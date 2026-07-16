# -*- coding: utf-8 -*-

# pip install pdfplumber PyMuPDF pytesseract pillow python-docx google-genai
# (google-generativeai is deprecated — this uses the current google-genai SDK)

import pdfplumber
import fitz  # PyMuPDF
import pytesseract
from PIL import Image
import io
import re
import os
import json
import time
from docx import Document

# If on Windows, uncomment and set this:
pytesseract.pytesseract.tesseract_cmd = r"C:\Program Files\Tesseract-OCR\tesseract.exe"


# ─── GEMINI CONFIG (zero-shot section classification — no training needed) ───

# Toggle this to False to disable Gemini entirely and fall back to the
# original pdfplumber/PyMuPDF/OCR pipeline only (e.g. if the API key isn't
# set, google-generativeai isn't installed, or you're offline).
USE_GEMINI = True

# Match whatever model/config categorize.py already uses for its Gemini
# calls — reuse the same one here rather than paying for two setups.
GEMINI_MODEL = os.getenv(
    "GEMINI_MODEL",
    "gemini-3.1-flash-lite"
)

# Same env var categorize.py reads its API key from.
GEMINI_API_KEY_ENV_VAR = "GEMINI_API_KEY"

# Free-tier Gemini enforces requests-per-minute / requests-per-day limits.
# A single resume is nowhere near the per-request token limit (that's in the
# hundreds of thousands+), so retries here are only ever about pacing
# requests, not about the resume being "too long".
GEMINI_MAX_RETRIES = 4
GEMINI_BASE_BACKOFF_SECONDS = 2  # backs off 2s, 4s, 8s, 16s on repeated 429s

SECTION_LABELS = [
    "O",
    "Header",
    "Contact",
    "Summary",
    "Education",
    "Experience",
    "Skills",
    "Projects",
    "Languages",
    "Certifications",
]

# Maps a section label -> the canonical header text categorize.py's
# SECTION_HEADERS already recognizes. Keeping these in sync means the
# reconstructed text below gets parsed with high confidence downstream.
LABEL_TO_HEADER = {
    "Header": None,          # goes at the very top, no header line needed
    "Contact": "Contact",
    "Summary": "Summary",
    "Education": "Education",
    "Experience": "Experience",
    "Skills": "Skills",
    "Projects": "Projects",
    "Languages": "Languages",
    "Certifications": "Certifications",
}

_gemini_client = None  # lazy-initialized singleton


def _get_gemini_client():
    """Initializes the Gemini client once and reuses it across calls."""
    global _gemini_client

    if not USE_GEMINI:
        return None

    if _gemini_client is not None:
        return _gemini_client

    api_key = os.environ.get(GEMINI_API_KEY_ENV_VAR)
    if not api_key:
        print(f"{GEMINI_API_KEY_ENV_VAR} not set — skipping Gemini section classification.")
        return None

    try:
        from google import genai
        _gemini_client = genai.Client(api_key=api_key)
        return _gemini_client
    except ImportError:
        print("google-genai not installed — run: pip install google-genai")
        return None
    except Exception as e:
        print(f"Failed to initialize Gemini client: {e}")
        return None


def _build_section_prompt(numbered_lines):
    """Builds the zero-shot classification prompt. No examples/training data
    needed — Gemini already knows what resumes look like; we're just telling
    it exactly which labels we want and how to format the answer."""
    labels_str = ", ".join(l for l in SECTION_LABELS if l != "O")
    lines_block = "\n".join(f"{i}: {line}" for i, line in numbered_lines)

    return f"""You are labeling each line of text extracted from a resume with the section it belongs to.

Allowed labels: {labels_str}, O

Use "O" for anything that isn't part of a real section — e.g. a stray page number, a decorative separator, or a leftover artifact from PDF text extraction.

Rules:
- "Header" is the candidate's name / professional title line at the very top of the resume, and nothing else.
- "Contact" is email, phone, address, LinkedIn/portfolio/GitHub links.
- A section heading line itself (e.g. the word "Education" on its own line) should get the same label as the content underneath it.
- Every line must get exactly one label from the allowed list.
- Preserve the original line index exactly as given.

Resume lines (format is "index: text"):
{lines_block}

Return ONLY a JSON array, with no other text before or after it, in this exact form:
[{{"index": 0, "label": "Header"}}, {{"index": 1, "label": "Contact"}}]

One entry per input line, covering every index from 0 to {len(numbered_lines) - 1}.
"""


