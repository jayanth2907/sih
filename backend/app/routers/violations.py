from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import Violation, CorrectiveAction, ViolationStatusEnum
from app.schemas import ViolationResponse, CorrectiveActionUpdate
from app.ledger import record_audit_event

from pydantic import BaseModel
from typing import Optional, List, Any
from app.services.violation_service import transition_violation_state
from app.core.exceptions import InvalidStateTransitionException, RecordNotFoundException

router = APIRouter(prefix="/api/violations", tags=["Violations"])
v1_router = APIRouter(prefix="/api/v1/violations", tags=["Violations V1"])

class StatusTransitionPayload(BaseModel):
    target_state: str
    notes: Optional[str] = None
    actor_name: Optional[str] = "Mine Safety Officer"
    actor_role: Optional[str] = "MINE_OFFICER"

@router.get("", response_model=list[ViolationResponse])
@v1_router.get("", response_model=list[ViolationResponse])
def list_violations(mine_id: int = None, status: str = None, db: Session = Depends(get_db)):
    query = db.query(Violation)
    if mine_id:
        query = query.filter(Violation.mine_id == mine_id)
    if status:
        query = query.filter(Violation.status == status)
    return query.order_by(Violation.id.desc()).all()

@router.get("/corrective-actions")
@v1_router.get("/corrective-actions")
def list_all_corrective_actions(db: Session = Depends(get_db)):
    """
    Returns all corrective action records joined with violation and mine details.
    """
    actions = db.query(CorrectiveAction).order_by(CorrectiveAction.id.desc()).all()
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
def get_violation_corrective_actions(violation_id: int, db: Session = Depends(get_db)):
    actions = db.query(CorrectiveAction).filter(CorrectiveAction.violation_id == violation_id).all()
    return actions

@router.patch("/{violation_id}/status", response_model=ViolationResponse)
@v1_router.patch("/{violation_id}/status", response_model=ViolationResponse)
def update_violation_status(
    violation_id: int,
    payload: StatusTransitionPayload,
    db: Session = Depends(get_db)
):
    """
    Centralized State Machine endpoint enforcing valid transitions:
    OPEN -> ASSIGNED -> IN_PROGRESS -> REMEDIATION_PENDING -> RESOLVED -> CLOSED
    """
    try:
        updated_violation = transition_violation_state(
            db=db,
            violation_id=violation_id,
            target_state=payload.target_state,
            actor_name=payload.actor_name or "Mine Safety Officer",
            actor_role=payload.actor_role or "MINE_OFFICER",
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
    db: Session = Depends(get_db)
):
    try:
        updated = transition_violation_state(
            db=db,
            violation_id=violation_id,
            target_state=ViolationStatusEnum.CLOSED,
            actor_name=user_name,
            actor_role=user_role,
            notes=notes
        )
        return {"status": "SUCCESS", "message": f"Violation {updated.violation_code} successfully transitioned to CLOSED."}
    except RecordNotFoundException as e:
        raise HTTPException(status_code=404, detail=str(e))
    except InvalidStateTransitionException as e:
        raise HTTPException(status_code=400, detail=str(e))
