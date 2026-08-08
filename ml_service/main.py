import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response


# Local import of the router that holds the /predict endpoint
from router import router as predict_router


app = FastAPI(
    title="Career Compass ML Service",
    description="Analyzes uploaded resumes and returns skill scores.",
    version="0.1.0",
)

# ---- CORS configuration (allow any origin – adjust for production) ----
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---- Upload size limit (5 MiB) ----
MAX_UPLOAD_SIZE = 5 * 1024 * 1024  # bytes

class MaxUploadSizeMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        # FastAPI/Starlette provides the content‑length header; enforce the limit early.
        content_length = request.headers.get("content-length")
        if content_length and int(content_length) > MAX_UPLOAD_SIZE:
            return Response(
                content="File too large. Max allowed size is 5 MiB.",
                status_code=413,
                media_type="text/plain",
            )
        return await call_next(request)


app.add_middleware(MaxUploadSizeMiddleware)

# Register the router that contains the /predict endpoint
app.include_router(predict_router, prefix="/api/ml")
