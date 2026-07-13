"""
STEP 1 — Cleaning & Feature Engineering
----------------------------------------
Turns the raw Kaggle resume_data.csv into a numeric feature table (X)
plus the target column (y = matched_score) that a model can learn from.

CHANGES vs previous version:
  - Skill features expanded: added precision, recall, F1 (tree models
    combine these better than one collapsed ratio; importance was ~6%).
  - NEW: experience_gap = candidate_years - required_min_years, where
    candidate_years is computed from real start_dates/end_dates spans
    (not a proxy like n_positions_held).
  - NEW: education_match / education_level_diff, comparing candidate's
    highest degree (from degree_names) against the job's stated
    educationaL_requirements.
  - NEW: n_certifications, n_languages (raw counts instead of just
    presence flags — presence flags throw away signal).
  - All new columns are read defensively: if a column name doesn't
    match your actual CSV, the feature safely defaults instead of
    crashing. Check the ASSUMPTION comments below and adjust names
    if needed.

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

    precision = of the skills the candidate lists, how many were actually
                asked for (penalizes irrelevant/padded skill lists)
    recall    = same as skill_overlap_ratio: of what the job asked for,
                how much does the candidate cover
    f1        = harmonic mean of the two — a single balanced number
    """
    n_req = len(req_set)
    n_cand = len(cand_set)

    if not cand_set or not req_set:
        return {
            "skill_overlap_ratio": 0.0,
            "skill_jaccard": 0.0,
            "n_skill_matches": 0,
            "missing_required_skills": n_req,
            "skill_precision": 0.0,
            "skill_recall": 0.0,
            "skill_f1": 0.0,
        }

    inter = cand_set & req_set
    union = cand_set | req_set
    n_inter = len(inter)

    precision = n_inter / n_cand if n_cand else 0.0
    recall = n_inter / n_req if n_req else 0.0
    f1 = (2 * precision * recall / (precision + recall)) if (precision + recall) else 0.0

    return {
        "skill_overlap_ratio": recall,              # kept for backward-compat / feature parity
        "skill_jaccard": n_inter / len(union),
        "n_skill_matches": n_inter,
        "missing_required_skills": n_req - n_inter,
        "skill_precision": precision,
        "skill_recall": recall,
        "skill_f1": f1,
    }


# ----------------------------------------------------------------------
# NEW: experience-gap features (real years, parsed from date ranges)
# ----------------------------------------------------------------------
_MONTHS = {
    "jan": 1, "feb": 2, "mar": 3, "apr": 4, "may": 5, "jun": 6,
    "jul": 7, "aug": 8, "sep": 9, "oct": 10, "nov": 11, "dec": 12,
}


def _parse_single_date(s):
    """Best-effort parse of a messy date string into a float year
    (e.g. 'Jan 2019' -> 2019.08, '2020' -> 2020.0, 'Present'/'Current' -> None,
    which the caller treats as "today")."""
    if s is None:
        return None
    s = str(s).strip().lower()
    if not s or s in ("present", "current", "till date", "n/a", "nan"):
        return "present"

    # "Jan 2019", "January 2019"
    m = re.match(r"([a-zA-Z]{3,})\s+(\d{4})", s)
    if m:
        mon = m.group(1)[:3]
        year = int(m.group(2))
        month_num = _MONTHS.get(mon, 1)
        return year + (month_num - 1) / 12.0

    # plain "2019"
    m = re.search(r"(\d{4})", s)
    if m:
        return float(m.group(1))

    return None


def compute_candidate_years(start_dates_cell, end_dates_cell):
    """
    ASSUMPTION: dataset has `start_dates` / `end_dates` columns, each a
    Python-list-like string of per-position date strings, e.g.
        start_dates = "['Jan 2019', 'Jun 2021']"
        end_dates   = "['May 2021', 'Present']"
    Sums the duration of each position (Present/Current treated as "now").
    If parsing fails or columns are missing/empty, returns NaN and the
    caller falls back to a proxy (see build_features).
    """
    starts = safe_parse_list(start_dates_cell)
    ends = safe_parse_list(end_dates_cell)
    if not starts or not ends or len(starts) != len(ends):
        return np.nan

    from datetime import datetime
    current_year = datetime.now().year + (datetime.now().month - 1) / 12.0

    total = 0.0
    counted_any = False
    for s_raw, e_raw in zip(starts, ends):
        s = _parse_single_date(s_raw)
        e = _parse_single_date(e_raw)
        if s is None or s == "present":
            continue
        if e == "present":
            e = current_year
        if e is None:
            continue
        span = e - s
        if span > 0:
            total += span
            counted_any = True

    return total if counted_any else np.nan


