import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from fastapi import FastAPI, Request, Depends
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
import logging
from apscheduler.schedulers.background import BackgroundScheduler
from app.database import SessionLocal, engine, Base
from app.seed import seed_db
from app.escalation_engine import evaluate_sla_and_escalate_violations
from app.silence_engine.detector import analyze_mine_reporting_silence
from app.models import Mine
from app.routers import auth, mines, inspections, violations, audit, risk, documents, chat, monitor, demo, dashboard, integrations, health, analytics

logger = logging.getLogger("governance_scheduler")

def run_scheduled_governance_tasks():
    """
    Periodic background job:
    1. Evaluates SLA breaches and escalates overdue violations across all active mines.
    2. Runs Silence-to-Risk and CUSUM drift detection across all active mines.
    Opens and closes its own independent database session per execution.
    """
    db = SessionLocal()
    try:
        # 1. SLA Evaluation & Escalation
        sla_res = evaluate_sla_and_escalate_violations(db)
        logger.info(
            f"[SCHEDULER] SLA Run: evaluated {sla_res.get('evaluated_count', 0)} violations, "
            f"newly escalated {sla_res.get('newly_escalated_count', 0)}. "
            f"Escalated codes: {sla_res.get('escalated_codes', [])}"
        )

        # 2. Silence Anomaly & CUSUM checks for active mines
        active_mines = db.query(Mine).filter(Mine.active == True).all()
        anomalies_detected = 0
        for mine in active_mines:
            analysis = analyze_mine_reporting_silence(mine)
            if analysis.get("is_silence_anomaly"):
                anomalies_detected += 1
                logger.warning(
                    f"[SCHEDULER] Reporting silence anomaly detected for {mine.mine_code} "
                    f"({mine.name}): drift {analysis.get('drift_percentage')}%"
                )

        logger.info(f"[SCHEDULER] Mine Monitoring: evaluated {len(active_mines)} mines, found {anomalies_detected} silence anomalies.")
    except Exception as e:
        logger.error(f"[SCHEDULER] Error during scheduled governance execution: {e}")
    finally:
        db.close()

# Initialize Database Schema
Base.metadata.create_all(bind=engine)
seed_db()

app = FastAPI(
    title="CoalGov - AI Governance Operating Layer API",
    description="Smart Governance and Compliance Monitoring System for Coal Mines (SIH PS 26024)",
    version="12.0.0"
)

# Background Scheduler startup/shutdown events
_scheduler = None

@app.on_event("startup")
def start_scheduler():
    global _scheduler
    # Avoid starting multiple schedulers in reload mode if already running
    if _scheduler is None or not _scheduler.running:
        _scheduler = BackgroundScheduler(daemon=True)
        interval_minutes = int(os.getenv("GOVERNANCE_SCHEDULER_INTERVAL_MINUTES", "5"))
        _scheduler.add_job(
            run_scheduled_governance_tasks,
            "interval",
            minutes=interval_minutes,
            id="governance_periodic_engine"
        )
        _scheduler.start()
        logger.info(f"Started Governance BackgroundScheduler (interval: {interval_minutes} minutes)")

@app.on_event("shutdown")
def stop_scheduler():
    global _scheduler
    if _scheduler and _scheduler.running:
        _scheduler.shutdown(wait=False)
        logger.info("Stopped Governance BackgroundScheduler")

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
app.include_router(violations.v1_router)
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

@app.get("/api/notifications")
@app.get("/api/v1/notifications")
def get_notifications_alias(db: Session = Depends(dashboard.get_db)):
    return dashboard.get_dashboard_notifications(db=db)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="127.0.0.1", port=8000, reload=True)