def _call_gemini_with_retries(client, prompt):
    """Calls Gemini, retrying with exponential backoff if we hit a rate
    limit (HTTP 429). This is about request pacing on the free tier, not
    about the prompt being too long — a resume is far under any per-request
    token cap."""
    from google.genai import types

    for attempt in range(GEMINI_MAX_RETRIES):
        try:
            response = client.models.generate_content(
                model=GEMINI_MODEL,
                contents=prompt,
                config=types.GenerateContentConfig(response_mime_type="application/json"),
            )
            return response.text
        except Exception as e:
            msg = str(e).lower()
            is_rate_limit = "429" in msg or "rate limit" in msg or "resource exhausted" in msg or "quota" in msg

            if is_rate_limit and attempt < GEMINI_MAX_RETRIES - 1:
                wait = GEMINI_BASE_BACKOFF_SECONDS * (2 ** attempt)
                print(f"Gemini rate limit hit — waiting {wait}s before retry ({attempt + 1}/{GEMINI_MAX_RETRIES})")
                time.sleep(wait)
                continue

            print(f"Gemini call failed: {e}")
            return None
    return None


def _parse_gemini_labels(response_text, n_lines):
    """Parses Gemini's JSON response into a label-per-line list. Any line
    Gemini didn't confidently cover defaults to 'O' rather than crashing
    the pipeline — a partial response is still useful."""
    if not response_text:
        return None

    cleaned = response_text.strip()
    if cleaned.startswith("```"):
        cleaned = re.sub(r'^```(json)?', '', cleaned).rstrip('`').strip()

    try:
        data = json.loads(cleaned)
    except Exception as e:
        print(f"Failed to parse Gemini response as JSON: {e}")
        return None

    if not isinstance(data, list):
        print("Gemini response was valid JSON but not a list — treating as failed.")
        return None

    labels = ["O"] * n_lines
    for item in data:
        if not isinstance(item, dict):
            continue
        idx = item.get("index")
        label = item.get("label")
        if not isinstance(idx, int) or label not in SECTION_LABELS:
            continue
        if 0 <= idx < n_lines:
            labels[idx] = label

    return labels


def classify_lines_with_gemini(lines):
    """
    Sends resume lines to Gemini and asks it to zero-shot label each one
    with the section it belongs to — no fine-tuning, no labeled training
    set, no model file to manage. Reconstructs a clean document with
    explicit section headers matching categorize.py's SECTION_HEADERS
    keywords, same output shape the rest of the pipeline already expects.

    Returns "" if Gemini isn't configured/available, the call fails after
    retries, or nothing was confidently labeled — callers should treat that
    as "try the next method".
    """
    if not lines:
        return ""

    client = _get_gemini_client()
    if client is None:
        return ""

    numbered_lines = list(enumerate(lines))
    prompt = _build_section_prompt(numbered_lines)

    response_text = _call_gemini_with_retries(client, prompt)
    labels = _parse_gemini_labels(response_text, len(lines))
    if labels is None:
        return ""

    sections = {}
    order = []
    for line, label in zip(lines, labels):
        if label == "O":
            continue
        if label not in sections:
            sections[label] = []
            order.append(label)
        sections[label].append(line)

    if not sections:
        return ""

    output_parts = []
    if "Header" in sections:
        output_parts.append("\n".join(sections["Header"]))

    for label, header_label in LABEL_TO_HEADER.items():
        if label == "Header" or label not in sections:
            continue
        output_parts.append(f"\n{header_label}\n" + "\n".join(sections[label]))

    return "\n".join(output_parts).strip()


# ─── COLUMN DETECTION HELPER ──────────────────────────────────────────────────

