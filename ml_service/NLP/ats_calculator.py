# ats_calculator.py — 5-Dimension Weighted ATS Evaluation Engine
import json
import os
import re
import pandas as pd
from dotenv import load_dotenv
from google import genai

# Load env vars
env_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "key.env")
load_dotenv(dotenv_path=env_path)

DATASET_PATH = os.path.join(os.path.dirname(__file__), "..", "dataset", "resume_data_last_dance.csv")


def _get_gemini_client():
    api_key = os.getenv("GEMINI_API_KEY")
    if api_key:
        try:
            return genai.Client(api_key=api_key)
        except Exception:
            pass
    return None


def get_required_skills_for_custom_role(target_role: str) -> list[str]:
    """
    Dynamically asks Gemini AI to return essential technical skills for a custom target role.
    Uses an optimized ATS prompt to output atomic, language-agnostic skill terms.
    """
    client = _get_gemini_client()
    if not client:
        return ["Problem Solving", "Communication", "Git", "Project Management", "Technical Documentation"]

    prompt = f"""
    You are a senior enterprise ATS recruiter.
    Analyze the target job role: "{target_role}".

    List the top 8 essential core technical skills, frameworks, and tools required for this role.

    CRITICAL RULES:
    1. Return ONLY atomic, clean skill names (e.g., "REST APIs", "SQL", "Docker", "Git", "API Design", "System Design").
    2. NEVER bundle multiple technologies with slashes or 'or' (e.g., NEVER return "Java/Python/Go", "SQL/NoSQL", or "AWS/GCP").
    3. For general roles like "Backend Engineer", focus on core backend engineering concepts (APIs, Databases, Systems, Version Control) rather than forcing a specific programming language like Java.
    4. Return ONLY a valid JSON array of strings without markdown formatting.

    Example format: ["REST APIs", "SQL", "Docker", "Git", "API Design", "Database Design", "CI/CD", "Linux"]
    """
    try:
        response = client.models.generate_content(
            model="gemini-3.1-flash-lite",
            contents=prompt
        )
        cleaned = response.text.strip().replace("```json", "").replace("```", "").strip()
        skills = json.loads(cleaned)
        if isinstance(skills, list) and len(skills) > 0:
            return [str(s).strip() for s in skills]
    except Exception as e:
        print(f"Gemini skill generation error: {e}")

    return ["Technical Skills", "Problem Solving", "Domain Knowledge", "Git", "System Design"]


def get_benchmark_skills(target_role: str) -> tuple[str, list[str]]:
    """
    Finds benchmark skills for target_role from resume dataset or Gemini AI fallback.
    Returns (matched_role_name, skills_list)
    """
    target_role_clean = target_role.strip().lower()

    if os.path.exists(DATASET_PATH):
        try:
            df = pd.read_csv(DATASET_PATH)
            if "job_position_name" in df.columns:
                matches = df[df["job_position_name"].astype(str).str.lower().str.contains(re.escape(target_role_clean), na=False)]
                if matches.empty:
                    matches = df[df["job_position_name"].astype(str).str.lower().apply(lambda x: x in target_role_clean)]

                if not matches.empty:
                    matched_row = matches.iloc[0]
                    role_name = matched_row["job_position_name"]
                    raw_skills = ""
                    for col in ["related_skils_in_job", "skills", "job_description"]:
                        if col in matched_row and pd.notna(matched_row[col]):
                            raw_skills += " " + str(matched_row[col])

                    skills_found = [s.strip() for s in re.split(r'[,;/|\n]+', raw_skills) if len(s.strip()) > 1]
                    unique_skills = []
                    seen = set()
                    for s in skills_found:
                        if s.lower() not in seen:
                            seen.add(s.lower())
                            unique_skills.append(s)

                    if len(unique_skills) >= 3:
                        return role_name, unique_skills[:12]
        except Exception as e:
            print(f"Error reading dataset for benchmark skills: {e}")

    # Fallback to Gemini AI for custom/unknown role
    ai_skills = get_required_skills_for_custom_role(target_role)
    return target_role.title(), ai_skills


def _is_skill_match(req: str, resume_skill: str) -> bool:
    r = req.lower().strip()
    s = resume_skill.lower().strip()
    if r == s:
        return True

    def get_tokens(text):
        return {t for t in re.split(r'[^a-zA-Z0-9+#.]+', text) if t}

    r_tokens = get_tokens(r)
    s_tokens = get_tokens(s)

    if not r_tokens or not s_tokens:
        return False

    return s_tokens.issubset(r_tokens) or r_tokens.issubset(s_tokens)


def _is_skill_in_text(req: str, text_lower: str) -> bool:
    r = req.lower().strip()
    if len(r) <= 3:
        return bool(re.search(r'\b' + re.escape(r) + r'\b', text_lower))
    return r in text_lower


