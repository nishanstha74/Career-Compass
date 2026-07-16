# -*- coding: utf-8 -*-
"""
predict.py

Given a single resume (in the JSON format produced by categorize.py), ranks
it against every unique job found in the training dataset (resume_data.csv)
and returns the top 5 matching jobs.

Uses the three trained pipelines produced by train.py (SVR, Random Forest,
XGBoost -- each pipeline already bundles its own fitted TfidfVectorizer) and
averages their predictions per resume-job pair.

Usable two ways:
  1. Imported:   from predict import rank_jobs_from_categorized
                 rank_jobs_from_categorized(categorized_dict)
  2. CLI:        python predict.py --json '{...categorize.py output...}'
                 python predict.py --json-file categorized_output.json
                 python predict.py                 (uses ../output/categorized_output.json)
"""

import argparse
import json
import os

import joblib
import numpy as np
import pandas as pd

MODEL_DIR = os.path.join(os.path.dirname(__file__), "..", "models")
DATASET_PATH = os.path.join(os.path.dirname(__file__), "..", "dataset", "resume_data.csv")
# Default input is now categorize.py's actual output location, not a hand-written sample.
DEFAULT_INPUT_FILE = os.path.join(os.path.dirname(__file__), "..", "output", "categorized_output.json")

# Fields that come FROM THE RESUME the user submits.
# NOTE: this is the flat schema the ML pipelines were TRAINED on
# (resume_data.csv columns) -- it is NOT the schema categorize.py produces.
# See resume_json_to_features() below for the mapping between the two.
RESUME_FEATURES = [
    "career_objective",
    "skills",
    "educational_institution_name",
    "degree_names",
    "educational_results",
    "result_types",
    "major_field_of_studies",
    "related_skils_in_job",
    "positions",
    "responsibilities",
    "extra_curricular_activity_types",
    "role_positions",
    "languages",
    "proficiency_levels",
    "certification_providers",
    "certification_skills",
]

# Fields that describe a JOB -- pulled from the training dataset, not from
# the user's resume input.
JOB_FEATURES = [
    "job_position_name",
    "educationaL_requirements",
    "experiencere_requirement",
    "age_requirement",
    "responsibilities.1",
    "skills_required",
]

# Must match train.py's `features` list exactly -- same order, same set.
FEATURES = RESUME_FEATURES + JOB_FEATURES

MISSING_TOKENS = {"n/a", "na", "none", "null", "", "nan"}

MODEL_FILES = {
    "svr": "svr_model.joblib",
    "random_forest": "random_forest_model.joblib",
    "xgboost": "xgboost_model.joblib",
}

_loaded_models = {}
_job_pool_cache = None


def _clean_value(value) -> str:
    """Mirror train.py's missing-value handling for a single field."""
    if value is None or (isinstance(value, float) and np.isnan(value)):
        return "Unknown"
    text = str(value).strip()
    if text.lower() in MISSING_TOKENS or "n/a" in text.lower():
        return "Unknown"
    return text


def build_text_input(record: dict) -> str:
    """Turn a merged resume+job record into the single whitespace-joined
    `text` string the pipelines were trained on (FEATURES order)."""
    values = [_clean_value(record.get(col)) for col in FEATURES]
    return " ".join(values)


# ─── ADAPTER: categorize.py output -> flat RESUME_FEATURES ──────────────────
#
# categorize.py can emit two different shapes depending on which path ran:
#
#   "spacy" path:
#     education   -> {"raw": str, "institutions": [str], "dates": [str]}
#     experience  -> {"raw": str, "companies": [str], "dates": [str]}
#     skills      -> list[str]           (already flattened by _add_ml_features)
#     certifications / languages / activities / leadership -> raw str
#
#   "hybrid" (Gemini-merged) path:
#     education   -> [{"degree": str, "institution": str, "year": str}, ...]
#     experience  -> [{"title": str, "company": str, "duration": str,
#                       "description": str}, ...]
#     skills      -> list[str]
#     certifications / languages -> list[str] (Gemini's schema)
#     activities / leadership    -> raw str    (carried over from spaCy,
#                                                 Gemini's fixed schema doesn't
#                                                 ask for these at all)
#
# The functions below detect which shape they're given and normalize both
# into the flat strings resume_data.csv's columns expect.

def _join_list(items, sep=", "):
    if not items:
        return ""
    return sep.join(str(i).strip() for i in items if str(i).strip())