# ----------------------------------------------------------------------
# NEW: education matching
# ----------------------------------------------------------------------
_DEGREE_LEVELS = [
    (r"\bphd\b|\bdoctorate\b|\bd\.phil", 4),
    (r"\bmaster|\bm\.?sc\b|\bmba\b|\bm\.?tech\b|\bm\.?a\b", 3),
    (r"\bbachelor|\bb\.?sc\b|\bb\.?tech\b|\bb\.?a\b|\bb\.?e\b", 2),
    (r"\bdiploma|\bassociate", 1),
]


def _degree_level(text):
    """Maps free-text degree/requirement strings to a 0-4 ordinal level."""
    if pd.isna(text):
        return 0
    t = str(text).lower()
    best = 0
    for pattern, level in _DEGREE_LEVELS:
        if re.search(pattern, t):
            best = max(best, level)
    return best


def candidate_highest_degree_level(degree_names_cell):
    """ASSUMPTION: `degree_names` is a Python-list-like string of degree
    names the candidate holds, e.g. "['Bachelor of Science']"."""
    degrees = safe_parse_list(degree_names_cell)
    if not degrees:
        return 0
    return max(_degree_level(d) for d in degrees)


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
    for col in skill_feats_df.columns:
        feats[col] = skill_feats_df[col]

    feats["n_candidate_skills"] = candidate_skills.apply(len)
    feats["n_required_skills"] = required_skills.apply(len)

    # ---- 2. Text similarity between resume text and job text ----
    # Actual vectorization (TF-IDF or sentence-embeddings) happens in
    # train.py so it can be fit on the training set only (no leakage).
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

    # ---- 3. Experience: positions held (kept) ----
    feats["n_positions_held"] = df["positions"].apply(count_positions)

    # ---- 4. Required years of experience (job side) ----
    feats["required_min_years"] = df["experiencere_requirement"].apply(parse_required_years)
    feats["required_min_years"] = feats["required_min_years"].fillna(
        feats["required_min_years"].median()
    )

    # ---- 5. NEW: candidate years of experience + experience_gap ----
    if "start_dates" in df.columns and "end_dates" in df.columns:
        feats["candidate_years"] = df.apply(
            lambda r: compute_candidate_years(r["start_dates"], r["end_dates"]), axis=1
        )
    else:
        feats["candidate_years"] = np.nan

    # Fallback: if we couldn't parse real dates, use n_positions_held * 1.5
    # as a rough proxy (average tenure guess) rather than leaving NaN.
    fallback = feats["n_positions_held"] * 1.5
    feats["candidate_years"] = feats["candidate_years"].fillna(fallback)

    feats["experience_gap"] = feats["candidate_years"] - feats["required_min_years"]

    # ---- 6. NEW: education matching ----
    if "degree_names" in df.columns:
        feats["candidate_education_level"] = df["degree_names"].apply(candidate_highest_degree_level)
    else:
        feats["candidate_education_level"] = 0

    feats["required_education_level"] = df["educationaL_requirements"].apply(_degree_level)
    feats["education_level_diff"] = (
        feats["candidate_education_level"] - feats["required_education_level"]
    )
    feats["education_match"] = (
        feats["candidate_education_level"] >= feats["required_education_level"]
    ).astype(int)

    # ---- 7. Certifications / languages: counts instead of just presence ----
    if "certification_skills" in df.columns:
        feats["n_certifications"] = df["certification_skills"].apply(
            lambda c: len(safe_parse_list(c))
        )
    else:
        feats["n_certifications"] = 0
    feats["has_certification"] = (feats["n_certifications"] > 0).astype(int)

    if "languages" in df.columns:
        feats["n_languages"] = df["languages"].apply(lambda c: len(safe_parse_list(c)))
    else:
        feats["n_languages"] = 0
    feats["has_languages"] = (feats["n_languages"] > 0).astype(int)

    # ---- 8. Misc presence flags ----
    feats["has_career_objective"] = df["career_objective"].notna().astype(int)

    return feats


if __name__ == "__main__":
    path = sys.argv[1] if len(sys.argv) > 1 else "resume_data.csv"
    df = pd.read_csv("D:/PROJECT/Career-Compass/ml_service/dataset/resume_data.csv")
    feats = build_features(df)
    print(feats.drop(columns=["resume_text", "job_text"]).describe())
    print("\nSample rows:")
    print(feats.drop(columns=["resume_text", "job_text"]).head())