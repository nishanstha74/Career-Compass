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

#pdfplumber extraction function (primary method)
def extract_with_pdfplumber(pdf_path):
    """Primary extraction — best structure preservation for resumes."""
    text = ""
    try:
        with pdfplumber.open(pdf_path) as pdf:
            for page in pdf.pages:
                page_text = page.extract_text()
                if page_text:
                    text += page_text + "\n"
    except Exception as e:
        print(f"pdfplumber failed: {e}")
        return ""
    return text

#PyMuPDF extraction fucntion(fallback option)

def extract_with_pymupdf(pdf_path):
    """Fallback extraction — used if pdfplumber gives weak results."""
    text = ""
    try:
        doc = fitz.open(pdf_path)
        if doc.is_encrypted:
            doc.authenticate("")
        for page in doc:
            text += page.get_text(sort=True) + "\n"
        doc.close()
    except Exception as e:
        print(f"PyMuPDF failed: {e}")
        return ""
    return text

#OCR extraction method (for scanned pdfs)

def extract_with_image_ocr(image_path, lang='eng'):
    """Direct OCR for image files (jpg, jpeg, png)."""
    text = ""
    try:
        img = Image.open(image_path)
        # Upscale if image is too small for accurate OCR
        width, height = img.size
        if width < 1000:
            scale = 1000 / width
            img = img.resize((int(width * scale), int(height * scale)), Image.LANCZOS)
        text = pytesseract.image_to_string(img, lang=lang)
    except Exception as e:
        print(f"Image OCR failed: {e}")
    return text

# DOCX extraction function (for word resume)

def extract_with_docx(docx_path):
    """For resumes uploaded as .docx instead of PDF."""
    text = ""
    try:
        doc = Document(docx_path)
        for para in doc.paragraphs:
            text += para.text + "\n"
        # Also pull text from tables, common in resume templates
        for table in doc.tables:
            for row in table.rows:
                for cell in row.cells:
                    text += cell.text + "\n"
    except Exception as e:
        print(f"DOCX extraction failed: {e}")
        return ""
    return text

#text cleaning fucntion

def clean_text(text):
    """Normalize text before sending to NLP categorization."""
    text = re.sub(r'\n{3,}', '\n\n', text)       # collapse excess blank lines
    text = re.sub(r'[ \t]+', ' ', text)           # collapse multiple spaces
    text = re.sub(r'\u00ad', '', text)            # remove soft hyphens
    text = re.sub(r'•|●|▪', '-', text)            # normalize bullets
    return text.strip()

#Quality Check Function

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

# Master Function

def extract_resume_text(file_path, lang='eng'):
    ext = os.path.splitext(file_path)[1].lower()

    # --- DOCX path ---
    if ext == ".docx":
        text = extract_with_docx(file_path)
        method = "docx"

    # --- PDF path ---
    elif ext == ".pdf":
        text = extract_with_pdfplumber(file_path)
        method = "pdfplumber"

        if len(text.strip()) < 50:
            text = extract_with_pymupdf(file_path)
            method = "pymupdf"

        if len(text.strip()) < 50:
            text = extract_with_ocr(file_path, lang=lang)
            method = "ocr"

    # --- Image path (NEW) ---
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
    file_path = "mock/CV.jpeg"  # or "resume.docx"

    text, method, report = extract_resume_text(file_path)

    if text:
        print(f"Extraction method used: {method}")
        print(f"Quality report: {report}")

        with open("output/extracted_output.txt", "w", encoding="utf-8") as f:
            f.write(text)
        print("Saved to extracted_output.txt")
    else:
        print("Could not extract usable text from this file.")