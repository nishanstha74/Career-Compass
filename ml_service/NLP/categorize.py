# categorize.py

import spacy
from google import genai
from google.genai import types
import json
import re
from dotenv import load_dotenv
import os

# ─── CONFIG ───────────────────────────────────────────────────────────────────
env_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "key.env")
load_dotenv(dotenv_path=env_path)

client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))

nlp = spacy.load("en_core_web_sm")

# Expected sections — used to calculate spaCy confidence score
EXPECTED_SECTIONS = ["education", "experience", "skills", "projects"]

# All known header variants spaCy will look for
SECTION_HEADERS = {
    "name":           [],  # handled separately via NER
    "contact":        ["contact", "contact information", "personal details"],
    "education":      ["education", "academic background", "qualifications",
                       "academic qualifications", "educational background"],
    "experience":     ["experience", "work experience", "professional experience",
                       "employment history", "career history", "work history"],
    "skills":         ["skills", "technical skills", "core competencies",
                       "competencies", "key skills", "technologies", "tech stack",
                       "skillset", "technical proficiencies", "areas of expertise"],
    "projects":       ["projects", "personal projects", "academic projects",
                       "key projects", "notable projects"],
    "certifications": ["certifications", "certificates", "courses",
                       "professional certifications", "licenses"],
    "languages":      ["languages", "language proficiency", "spoken languages"],
    "summary":        ["summary", "objective", "profile", "about me",
                       "career objective", "professional summary"],
    # previously missing — these were silently swallowed into whatever
    # section was open before them (e.g. "education" absorbing everything
    # after it because the code had no bucket to put them in)
    "leadership":     ["leadership", "leadership experience"],
    "achievements":   ["achievements", "awards", "honors", "honours",
                       "accomplishments"],
    "references":     ["references"],
    "activities":     ["extracurricular", "extra curricular", "activities",
                       "volunteer", "volunteering"],
}


# ─── HEADER CLEANING HELPER ────────────────────────────────────────────────────

def _clean_header_line(stripped: str) -> str:
    """
    Strips leading bullet/icon characters, colons, and stray symbols that
    otherwise break exact/startswith header matching
    (e.g. "▪ SKILLS" would never match "skills" without this).
    """
    return re.sub(r'^[•●▪\-\*\u2022\u25aa\u25cf:\s]+', '', stripped).strip()


# ─── STAGE 1: spaCy SECTION SPLITTER ──────────────────────────────────────────

def detect_sections_spacy(text):
    """
    Splits resume text into sections based on known header keywords.
    Returns dict of { section_name: raw_text_chunk } and a confidence score.
    """
    # Normalize text — fix common two-column bleed issues
    text = re.sub(r'[ \t]{3,}', '\n', text)  # long spaces = likely column separator
    lines = text.split("\n")
    sections = {}
    current_section = "header"
    current_lines = []

    for line in lines:
        stripped = line.strip().lower()

        # Skip empty lines
        if not stripped:
            current_lines.append(line)
            continue

        cleaned = _clean_header_line(stripped)
        matched_section = None

        # Check if this line matches any known section header
        for section, keywords in SECTION_HEADERS.items():
            if any(cleaned == kw or cleaned.startswith(kw) for kw in keywords):
                matched_section = section
                break

        if matched_section:
            # Save previous section before starting new one
            if current_lines:
                # Append to existing content if this section was already seen
                # before (e.g. resume has two separate blocks under "skills")
                existing = sections.get(current_section, "")
                new_chunk = "\n".join(current_lines).strip()
                sections[current_section] = (existing + "\n" + new_chunk).strip() if existing else new_chunk
            current_section = matched_section
            current_lines = []
        else:
            current_lines.append(line)

    # Save last section
    if current_lines:
        existing = sections.get(current_section, "")
        new_chunk = "\n".join(current_lines).strip()
        sections[current_section] = (existing + "\n" + new_chunk).strip() if existing else new_chunk

    found = [s for s in EXPECTED_SECTIONS if s in sections and sections[s].strip()]
    confidence = len(found) / len(EXPECTED_SECTIONS)

    return sections, confidence


# ─── STAGE 2: spaCy ENTITY EXTRACTOR ──────────────────────────────────────────

def extract_entities_spacy(sections):
    """
    Runs spaCy NER on each section to extract structured entities.
    Returns a structured dict with entities pulled from each section.
    """
    result = {}

    # Extract candidate name from header/contact section
    header_text = sections.get("header", "") + " " + sections.get("contact", "")
    doc = nlp(header_text)
    name_found = ""
    for ent in doc.ents:
        # Require at least a first + last name (2+ words) to avoid
        # single-word false positives like "Nepal" being tagged PERSON
        if ent.label_ == "PERSON" and len(ent.text.split()) >= 2:
            name_found = ent.text
            break
    result["name"] = name_found

    # Extract contact info using regex (more reliable than NER for these)
    full_text = " ".join(sections.values())
    email = re.search(r'[\w\.-]+@[\w\.-]+\.\w+', full_text)
    phone = re.search(r'(\+?\d{1,3}[-.\s]?)?\d{7,10}', full_text)
    result["contact"] = {
        "email": email.group() if email else "",
        "phone": phone.group() if phone else "",
    }

    # Extract education entities
    edu_text = sections.get("education", "")
    edu_doc = nlp(edu_text)
    edu_orgs = [ent.text for ent in edu_doc.ents if ent.label_ == "ORG"]
    edu_dates = [ent.text for ent in edu_doc.ents if ent.label_ == "DATE"]
    result["education"] = {
        "raw": edu_text,
        "institutions": edu_orgs,
        "dates": edu_dates
    }

    # Extract experience entities
    exp_text = sections.get("experience", "")
    exp_doc = nlp(exp_text)
    exp_orgs = [ent.text for ent in exp_doc.ents if ent.label_ == "ORG"]
    exp_dates = [ent.text for ent in exp_doc.ents if ent.label_ == "DATE"]
    result["experience"] = {
        "raw": exp_text,
        "companies": exp_orgs,
        "dates": exp_dates
    }

    # Skills — kept as raw text for TF-IDF/ML stage
    result["skills"] = {
        "raw": sections.get("skills", "")
    }

    # Projects
    result["projects"] = {
        "raw": sections.get("projects", "")
    }

    # Certifications
    result["certifications"] = sections.get("certifications", "")

    # Languages
    result["languages"] = sections.get("languages", "")

    # Summary
    result["summary"] = sections.get("summary", "")

    # Newly captured sections that used to silently bleed into
    # whichever section happened to be open before them
    result["leadership"] = sections.get("leadership", "")
    result["achievements"] = sections.get("achievements", "")
    result["references"] = sections.get("references", "")
    result["activities"] = sections.get("activities", "")

    return result


