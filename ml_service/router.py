# ml_service/router.py
from fastapi import APIRouter, UploadFile, File, Form, HTTPException, status
from pydantic import BaseModel
from typing import Optional, List, Dict, Any

# Safe relative/absolute imports for pipeline functions
try:
    from pipeline import process_resume_pipeline, match_job_pipeline
except ImportError:
    from .pipeline import process_resume_pipeline, match_job_pipeline

router = APIRouter(tags=["ML Pipeline Endpoints"])

# Pydantic schema for structured job match requests
class JobMatchPayload(BaseModel):
    resume_text: Optional[str] = ""
    job_description: Optional[str] = ""
    resume_skills: Optional[List[str]] = []
    job_skills: Optional[List[str]] = []


@router.post("/predict", status_code=status.HTTP_200_OK)
@router.post("/analyze", status_code=status.HTTP_200_OK)
async def analyze_resume(
    file: UploadFile = File(...),
    target_role: Optional[str] = Form("Software Engineer")
) -> Dict[str, Any]:
    """
    Upload a resume document (PDF/DOCX/TXT) to parse skills, evaluate ATS score,
    generate a domain skill heatmap, and recommend learning roadmaps.
    """
    if not file.filename:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No file selected or invalid file upload."
        )

    try:
        file_bytes = await file.read()
        if len(file_bytes) == 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Uploaded file is empty."
            )

        analysis_result = process_resume_pipeline(
            file_bytes=file_bytes,
            filename=file.filename,
            mime_type=file.content_type or "",
            target_role=target_role
        )
        return analysis_result

    except Exception as err:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Resume processing failed: {str(err)}"
        )


@router.post("/predict/match", status_code=status.HTTP_200_OK)
@router.post("/match", status_code=status.HTTP_200_OK)
async def match_job_description(payload: JobMatchPayload) -> Dict[str, Any]:
    """
    Calculates skill overlap and match percentage between a parsed resume and a target job description.
    """
    try:
        match_result = match_job_pipeline(payload.dict())
        return match_result
    except Exception as err:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Job matching evaluation failed: {str(err)}"
        )