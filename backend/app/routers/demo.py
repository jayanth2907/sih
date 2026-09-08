from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.silence_engine.detector import auto_generate_silence_discrepancy_case
from app.integrations.cmsms.adapter import fetch_cmsms_satellite_signals
from app.escalation_engine import evaluate_sla_and_escalate_violations
from app.ledger import verify_audit_ledger

from app.seed import seed_db

router = APIRouter(prefix="/api/demo", tags=["National Finals Pitch Demo"])

v1_router = APIRouter(prefix="/api/v1/demo", tags=["National Finals Pitch Demo V1"])

@router.post("/reset")
@v1_router.post("/reset")
def reset_demo_database(db: Session = Depends(get_db)):
    """
    Phase 14.39 DEMO RESET:
    Resets the entire governance platform state to the deterministic baseline demo dataset.
    Feature Mine C (Singrauli Block-B) story with violation V-1024.
    """
    seed_db(db_session=db, force=True)
    return {
        "status": "SUCCESS",
        "message": "Governance Platform demo state reset to baseline deterministic dataset.",
        "hero_case": "Mine C - Singrauli Block-B (V-1024)"
    }

@router.get("/end-to-end-journey")
def run_end_to_end_journey_demo(db: Session = Depends(get_db)):
    """
    Executes the exact 9-Scene Pitch Journey for the SIH 2026 National Finals demo.
    """
    # 1. Trigger Silence-to-Risk detection for Raniganj Mine (Mine ID 4)
    auto_violation = auto_generate_silence_discrepancy_case(db, mine_id=4)
    v_code = auto_violation.violation_code if auto_violation else "VIOL-SILENCE-2026-004"

    # 2. Trigger SLA Check & Escalation Engine
    sla_result = evaluate_sla_and_escalate_violations(db)

    # 3. Verify SHA-256 Audit Chain
    ledger_result = verify_audit_ledger(db)

    return {
        "title": "SIH 2026 National Finals 9-Scene Pitch Journey",
        "pitch_line": "We don't just digitize what mines report. We identify what governance may be missing.",
        "scenes": [
            {
                "scene": 1,
                "heading": "Mine X is Operational",
                "evidence": "CMSMS / Sentinel-2 Satellite thermal signal confirms active excavation.",
                "satellite_status": "ACTIVE_MINING_SIGNAL_YES"
            },
            {
                "scene": 2,
                "heading": "Inspection Reporting Has Dropped",
                "trend": "Historical: 10/month -> Actual: 1/month (63% reporting decline).",
                "status": "SILENCE_DRIFT_DETECTED"
            },
            {
                "scene": 3,
                "heading": "Governance Discrepancy Detected",
                "system_message": "Governance Discrepancy Signal Flagged (Not merely 'Violation confirmed')."
            },
            {
                "scene": 4,
                "heading": "AI Explainability Breakdown",
                "priority_score": 87.0,
                "reasons": [
                    {"factor": "Repeated violations in last 30 days", "impact": "+24 pts"},
                    {"factor": "Reporting frequency decline", "impact": "+19 pts"},
                    {"factor": "Peer percentile (92nd)", "impact": "+17 pts"},
                    {"factor": "Inspection gap overdue", "impact": "+15 pts"},
                    {"factor": "External satellite activity mismatch", "impact": "+12 pts"}
                ]
            },
            {
                "scene": 5,
                "heading": "Automatic Work Assignment & SLA",
                "assignment": "Assigned to Mine Safety Manager Priya Verma",
                "sla_window": "24-Hour Remediation SLA"
            },
            {
                "scene": 6,
                "heading": "Offline Field App Capture",
                "mobile_state": "Internet OFF - Local SQLite Buffer",
                "data_captured": "GPS Coordinates, Timestamp, Regulation Check, Photo Upload"
            },
            {
                "scene": 7,
                "heading": "Network Synchronization",
                "sync_status": "Reconnected -> Inspection synced into SHA-256 Audit Chain"
            },
            {
                "scene": 8,
                "heading": "Remediation & Closure",
                "resolution": "Safety Manager verifies ventilation fan repair & resolves case."
            },
            {
                "scene": 9,
                "heading": "Auditable Audit Timeline Sealed",
                "ledger_status": ledger_result["status"],
                "total_blocks": ledger_result["total_records"],
                "digest": ledger_result.get("latest_hash", "0000000")
            }
        ]
    }
