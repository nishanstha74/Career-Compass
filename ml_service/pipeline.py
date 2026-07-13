# pipeline.py

import ast
import os
import re
import sys

import joblib
import numpy as np
import pandas as pd

from pdf_extract import extract_resume_text
from NLP.categorize import categorize_resume
from NLP.matching import fit_job_vectorizer, match_resume_to_jobs
from ML_train.preprocess import build_features  # same feature builder train.py used

# ── Load the trained ML model + artifacts once, at import time ──
# These are the files train.py saves after training on resume_data.csv.
# Anchored to this script's own folder (not the current working directory),
# so it doesn't matter which directory you happen to run `python pipeline.py`
# from — it always finds files saved next to train.py/pipeline.py.
ARTIFACTS_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "ML_train")


def _load_artifact(filename):
    path = os.path.join(ARTIFACTS_DIR, filename)
    if not os.path.exists(path):
        raise FileNotFoundError(
            f"Missing '{filename}' in {ARTIFACTS_DIR}. "
            f"Run `python train.py resume_data.csv` first to generate it."
        )
    return joblib.load(path)


# CHANGES vs previous version:
#   - Loads the single shared "text_vectorizer.joblib" (+ "encoder_kind.joblib")
#     instead of separate resume_vectorizer.joblib / job_vectorizer.joblib,
#     which train.py no longer produces (it now fits ONE shared vectorizer,
#     or a Sentence-BERT encoder if --embeddings was used).
#   - Filenames only (no absolute D:/... paths) — ARTIFACTS_DIR already
#     anchors these correctly; passing an absolute path bypassed that.
MODEL = _load_artifact("model.joblib")
TEXT_ENCODER = _load_artifact("text_vectorizer.joblib")
FEATURE_NAMES = _load_artifact("feature_names.joblib")
try:
    ENCODER_KIND = _load_artifact("encoder_kind.joblib")
except FileNotFoundError:
    ENCODER_KIND = "tfidf"  # backward-compat with models saved before this change


# CHANGES vs previous version:
#   - NUMERIC_COLS now matches preprocess.py's expanded feature set exactly
#     (skill_jaccard, skill_precision/recall/f1, candidate_years,
#     experience_gap, education_*, n_certifications, n_languages, etc.)
#     This is the list that was previously hand-duplicated and drifted out
#     of sync — kept here as a single explicit constant for clarity, but
#     the actual values come from build_features(), not from manual dict
#     construction, so it can't drift again.
NUMERIC_COLS = [
    "skill_overlap_ratio", "skill_jaccard", "n_skill_matches",
    "missing_required_skills", "skill_precision", "skill_recall", "skill_f1",
    "n_candidate_skills", "n_required_skills", "n_positions_held",
    "required_min_years", "candidate_years", "experience_gap",
    "candidate_education_level", "required_education_level",
    "education_level_diff", "education_match", "n_certifications",
    "has_certification", "n_languages", "has_languages",
    "has_career_objective",
]


# ── SINGLE SOURCE OF TRUTH FOR WHICH RESUME TO PROCESS ──
# Change this one line to switch resumes. pdf_extract.py's own __main__
# block imports this exact constant (`from pipeline import RESUME_PATH`)
# when run standalone, so both scripts always agree on which file is being
# processed — no more editing two separate hardcoded paths in two files.
# A CLI arg still overrides this if you pass one: `python pipeline.py foo.pdf`
RESUME_PATH = "mock/resume23.jpeg"


def process_resume(file_path: str) -> dict:
    """Extracts text from a resume file and returns structured JSON."""
    text, method, report = extract_resume_text(file_path)
    if text is None:
        raise ValueError(f"Extraction failed for {file_path}")
    return categorize_resume(text)


def _parse_list_cell(value) -> list:
    """
    resume_data.csv stores list-like columns (e.g. skills_required) as the
    STRING "['Python', 'SQL']", not a real Python list — literal_eval parses
    that back into an actual list. Returns [] for NaN/unparseable cells,
    since a fair number of rows have missing skills_required (as seen in the
    sample rows you shared).
    """
    if pd.isna(value):
        return []
    try:
        parsed = ast.literal_eval(value)
        return parsed if isinstance(parsed, list) else [str(parsed)]
    except (ValueError, SyntaxError):
        return []


