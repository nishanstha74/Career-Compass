"""
ats_score.py - Pure ATS Score Calculator
Calculates overall ATS score based on fixed weights:
Skill Match: 40%, Experience: 25%, Education: 10%, Semantic Similarity: 20%, Certifications: 5%
"""

from typing import Dict, List, Any


def calculate_ats_score(
    skills_eval: Dict[str, Any],
    experience_eval: Dict[str, Any],
    education_eval: Dict[str, Any],
    semantic_similarity_score: float,
    certification_score: float,
    recommendations: List[str]
) -> Dict[str, Any]:

    # Extract section numerical scores
    skill_score = float(skills_eval.get("score", 0))
    exp_score = float(experience_eval.get("score", 0))
    edu_score = float(education_eval.get("score", 0))
    sem_score = float(semantic_similarity_score)
    cert_score = float(certification_score)

    # Weighted Formula Calculation
    raw_ats_score = (
        (0.40 * skill_score) +
        (0.25 * exp_score) +
        (0.10 * edu_score) +
        (0.20 * sem_score) +
        (0.05 * cert_score)
    )

    final_score = int(round(raw_ats_score))

    return {
        "ats_score": final_score,
        "section_scores": {
            "skills": int(round(skill_score)),
            "experience": int(round(exp_score)),
            "education": int(round(edu_score)),
            "semantic_similarity": int(round(sem_score)),
            "certifications": int(round(cert_score))
        },
        "matched_skills": skills_eval.get("matched_skills", []),
        "missing_skills": skills_eval.get("missing_skills", []),
        "additional_skills": skills_eval.get("additional_skills", []),
        "experience": {
            "required": str(experience_eval.get("required", "Not Specified")),
            "found": str(experience_eval.get("found", "Not Specified")),
            "score": int(round(exp_score))
        },
        "education": {
            "required": str(education_eval.get("required", "Not Specified")),
            "found": str(education_eval.get("found", "Not Specified")),
            "matched": bool(education_eval.get("matched", False))
        },
        "semantic_similarity": int(round(sem_score)),
        "recommendations": recommendations
    }