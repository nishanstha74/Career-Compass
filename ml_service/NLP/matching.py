# matching.py

import pickle
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity


def _to_text(value) -> str:
    """Handles fields that might be a list, string, or missing."""
    if isinstance(value, list):
        return " ".join(str(v) for v in value)
    return str(value) if value else ""


def _extract_raw(value) -> str:
    """
    Handles the shapes categorize.py's categorize_resume() can actually
    produce for a section like 'experience' or 'projects':
      - dict with a 'raw' key (spaCy path):      {"raw": "..."}
      - list of dicts (Gemini fallback path):    [{"title": ..., "description": ...}, ...]
      - plain string, or missing/empty
    The old code assumed only the first shape and crashed
    (AttributeError: 'list' object has no attribute 'get') whenever the
    Gemini fallback path ran, since that path returns lists of dicts here
    instead of a {"raw": ...} dict.
    """
    if isinstance(value, dict):
        return value.get("raw", "")
    if isinstance(value, list):
        parts = []
        for item in value:
            if isinstance(item, dict):
                parts.append(" ".join(str(v) for v in item.values() if v))
            else:
                parts.append(str(item))
        return " ".join(parts)
    return str(value) if value else ""


# ─── TEXT BUILDERS: pull skills/experience/projects out of structured JSON ─

def build_resume_text(categorized_resume: dict) -> str:
    """
    Combines skills, experience, and projects from a categorize.py resume result.
    Skills are weighted heaviest, since they're the primary matching signal.
    """
    # categorize.py's _add_ml_features() always flattens 'skills' into a
    # plain list before returning, regardless of which path (spaCy/Gemini)
    # produced it — so skills is read as a list here, not {"raw": ...}.
    skills = _to_text(categorized_resume.get("skills", []))
    experience = _extract_raw(categorized_resume.get("experience", ""))
    projects = _extract_raw(categorized_resume.get("projects", ""))

    # weighting: skills counted 3x, experience 2x, projects 1x
    parts = [skills] * 3 + [experience] * 2 + [projects]
    return " ".join(p for p in parts if p)


def build_job_text(job: dict) -> str:
    """
    Combines skills, experience, and projects from a job posting JSON.
    Same weighting scheme as the resume side, so both sides are compared
    on equal footing. Uses _extract_raw defensively in case job records
    ever carry the same nested/list shapes as resume records.
    """
    skills = _to_text(job.get("skills", []))
    experience = _extract_raw(job.get("experience", ""))
    projects = _extract_raw(job.get("projects", ""))

    parts = [skills] * 3 + [experience] * 2 + [projects]
    return " ".join(p for p in parts if p)


# ─── STEP 1: Train once on all job postings ───────────────────────────────

def fit_job_vectorizer(jobs: list[dict], save_path="job_vectorizer.pkl"):
    """
    Run this whenever your job postings database is created/updated.
    jobs: list of job JSON objects from the ML section.
    """
    job_texts = [build_job_text(job) for job in jobs]

    vectorizer = TfidfVectorizer(
        stop_words='english',
        ngram_range=(1, 2),
        max_features=5000
    )
    job_vectors = vectorizer.fit_transform(job_texts)

    with open(save_path, "wb") as f:
        pickle.dump({
            "vectorizer": vectorizer,
            "job_vectors": job_vectors,
            "jobs": jobs
        }, f)

    return vectorizer, job_vectors


# ─── STEP 2: For each new resume, reuse the saved vectorizer ─────────────

def match_resume_to_jobs(categorized_resume: dict, saved_path="job_vectorizer.pkl", top_n=5):
    """
    Run this every time a new resume comes in.
    Returns top_n best-matching jobs with their scores.
    """
    with open(saved_path, "rb") as f:
        data = pickle.load(f)
    vectorizer = data["vectorizer"]
    job_vectors = data["job_vectors"]
    jobs = data["jobs"]

    resume_text = build_resume_text(categorized_resume)
    resume_vector = vectorizer.transform([resume_text])  # reuse learned vocabulary

    scores = cosine_similarity(resume_vector, job_vectors).flatten()
    ranked_indices = sorted(range(len(scores)), key=lambda i: scores[i], reverse=True)

    results = []
    for i in ranked_indices[:top_n]:
        results.append({
            "job_id": jobs[i].get("job_id"),
            "title": jobs[i].get("title"),
            "company": jobs[i].get("company"),
            "score": round(float(scores[i]), 4)
        })
    return results