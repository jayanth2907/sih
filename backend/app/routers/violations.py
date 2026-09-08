from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import Violation, CorrectiveAction, ViolationStatusEnum
from app.schemas import ViolationResponse, CorrectiveActionUpdate
from app.ledger import record_audit_event

router = APIRouter(prefix="/api/violations", tags=["Violations"])

@router.get("", response_model=list[ViolationResponse])
def list_violations(mine_id: int = None, status: str = None, db: Session = Depends(get_db)):
    query = db.query(Violation)
    if mine_id:
        query = query.filter(Violation.mine_id == mine_id)
    if status:
        query = query.filter(Violation.status == status)
    return query.order_by(Violation.id.desc()).all()

@router.post("/{violation_id}/resolve")
def resolve_violation(
    violation_id: int,
    notes: str = "Corrective action completed and verified by Mine Safety Manager",
    user_name: str = "Priya Verma (Mine Safety Manager)",
    user_role: str = "MINE_OFFICER",
    db: Session = Depends(get_db)
):
    violation = db.query(Violation).filter(Violation.id == violation_id).first()
    if not violation:
        raise HTTPException(status_code=404, detail="Violation not found")

    violation.status = ViolationStatusEnum.CLOSED
    db.commit()

    record_audit_event(
        db,
        entity_type="Violation",
        entity_id=violation.id,
        action="VIOLATION_CLOSED",
        performed_by_name=user_name,
        performed_by_role=user_role,
        details={
            "violation_code": violation.violation_code,
            "resolution_notes": notes,
            "status": "CLOSED"
        }
    )

    return {"status": "SUCCESS", "message": f"Violation {violation.violation_code} successfully resolved and verified."}
