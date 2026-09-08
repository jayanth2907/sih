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
    current_val = current_state.value if hasattr(current_state, "value") else str(current_state)
    target_val = target_state.value if hasattr(target_state, "value") else str(target_state)

    allowed_next = []
    for k, v in VALID_TRANSITIONS.items():
        k_val = k.value if hasattr(k, "value") else str(k)
        if k_val == current_val:
            allowed_next = [s.value if hasattr(s, "value") else str(s) for s in v]
            break

    if target_val not in allowed_next:
        raise InvalidStateTransitionException(
            f"Invalid state transition from '{current_val}' to '{target_val}'. "
            f"Allowed transitions from '{current_val}': {allowed_next}."
        )

    violation.status = target_val
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
