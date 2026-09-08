import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from app.database import engine, Base
from app.seed import seed_db
from app.routers import auth, mines, inspections, violations, audit, risk, documents, chat, monitor, demo, dashboard, integrations, health, analytics

# Initialize Database Schema
Base.metadata.create_all(bind=engine)
seed_db()

app = FastAPI(
    title="CoalGov - AI Governance Operating Layer API",
    description="Smart Governance and Compliance Monitoring System for Coal Mines (SIH PS 26024)",
    version="12.0.0"
)

# Enable CORS for React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Phase 12 Global Error Handler & Request Tracing
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    req_id = f"REQ-{os.urandom(4).hex()}"
    return JSONResponse(
        status_code=500,
        content={
            "error": {
                "code": "INTERNAL_SERVER_ERROR",
                "message": str(exc),
                "request_id": req_id
            }
        }
    )

# Include API Routers (Phases 1 - 12)
app.include_router(health.router)
app.include_router(auth.router)
app.include_router(mines.router)
app.include_router(inspections.router)
app.include_router(inspections.v1_router)
app.include_router(violations.router)
app.include_router(audit.router)
app.include_router(audit.v1_router)
app.include_router(risk.router)
app.include_router(risk.v1_router)
app.include_router(documents.router)
app.include_router(documents.v1_router)
app.include_router(chat.router)
app.include_router(monitor.router)
app.include_router(demo.router)
app.include_router(demo.v1_router)
app.include_router(dashboard.router)
app.include_router(dashboard.v1_router)
app.include_router(integrations.router)
app.include_router(analytics.router)
app.include_router(analytics.v1_router)

@app.get("/")
def root():
    return {
        "system": "CoalGov Governance Operating Layer API",
        "version": "12.0.0",
        "phases_implemented": "Phases 1 through 12 (ALL PHASES COMPLETE)",
        "status": "ONLINE",
        "governance_mode": "ACTIVE",
        "docs_url": "/docs"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="127.0.0.1", port=8000, reload=True)