# ─── STAGE 3: GEMINI FALLBACK ─────────────────────────────────────────────────

def categorize_with_gemini(text):
    prompt = f"""
You are a resume parser. Extract information from the resume text below and return ONLY a valid JSON object.
Do not include any explanation, markdown, or code blocks — return raw JSON only.

The JSON must follow this exact structure:
{{
  "name": "",
  "contact": {{
    "email": "",
    "phone": "",
    "location": ""
  }},
  "summary": "",
  "education": [
    {{
      "degree": "",
      "institution": "",
      "year": ""
    }}
  ],
  "experience": [
    {{
      "title": "",
      "company": "",
      "duration": "",
      "description": ""
    }}
  ],
  "skills": [],
  "projects": [
    {{
      "title": "",
      "description": ""
    }}
  ],
  "certifications": [],
  "languages": []
}}

If any section is missing from the resume, return empty string "" for strings or empty array [] for lists.

Resume text:
{text}
"""

    try:
        response = client.models.generate_content(
            model="gemini-1.5-flash",
            contents=prompt
        )
        raw = response.text.strip()

        # Strip markdown code blocks if Gemini wraps response in them
        raw = re.sub(r'^```json|^```|```$', '', raw, flags=re.MULTILINE).strip()

        return json.loads(raw)

    except json.JSONDecodeError as e:
        print(f"Gemini returned invalid JSON: {e}")
        return None
    except Exception as e:
        print(f"Gemini API failed: {e}")
        return None


# ─── STAGE 4: MERGE spaCy + GEMINI RESULTS ────────────────────────────────────

def merge_results(spacy_result, gemini_result):
    """
    Merges spaCy and Gemini results.
    Gemini fills in what spaCy missed; spaCy's entity-level extractions
    (email/phone) are kept since regex is generally more reliable than
    an LLM for those specific fixed-format fields.
    """
    if not gemini_result:
        return spacy_result  # fixed: was "spacy_result4" (undefined variable, crash bug)

    merged = gemini_result.copy()

    # Keep spaCy's entity-level detail where Gemini only has raw text
    if spacy_result.get("contact", {}).get("email"):
        merged.setdefault("contact", {})
        merged["contact"]["email"] = spacy_result["contact"]["email"]
    if spacy_result.get("contact", {}).get("phone"):
        merged.setdefault("contact", {})
        merged["contact"]["phone"] = spacy_result["contact"]["phone"]

    # Carry over sections Gemini's fixed schema doesn't ask for at all
    merged["leadership"] = spacy_result.get("leadership", "")
    merged["achievements"] = spacy_result.get("achievements", "")
    merged["references"] = spacy_result.get("references", "")
    merged["activities"] = spacy_result.get("activities", "")

    return merged


# ─── MASTER CATEGORIZATION FUNCTION ───────────────────────────────────────────

def categorize_resume(extracted_text, confidence_threshold=0.5):
    """
    Main function. Takes extracted text, returns structured JSON.
    Uses spaCy first, falls back to Gemini if confidence is low.
    """
    print("Running spaCy section detection...")
    sections, confidence = detect_sections_spacy(extracted_text)
    print(f"spaCy confidence: {confidence:.0%} — found sections: {list(sections.keys())}")

    if confidence >= confidence_threshold:
        print("spaCy confidence sufficient — extracting entities...")
        result = extract_entities_spacy(sections)
        result["_meta"] = {"method": "spacy", "confidence": confidence}

    else:
        print(f"spaCy confidence too low ({confidence:.0%}) — falling back to Gemini...")
        spacy_result = extract_entities_spacy(sections)  # still run for entity detail
        gemini_result = categorize_with_gemini(extracted_text)
        result = merge_results(spacy_result, gemini_result)
        result["_meta"] = {"method": "hybrid", "confidence": confidence}

    return result


# ─── MAIN ─────────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    # Read extracted text from your extraction pipeline output
    input_path = os.path.join("..", "output", "extracted_output.txt")
    output_path = os.path.join("..", "output", "categorized_output.json")

    if not os.path.exists(input_path):
        print(f"Input file not found: {input_path}")
        print("Run pdf_extract.py first to generate extracted_output.txt")
    else:
        with open(input_path, "r", encoding="utf-8") as f:
            text = f.read()

        result = categorize_resume(text)

        os.makedirs(os.path.join("..", "output"), exist_ok=True)
        with open(output_path, "w", encoding="utf-8") as f:
            json.dump(result, f, indent=2, ensure_ascii=False)

        print(f"\nCategorization method: {result['_meta']['method']}")
        print(f"Saved to: {os.path.abspath(output_path)}")
        print(f"\n--- JSON Preview ---")
        print(json.dumps(result, indent=2)[:1000])