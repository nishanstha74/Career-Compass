"""
STEP 1 — Cleaning & Feature Engineering
----------------------------------------
Turns the raw Kaggle resume_data.csv into a numeric feature table (X)
plus the target column (y = matched_score) that a model can learn from.

Run standalone to sanity-check:
    python preprocess.py resume_data.csv
"""
import ast
import re
import sys

import numpy as np
import pandas as pd


def safe_parse_list(cell):
    """Many columns are strings that *look* like Python lists, e.g. "['Python', 'SQL']".
    ast.literal_eval turns that string back into a real list. If parsing fails
    (NaN, malformed, plain text) we fall back to an empty list."""
    if pd.isna(cell):
        return []
    try:
        parsed = ast.literal_eval(cell)
        if isinstance(parsed, list):
            return parsed
        return [parsed]
    except (ValueError, SyntaxError):
        return []


def split_skill_text(cell):
    """`skills_required` is NOT a python-list string — it's raw text with
    skills separated by newlines/commas, e.g. 'Python\\nR or Java\\nTensorFlow'.
    This splits it into a clean list of lowercase tokens."""
    if pd.isna(cell):
        return []
    parts = re.split(r"[\n,;]+", str(cell))
    return [p.strip().lower() for p in parts if p.strip()]


def normalize_skill_list(items):
    """Lowercase + strip every skill in a list (from safe_parse_list output)."""
    return [str(s).strip().lower() for s in items if s and str(s).strip()]


def parse_required_years(text):
    """Turns strings like 'At least 5 year(s)', '2 to 5 years', '5 to 10 years'
    into a single number: the MINIMUM years required. Returns NaN if unparsable."""
    if pd.isna(text):
        return np.nan
    numbers = re.findall(r"\d+", str(text))
    if not numbers:
        return np.nan
    return float(numbers[0])  # first number = minimum in both phrasings


def count_positions(cell):
    """Counts how many jobs/positions a candidate has listed — a simple
    proxy for how experienced they are."""
    return len(safe_parse_list(cell))


def build_features(df: pd.DataFrame) -> pd.DataFrame:
    """Builds the full numeric feature table from the raw dataframe."""
    df = df.copy()

    # --- Fix the BOM (byte-order-mark) glitch on this column name ---
    df.columns = [c.replace("\ufeff", "") for c in df.columns]

    feats = pd.DataFrame(index=df.index)

    # ---- 1. Skill overlap between candidate skills and job's required skills ----
    candidate_skills = df["skills"].apply(safe_parse_list).apply(normalize_skill_list)
    required_skills = df["skills_required"].apply(split_skill_text)

    def overlap_ratio(row):
        cand, req = row["cand"], row["req"]
        if not cand or not req:
            return 0.0
        cand_set, req_set = set(cand), set(req)
        # how much of what the JOB wants is covered by the candidate
        return len(cand_set & req_set) / len(req_set)

    tmp = pd.DataFrame({"cand": candidate_skills, "req": required_skills})
    feats["skill_overlap_ratio"] = tmp.apply(overlap_ratio, axis=1)
    feats["n_candidate_skills"] = candidate_skills.apply(len)
    feats["n_required_skills"] = required_skills.apply(len)

    # ---- 2. Text similarity between resume text and job text (TF-IDF cosine) ----
    # Built here as raw text columns; actual TF-IDF vectorization happens in
    # train.py because the vectorizer must be *fit* on the training set only.
    feats["resume_text"] = (
        df["career_objective"].fillna("")
        + " "
        + df["skills"].fillna("")
        + " "
        + df["responsibilities"].fillna("")
    )
    feats["job_text"] = (
        df["job_position_name"].fillna("")
        + " "
        + df["skills_required"].fillna("")
        + " "
        + df["responsibilities.1"].fillna("")
        + " "
        + df["educationaL_requirements"].fillna("")
    )

    # ---- 3. Experience: how many jobs the candidate has held ----
    feats["n_positions_held"] = df["positions"].apply(count_positions)

    # ---- 4. Required years of experience (parsed from job posting) ----
    feats["required_min_years"] = df["experiencere_requirement"].apply(parse_required_years)
    feats["required_min_years"] = feats["required_min_years"].fillna(
        feats["required_min_years"].median()
    )

    # ---- 5. Simple presence flags ----
    feats["has_career_objective"] = df["career_objective"].notna().astype(int)
    feats["has_certification"] = df["certification_skills"].notna().astype(int)
    feats["has_languages"] = df["languages"].notna().astype(int)

    return feats


if __name__ == "__main__":
    path = sys.argv[1] if len(sys.argv) > 1 else "resume_data.csv"
    df = pd.read_csv("D:/PROJECT/Career-Compass/ml_service/dataset/resume_data.csv")
    feats = build_features(df)
    print(feats.drop(columns=["resume_text", "job_text"]).describe())
    print("\nSample rows:")
    print(feats.drop(columns=["resume_text", "job_text"]).head())
