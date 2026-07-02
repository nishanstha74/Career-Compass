# This is the section where we are using TF-IDF vectorization for feature engineering..

# matching.py

from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity


def build_corpus_text(categorized_resume: dict) -> str:
    """Pulls skill-relevant text out of a categorize.py JSON result."""
    parts = [
        categorized_resume.get("skills", {}).get("raw", ""),
        categorized_resume.get("experience", {}).get("raw", ""),
        categorized_resume.get("projects", {}).get("raw", ""),
        categorized_resume.get("summary", "")
    ]
    return " ".join(p for p in parts if p)


def rank_resumes_by_job(resume_texts: list[str], job_description: str) -> list[tuple[int, float]]:
    """Returns (index, score) pairs sorted best-match first."""
    documents = resume_texts + [job_description]

    vectorizer = TfidfVectorizer(
        stop_words='english',
        ngram_range=(1, 2),
        max_features=5000
    )
    tfidf_matrix = vectorizer.fit_transform(documents)

    job_vector = tfidf_matrix[-1]
    resume_vectors = tfidf_matrix[:-1]

    scores = cosine_similarity(resume_vectors, job_vector).flatten()
    return sorted(enumerate(scores), key=lambda x: x[1], reverse=True)