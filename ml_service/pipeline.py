# pipeline.py

from pdf_extract import extract_resume_text
from NLP.categorize import categorize_resume
from NLP.matching import fit_job_vectorizer, match_resume_to_jobs


def process_resume(file_path: str) -> dict:
    """Extracts text from a resume file and returns structured JSON."""
    text, method, report = extract_resume_text(file_path)
    if text is None:
        raise ValueError(f"Extraction failed for {file_path}")
    return categorize_resume(text)


def train_job_matcher(jobs: list[dict], save_path="job_vectorizer.pkl"):
    """
    Run this whenever the ML section's job postings are available or updated.
    jobs: list of job JSON objects, e.g. fetched from the ML section's database/API.
    """
    fit_job_vectorizer(jobs, save_path=save_path)
    print(f"Trained job vectorizer on {len(jobs)} postings — saved to {save_path}")


def get_job_matches(resume_file_path: str, top_n=5, saved_path="job_vectorizer.pkl"):
    """
    Run this whenever a user uploads a resume.
    Returns the top_n best-matching jobs.
    """
    categorized_resume = process_resume(resume_file_path)
    matches = match_resume_to_jobs(categorized_resume, saved_path=saved_path, top_n=top_n)
    return matches


if __name__ == "__main__":
    # ── Step 1: Train the job matcher (normally triggered when job data updates) ──
    # Replace this with a real fetch from your ML section — DB query, API call, file read, etc.
    sample_jobs = [
        {
            "job_id": "1",
            "title": "Backend Engineer",
            "company": "Acme Corp",
            "skills": ["Python", "SQL", "Django", "REST APIs"],
            "experience": "3+ years building backend services",
            "projects": "Experience with microservices architecture"
        },
        {
            "job_id": "2",
            "title": "Data Scientist",
            "company": "DataCo",
            "skills": ["Python", "Pandas", "Machine Learning", "SQL"],
            "experience": "2+ years in data analysis roles",
            "projects": "Built predictive models for customer churn"
        }
    ]
    train_job_matcher(sample_jobs)

    # ── Step 2: Process a resume and get matches ──
    resume_path = "mock/CV2.jpeg"
    matches = get_job_matches(resume_path, top_n=5)

    print("\nTop job matches:")
    for m in matches:
        print(f"  {m['title']} at {m['company']} — score: {m['score']}")