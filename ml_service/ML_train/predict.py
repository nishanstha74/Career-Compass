"""
STEP 3 — Predict on New Data
------------------------------
Loads the saved model + vectorizers and scores a resume against a job.

Run:
    python predict.py
(edit the example resume/job dicts below, or import predict_match() elsewhere)
"""
import joblib
import numpy as np
import pandas as pd

from preprocess import build_features

model = joblib.load("model.joblib")
resume_vectorizer = joblib.load("resume_vectorizer.joblib")
job_vectorizer = joblib.load("job_vectorizer.joblib")
feature_names = joblib.load("feature_names.joblib")


def predict_match(resume_row: dict, job_row: dict) -> float:
    """
    resume_row / job_row: dicts with the SAME keys as the original CSV columns
    for a single candidate / single job posting, e.g.:
        resume_row = {
            "career_objective": "...",
            "skills": "['Python', 'SQL', 'Machine Learning']",
            "responsibilities": "...",
            "positions": "['Data Analyst']",
            "certification_skills": None,
            "languages": None,
        }
        job_row = {
            "job_position_name": "Data Scientist",
            "skills_required": "Python\\nSQL\\nMachine Learning",
            "responsibilities.1": "...",
            "educationaL_requirements": "B.Sc in CS",
            "experiencere_requirement": "At least 3 years",
        }
    """
    row = {**resume_row, **job_row}
    df_row = pd.DataFrame([row])

    feats = build_features(df_row)
    X_num = feats[
        [
            "skill_overlap_ratio",
            "n_candidate_skills",
            "n_required_skills",
            "n_positions_held",
            "required_min_years",
            "has_career_objective",
            "has_certification",
            "has_languages",
        ]
    ].values

    r_vec = resume_vectorizer.transform(feats["resume_text"]).toarray()
    j_vec = job_vectorizer.transform(feats["job_text"]).toarray()
    num = (r_vec * j_vec).sum(axis=1)
    denom = (np.linalg.norm(r_vec, axis=1) * np.linalg.norm(j_vec, axis=1)) + 1e-9
    text_sim = (num / denom).reshape(-1, 1)

    X = np.hstack([X_num, text_sim])
    score = model.predict(X)[0]
    return float(np.clip(score, 0, 1))


if __name__ == "__main__":
    example_resume = {
        "career_objective": "Data analyst experienced in Python, SQL and dashboards.",
        "skills": "['Python', 'SQL', 'Machine Learning', 'Tableau']",
        "responsibilities": "Built dashboards. Automated reports. Ran analyses.",
        "positions": "['Data Analyst']",
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
