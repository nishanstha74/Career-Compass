# -*- coding: utf-8 -*-

# pip install pdfplumber PyMuPDF pytesseract pillow python-docx

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


# ─── PDF OCR extraction (for scanned/image-only PDFs) — this was missing ─────

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


# ─── OCR extraction method (for scanned images: jpg/png) ─────────────────────

def extract_with_image_ocr(image_path, lang='eng'):
    """Direct OCR for image files (jpg, jpeg, png)."""
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

    if ext == ".docx":
        text = extract_with_docx(file_path)
        method = "docx"

    elif ext == ".pdf":
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

    elif ext in [".jpg", ".jpeg", ".png"]:
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
    file_path = "mock/CV2.jpeg"  # or "resume.docx"

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