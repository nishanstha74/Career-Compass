import os
import shutil
import uuid
from fastapi import APIRouter, UploadFile, File, HTTPException
from fastapi.responses import JSONResponse
from starlette.status import HTTP_400_BAD_REQUEST, HTTP_500_INTERNAL_SERVER_ERROR
import warnings
from pydantic import BaseModel
from typing import List
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

# Import the core pipeline function
from .pipeline import run_pipeline

router = APIRouter()

@router.post('/predict', response_class=JSONResponse)
async def predict(file: UploadFile = File(...)):
    """Receive a resume file, run the ML pipeline, and return the analysis.

    Supported formats: PDF, DOCX (any format recognised by `run_pipeline`).
    The file is stored temporarily, processed, then removed.
    """
    warnings.warn("The /predict endpoint is deprecated and will be removed in a future version. Use /predict/match instead.", DeprecationWarning)
# Basic validation – ensure a filename is present
    if not file.filename:
        raise HTTPException(status_code=HTTP_400_BAD_REQUEST, detail='No file provided')

    # Create a temporary directory for the upload
    temp_dir = os.path.join(os.getcwd(), 'tmp')
    os.makedirs(temp_dir, exist_ok=True)
    # Use a UUID to avoid name collisions
    temp_path = os.path.join(temp_dir, f"{uuid.uuid4()}_{file.filename}")

    try:
        # Write the uploaded file to disk
        with open(temp_path, 'wb') as buffer:
            shutil.copyfileobj(file.file, buffer)

        # Run the existing pipeline on the saved file
        result = run_pipeline(temp_path)

        # Return the pipeline's dictionary as JSON
        return JSONResponse(content=result)
    except Exception as exc:
        # Log the exception in a real app – here we simply return a generic error
        raise HTTPException(
            status_code=HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(exc),
        )
    finally:
        # Clean‑up the temporary file
        try:
            os.remove(temp_path)
        except Exception:
            pass

# --- New Structured JSON Match API ---
class MatchRequest(BaseModel):
    resume_text: str
    job_description: str
    resume_skills: List[str] = []
    job_skills: List[str] = []

class MatchResponse(BaseModel):
    match_score: float
    skill_overlap_ratio: float
    tfidf_similarity: float

@router.post('/predict/match', response_model=MatchResponse)
async def predict_match(request: MatchRequest):
    """Calculate a match score using TF‑IDF similarity and skill overlap.

    * **Skill overlap** – Jaccard‑style overlap of the provided skill lists.
    * **TF‑IDF similarity** – Cosine similarity between the resume text and job description.
    The final score is a weighted average (50 % each) and the components are returned
    for display in the UI.
    """
    # Skill overlap (simple Jaccard‑style ratio)
    common = set(request.resume_skills).intersection(set(request.job_skills))
    skill_overlap = len(common) / (len(request.job_skills) or 1)

    # TF‑IDF cosine similarity between the two text blocks
    vectorizer = TfidfVectorizer()
    tfidf_matrix = vectorizer.fit_transform([request.resume_text, request.job_description])
    tfidf_sim = cosine_similarity(tfidf_matrix[0:1], tfidf_matrix[1:2])[0][0]

    # Weighted match score (adjust weights as needed)
    match_score = 0.5 * skill_overlap + 0.5 * tfidf_sim

    return MatchResponse(
        match_score=round(match_score, 4),
        skill_overlap_ratio=round(skill_overlap, 4),
        tfidf_similarity=round(tfidf_sim, 4),
    )


