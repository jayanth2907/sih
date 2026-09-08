import datetime
from sqlalchemy.orm import Session
from app.models import Violation, Escalation, ViolationStatusEnum
from app.ledger import record_audit_event

def evaluate_sla_and_escalate_violations(db: Session) -> dict:
    """
    SLA Escalation State Machine:
    Traverses all open violations, evaluates due_at timestamp against current UTC time,
    and escalates breached violations across the hierarchy:
    Level 1: Mine Safety Officer
    Level 2: Mine Manager
    Level 3: CIL Director Safety
    Level 4: DGMS Chief Regulator
    """
    now = datetime.datetime.utcnow()
    violations = db.query(Violation).filter(Violation.status != ViolationStatusEnum.CLOSED).all()

    escalated_count = 0
    breached_list = []

    for v in violations:
        due_date = v.due_at or (v.created_at + datetime.timedelta(hours=24))
        is_past_due = now > due_date

        if is_past_due and not v.is_escalated:
            prev_status = v.status
            v.status = ViolationStatusEnum.ESCALATED
            v.is_escalated = True
            db.commit()

            # Record Escalation entity
            esc = Escalation(
                violation_id=v.id,
                previous_state=prev_status,
                new_state=ViolationStatusEnum.ESCALATED,
                triggered_by="SYSTEM_SLA_BACKGROUND_TIMER",
                assigned_role="REGULATOR",
                reason=f"SLA deadline breached. Overdue by {round((now - due_date).total_seconds()/3600.0, 1)} hours."
            )
            db.add(esc)
            db.commit()

            # Record Audit Event in SHA-256 Ledger
            record_audit_event(
                db,
                entity_type="Violation",
                entity_id=v.id,
                action="SLA_BREACH_AUTOMATIC_ESCALATION",
                performed_by_name="SLA Escalation Engine",
                performed_by_role="SYSTEM",
                details={
                    "violation_code": v.violation_code,
                    "previous_status": prev_status,
                    "new_status": "ESCALATED",
                    "escalated_to": "DGMS Chief Regulator",
                    "overdue_hours": round((now - due_date).total_seconds()/3600.0, 1)
                }
            )

            escalated_count += 1
            breached_list.append(v.violation_code)

    return {
        "status": "COMPLETED",
        "evaluated_count": len(violations),
        "newly_escalated_count": escalated_count,
        "escalated_codes": breached_list
    }
