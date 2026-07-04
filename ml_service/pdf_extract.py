# -*- coding: utf-8 -*-

# pip install pdfplumber PyMuPDF pytesseract pillow python-docx ultralytics

import pdfplumber
import fitz  # PyMuPDF
import pytesseract
from PIL import Image
import io
import re
import os
from docx import Document

# If on Windows, uncomment and set this:
pytesseract.pytesseract.tesseract_cmd = r"C:\Program Files\Tesseract-OCR\tesseract.exe"


# ─── YOLO CONFIG ───────────────────────────────────────────────────────────────

# Toggle this to False to disable YOLO entirely and fall back to the original
# pdfplumber/PyMuPDF/OCR pipeline only (e.g. if ultralytics isn't installed,
# or the trained model file isn't available on a given machine).
USE_YOLO = True

# Path to your trained weights from train_yolo.py.
# Adjust this if your folder layout differs.
YOLO_MODEL_PATH = r"C:\Users\PREDATOR\OneDrive\Desktop\PROJECT\Career-Compass\runs\detect\runs\resume_sections-8\weights\best.pt"
# Maps YOLO class names -> the canonical header text categorize.py's
# SECTION_HEADERS already recognizes. Keeping these in sync means the
# reconstructed text below gets parsed with high confidence downstream.
YOLO_CLASS_TO_HEADER = {
    "header": None,          # goes at the very top, no header line needed
    "contact": "Contact",
    "summary": "Summary",
    "education": "Education",
    "experience": "Experience",
    "skills": "Skills",
    "projects": "Projects",
    "languages": "Languages",
}

_yolo_model = None  # lazy-loaded singleton, so the model is only loaded once


def _get_yolo_model():
    """Loads the trained YOLO model once and reuses it across calls."""
    global _yolo_model

    if not USE_YOLO:
        return None

    if _yolo_model is not None:
        return _yolo_model

    if not os.path.exists(YOLO_MODEL_PATH):
        print(f"YOLO model not found at {YOLO_MODEL_PATH} — skipping YOLO layout detection.")
        return None

    try:
        from ultralytics import YOLO
        _yolo_model = YOLO(YOLO_MODEL_PATH)
        return _yolo_model
    except ImportError:
        print("ultralytics not installed — skipping YOLO layout detection. Run: pip install ultralytics")
        return None
    except Exception as e:
        print(f"Failed to load YOLO model: {e}")
        return None


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


def _words_to_text(words):
    """Reconstruct readable text from a list of word dicts, grouping by line (top)."""
    if not words:
        return ""
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

    return "\n".join(lines)


# ─── pdfplumber extraction function (primary method, column-aware) ───────────

def extract_with_pdfplumber(pdf_path):
    """Primary extraction — column-aware, avoids row-bleed on two-column resumes."""
    text = ""
    try:
        with pdfplumber.open(pdf_path) as pdf:
            for page in pdf.pages:
                words = page.extract_words(use_text_flow=False, keep_blank_chars=False)
                if not words:
                    continue

                split_x = _detect_column_split(words, page.width)

                if split_x is None:
                    # single column — reconstruct normally
                    text += _words_to_text(words) + "\n"
                else:
                    left = [w for w in words if w["x0"] < split_x]
                    right = [w for w in words if w["x0"] >= split_x]
                    # read left column fully, then right column
                    text += _words_to_text(left) + "\n"
                    text += _words_to_text(right) + "\n"
    except Exception as e:
        print(f"pdfplumber failed: {e}")
        return ""
    return text


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
    """Renders each PDF page to an image and OCRs it. Used when both
    pdfplumber and PyMuPDF fail to find a text layer (scanned resumes)."""
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


def _pdf_first_page_to_image(pdf_path, dpi=200):
    """
    Renders just the first page of a PDF to a temporary image file.
    Used to feed YOLO (which operates on images, not PDFs directly).
    """
    try:
        doc = fitz.open(pdf_path)
        page = doc[0]
        zoom = dpi / 72
        matrix = fitz.Matrix(zoom, zoom)
        pix = page.get_pixmap(matrix=matrix)

        temp_path = os.path.join(
            os.path.dirname(os.path.abspath(pdf_path)) or ".",
            "_yolo_temp_page.png"
        )
        pix.save(temp_path)
        doc.close()
        return temp_path
    except Exception as e:
        print(f"Failed to render PDF page to image for YOLO: {e}")
        return None


# ─── YOLO LAYOUT-AWARE EXTRACTION (new) ───────────────────────────────────────

