# pipeline.py

import ast
import os
import re

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
ARTIFACTS_DIR = os.path.dirname(os.path.abspath(__file__))


def _load_artifact(filename):
    path = os.path.join(ARTIFACTS_DIR, filename)
    if not os.path.exists(path):
        raise FileNotFoundError(
            f"Missing '{filename}' in {ARTIFACTS_DIR}. "
            f"Run `python train.py resume_data.csv` first to generate it."
        )
    return joblib.load(path)


MODEL = _load_artifact("D:/PROJECT/Career-Compass/ml_service/ML_train/model.joblib")
RESUME_VECTORIZER = _load_artifact("D:/PROJECT/Career-Compass/ml_service/ML_train/resume_vectorizer.joblib")
JOB_VECTORIZER = _load_artifact("D:/PROJECT/Career-Compass/ml_service/ML_train/job_vectorizer.joblib")
FEATURE_NAMES = _load_artifact("D:/PROJECT/Career-Compass/ml_service/ML_train/feature_names.joblib")


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

    NOTE: this reimplements a small amount of the same parsing preprocess.py's
    build_features() does for the job side of each row. If build_features
    already exposes a "get unique jobs" helper or parses these columns
    differently, prefer reusing that directly so this stays in sync with
    however the model was actually trained.
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


def _skill_overlap_ratio(categorized_resume: dict, job: dict) -> float:
    candidate_skills = set(s.lower() for s in categorized_resume.get("skills", []))
    required_skills = set(s.lower() for s in job.get("skills", []))
    if not required_skills:
        return 0.0
    return len(candidate_skills & required_skills) / len(required_skills)


def _cosine_sim_rowwise(A, B):
    A, B = A.toarray(), B.toarray()
    num = (A * B).sum(axis=1)
    denom = (np.linalg.norm(A, axis=1) * np.linalg.norm(B, axis=1)) + 1e-9
    return num / denom


def _score_jobs_with_model(categorized_resume: dict, jobs: list[dict]) -> pd.DataFrame:
    """
    Builds the same numeric + text-similarity features train.py used, one row
    per (resume, job) pair, then predicts matched_score with the trained model.
    """
    rows = []
    for job in jobs:
        rows.append({
            "resume_text": categorized_resume.get("full_text", ""),
            "job_text": " ".join([
                job.get("title", ""),
                job.get("experience", ""),
                job.get("projects", ""),
                " ".join(job.get("skills", [])),
            ]),
            "skill_overlap_ratio": _skill_overlap_ratio(categorized_resume, job),
            "n_candidate_skills": len(categorized_resume.get("skills", [])),
            "n_required_skills": len(job.get("skills", [])),
            "n_positions_held": categorized_resume.get("n_positions_held", 0),
            "required_min_years": job.get("required_min_years", 0),
            "has_career_objective": int(categorized_resume.get("has_career_objective", False)),
            "has_certification": int(categorized_resume.get("has_certification", False)),
            "has_languages": int(categorized_resume.get("has_languages", False)),
        })
    df = pd.DataFrame(rows)

    resume_tfidf = RESUME_VECTORIZER.transform(df["resume_text"])
    job_tfidf = JOB_VECTORIZER.transform(df["job_text"])
    text_similarity = _cosine_sim_rowwise(resume_tfidf, job_tfidf)

    X_numeric = df[[c for c in FEATURE_NAMES if c != "text_similarity"]].values
    X = np.hstack([X_numeric, text_similarity.reshape(-1, 1)])

    df["score"] = MODEL.predict(X)
    return df


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
    DATASET_PATH = os.path.join(ARTIFACTS_DIR, "D:/PROJECT/Career-Compass/ml_service/dataset/resume_data.csv")
    jobs = load_jobs_from_dataset(DATASET_PATH)
    train_job_matcher(jobs)

    # ── Step 2: Process a resume and get the top 5 ML-predicted matches ──
    resume_path = "mock/CV1.pdf"
    matches = get_job_matches(resume_path, jobs=jobs, top_n=5)

    print("\nTop job matches:")
    for m in matches:
        print(f"  {m['title']} at {m['company']} — score: {m['score']:.3f}")