def _detect_column_split(words, page_width, min_gap=20):
    """
    Given a list of pdfplumber word dicts (each with x0, x1, top, bottom, text),
    tries to find a vertical gutter that splits the page into two columns.
    Returns the x-coordinate of the split, or None if the page looks single-column.
    """
    if not words:
        return None

    # Build a coverage array across the page width to find empty vertical strips
    resolution = 2  # points per bucket
    n_buckets = int(page_width // resolution) + 1
    covered = [False] * n_buckets

    for w in words:
        start = int(w["x0"] // resolution)
        end = int(w["x1"] // resolution)
        for b in range(max(0, start), min(n_buckets, end + 1)):
            covered[b] = True

    # Only look for a gutter in the middle third of the page —
    # avoids treating normal word spacing as a column break
    lo = n_buckets // 3
    hi = 2 * n_buckets // 3

    gap_start = None
    best_gap = (0, None)  # (gap_width_in_points, x_position)

    for i in range(lo, hi):
        if not covered[i]:
            if gap_start is None:
                gap_start = i
        else:
            if gap_start is not None:
                gap_width = (i - gap_start) * resolution
                if gap_width > best_gap[0]:
                    mid = (gap_start + i) // 2
                    best_gap = (gap_width, mid * resolution)
                gap_start = None

    gap_width, split_x = best_gap
    if gap_width >= min_gap:
        return split_x
    return None


def _words_to_lines(words):
    """Reconstruct a list of readable lines from pdfplumber word dicts,
    grouping words by their vertical position (top)."""
    if not words:
        return []
    words = sorted(words, key=lambda w: (round(w["top"], 1), w["x0"]))
    lines = []
    current_line = []
    current_top = None
    line_tol = 3  # points — words within this vertical tolerance are on the same line

    for w in words:
        if current_top is None or abs(w["top"] - current_top) <= line_tol:
            current_line.append(w)
            current_top = w["top"] if current_top is None else current_top
        else:
            current_line.sort(key=lambda w: w["x0"])
            lines.append(" ".join(x["text"] for x in current_line))
            current_line = [w]
            current_top = w["top"]

    if current_line:
        current_line.sort(key=lambda w: w["x0"])
        lines.append(" ".join(x["text"] for x in current_line))

    return lines


def _words_to_text(words):
    return "\n".join(_words_to_lines(words))


def _get_ordered_lines_from_pdf(pdf_path):
    """
    Column-aware line extraction: reads each page's words, splits into left/
    right columns if a gutter is detected (so column text doesn't bleed
    together), and returns one flat list of lines in natural reading order.
    This is what gets sent to Gemini for section classification, and is also
    reused as-is for the plain-text fallback (extract_with_pdfplumber).
    """
    all_lines = []
    try:
        with pdfplumber.open(pdf_path) as pdf:
            for page in pdf.pages:
                words = page.extract_words(use_text_flow=False, keep_blank_chars=False)
                if not words:
                    continue

                split_x = _detect_column_split(words, page.width)

                if split_x is None:
                    all_lines.extend(_words_to_lines(words))
                else:
                    left = [w for w in words if w["x0"] < split_x]
                    right = [w for w in words if w["x0"] >= split_x]
                    all_lines.extend(_words_to_lines(left))
                    all_lines.extend(_words_to_lines(right))
    except Exception as e:
        print(f"pdfplumber failed while preparing lines: {e}")
        return []

    return [ln for ln in all_lines if ln.strip()]


def extract_with_gemini_pdf(pdf_path):
    """Entry point for PDFs: pulls column-aware lines via pdfplumber, then
    has Gemini zero-shot classify each line into a resume section."""
    lines = _get_ordered_lines_from_pdf(pdf_path)
    return classify_lines_with_gemini(lines)


def extract_with_gemini_image(image_path, lang='eng'):
    """Entry point for image uploads (jpg/png): OCRs the image first (no
    layout awareness needed at this stage — Gemini figures out the
    sections from the text and reading order alone), then classifies."""
    raw_text = extract_with_image_ocr(image_path, lang=lang)
    lines = [ln.strip() for ln in raw_text.splitlines() if ln.strip()]
    return classify_lines_with_gemini(lines)


# ─── pdfplumber extraction function (fallback method, column-aware) ──────────

def extract_with_pdfplumber(pdf_path):
    """Column-aware plain-text extraction. Used as a fallback if Gemini
    isn't available/confident, and shares the same line-extraction logic
    that feeds Gemini above."""
    lines = _get_ordered_lines_from_pdf(pdf_path)
    return "\n".join(lines)


# ─── PyMuPDF extraction function (fallback option, column-aware) ─────────────

def extract_with_pymupdf(pdf_path):
    """Fallback extraction — used if pdfplumber gives weak results."""
    text = ""
    try:
        doc = fitz.open(pdf_path)
        if doc.is_encrypted:
            doc.authenticate("")
        for page in doc:
            page_width = page.rect.width
            blocks = page.get_text("blocks")  # (x0, y0, x1, y1, text, block_no, ...)

            midpoint = page_width / 2
            left_col = sorted([b for b in blocks if b[0] < midpoint], key=lambda b: b[1])
            right_col = sorted([b for b in blocks if b[0] >= midpoint], key=lambda b: b[1])

            for b in left_col:
                text += b[4]
            for b in right_col:
                text += b[4]
            text += "\n"
        doc.close()
    except Exception as e:
        print(f"PyMuPDF failed: {e}")
        return ""
    return text


# ─── PDF OCR extraction (for scanned/image-only PDFs) ────────────────────────

def extract_with_ocr(pdf_path, lang='eng', dpi=300):
    """Renders each PDF page to an image and OCRs it. Used when the page has
    no extractable text layer for pdfplumber/Gemini to work with at all
    (scanned resumes)."""
    text = ""
    try:
        doc = fitz.open(pdf_path)
        zoom = dpi / 72  # fitz default is 72 dpi
        matrix = fitz.Matrix(zoom, zoom)
        for page in doc:
            pix = page.get_pixmap(matrix=matrix)
            img = Image.open(io.BytesIO(pix.tobytes("png")))
            text += pytesseract.image_to_string(img, lang=lang) + "\n"
        doc.close()
    except Exception as e:
        print(f"PDF OCR failed: {e}")
        return ""
    return text


# ─── OCR extraction method (for scanned images: jpg/png) ─────────────────────

def extract_with_image_ocr(image_path, lang='eng'):
    """Direct OCR for image files (jpg, jpeg, png) — no layout awareness."""
    text = ""
    try:
        img = Image.open(image_path)
        width, height = img.size
        if width < 1000:
            scale = 1000 / width
            img = img.resize((int(width * scale), int(height * scale)), Image.LANCZOS)
        text = pytesseract.image_to_string(img, lang=lang)
    except Exception as e:
        print(f"Image OCR failed: {e}")
    return text


# ─── DOCX extraction function (for word resumes) ──────────────────────────────

def extract_with_docx(docx_path):
    """For resumes uploaded as .docx instead of PDF."""
    text = ""
    try:
        doc = Document(docx_path)
        for para in doc.paragraphs:
            text += para.text + "\n"
        for table in doc.tables:
            for row in table.rows:
                for cell in row.cells:
                    text += cell.text + "\n"
    except Exception as e:
        print(f"DOCX extraction failed: {e}")
        return ""
    return text


# ─── text cleaning function ───────────────────────────────────────────────────

def clean_text(text):
    """Normalize text before sending to NLP categorization."""
    text = re.sub(r'\n{3,}', '\n\n', text)
    text = re.sub(r'[ \t]+', ' ', text)
    text = re.sub(r'\u00ad', '', text)
    text = re.sub(r'•|●|▪', '-', text)
    return text.strip()


# ─── Quality Check Function ────────────────────────────────────────────────────

def quality_check(text):
    """Sanity check — flags weak extractions before they reach NLP."""
    has_email = bool(re.search(r'[\w\.-]+@[\w\.-]+\.\w+', text))
    has_phone = bool(re.search(r'(\+?\d{1,3}[-.\s]?)?\d{7,10}', text))
    section_keywords = ['experience', 'education', 'skills', 'project']
    has_sections = any(k in text.lower() for k in section_keywords)
    return {
        "has_email": has_email,
        "has_phone": has_phone,
        "has_sections": has_sections,
        "length": len(text)
    }


def _is_weak(text, report, min_length=300):
    """Decide whether an extraction is weak enough to escalate to the next method."""
    if len(text.strip()) < min_length:
        return True
    # A real resume extraction should have email, phone, AND section headers.
    # Missing any one of these is a strong signal of a partial/garbled
    # extraction (e.g. Gemini mislabeling the contact-info lines, or OCR
    # mangling a header) — so escalate to the next method if any is missing.
    if not report["has_email"] or not report["has_phone"] or not report["has_sections"]:
        return True
    return False

# ─── Master Function ────────────────────────────────────────────────────────────

def extract_resume_text(file_path, lang='eng'):
    ext = os.path.splitext(file_path)[1].lower()
    text = ""
    method = None
    base_method = None      #actual text extractor
    report = None

    if ext == ".docx":
        text = extract_with_docx(file_path)
        method = "docx"

    elif ext == ".pdf":
        # Try Gemini zero-shot section classification first — if it's
        # confident, this avoids column-bleed entirely and needs no
        # training data or model file.
        if USE_GEMINI:
            gemini_text = extract_with_gemini_pdf(file_path)
            if gemini_text.strip():
                gemini_report = quality_check(clean_text(gemini_text))
                if not _is_weak(gemini_text, gemini_report):
                    #text, method, report = gemini_text, "gemini", gemini_report
                    text = gemini_text
                    base_method = "pdfplumber"
                    method = f"{base_method} + Gemini (section separation)"
                    report = gemini_report

        # Fall back to the original text-extraction chain if Gemini wasn't
        # available, wasn't confident, or found nothing usable.
        if not text.strip():
            text = extract_with_pdfplumber(file_path)
            method = "pdfplumber"
            report = quality_check(clean_text(text)) if text.strip() else None

            if not text.strip() or _is_weak(text, report):
                text2 = extract_with_pymupdf(file_path)
                if text2.strip():
                    text, method = text2, "pymupdf"
                    report = quality_check(clean_text(text))

            if not text.strip() or _is_weak(text, report or quality_check("")):
                text3 = extract_with_ocr(file_path, lang=lang)
                if text3.strip():
                    text, method = text3, "ocr"

    elif ext in [".jpg", ".jpeg", ".png", ".webp"]:
        # Try Gemini (OCR + zero-shot classification) first for image uploads too.
        if USE_GEMINI:
            gemini_text = extract_with_gemini_image(file_path, lang=lang)
            if gemini_text.strip():
                gemini_report = quality_check(clean_text(gemini_text))
                if not _is_weak(gemini_text, gemini_report):
                    text = gemini_text
                    base_method = "OCR"
                    method = f"{base_method} + Gemini (section separation)"
                    report = gemini_report

        # Fall back to plain (layout-unaware) OCR if Gemini didn't help.
        if not text.strip():
            text = extract_with_image_ocr(file_path, lang=lang)
            method = "image_ocr"

    else:
        print(f"Unsupported file type: {ext}")
        return None, None, None

    if len(text.strip()) < 10:
        print("Extraction failed completely — flag for manual review.")
        return None, method, None

    cleaned = clean_text(text)
    report = quality_check(cleaned)
    return cleaned, method, report


if __name__ == "__main__":
    # RESUME_PATH lives in pipeline.py — the single source of truth.
    # Change the resume there, not here.
    from pipeline import RESUME_PATH as file_path

    text, method, report = extract_resume_text(file_path)

    if text:
        print(f"Extraction method used: {method}")
        print(f"Quality report: {report}")

        os.makedirs("output", exist_ok=True)
        with open("output/extracted_output.txt", "w", encoding="utf-8") as f:
            f.write(text)
        print("Saved to extracted_output.txt")
    else:
        print("Could not extract usable text from this file.")