def extract_with_yolo_layout(image_path, lang='eng', conf_threshold=0.25):
    """
    Uses the trained YOLO model (see ml_service/vision/train_yolo.py) to detect
    resume section regions directly on the image, crops each region, OCRs it
    individually, then reconstructs a clean document with explicit section
    headers matching categorize.py's SECTION_HEADERS keywords.

    This sidesteps the column-bleed problem entirely — instead of guessing
    column gutters from text positions, YOLO has actually learned what a
    "skills box" or "education box" looks like visually.

    Returns "" if YOLO isn't available, the model isn't found, or nothing
    was detected — callers should treat that as "try the next method".
    """
    model = _get_yolo_model()
    if model is None:
        return ""

    try:
        results = model(image_path, conf=conf_threshold, verbose=False)
    except Exception as e:
        print(f"YOLO inference failed: {e}")
        return ""

    if not results or len(results[0].boxes) == 0:
        return ""

    try:
        img = Image.open(image_path).convert("RGB")
    except Exception as e:
        print(f"Failed to open image for cropping: {e}")
        return ""

    sections_text = {}
    pad = 5  # small padding so OCR doesn't clip characters right at the box edge

    for box in results[0].boxes:
        class_id = int(box.cls)
        class_name = model.names[class_id]
        x1, y1, x2, y2 = box.xyxy[0].tolist()

        x1 = max(0, x1 - pad)
        y1 = max(0, y1 - pad)
        x2 = min(img.width, x2 + pad)
        y2 = min(img.height, y2 + pad)

        cropped = img.crop((x1, y1, x2, y2))
        crop_text = pytesseract.image_to_string(cropped, lang=lang).strip()

        if not crop_text:
            continue

        # if a class appears more than once (e.g. multiple experience boxes),
        # append rather than overwrite
        existing = sections_text.get(class_name, "")
        sections_text[class_name] = (existing + "\n" + crop_text).strip() if existing else crop_text

    if not sections_text:
        return ""

    # Reconstruct into a document with clean, single-line headers so
    # categorize.py's detect_sections_spacy() finds them at high confidence,
    # regardless of how the original layout was visually arranged.
    output_parts = []

    if "header" in sections_text:
        output_parts.append(sections_text["header"])

    for class_name, header_label in YOLO_CLASS_TO_HEADER.items():
        if class_name == "header" or class_name not in sections_text:
            continue
        output_parts.append(f"\n{header_label}\n{sections_text[class_name]}")

    return "\n".join(output_parts).strip()


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


def _is_weak(text, report, min_length=50):
    """Decide whether an extraction is weak enough to escalate to the next method."""
    if len(text.strip()) < min_length:
        return True
    # long-but-garbled: no email/phone AND no recognizable section headers
    if not report["has_email"] and not report["has_phone"] and not report["has_sections"]:
        return True
    return False


# ─── Master Function ────────────────────────────────────────────────────────────

def extract_resume_text(file_path, lang='eng'):
    ext = os.path.splitext(file_path)[1].lower()
    text = ""
    method = None
    report = None

    if ext == ".docx":
        text = extract_with_docx(file_path)
        method = "docx"

    elif ext == ".pdf":
        # Try YOLO layout detection first (on the rendered first page) —
        # if it's confident, this avoids column-bleed entirely.
        if USE_YOLO:
            temp_image_path = _pdf_first_page_to_image(file_path)
            if temp_image_path:
                yolo_text = extract_with_yolo_layout(temp_image_path, lang=lang)
                try:
                    os.remove(temp_image_path)
                except OSError:
                    pass

                if yolo_text.strip():
                    yolo_report = quality_check(clean_text(yolo_text))
                    if not _is_weak(yolo_text, yolo_report):
                        text, method, report = yolo_text, "yolo_layout", yolo_report

        # Fall back to the original text-extraction chain if YOLO
        # wasn't available, wasn't confident, or found nothing usable.
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
        # Try YOLO layout detection first for image uploads too.
        if USE_YOLO:
            yolo_text = extract_with_yolo_layout(file_path, lang=lang)
            if yolo_text.strip():
                yolo_report = quality_check(clean_text(yolo_text))
                if not _is_weak(yolo_text, yolo_report):
                    text, method, report = yolo_text, "yolo_layout", yolo_report

        # Fall back to plain (layout-unaware) OCR if YOLO didn't help.
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
    file_path = "mock/resume02.jpeg"  # or "resume.docx" / "resume.pdf"

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