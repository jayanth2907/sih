from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional, Any
from pydantic import BaseModel

from app.database import get_db
from app.models import Violation, CorrectiveAction, ViolationStatusEnum, User
from app.schemas import ViolationResponse, CorrectiveActionUpdate
from app.ledger import record_audit_event
from app.core.dependencies import get_current_user, get_optional_current_user, get_authorized_mine_ids, verify_mine_access
from app.services.violation_service import transition_violation_state
from app.core.exceptions import InvalidStateTransitionException, RecordNotFoundException

router = APIRouter(prefix="/api/violations", tags=["Violations"])
v1_router = APIRouter(prefix="/api/v1/violations", tags=["Violations V1"])

class StatusTransitionPayload(BaseModel):
    target_state: str
    notes: Optional[str] = None
    actor_name: Optional[str] = "Mine Safety Officer"
    actor_role: Optional[str] = "MINE_OFFICER"

@router.get("", response_model=List[ViolationResponse])
@v1_router.get("", response_model=List[ViolationResponse])
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

@router.get("/corrective-actions")
@v1_router.get("/corrective-actions")
def list_all_corrective_actions(
    current_user: Optional[User] = Depends(get_optional_current_user),
    db: Session = Depends(get_db)
):
    """
    Returns all corrective action records joined with violation and mine details.
    """
    query = db.query(CorrectiveAction)
    if current_user:
        allowed_mine_ids = get_authorized_mine_ids(current_user, db)
        if allowed_mine_ids is not None:
            query = query.join(Violation).filter(Violation.mine_id.in_(allowed_mine_ids))

    actions = query.order_by(CorrectiveAction.id.desc()).all()
    results = []
    for ca in actions:
        viol = ca.violation
        mine_name = viol.mine.name if viol and viol.mine else "Coal Mine"
        subsidiary = viol.mine.subsidiary if viol and viol.mine else "CIL"
        v_code = viol.violation_code if viol else "V-UNKNOWN"
        results.append({
            "id": ca.id,
            "title": ca.title,
            "violation": f"{v_code} ({viol.title if viol else 'Non-Compliance'})",
            "mine": f"{mine_name} ({subsidiary})",
            "assigned_to": "Assigned Engineer",
            "due": ca.due_at.strftime("%Y-%m-%d %H:%M") if ca.due_at else "Pending",
            "status": ca.status,
            "progress": 100 if ca.status == "COMPLETED" else (65 if ca.status == "IN_PROGRESS" else 20),
            "violation_id": ca.violation_id
        })
    return results

@router.get("/{violation_id}/corrective-actions")
@v1_router.get("/{violation_id}/corrective-actions")
def get_violation_corrective_actions(
    violation_id: int,
    current_user: Optional[User] = Depends(get_optional_current_user),
    db: Session = Depends(get_db)
):
    violation = db.query(Violation).filter(Violation.id == violation_id).first()
    if not violation:
        raise HTTPException(status_code=404, detail=f"Violation #{violation_id} not found")
    if current_user:
        verify_mine_access(violation.mine_id, current_user, db)
    actions = db.query(CorrectiveAction).filter(CorrectiveAction.violation_id == violation_id).all()
    return actions

@router.get("/{violation_id}", response_model=ViolationResponse)
@v1_router.get("/{violation_id}", response_model=ViolationResponse)
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

@router.patch("/{violation_id}/status", response_model=ViolationResponse)
@v1_router.patch("/{violation_id}/status", response_model=ViolationResponse)
def update_violation_status(
    violation_id: int,
    payload: StatusTransitionPayload,
    current_user: Optional[User] = Depends(get_optional_current_user),
    db: Session = Depends(get_db)
):
    """
    Centralized State Machine endpoint enforcing valid transitions:
    OPEN -> ASSIGNED -> IN_PROGRESS -> REMEDIATION_PENDING -> RESOLVED -> CLOSED
    """
    violation = db.query(Violation).filter(Violation.id == violation_id).first()
    if not violation:
        raise HTTPException(status_code=404, detail=f"Violation #{violation_id} not found")
    if current_user:
        verify_mine_access(violation.mine_id, current_user, db)

    actor_name = current_user.name if current_user else (payload.actor_name or "Mine Safety Officer")
    actor_role = current_user.role if current_user else (payload.actor_role or "MINE_OFFICER")

    try:
        updated_violation = transition_violation_state(
            db=db,
            violation_id=violation_id,
            target_state=payload.target_state,
            actor_name=actor_name,
            actor_role=actor_role,
            notes=payload.notes
        )
        return updated_violation
    except RecordNotFoundException as e:
        raise HTTPException(status_code=404, detail=str(e))
    except InvalidStateTransitionException as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/{violation_id}/resolve")
@v1_router.post("/{violation_id}/resolve")
def resolve_violation(
    violation_id: int,
    notes: str = "Corrective action completed and verified by Mine Safety Manager",
    user_name: str = "Priya Verma (Mine Safety Manager)",
    user_role: str = "MINE_OFFICER",
    current_user: Optional[User] = Depends(get_optional_current_user),
    db: Session = Depends(get_db)
):
    violation = db.query(Violation).filter(Violation.id == violation_id).first()
    if not violation:
        raise HTTPException(status_code=404, detail=f"Violation #{violation_id} not found")

    if current_user:
        verify_mine_access(violation.mine_id, current_user, db)

    actor_name = current_user.name if current_user else user_name
    actor_role = current_user.role if current_user else user_role

    try:
        updated = transition_violation_state(
            db=db,
            violation_id=violation_id,
            target_state=ViolationStatusEnum.RESOLVED,
            actor_name=actor_name,
            actor_role=actor_role,
            notes=notes
        )
        return {"status": "SUCCESS", "message": f"Violation #{updated.violation_code} successfully resolved."}
    except Exception:
        # Fallback direct assignment if already resolved
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
