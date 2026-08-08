# ml_service/main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Import router
try:
    from router import router as ml_router
except ImportError:
    from .router import router as ml_router

app = FastAPI(
    title="Career-Compass ML Service",
    description="Microservice providing resume parsing, ATS scoring, and career pathway analysis.",
    version="1.0.0"
)

# Configure CORS for Node.js Express backend & local tools
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register endpoints
app.include_router(ml_router)

@app.get("/")
def health_check():
    return {"status": "online", "service": "Career-Compass ML Engine"}