import datetime
import random
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from app.database import get_db
from app.models import Inspection, Observation, Violation, Mine, Regulation, User, SeverityEnum, ViolationStatusEnum
from app.schemas import InspectionCreate, InspectionResponse
from app.ledger import record_audit_event
from app.sync_service import process_mobile_batch_sync
from app.core.dependencies import get_current_user, get_authorized_mine_ids, verify_mine_access

router = APIRouter(prefix="/api/inspections", tags=["Inspections"])
v1_router = APIRouter(prefix="/api/v1/inspections", tags=["Inspections V1"])

@router.get("", response_model=List[InspectionResponse])
@v1_router.get("", response_model=List[InspectionResponse])
def list_inspections(
    mine_id: Optional[int] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    query = db.query(Inspection)
    
    # Enforce data scoping
    allowed_mine_ids = get_authorized_mine_ids(current_user, db)
    if allowed_mine_ids is not None:
        if mine_id and mine_id not in allowed_mine_ids:
            return []
        query = query.filter(Inspection.mine_id.in_(allowed_mine_ids))
    elif mine_id:
        query = query.filter(Inspection.mine_id == mine_id)

    return query.order_by(Inspection.id.desc()).all()

@router.get("/{inspection_id}", response_model=InspectionResponse)
@v1_router.get("/{inspection_id}", response_model=InspectionResponse)
def get_inspection(
    inspection_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    inspection = db.query(Inspection).filter(Inspection.id == inspection_id).first()
    if not inspection:
        raise HTTPException(status_code=404, detail=f"Inspection #{inspection_id} not found")

    verify_mine_access(inspection.mine_id, current_user, db)
    return inspection

@router.get("/regulations")
@v1_router.get("/regulations")
def list_regulations(db: Session = Depends(get_db)):
    return db.query(Regulation).all()

@router.post("/batch-sync")
@router.post("/sync")
@v1_router.post("/sync")
@v1_router.post("/batch-sync")
def mobile_batch_sync_endpoint(payload: dict, db: Session = Depends(get_db)):
    """
    Phase 5 Mobile App Batch Synchronization API endpoint.
    Receives unsynced inspection reports from local SQLite storage, checks idempotency via local_id,
    and syncs into PostgreSQL DB + SHA-256 Audit Chain.
    """
    result = process_mobile_batch_sync(db, payload)
    return result

@router.post("", response_model=InspectionResponse)
@v1_router.post("", response_model=InspectionResponse)
def create_inspection(
    payload: InspectionCreate,
    inspector_id: int = 1,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Verify user permission for the target mine
    verify_mine_access(payload.mine_id, current_user, db)

    mine = db.query(Mine).filter(Mine.id == payload.mine_id).first()
    if not mine:
        raise HTTPException(status_code=404, detail=f"Mine #{payload.mine_id} not found")


    inspector = db.query(User).filter(User.id == inspector_id).first()
    inspector_name = inspector.name if inspector else "Field Inspector"
    inspector_role = inspector.role if inspector else "INSPECTOR"

    inspection_code = f"INSP-{datetime.datetime.utcnow().strftime('%Y%m%d')}-{random.randint(100, 999)}"

    inspection = Inspection(
        inspection_number=inspection_code,
        mine_id=payload.mine_id,
        inspector_id=inspector_id,
        status="COMPLETED",
        gps_lat=payload.gps_lat,
        gps_lng=payload.gps_lng,
        notes=payload.notes,
        is_offline_sync=payload.is_offline_sync
    )
    db.add(inspection)
    db.commit()
    db.refresh(inspection)

    # Add Observations & auto-generate Violations if flagged
    created_observations = []
    for obs_item in payload.observations:
        obs = Observation(
            inspection_id=inspection.id,
            regulation_id=obs_item.regulation_id,
            severity=obs_item.severity,
            description=obs_item.description,
            evidence_url=obs_item.evidence_url or "https://images.unsplash.com/photo-1578575437130-527eed3abbec?auto=format&fit=crop&w=600&q=80",
            is_violation=obs_item.is_violation
        )
        db.add(obs)
        db.commit()
        db.refresh(obs)
        created_observations.append(obs)

        if obs_item.is_violation:
            reg = db.query(Regulation).filter(Regulation.id == obs_item.regulation_id).first()
            reg_code = reg.code if reg else "REG-GENERIC"
            reg_title = reg.title if reg else "Safety Compliance Requirement"
            sla_hrs = reg.response_sla_hours if reg else 48

            v_code = f"VIOL-{datetime.datetime.utcnow().strftime('%Y%m%d')}-{random.randint(1000, 9999)}"

            # 1. Compute real DB-backed features
            from app.services.feature_service import (
                get_recurrence_count,
                get_inspection_gap_days,
                get_open_violation_count,
                get_site_violation_rate,
                get_reporting_drift,
                get_external_discrepancy
            )
            from app.priority.fusion import run_full_intelligence_pipeline

            rec_count = get_recurrence_count(db, payload.mine_id, obs_item.regulation_id)
            gap_days = get_inspection_gap_days(db, payload.mine_id)
            open_count = get_open_violation_count(db, payload.mine_id)
            site_rate = get_site_violation_rate(db, payload.mine_id)
            rep_drift = get_reporting_drift(db, payload.mine_id)
            ext_disc = get_external_discrepancy(db, payload.mine_id)

            # 2. Run Central Intelligence Pipeline
            fusion_res = run_full_intelligence_pipeline(
                severity=obs_item.severity,
                recurrence_count=rec_count,
                overdue_days=gap_days,
                open_count=open_count,
                mine_risk_score=mine.risk_score if mine else 50.0,
                reporting_drift=rep_drift,
                external_discrepancy=ext_disc,
                mine_id=payload.mine_id,
                db=db,
                site_violation_rate=site_rate
            )

            is_critical = fusion_res.get("risk_class") == "CRITICAL"
            ml_prob = fusion_res.get("layers", {}).get("layer3_ml", {}).get("risk_probability", 0.50)
            peer_pct = fusion_res.get("layers", {}).get("layer2_peer", {}).get("peer_percentile", 50.0)

            violation = Violation(
                violation_code=v_code,
                observation_id=obs.id,
                mine_id=payload.mine_id,
                regulation_id=obs_item.regulation_id,
                severity=obs_item.severity,
                status=ViolationStatusEnum.ESCALATED if is_critical else ViolationStatusEnum.OPEN,
                title=f"Non-Compliance: {reg_title}",
                description=obs_item.description,
                priority_score=fusion_res.get("unified_score", 50.0),
                ml_probability=ml_prob,
                recurrence_count=rec_count,
                peer_percentile=peer_pct,
                reporting_drift=rep_drift,
                external_discrepancy=ext_disc,
                due_at=datetime.datetime.utcnow() + datetime.timedelta(hours=sla_hrs),
                is_escalated=is_critical
            )
            db.add(violation)
            db.commit()

            # Record Audit Event with SHAP / Explainability breakdown
            record_audit_event(
                db,
                entity_type="Violation",
                entity_id=violation.id,
                action="VIOLATION_AUTO_FLAGGED",
                performed_by_name=inspector_name,
                performed_by_role=inspector_role,
                details={
                    "violation_code": v_code,
                    "mine_name": mine.name,
                    "regulation": reg_code,
                    "severity": obs_item.severity,
                    "priority_score": fusion_res.get("unified_score"),
                    "risk_class": fusion_res.get("risk_class"),
                    "recurrence_count": rec_count,
                    "shap_explanation": fusion_res.get("layers", {}).get("layer4_shap")
                }
            )

    mine.reporting_frequency_actual += 1
    db.commit()

    record_audit_event(
        db,
        entity_type="Inspection",
        entity_id=inspection.id,
        action="INSPECTION_SUBMITTED",
        performed_by_name=inspector_name,
        performed_by_role=inspector_role,
        details={
            "inspection_number": inspection_code,
            "mine_code": mine.mine_code,
            "gps": f"{payload.gps_lat}, {payload.gps_lng}",
            "offline_sync": payload.is_offline_sync,
            "observations_count": len(payload.observations)
        }
    )

    return inspection