def _parse_min_years(experience_text) -> int:
    """Pulls the leading integer out of text like 'At least 5 year(s)'."""
    if pd.isna(experience_text):
        return 0
    match = re.search(r"(\d+)", str(experience_text))
    return int(match.group(1)) if match else 0


def load_jobs_from_dataset(csv_path: str = "resume_data.csv") -> list[dict]:
    """
    resume_data.csv is a resume-JOB PAIR dataset — each row already has one
    resume matched against one job posting's fields (job_position_name,
    skills_required, experiencere_requirement, etc.), not a separate
    normalized jobs table. This pulls out the unique job postings embedded
    in it, deduplicated by title + experience requirement.
    """
    df = pd.read_csv(csv_path)
    df.columns = [c.replace("\ufeff", "") for c in df.columns]

    job_cols = [
        "job_position_name",
        "educationaL_requirements",
        "experiencere_requirement",
        "age_requirement",
        "responsibilities.1",
        "skills_required",
    ]
    jobs_df = (
        df[job_cols]
        .drop_duplicates(subset=["job_position_name", "experiencere_requirement"])
        .reset_index(drop=True)
    )

    jobs = []
    for i, row in jobs_df.iterrows():
        jobs.append({
            "job_id": str(i),
            "title": row["job_position_name"] if pd.notna(row["job_position_name"]) else "Unknown",
            "company": "N/A",  # not present in this dataset
            "skills": _parse_list_cell(row["skills_required"]),
            "experience": row["experiencere_requirement"] if pd.notna(row["experiencere_requirement"]) else "",
            "education_requirement": row["educationaL_requirements"] if pd.notna(row["educationaL_requirements"]) else "",
            "projects": row["responsibilities.1"] if pd.notna(row["responsibilities.1"]) else "",
            "required_min_years": _parse_min_years(row["experiencere_requirement"]),
        })

    print(f"Loaded {len(jobs)} unique job postings from {csv_path}")
    return jobs


def train_job_matcher(jobs: list[dict], save_path="job_vectorizer.pkl"):
    """
    Run this whenever the ML section's job postings are available or updated.
    jobs: list of job JSON objects, e.g. fetched from the ML section's database/API.
    """
    fit_job_vectorizer(jobs, save_path=save_path)
    print(f"Trained job vectorizer on {len(jobs)} postings — saved to {save_path}")


def _resume_to_raw_row(categorized_resume: dict, job: dict) -> dict:
    """
    CHANGES vs previous version:
      This replaces the old hand-built numeric-feature dict entirely. Instead
      of computing skill_overlap_ratio / n_positions_held / etc. by hand here
      (which is what silently drifted out of sync when preprocess.py's
      feature set expanded), this function maps categorize_resume()'s output
      + a job dict into the SAME raw column names build_features() expects
      from the original CSV. We then hand this to build_features() directly
      — the exact function train.py used — so pipeline.py can never drift
      out of sync with preprocess.py again.

    ASSUMPTION: categorize_resume() may not currently return degree_names,
    start_dates/end_dates, certifications, or languages as separate
    structured fields — check NLP/categorize.py's actual output keys and
    adjust the .get() calls below if the real key names differ. Until then,
    these fall back to empty, meaning experience_gap/education_match/etc.
    will compute to safe defaults rather than real signal at inference time.
    """
    skills_list = categorized_resume.get("skills", [])
    positions_list = categorized_resume.get("positions", [])
    certifications_list = categorized_resume.get("certifications", [])
    languages_list = categorized_resume.get("languages", [])
    degrees_list = categorized_resume.get("degrees", [])
    start_dates_list = categorized_resume.get("start_dates", [])
    end_dates_list = categorized_resume.get("end_dates", [])

    return {
        "career_objective": categorized_resume.get(
            "career_objective", categorized_resume.get("summary", "")
        ),
        "skills": str(skills_list),  # build_features expects a CSV-style "['a','b']" string
        "responsibilities": categorized_resume.get(
            "responsibilities", categorized_resume.get("full_text", "")
        ),
        "positions": str(positions_list),
        "certification_skills": str(certifications_list) if certifications_list else None,
        "languages": str(languages_list) if languages_list else None,
        "degree_names": str(degrees_list) if degrees_list else None,
        "start_dates": str(start_dates_list) if start_dates_list else None,
        "end_dates": str(end_dates_list) if end_dates_list else None,
        "job_position_name": job.get("title", ""),
        "skills_required": "\n".join(job.get("skills", [])),
        "responsibilities.1": job.get("projects", ""),
        "educationaL_requirements": job.get("education_requirement", ""),
        "experiencere_requirement": job.get("experience", ""),
    }


