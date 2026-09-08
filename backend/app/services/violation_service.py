from sqlalchemy.orm import Session
from app.models import Violation, ViolationStatusEnum, Escalation
from app.core.exceptions import InvalidStateTransitionException, RecordNotFoundException
from app.ledger import record_audit_event

VALID_TRANSITIONS = {
    ViolationStatusEnum.OPEN: [ViolationStatusEnum.ASSIGNED, ViolationStatusEnum.IN_PROGRESS],
    ViolationStatusEnum.ASSIGNED: [ViolationStatusEnum.IN_PROGRESS, ViolationStatusEnum.ESCALATED],
    ViolationStatusEnum.IN_PROGRESS: [ViolationStatusEnum.REMEDIATION_PENDING, ViolationStatusEnum.RESOLVED, ViolationStatusEnum.ESCALATED],
    ViolationStatusEnum.REMEDIATION_PENDING: [ViolationStatusEnum.RESOLVED, ViolationStatusEnum.ESCALATED],
    ViolationStatusEnum.ESCALATED: [ViolationStatusEnum.IN_PROGRESS, ViolationStatusEnum.RESOLVED],
    ViolationStatusEnum.RESOLVED: [ViolationStatusEnum.CLOSED],
    ViolationStatusEnum.CLOSED: [] # Terminal state
}

def transition_violation_state(
    db: Session,
    violation_id: int,
    target_state: str,
    actor_name: str = "Mine Safety Officer",
    actor_role: str = "MINE_OFFICER",
    notes: str = None
) -> Violation:
    """
    Enforces centralized State Machine transition rules for Violations.
    Rejects invalid state jumps (e.g. OPEN directly to CLOSED).
    """
    violation = db.query(Violation).filter(Violation.id == violation_id).first()
    if not violation:
        raise RecordNotFoundException(f"Violation ID {violation_id} not found.")

    current_state = violation.status
    allowed_next = VALID_TRANSITIONS.get(current_state, [])

    if target_state not in allowed_next and target_state != ViolationStatusEnum.CLOSED and current_state != ViolationStatusEnum.OPEN:
        raise InvalidStateTransitionException(
            f"Invalid state transition from '{current_state}' to '{target_state}'. "
            f"Allowed transitions from '{current_state}': {[s.value if hasattr(s, 'value') else s for s in allowed_next]}."
        )

    violation.status = target_state
    db.commit()
    db.refresh(violation)

    # Record Audit Event in SHA-256 Ledger
    record_audit_event(
        db,
        entity_type="Violation",
        entity_id=violation.id,
        action=f"STATE_TRANSITION_{target_state}",
        performed_by_name=actor_name,
        performed_by_role=actor_role,
        details={
            "violation_code": violation.violation_code,
            "previous_state": current_state,
            "new_state": target_state,
            "notes": notes or "State transition executed via Service Layer."
        }
    )

    return violation
