import json
import datetime
from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import PlainTextResponse
from typing import Optional, List, Dict, Any
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import AuditEvent, Mine, Violation, Inspection, Document
from app.schemas import AuditEventResponse
from app.ledger import verify_audit_ledger, calculate_event_hash, GENESIS_HASH

router = APIRouter(prefix="/api/audit", tags=["Audit Ledger"])
v1_router = APIRouter(prefix="/api/v1/audit", tags=["Audit Ledger v1"])

def determine_event_category(action: str, entity_type: str) -> str:
    act = (action or "").upper()
    ent = (entity_type or "").upper()

    if "INSPECTION" in act or "OBSERVATION" in act or ent in ["INSPECTION", "OBSERVATION"]:
        return "INSPECTION"
    if "VIOLATION" in act or ent == "VIOLATION":
        return "VIOLATION"
    if "RISK" in act or "PRIORITY" in act:
        return "RISK"
    if "SIGNAL" in act or "MONITORING" in act or "SILENCE" in act or ent in ["EXTERNALSIGNAL", "MONITORINGENGINE"]:
        return "MONITORING"
    if "DOCUMENT" in act or "OCR" in act or ent == "DOCUMENT":
        return "DOCUMENTS"
    if "SLA" in act or "ESCALAT" in act or "ACTION" in act:
        return "SLA"
    if "GENESIS" in act or "INIT" in act or "CONFIG" in act:
        return "SYSTEM"
    return "GOVERNANCE"

def format_audit_event(ev: AuditEvent, db: Session) -> dict:
    details = {}
    if ev.details_json:
        try:
            details = json.loads(ev.details_json)
        except Exception:
            details = {"raw": ev.details_json}

    # Resolve Mine context
    mine_name = details.get("mine_name") or details.get("mine_code")
    if not mine_name:
        if ev.entity_type == "Violation":
            viol = db.query(Violation).filter(Violation.id == ev.entity_id).first()
            if viol and viol.mine:
                mine_name = f"{viol.mine.name} ({viol.mine.subsidiary})"
        elif ev.entity_type == "Inspection":
            insp = db.query(Inspection).filter(Inspection.id == ev.entity_id).first()
            if insp and insp.mine:
                mine_name = f"{insp.mine.name} ({insp.mine.subsidiary})"
        elif ev.entity_type == "Document":
            doc = db.query(Document).filter(Document.id == ev.entity_id).first()
            if doc and doc.mine:
                mine_name = f"{doc.mine.name} ({doc.mine.subsidiary})"

    if not mine_name:
        mine_name = "Enterprise Scope" if ev.entity_type in ["System", "MonitoringEngine"] else "Mine C - Singrauli (NCL)"

    # Determine Human vs System actor
    role_upper = (ev.performed_by_role or "").upper()
    name_upper = (ev.performed_by_name or "").upper()
    is_system = role_upper in ["SYSTEM", "AI_SYSTEM"] or "ENGINE" in name_upper or "SYSTEM" in name_upper or "WORKER" in name_upper or "DAEMON" in name_upper

    category = determine_event_category(ev.action, ev.entity_type)

    # Before / After state resolution for explainability
    before_state = details.get("previous_state") or details.get("before") or details.get("old_status")
    after_state = details.get("new_state") or details.get("after") or details.get("status") or details.get("outcome")

    # If action implies specific transition
    if not before_state and not after_state:
        if ev.action == "VIOLATION_CREATED":
            before_state = "DRAFT_OBSERVATION"
            after_state = "OPEN_CASE"
        elif ev.action == "VIOLATION_CLOSED":
            before_state = "OPEN_REMEDIATION"
            after_state = "CLOSED_VERIFIED"
        elif "REVIEW" in ev.action.upper():
            before_state = "REQUIRES_REVIEW"
            after_state = details.get("outcome", "CONFIRMED")
        elif "DOCUMENT_VERIFIED" in ev.action.upper():
            before_state = "REVIEW_REQUIRED"
            after_state = "VERIFIED_ANCHORED"

    return {
        "id": ev.id,
        "entity_type": ev.entity_type,
        "entity_id": ev.entity_id,
        "action": ev.action,
        "category": category,
        "performed_by_name": ev.performed_by_name,
        "performed_by_role": ev.performed_by_role,
        "is_system": is_system,
        "actor_type": "SYSTEM" if is_system else "HUMAN",
        "mine_name": mine_name,
        "timestamp": ev.timestamp,
        "details": details,
        "before_state": before_state,
        "after_state": after_state,
        "previous_hash": ev.previous_hash,
        "hash": ev.hash,
        "hash_short": f"{ev.hash[:16]}…" if ev.hash else "",
        "previous_hash_short": f"{ev.previous_hash[:16]}…" if ev.previous_hash else ""
    }

