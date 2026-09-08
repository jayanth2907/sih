from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from app.database import get_db
from app.models import Violation, CorrectiveAction, ViolationStatusEnum, User
from app.schemas import ViolationResponse, CorrectiveActionUpdate
from app.ledger import record_audit_event
from app.core.dependencies import get_current_user, get_authorized_mine_ids, verify_mine_access

router = APIRouter(prefix="/api/violations", tags=["Violations"])

@router.get("", response_model=List[ViolationResponse])
def list_violations(
    mine_id: Optional[int] = None,
    status: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    query = db.query(Violation)
    
    # Enforce user role/mine data scope
    allowed_mine_ids = get_authorized_mine_ids(current_user, db)
    if allowed_mine_ids is not None:
        if mine_id and mine_id not in allowed_mine_ids:
            return []
        query = query.filter(Violation.mine_id.in_(allowed_mine_ids))
    elif mine_id:
        query = query.filter(Violation.mine_id == mine_id)

    if status and status != "ALL":
        query = query.filter(Violation.status == status)
        
    return query.order_by(Violation.id.desc()).all()

@router.get("/{violation_id}", response_model=ViolationResponse)
def get_violation(
    violation_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    violation = db.query(Violation).filter(Violation.id == violation_id).first()
    if not violation:
        raise HTTPException(status_code=404, detail=f"Violation #{violation_id} not found")

    # Enforce scope check
    verify_mine_access(violation.mine_id, current_user, db)
    return violation

@router.post("/{violation_id}/resolve")
def resolve_violation(
    violation_id: int,
    notes: str = "Corrective action completed and verified by Mine Safety Manager",
    user_name: str = "Priya Verma (Mine Safety Manager)",
    user_role: str = "MINE_OFFICER",
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    violation = db.query(Violation).filter(Violation.id == violation_id).first()
    if not violation:
        raise HTTPException(status_code=404, detail=f"Violation #{violation_id} not found")

    # Enforce scope check
    verify_mine_access(violation.mine_id, current_user, db)

    actor_name = current_user.name if current_user else user_name
    actor_role = current_user.role if current_user else user_role

    violation.status = ViolationStatusEnum.RESOLVED
    db.commit()

    record_audit_event(
        event_type="VIOLATION_RESOLVED",
        entity_type="VIOLATION",
        entity_id=violation.id,
        user_name=actor_name,
        user_role=actor_role,
        action=f"Marked violation #{violation.violation_code} as RESOLVED with notes: {notes}",
        db_session=db
    )

    return {"status": "SUCCESS", "message": f"Violation #{violation.violation_code} successfully resolved."}
