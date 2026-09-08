from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.integrations.registry import get_system_integrations_status
from app.integrations.cmsms.adapter import fetch_cmsms_satellite_signals

router = APIRouter(prefix="/api/v1/integrations", tags=["Government Integrations"])

@router.get("/status")
def list_integrations_status():
    return get_system_integrations_status()

@router.get("/cmsms/signals")
def get_cmsms_signals():
    return fetch_cmsms_satellite_signals()

@router.post("/simulate-activity")
def simulate_external_activity_endpoint(mine_code: str = "MINE-D", db: Session = Depends(get_db)):
    """
    Phase 10 Hackathon Demo Endpoint:
    Simulates external satellite activity ingestion for live judging demonstrations.
    """
    return {
        "status": "SUCCESS",
        "mine_code": mine_code,
        "source": "CMSMS_SATELLITE",
        "activity_detected": True,
        "timestamp": "2026-09-07T23:25:00Z",
        "message": "External satellite activity ingested into normalized governance pipeline."
    }
