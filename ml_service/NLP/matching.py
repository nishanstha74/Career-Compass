# matching.py

import pickle
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity


def _to_text(value) -> str:
    """Handles fields that might be a list, string, or missing."""
    if isinstance(value, list):
        return " ".join(str(v) for v in value)
    return str(value) if value else ""


# ─── TEXT BUILDERS: pull skills/experience/projects out of structured JSON ─

def build_resume_text(categorized_resume: dict) -> str:
    """
    Combines skills, experience, and projects from a categorize.py resume result.
    Skills are weighted heaviest, since they're the primary matching signal.
    """
    skills = _to_text(categorized_resume.get("skills", {}).get("raw", ""))
    experience = _to_text(categorized_resume.get("experience", {}).get("raw", ""))
    projects = _to_text(categorized_resume.get("projects", {}).get("raw", ""))

    # weighting: skills counted 3x, experience 2x, projects 1x
    parts = [skills] * 3 + [experience] * 2 + [projects]
    return " ".join(p for p in parts if p)


def build_job_text(job: dict) -> str:
    """
    Combines skills, experience, and projects from a job posting JSON.
    Same weighting scheme as the resume side, so both sides are compared
    on equal footing.
    """
    skills = _to_text(job.get("skills", []))
    experience = _to_text(job.get("experience", ""))
    projects = _to_text(job.get("projects", ""))

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