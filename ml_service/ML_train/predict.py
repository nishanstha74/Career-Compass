"""
STEP 3 — Predict on New Data
------------------------------
Loads the saved model + text encoder and scores a resume against a job.

CHANGES vs previous version:
  - Loads encoder_kind.joblib to know whether text_vectorizer.joblib is
    a TF-IDF vectorizer or a SentenceTransformer, and computes similarity
    accordingly.
  - NUMERIC_COLS matches the expanded feature set from preprocess.py.

Run:
    python predict.py
"""
import joblib
import numpy as np
import pandas as pd

from preprocess import build_features

model = joblib.load("model.joblib")
text_encoder = joblib.load("text_vectorizer.joblib")
feature_names = joblib.load("feature_names.joblib")
try:
    encoder_kind = joblib.load("encoder_kind.joblib")
except FileNotFoundError:
    encoder_kind = "tfidf"  # backward-compat with models saved before this change

NUMERIC_COLS = [
    "skill_overlap_ratio",
    "skill_jaccard",
    "n_skill_matches",
    "missing_required_skills",
    "skill_precision",
    "skill_recall",
    "skill_f1",
    "n_candidate_skills",
    "n_required_skills",
    "n_positions_held",
    "required_min_years",
    "candidate_years",
    "experience_gap",
    "candidate_education_level",
    "required_education_level",
    "education_level_diff",
    "education_match",
    "n_certifications",
    "has_certification",
    "n_languages",
    "has_languages",
    "has_career_objective",
]


def _cosine_sim(a, b):
    if hasattr(a, "toarray"):
        a = a.toarray()
    if hasattr(b, "toarray"):
        b = b.toarray()
    num = (a * b).sum(axis=1)
    denom = (np.linalg.norm(a, axis=1) * np.linalg.norm(b, axis=1)) + 1e-9
    return num / denom


def predict_match(resume_row: dict, job_row: dict) -> float:
    """
    resume_row / job_row: dicts with the SAME keys as the original CSV columns
    for a single candidate / single job posting. New optional keys used by
    the expanded features: degree_names, start_dates, end_dates,
    certification_skills, languages.
    """
    row = {**resume_row, **job_row}
    df_row = pd.DataFrame([row])

    feats = build_features(df_row)
    X_num = feats[NUMERIC_COLS].values

    if encoder_kind == "embeddings":
        r_vec = text_encoder.encode(list(feats["resume_text"]))
        j_vec = text_encoder.encode(list(feats["job_text"]))
    else:
        r_vec = text_encoder.transform(feats["resume_text"]).toarray()
        j_vec = text_encoder.transform(feats["job_text"]).toarray()

    text_sim = _cosine_sim(r_vec, j_vec).reshape(-1, 1)

    X = np.hstack([X_num, text_sim])
    score = model.predict(X)[0]
    return float(np.clip(score, 0, 1))


if __name__ == "__main__":
    example_resume = {
        "career_objective": "Data analyst experienced in Python, SQL and dashboards.",
        "skills": "['Python', 'SQL', 'Machine Learning', 'Tableau']",
        "responsibilities": "Built dashboards. Automated reports. Ran analyses.",
        "positions": "['Data Analyst']",
        "degree_names": "['Bachelor of Science']",
        "start_dates": "['Jan 2021']",
        "end_dates": "['Present']",
        "certification_skills": None,
        "languages": None,
    }
    example_job = {
        "job_position_name": "Data Scientist",
        "skills_required": "Python\nSQL\nMachine Learning\nStatistics",
        "responsibilities.1": "Build models. Analyze data. Present findings.",
        "educationaL_requirements": "B.Sc in Computer Science",
        "experiencere_requirement": "At least 2 years",
    }
    score = predict_match(example_resume, example_job)
    print(f"Predicted match score: {score:.3f}")