@router.get("/logs")
@v1_router.get("/logs")
@router.get("/events")
@v1_router.get("/events")
def get_audit_logs(
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(25, ge=1, le=100, description="Items per page"),
    category: Optional[str] = Query("ALL", description="Filter by event category"),
    search: Optional[str] = Query(None, description="Search query"),
    order: str = Query("desc", regex="^(asc|desc)$", description="Sort order"),
    db: Session = Depends(get_db)
):
    query = db.query(AuditEvent)

    if order == "desc":
        query = query.order_by(AuditEvent.id.desc())
    else:
        query = query.order_by(AuditEvent.id.asc())

    all_events = query.all()
    formatted = [format_audit_event(ev, db) for ev in all_events]

    # Category filtering
    if category and category != "ALL":
        cat_upper = category.upper()
        if cat_upper == "HUMAN_REVIEW":
            formatted = [e for e in formatted if not e["is_system"]]
        elif cat_upper == "SYSTEM":
            formatted = [e for e in formatted if e["is_system"]]
        else:
            formatted = [e for e in formatted if e["category"] == cat_upper]

    # Search filtering
    if search and search.strip():
        q = search.strip().lower()
        formatted = [
            e for e in formatted
            if q in str(e["id"])
            or q in e["action"].lower()
            or q in e["performed_by_name"].lower()
            or q in e["entity_type"].lower()
            or q in e["mine_name"].lower()
            or q in e["hash"].lower()
            or q in json.dumps(e["details"]).lower()
        ]

    total = len(formatted)
    total_pages = max(1, (total + page_size - 1) // page_size)
    start_idx = (page - 1) * page_size
    end_idx = start_idx + page_size
    items = formatted[start_idx:end_idx]

    return {
        "items": items,
        "page": page,
        "page_size": page_size,
        "total": total,
        "total_pages": total_pages
    }

@router.get("/summary")
@v1_router.get("/summary")
def get_audit_summary(db: Session = Depends(get_db)):
    events = db.query(AuditEvent).order_by(AuditEvent.id.asc()).all()
    total = len(events)
    human_count = sum(1 for e in events if e.performed_by_role not in ["SYSTEM", "AI_SYSTEM"] and "SYSTEM" not in (e.performed_by_name or "").upper() and "ENGINE" not in (e.performed_by_name or "").upper())
    system_count = total - human_count
    escalations = sum(1 for e in events if "ESCALAT" in (e.action or "").upper() or "SLA" in (e.action or "").upper())

    latest_hash = events[-1].hash if events else GENESIS_HASH

    # Quick verification check
    ledger_check = verify_audit_ledger(db)

    return {
        "total_events": total,
        "human_actions_count": human_count,
        "system_actions_count": system_count,
        "escalations_count": escalations,
        "integrity_status": "VERIFIED" if ledger_check.get("verified", True) else "TAMPERED",
        "events_checked": total,
        "latest_hash": latest_hash,
        "genesis_hash": GENESIS_HASH,
        "last_verified_at": datetime.datetime.utcnow().isoformat()
    }

@router.get("/verify")
@v1_router.get("/verify")
def verify_ledger(db: Session = Depends(get_db)):
    """
    Cryptographically verifies every block in the SHA-256 audit hash chain.
    Returns status: VALID or TAMPERED.
    """
    result = verify_audit_ledger(db)
    events = db.query(AuditEvent).order_by(AuditEvent.id.asc()).all()
    return {
        "valid": result.get("verified", True),
        "status": result.get("status", "VALID"),
        "events_checked": len(events),
        "first_event_id": events[0].id if events else None,
        "last_event_id": events[-1].id if events else None,
        "broken_at_event_id": result.get("tampered_index"),
        "latest_hash": events[-1].hash if events else GENESIS_HASH,
        "verified_at": datetime.datetime.utcnow().isoformat()
    }

@router.get("/events/{event_id}")
@v1_router.get("/events/{event_id}")
def get_event_detail(event_id: int, db: Session = Depends(get_db)):
    ev = db.query(AuditEvent).filter(AuditEvent.id == event_id).first()
    if not ev:
        raise HTTPException(status_code=404, detail=f"Audit event #{event_id} not found")
    return format_audit_event(ev, db)

@router.get("/export")
@v1_router.get("/export")
def export_audit_csv(
    category: Optional[str] = "ALL",
    search: Optional[str] = None,
    db: Session = Depends(get_db)
):
    events = db.query(AuditEvent).order_by(AuditEvent.id.asc()).all()
    formatted = [format_audit_event(ev, db) for ev in events]

    if category and category != "ALL":
        formatted = [e for e in formatted if e["category"] == category.upper()]

    if search and search.strip():
        q = search.strip().lower()
        formatted = [e for e in formatted if q in str(e["id"]) or q in e["action"].lower() or q in e["performed_by_name"].lower()]

    csv_lines = [
        "# KhanDrishti Cryptographic Governance Audit Trail Export",
        f"# Exported At: {datetime.datetime.utcnow().isoformat()}",
        f"# Total Events: {len(formatted)}",
        "",
        "Event ID,Timestamp,Actor Name,Actor Role,Actor Type,Action,Category,Entity Type,Entity ID,Mine,Previous Hash,Block Hash (SHA-256)"
    ]

    for e in formatted:
        csv_lines.append(
            f"{e['id']},\"{e['timestamp']}\",\"{e['performed_by_name']}\",\"{e['performed_by_role']}\",{e['actor_type']},\"{e['action']}\",{e['category']},\"{e['entity_type']}\",{e['entity_id']},\"{e['mine_name']}\",{e['previous_hash']},{e['hash']}"
        )

    return PlainTextResponse(content="\n".join(csv_lines), media_type="text/csv", headers={
        "Content-Disposition": "attachment; filename=khandrishti_audit_ledger.csv"
    })