def _cosine_sim_rowwise_arrays(A, B):
    """Cosine similarity between two dense arrays, row by row. Works for
    both TF-IDF (.toarray()'d beforehand) and Sentence-BERT embeddings,
    which are already dense numpy arrays."""
    num = (A * B).sum(axis=1)
    denom = (np.linalg.norm(A, axis=1) * np.linalg.norm(B, axis=1)) + 1e-9
    return num / denom


def _score_jobs_with_model(categorized_resume: dict, jobs: list[dict]) -> pd.DataFrame:
    """
    CHANGES vs previous version:
      Builds ONE raw row per (resume, job) pair in the CSV's original shape,
      runs it through build_features() (the exact function train.py used),
      then scores with the trained model. This keeps pipeline.py permanently
      in sync with preprocess.py — no more hand-copied feature lists that
      can silently fall behind.
      Also fixed to use the single shared TEXT_ENCODER + ENCODER_KIND
      (TF-IDF or Sentence-BERT) instead of the old separate
      resume_vectorizer/job_vectorizer files, which train.py no longer saves.
    """
    raw_rows = [_resume_to_raw_row(categorized_resume, job) for job in jobs]
    raw_df = pd.DataFrame(raw_rows)

    feats = build_features(raw_df)

    if ENCODER_KIND == "embeddings":
        r_vec = TEXT_ENCODER.encode(list(feats["resume_text"]))
        j_vec = TEXT_ENCODER.encode(list(feats["job_text"]))
    else:
        r_vec = TEXT_ENCODER.transform(feats["resume_text"]).toarray()
        j_vec = TEXT_ENCODER.transform(feats["job_text"]).toarray()

    text_similarity = _cosine_sim_rowwise_arrays(r_vec, j_vec)

    X_numeric = feats[NUMERIC_COLS].values
    X = np.hstack([X_numeric, text_similarity.reshape(-1, 1)])

    feats["score"] = MODEL.predict(X)
    return feats


def get_job_matches(resume_file_path: str, jobs: list[dict], top_n=5):
    """
    Run this whenever a user uploads a resume.
    Scores every job in `jobs` with the trained ML model and returns the
    top_n best-matching jobs, sorted by predicted matched_score.
    """
    categorized_resume = process_resume(resume_file_path)
    scored = _score_jobs_with_model(categorized_resume, jobs)
    top = scored.sort_values("score", ascending=False).head(top_n)

    # Build result list preserving each job's original metadata + predicted score.
    jobs_by_index = {i: job for i, job in enumerate(jobs)}
    results = []
    for idx, row in top.iterrows():
        job = jobs_by_index[idx]
        results.append({**job, "score": float(row["score"])})
    return results


if __name__ == "__main__":
    # ── Step 1: Load job postings and train the job matcher ──
    # No live API — job postings live inside resume_data.csv itself, so we
    # pull the unique postings out of it directly. Re-run this whenever the
    # dataset is updated/replaced.
    DATASET_PATH = os.path.join(
        os.path.dirname(ARTIFACTS_DIR), "dataset", "resume_data.csv"
    )
    jobs = load_jobs_from_dataset(DATASET_PATH)
    train_job_matcher(jobs)

    # ── Step 2: Process a resume and get the top 5 ML-predicted matches ──
    # RESUME_PATH (defined near the top of this file) is the single source
    # of truth for which resume gets processed. A CLI arg still overrides
    # it if you pass one:  python pipeline.py mock/CV2.pdf
    resume_path = sys.argv[1] if len(sys.argv) > 1 else RESUME_PATH
    matches = get_job_matches(resume_path, jobs=jobs, top_n=5)

    print("\nTop job matches:")
    for m in matches:
        print(f"  {m['title']} at {m['company']} — score: {m['score']:.3f}")