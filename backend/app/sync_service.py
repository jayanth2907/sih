import random
import datetime
from sqlalchemy.orm import Session
from app.models import Inspection, Observation, Violation, Mine, Regulation, User, SeverityEnum, ViolationStatusEnum
from app.ledger import record_audit_event
from app.priority.fusion import run_full_intelligence_pipeline

def process_mobile_batch_sync(db: Session, batch_payload: dict) -> dict:
    """
    Phase 5 Idempotent Batch Synchronization Engine:
    Processes batch inspection uploads from offline mobile local database.
    Prevents duplicates using local_id idempotency checks.
    Triggers central 5-layer Intelligence Engine upon successful sync.
    """
    items = batch_payload.get("inspections", [])
    synced_results = []

    for item in items:
        local_id = item.get("local_id", f"LOCAL-{random.randint(10000, 99999)}")
        mine_id = item.get("mine_id", 1)

        # Idempotency check: verify if local_id was already synced
        existing_inspection = db.query(Inspection).filter(Inspection.notes.contains(local_id)).first()
        if existing_inspection:
            synced_results.append({
                "local_id": local_id,
                "server_id": existing_inspection.inspection_number,
                "sync_status": "SYNCED",
                "message": "Already synced (Idempotent match)"
            })
            continue

        mine = db.query(Mine).filter(Mine.id == mine_id).first()
        mine_name = mine.name if mine else "Jharia Opencast"

        server_inspection_number = f"INS-{datetime.datetime.utcnow().strftime('%Y%m%d')}-{random.randint(100, 999)}"

        inspection = Inspection(
            inspection_number=server_inspection_number,
            mine_id=mine_id,
            inspector_id=item.get("inspector_id", 1),
            status="COMPLETED",
            gps_lat=item.get("gps_lat", 23.7466),
            gps_lng=item.get("gps_lng", 86.4162),
            notes=f"Synced from mobile local_id:{local_id}. {item.get('notes', '')}",
            source="MOBILE_OFFLINE_SYNC",
            is_offline_sync=True
        )
        db.add(inspection)
        db.commit()
        db.refresh(inspection)

        # Process Observations & Violations
        for obs_data in item.get("observations", []):
            reg_id = obs_data.get("regulation_id", 1)
            severity = obs_data.get("severity", "HIGH")

            obs = Observation(
                inspection_id=inspection.id,
                regulation_id=reg_id,
                severity=severity,
                description=obs_data.get("description", "Field observation recorded offline."),
                evidence_url=obs_data.get("evidence_url", "https://images.unsplash.com/photo-1578575437130-527eed3abbec?auto=format&fit=crop&w=600&q=80"),
                is_violation=obs_data.get("is_violation", True)
            )
            db.add(obs)
            db.commit()

            if obs_data.get("is_violation", True):
                reg = db.query(Regulation).filter(Regulation.id == reg_id).first()
                reg_title = reg.title if reg else "Safety Compliance Requirement"
                sla_hrs = reg.response_sla_hours if reg else 24

                v_code = f"VIOL-MOBILE-{datetime.datetime.utcnow().strftime('%Y%m%d')}-{random.randint(1000, 9999)}"

                # 1. Compute real DB-backed features
                from app.services.feature_service import (
                    get_recurrence_count,
                    get_inspection_gap_days,
                    get_open_violation_count,
                    get_site_violation_rate,
                    get_reporting_drift,
                    get_external_discrepancy
                )

                rec_count = get_recurrence_count(db, mine_id, reg_id)
                gap_days = get_inspection_gap_days(db, mine_id)
                open_count = get_open_violation_count(db, mine_id)
                site_rate = get_site_violation_rate(db, mine_id)
                rep_drift = get_reporting_drift(db, mine_id)
                ext_disc = get_external_discrepancy(db, mine_id)

                # 2. Trigger Phase 3 Central Intelligence Engine
                intel_res = run_full_intelligence_pipeline(
                    severity=severity,
                    recurrence_count=rec_count,
                    overdue_days=gap_days,
                    open_count=open_count,
                    mine_risk_score=mine.risk_score if mine else 50.0,
                    reporting_drift=rep_drift,
                    external_discrepancy=ext_disc,
                    mine_id=mine_id,
                    db=db,
                    site_violation_rate=site_rate
                )

                is_critical = intel_res.get("risk_class") == "CRITICAL"
                ml_prob = intel_res.get("layers", {}).get("layer3_ml", {}).get("risk_probability", 0.50)
                peer_pct = intel_res.get("layers", {}).get("layer2_peer", {}).get("peer_percentile", 50.0)

                violation = Violation(
                    violation_code=v_code,
                    observation_id=obs.id,
                    mine_id=mine_id,
                    regulation_id=reg_id,
                    severity=severity,
                    status=ViolationStatusEnum.ESCALATED if is_critical else ViolationStatusEnum.OPEN,
                    title=f"Mobile Flagged Non-Compliance: {reg_title}",
                    description=obs_data.get("description", "Offline field non-compliance finding."),
                    priority_score=intel_res.get("unified_score", 50.0),
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

        # Update Mine actual reporting count
        if mine:
            mine.reporting_frequency_actual += 1
            db.commit()

        # Audit Event Log
        record_audit_event(
            db,
            entity_type="Inspection",
            entity_id=inspection.id,
            action="MOBILE_OFFLINE_BATCH_SYNCED",
            performed_by_name="Field Inspector (Mobile App)",
            performed_by_role="INSPECTOR",
            details={
                "local_id": local_id,
                "server_id": server_inspection_number,
                "mine_name": mine_name,
                "sync_status": "SYNCED"
            }
        )

        synced_results.append({
            "local_id": local_id,
            "server_id": server_inspection_number,
            "sync_status": "SYNCED",
            "message": "Successfully synchronized into audit chain"
        })

    return {
        "success": True,
        "batch_count": len(items),
        "synced_items": synced_results
    }