def _extract_education_fields(education):
    """Returns (institution_names, degree_names) as strings."""
    if isinstance(education, list):
        institutions = _join_list([e.get("institution", "") for e in education if isinstance(e, dict)])
        degrees = _join_list([e.get("degree", "") for e in education if isinstance(e, dict)])
        return institutions, degrees
    if isinstance(education, dict):
        institutions = _join_list(education.get("institutions", []))
        # spaCy path never separates out a clean "degree name" -- fall back
        # to the raw section text so the field isn't just empty.
        degrees = education.get("raw", "")
        return institutions, degrees
    return "", ""


def _extract_experience_fields(experience):
    """Returns (positions, responsibilities) as strings."""
    if isinstance(experience, list):
        positions = _join_list([e.get("title", "") for e in experience if isinstance(e, dict)])
        responsibilities = _join_list(
            [e.get("description", "") for e in experience if isinstance(e, dict)], sep=" "
        )
        return positions, responsibilities
    if isinstance(experience, dict):
        # spaCy path has no job-title extraction, only company names -- best
        # available proxy for "positions".
        positions = _join_list(experience.get("companies", []))
        responsibilities = experience.get("raw", "")
        return positions, responsibilities
    return "", ""


def _extract_certifications_fields(categorized):
    """
    Dataset wants certification_providers and certification_skills as
    separate columns. Neither spaCy nor Gemini's current schema distinguishes
    "who issued it" from "what it's in" -- so certification_skills gets the
    real content and certification_providers is left "Unknown". If you want
    real provider data, categorize.py's Gemini prompt would need a
    {"provider": "", "skill": ""} shape instead of a flat list.
    """
    certs = categorized.get("certifications", "")
    cert_text = _join_list(certs) if isinstance(certs, list) else str(certs or "")
    return "Unknown", cert_text


def _extract_languages_fields(categorized):
    """Returns (languages, proficiency_levels). Proficiency isn't captured
    upstream by either path, so it's left "Unknown"."""
    langs = categorized.get("languages", "")
    lang_text = _join_list(langs) if isinstance(langs, list) else str(langs or "")
    return lang_text, "Unknown"


def resume_json_to_features(categorized: dict) -> dict:
    """
    Maps the nested JSON produced by categorize.py (spaCy-only OR
    spaCy+Gemini hybrid path) onto the flat RESUME_FEATURES schema the ML
    pipelines were trained on.

    Fields with no real upstream source (educational_results, result_types,
    major_field_of_studies, proficiency_levels, certification_providers) are
    set to "Unknown" -- _clean_value() already treats "Unknown" the same way
    it treats a genuinely blank dataset cell, so this doesn't skew scoring
    any differently than a training-set resume that just had that column
    unfilled.
    """
    institution_names, degree_names = _extract_education_fields(categorized.get("education", ""))
    positions, responsibilities = _extract_experience_fields(categorized.get("experience", ""))
    cert_providers, cert_skills = _extract_certifications_fields(categorized)
    languages, proficiency = _extract_languages_fields(categorized)

    skills = categorized.get("skills", [])
    skills_text = _join_list(skills) if isinstance(skills, list) else str(skills or "")

    activities = categorized.get("activities", "")
    activities_text = activities if isinstance(activities, str) else _join_list(activities)

    leadership = categorized.get("leadership", "")
    leadership_text = leadership if isinstance(leadership, str) else _join_list(leadership)

    return {
        "career_objective": categorized.get("summary", "") or "",
        "skills": skills_text,
        "educational_institution_name": institution_names,
        "degree_names": degree_names,
        "educational_results": "Unknown",
        "result_types": "Unknown",
        "major_field_of_studies": "Unknown",
        "related_skils_in_job": skills_text,
        "positions": positions,
        "responsibilities": responsibilities,
        "extra_curricular_activity_types": activities_text,
        # dataset's "role_positions" is closest in spirit to leadership /
        # extracurricular roles held, not paid job titles (those go in
        # "positions" above).
        "role_positions": leadership_text,
        "languages": languages,
        "proficiency_levels": proficiency,
        "certification_providers": cert_providers,
        "certification_skills": cert_skills,
    }


def load_models() -> dict:
    """Load and cache all three pipelines from MODEL_DIR."""
    if _loaded_models:
        return _loaded_models

    for name, filename in MODEL_FILES.items():
        path = os.path.join(MODEL_DIR, filename)
        if not os.path.exists(path):
            raise FileNotFoundError(
                f"Missing model file for '{name}': {path}. Run train.py first."
            )
        _loaded_models[name] = joblib.load(path)

    return _loaded_models


