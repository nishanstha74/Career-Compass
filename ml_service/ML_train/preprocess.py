"""
STEP 1 — Cleaning & Feature Engineering
----------------------------------------
Turns the raw Kaggle resume_data.csv into a numeric feature table (X)
plus the target column (y = matched_score) that a model can learn from.

CHANGES vs previous version:
  - skill_overlap_ratio kept, but now paired with 3 new skill features:
    skill_jaccard, n_skill_matches, missing_required_skills. The old
    single ratio was nearly unused by the model (importance ~0.06/0.008)
    because it threw away information (raw counts, symmetric overlap).
  - Everything else (resume_text/job_text construction, positions,
    experience parsing, presence flags) is unchanged.

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
    parts = re.split(r"[\n,;/]+|\bor\b|\band\b", str(cell))
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


def skill_match_features(cand_set: set, req_set: set) -> dict:
    """
    Richer skill-matching signal than a single overlap ratio. Tree models
    can combine these far more effectively than one pre-collapsed ratio.
    """
    if not cand_set or not req_set:
        return {
            "skill_overlap_ratio": 0.0,
            "skill_jaccard": 0.0,
            "n_skill_matches": 0,
            "missing_required_skills": len(req_set),
        }
    inter = cand_set & req_set
    union = cand_set | req_set
    return {
        "skill_overlap_ratio": len(inter) / len(req_set),          # coverage of job's asks
        "skill_jaccard": len(inter) / len(union),                   # symmetric similarity
        "n_skill_matches": len(inter),                              # raw signal, no normalization
        "missing_required_skills": len(req_set) - len(inter),       # gap size
    }


def build_features(df: pd.DataFrame) -> pd.DataFrame:
    """Builds the full numeric feature table from the raw dataframe."""
    df = df.copy()

    # --- Fix the BOM (byte-order-mark) glitch on this column name ---
    df.columns = [c.replace("\ufeff", "") for c in df.columns]

    feats = pd.DataFrame(index=df.index)

    # ---- 1. Skill overlap between candidate skills and job's required skills ----
    candidate_skills = df["skills"].apply(safe_parse_list).apply(normalize_skill_list)
    required_skills = df["skills_required"].apply(split_skill_text)

    tmp = pd.DataFrame({"cand": candidate_skills, "req": required_skills})
    skill_feats = tmp.apply(
        lambda row: skill_match_features(set(row["cand"]), set(row["req"])), axis=1
    )
    skill_feats_df = pd.DataFrame(list(skill_feats), index=feats.index)
    feats["skill_overlap_ratio"] = skill_feats_df["skill_overlap_ratio"]
    feats["skill_jaccard"] = skill_feats_df["skill_jaccard"]
    feats["n_skill_matches"] = skill_feats_df["n_skill_matches"]
    feats["missing_required_skills"] = skill_feats_df["missing_required_skills"]

    feats["n_candidate_skills"] = candidate_skills.apply(len)
    feats["n_required_skills"] = required_skills.apply(len)

    # ---- 2. Text similarity between resume text and job text (TF-IDF cosine) ----
    # Built here as raw text columns; actual TF-IDF vectorization happens in
    # train.py because the vectorizer must be *fit* on the training set only.
    responsibilities_1 = df["responsibilities.1"] if "responsibilities.1" in df.columns else pd.Series("", index=df.index)

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
        + responsibilities_1.fillna("")
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
    
    languages = df["languages"] if "languages" in df.columns else pd.Series(np.nan, index=df.index)
    feats["has_languages"] = languages.notna().astype(int)

    return feats


if __name__ == "__main__":
    path = sys.argv[1] if len(sys.argv) > 1 else "resume_data.csv"
    df = pd.read_csv("D:/PROJECT/Career-Compass/ml_service/dataset/resume_data.csv")
    feats = build_features(df)
    print(feats.drop(columns=["resume_text", "job_text"]).describe())
    print("\nSample rows:")
    print(feats.drop(columns=["resume_text", "job_text"]).head())