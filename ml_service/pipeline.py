"""
pipeline.py — Resume -> job match & optional ATS evaluation (orchestrator)
---------------------------------------------------------------------------
  1. pdf_extract.extract_resume_text        (file -> raw text)
  2. categorize.categorize_resume            (raw text -> structured JSON)
  3. predict.rank_jobs_from_categorized     (ML ensemble career prediction)
  4. ats_score.calculate_ats_score          (Optional: 1-to-1 ATS scoring against target JD)
"""
import json
import os
from pathlib import Path
from typing import Optional, Dict, Any

import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

from pdf_extract import extract_resume_text
from NLP.categorize import categorize_resume
from ML_train.predict import rank_jobs_from_categorized
from NLP.matching import build_resume_text
from ats_score import calculate_ats_score

# pdf_extract.py's own __main__ block does `from pipeline import RESUME_PATH`
# when run standalone — kept here for that compatibility only.
<<<<<<< Updated upstream
RESUME_PATH = "mock/CV1.pdf"

=======
DEFAULT_RESUME_PATH = "mock/CV1.pdf"
>>>>>>> Stashed changes
TOP_K = 5


def _calculate_ats_evaluation(categorized: dict, job_description: str) -> dict:
    """Helper function to calculate ATS score against a target job description string."""
    # 1. Build weighted text corpus from candidate resume using matching.py
    resume_text = build_resume_text(categorized)

    # 2. Compute TF-IDF Cosine Similarity between Resume and Target Job Description
    vectorizer = TfidfVectorizer(stop_words="english", ngram_range=(1, 2))
    tfidf_matrix = vectorizer.fit_transform([resume_text, job_description])
    similarity_score = float(cosine_similarity(tfidf_matrix[0:1], tfidf_matrix[1:2])[0][0]) * 100.0

    # 3. Extract and normalize skills
    parsed_skills = categorized.get("skills", [])
    if isinstance(parsed_skills, str):
        parsed_skills = [s.strip() for s in parsed_skills.split(",") if s.strip()]

    skills_eval = {
        "score": round(similarity_score, 2),
        "matched_skills": parsed_skills,
        "missing_skills": []
    }

    # 4. Construct Section Evaluations
    experience_eval = {
        "score": 80.0,
        "required": "Not Specified",
        "found": str(categorized.get("experience", "Extracted"))
    }

    edu_list = categorized.get("education", [])
    education_eval = {
        "score": 100.0 if edu_list else 70.0,
        "required": "Bachelor Degree",
        "found": str(edu_list[0]) if isinstance(edu_list, list) and edu_list else "Not Specified",
        "matched": bool(edu_list)
    }

    # 5. Recommendations based on similarity threshold
    recommendations = []
    if similarity_score < 65.0:
        recommendations.append("Tailor your summary and experience section to include key terminology from the job description.")

    # 6. Return Final Weighted Payload via ats_score.py
    return calculate_ats_score(
        skills_eval=skills_eval,
        experience_eval=experience_eval,
        education_eval=education_eval,
        semantic_similarity_score=similarity_score,
        certification_score=80.0,
        recommendations=recommendations
    )


def run_pipeline(
    resume_path: str, 
    top_k: int = TOP_K, 
    target_job_description: Optional[str] = None
) -> Dict[str, Any]:
    
    resume_path = Path(resume_path)

    print(f"Extracting text from {resume_path}...")

    raw_text, method, report = extract_resume_text(str(resume_path))

    if not raw_text:
        raise RuntimeError(f"Could not extract text from {resume_path}")

    print(f"Extraction method : {method}")
    print(f"Quality           : {report}")

    print("\nCategorizing resume...")

    categorized = categorize_resume(raw_text)

    print(f"Categorization method : {categorized['_meta']['method']}")

    print("\nPredicting top matching jobs...")

    final_ranked = rank_jobs_from_categorized(
        categorized,
        top_n=top_k
    )

<<<<<<< Updated upstream
    return {
        "extraction_method": method,
        "categorization_method": categorized["_meta"]["method"],
        "final_ranked_jobs": final_ranked
    }


def main():

    result = run_pipeline(
        RESUME_PATH,
        top_k=TOP_K
    )

    print("\n========== TOP JOB MATCHES ==========\n")

    # print(json.dumps(result["final_ranked_jobs"], indent=4))
    for i, job in enumerate(result["final_ranked_jobs"], start=1):
        print(f"--- Job {i} ---")
        for key, value in job.items():
            print(f"  {key}: {value}")
        print()


if __name__ == "__main__":
    main()
=======
    colors = ["bg-indigo-600", "bg-blue-600", "bg-purple-600", "bg-emerald-600", "bg-amber-600"]
    
    career_predictions = []
    for idx, item in enumerate(final_ranked):
        score_val = item.get("matched_score", item.get("score", 0.7))
        confidence_pct = round(score_val * 100) if score_val <= 1.0 else round(score_val)
        career_predictions.append({
            "role": item.get("job_position_name", f"Job Option {idx+1}"),
            "confidence": confidence_pct,
            "color": colors[idx % len(colors)]
        })

    # Optional 1-to-1 ATS Evaluation (only triggered when job_description is passed)
    ats_evaluation = None
    if target_job_description:
        print("\nCalculating ATS evaluation score...")
        ats_evaluation = _calculate_ats_evaluation(categorized, target_job_description)

    parsed_skills = categorized.get("skills", [])
    if isinstance(parsed_skills, str):
        parsed_skills = [s.strip() for s in parsed_skills.split(",") if s.strip()]

    contact_info = categorized.get("contact", {})
    email_val = contact_info.get("email", "") if isinstance(contact_info, dict) else ""

    parsed_resume = {
        "name": categorized.get("name") or "Extracted Resume Profile",
        "email": email_val,
        "education": categorized.get("education", []),
        "experience": categorized.get("experience", []),
        "skills": parsed_skills
    }

    return {
        "extraction_method": method,
        "categorization_method": categorized.get("_meta", {}).get("method", "spacy"),
        "final_ranked_jobs": final_ranked,
        "careerPredictions": career_predictions,
        "parsedResume": parsed_resume,
        "ats_evaluation": ats_evaluation,
        "raw_categorized": categorized
    }


if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser(description="Run the resume-to-job pipeline")
    parser.add_argument(
        "resume_path",
        nargs="?",
        default=DEFAULT_RESUME_PATH,
        help="Path to the resume file (PDF/DOCX)."
    )
    parser.add_argument(
        "--job", 
        type=str, 
        default=None, 
        help="Optional target job description text for ATS scoring."
    )
    args = parser.parse_args()
    
    # Run pipeline with provided or default path
    result = run_pipeline(args.resume_path, top_k=TOP_K, target_job_description=args.job)
    
    print("\n========== TOP JOB MATCHES ==========\n")
    for i, job in enumerate(result["final_ranked_jobs"], start=1):
        print(f"--- Job {i} ---")
        for k, v in job.items():
            print(f"  {k}: {v}")
        print()

    if result["ats_evaluation"]:
        print("========== ATS SCORE REPORT ==========")
        print(f"Overall ATS Score: {result['ats_evaluation']['ats_score']}/100")
>>>>>>> Stashed changes
