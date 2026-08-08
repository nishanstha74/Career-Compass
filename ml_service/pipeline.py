"""
pipeline.py — Resume -> job match pipeline (orchestrator)
-----------------------------------------------------------
  1. pdf_extract.extract_resume_text    (file -> raw text)
  2. categorize.categorize_resume        (raw text -> structured JSON)
  3. predict.rank_jobs_from_categorized  (ML ensemble prediction)
  4. ats_calculator.calculate_ats_and_gaps (5-dimension weighted ATS calculation)
"""
import json
import os
from pathlib import Path
import pandas as pd

from pdf_extract import extract_resume_text
from NLP.categorize import categorize_resume
from ML_train.predict import rank_jobs_from_categorized
from NLP.ats_calculator import calculate_ats_and_gaps

DEFAULT_RESUME_PATH = "mock/CV1.pdf"
TOP_K = 5


def run_pipeline(resume_path: str, target_role: str = "", top_k: int = 5):
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

    top_predicted_role = final_ranked[0].get("job_position_name", "") if final_ranked else ""
    
    # Calculate 5-Dimension ATS score and skill gaps
    ats_analysis = calculate_ats_and_gaps(
        categorized_resume=categorized,
        target_role=target_role,
        top_predicted_role=top_predicted_role
    )

    return {
        "extraction_method": method,
        "categorization_method": categorized.get("_meta", {}).get("method", "spacy"),
        "final_ranked_jobs": final_ranked,
        "careerPredictions": career_predictions,
        "parsedResume": parsed_resume,
        "atsAnalysis": ats_analysis,
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
    args = parser.parse_args()
    result = run_pipeline(args.resume_path, top_k=TOP_K)
    print("\n========== TOP JOB MATCHES ==========\n")
    for i, job in enumerate(result["final_ranked_jobs"], start=1):
        print(f"--- Job {i} ---")
        for k, v in job.items():
            print(f"  {k}: {v}")
        print()