def calculate_ats_and_gaps(categorized_resume: dict, target_role: str = "", top_predicted_role: str = "") -> dict:
    """
    Calculates ATS score using a 5-dimension weighted evaluation scheme:
    1. Skill Match (35%)
    2. Experience & Responsibilities (30%)
    3. Education & Credentials (15%)
    4. Projects & Practical Application (10%)
    5. Domain & Industry Fit (10%)
    """
    effective_role = target_role.strip() if target_role.strip() else top_predicted_role
    if not effective_role:
        effective_role = "Software Developer"

    matched_role_name, required_skills = get_benchmark_skills(effective_role)

    # --- 1. SKILL MATCH (Weight: 35%) ---
    resume_skills_raw = categorized_resume.get("skills", [])
    if isinstance(resume_skills_raw, str):
        resume_skills_list = [s.strip() for s in resume_skills_raw.split(",") if s.strip()]
    elif isinstance(resume_skills_raw, list):
        resume_skills_list = [str(s).strip() for s in resume_skills_raw if str(s).strip()]
    else:
        resume_skills_list = []

    full_text_lower = str(categorized_resume.get("full_text", "")).lower()

    matched_skills = []
    missing_skills = []

    for req in required_skills:
        has_skill = any(_is_skill_match(req, s) for s in resume_skills_list) or _is_skill_in_text(req, full_text_lower)
        if has_skill:
            matched_skills.append(req)
        else:
            missing_skills.append(req)

    total_req = max(len(required_skills), 1)
    skills_score = int(round((len(matched_skills) / total_req) * 100))
    skills_score = max(20, min(100, skills_score))

    # --- 2. EXPERIENCE & RESPONSIBILITIES MATCH (Weight: 30%) ---
    exp_entries = categorized_resume.get("experience", [])
    n_positions = categorized_resume.get("n_positions_held", 0)
    if not n_positions and isinstance(exp_entries, list):
        n_positions = len(exp_entries)

    if n_positions >= 3:
        experience_score = 95
    elif n_positions == 2:
        experience_score = 80
    elif n_positions == 1:
        experience_score = 65
    else:
        experience_score = 45 if len(full_text_lower) > 300 else 30

    # Title alignment bonus
    if effective_role.lower() in full_text_lower:
        experience_score = min(100, experience_score + 10)

    # --- 3. EDUCATION & CREDENTIALS MATCH (Weight: 15%) ---
    education_info = categorized_resume.get("education", [])
    has_certifications = categorized_resume.get("has_certification", False)

    if education_info or ("degree" in full_text_lower or "bachelor" in full_text_lower or "master" in full_text_lower or "bs" in full_text_lower):
        education_score = 90
        if has_certifications:
            education_score = 100
    else:
        education_score = 50

    # --- 4. PROJECTS & PRACTICAL APPLICATION MATCH (Weight: 10%) ---
    has_projects = ("project" in full_text_lower or "github" in full_text_lower or "built" in full_text_lower or "developed" in full_text_lower)
    if has_projects:
        project_score = 90 if len(resume_skills_list) >= 5 else 75
    else:
        project_score = 50

    # --- 5. DOMAIN & INDUSTRY FIT (Weight: 10%) ---
    has_objective = categorized_resume.get("has_career_objective", False) or ("objective" in full_text_lower or "summary" in full_text_lower)
    domain_score = 85 if (has_objective and len(matched_skills) > 0) else 65

    # --- WEIGHTED OVERALL ATS SCORE ---
    raw_ats = (
        (skills_score * 0.35) +
        (experience_score * 0.30) +
        (education_score * 0.15) +
        (project_score * 0.10) +
        (domain_score * 0.10)
    )
    ats_score = int(round(raw_ats))
    ats_score = max(35, min(98, ats_score))

    # --- SKILL GAPS & CATEGORIZATION ---
    skill_gaps = []
    categories = ["Core Technical", "Frameworks & Tools", "Cloud & Infrastructure", "Methodology & Architecture"]
    for idx, s in enumerate(missing_skills[:8]):
        cat = categories[idx % len(categories)]
        gap_percent = min(95, 60 + (idx * 5))
        skill_gaps.append({
            "skill": s,
            "gap": gap_percent,
            "category": cat
        })

    # --- STRENGTHS, GAPS & RECOMMENDATIONS ---
    key_strengths = []
    if matched_skills:
        key_strengths.append(f"Strong match in core skills: {', '.join(matched_skills[:3])}.")
    if experience_score >= 75:
        key_strengths.append(f"Relevant work experience profile detected for {matched_role_name}.")
    if education_score >= 85:
        key_strengths.append("Educational qualifications align with role prerequisites.")

    critical_gaps = []
    if missing_skills:
        critical_gaps.append(f"Missing required target skills: {', '.join(missing_skills[:3])}.")
    if experience_score < 70:
        critical_gaps.append("Limited detailed work experience entries found.")

    recommendations = [
        f"Incorporate missing target skills ({', '.join(missing_skills[:3]) if missing_skills else 'advanced tooling'}) into your technical skills section.",
        "Quantify project outcomes with concrete metrics (e.g. 'Reduced API response latency by 35%').",
        f"Align work history bullet points directly with core responsibilities of a '{matched_role_name}'."
    ]

    return {
        "targetRole": effective_role,
        "matchedRoleName": matched_role_name,
        "atsScore": ats_score,
        "matchedSkills": matched_skills,
        "missingSkills": missing_skills,
        "skillGaps": skill_gaps,
        "section_scores": {
            "skills": skills_score,
            "experience": experience_score,
            "education": education_score,
            "projects": project_score,
            "domain": domain_score
        },
        "key_strengths": key_strengths,
        "critical_gaps": critical_gaps,
        "recommendations": recommendations,
        "user_provided_target": bool(target_role.strip())
    }