def load_job_pool() -> list:
    """
    Pull the unique jobs out of the training dataset (one row per distinct
    job_position_name) and cache them. Each entry only contains the
    JOB_FEATURES columns, already cleaned.
    """
    global _job_pool_cache
    if _job_pool_cache is not None:
        return _job_pool_cache

    if not os.path.exists(DATASET_PATH):
        raise FileNotFoundError(f"Dataset not found at {DATASET_PATH}")

    df = pd.read_csv(DATASET_PATH)
    df.columns = df.columns.str.strip().str.replace("\ufeff", "", regex=False)

    missing_job_cols = [c for c in JOB_FEATURES if c not in df.columns]
    if missing_job_cols:
        raise ValueError(f"Dataset is missing expected job columns: {missing_job_cols}")

    job_df = df[JOB_FEATURES].copy()
    for col in JOB_FEATURES:
        job_df[col] = job_df[col].apply(_clean_value)

    job_df = job_df.drop_duplicates(subset=["job_position_name"]).reset_index(drop=True)

    _job_pool_cache = job_df.to_dict("records")
    return _job_pool_cache


def rank_jobs(resume_record: dict, top_n: int = 5) -> list:
    """
    Score a single FLAT resume record (already in RESUME_FEATURES shape)
    against every unique job in the dataset and return the top_n matches.

    Most callers should use rank_jobs_from_categorized() instead -- this
    lower-level function is kept for cases where you already have data in
    the flat training schema (e.g. re-scoring dataset rows directly).
    """
    jobs = load_job_pool()
    models = load_models()

    texts = [build_text_input({**resume_record, **job}) for job in jobs]

    total_scores = np.zeros(len(texts))
    for pipeline in models.values():
        total_scores += pipeline.predict(texts)
    avg_scores = total_scores / len(models)

    ranked = sorted(zip(jobs, avg_scores), key=lambda pair: pair[1], reverse=True)

    return [
        {"job_position_name": job["job_position_name"], "matched_score": float(score)}
        for job, score in ranked[:top_n]
    ]


def rank_jobs_from_categorized(categorized: dict, top_n: int = 5) -> list:
    """
    Main entry point for the real pipeline: takes the JSON dict exactly as
    produced by categorize.py's categorize_resume(), converts it to the flat
    schema the models were trained on, and ranks jobs against it.
    """
    resume_record = resume_json_to_features(categorized)
    return rank_jobs(resume_record, top_n=top_n)


def _looks_like_categorized_output(record: dict) -> bool:
    """
    Detects whether a loaded JSON dict is categorize.py's nested output
    (has "_meta"/"full_text", or education/experience/skills in their nested
    shapes) versus an already-flat RESUME_FEATURES dict. Lets the CLI accept
    either without the user having to specify which.
    """
    if "_meta" in record or "full_text" in record:
        return True
    # A flat record would have "career_objective" as a plain string and
    # never a list/dict for "education" or "experience".
    if isinstance(record.get("education"), (list, dict)):
        return True
    if isinstance(record.get("experience"), (list, dict)):
        return True
    return False


def _parse_args():
    parser = argparse.ArgumentParser(
        description="Rank jobs in the dataset against a single input resume "
                     "(categorize.py output JSON, or a pre-flattened record)."
    )
    group = parser.add_mutually_exclusive_group(required=False)
    group.add_argument("--json", type=str, help="Inline JSON object (categorize.py output, or flat resume fields).")
    group.add_argument(
        "--json-file",
        type=str,
        help=f"Path to a JSON file. Defaults to {DEFAULT_INPUT_FILE} if no argument is given at all.",
    )
    parser.add_argument("--top", type=int, default=5, help="Number of top matches to return (default 5).")
    return parser.parse_args()


def _main():
    args = _parse_args()

    if args.json:
        record = json.loads(args.json)
    elif args.json_file:
        with open(args.json_file, "r", encoding="utf-8") as f:
            record = json.load(f)
    else:
        if not os.path.exists(DEFAULT_INPUT_FILE):
            raise FileNotFoundError(
                f"No --json/--json-file given, and default input file not found: "
                f"{DEFAULT_INPUT_FILE}. Run categorize.py first, or pass --json/--json-file."
            )
        print(f"No arguments given -- reading resume from {DEFAULT_INPUT_FILE}\n")
        with open(DEFAULT_INPUT_FILE, "r", encoding="utf-8") as f:
            record = json.load(f)

    if _looks_like_categorized_output(record):
        print("Detected categorize.py-style JSON -- converting to model features...")
        top_matches = rank_jobs_from_categorized(record, top_n=args.top)
    else:
        print("Detected flat resume record -- scoring directly...")
        top_matches = rank_jobs(record, top_n=args.top)

    print(json.dumps(top_matches, indent=2))


if __name__ == "__main__":
    _main()