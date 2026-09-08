import hashlib
import json
import datetime
from sqlalchemy.orm import Session
from app.models import AuditEvent

GENESIS_HASH = "0000000000000000000000000000000000000000000000000000000000000000"

def calculate_event_hash(entity_type: str, entity_id: int, action: str, performed_by_name: str, performed_by_role: str, timestamp_str: str, details_json: str, previous_hash: str) -> str:
    """
    Computes a cryptographic SHA-256 hash chaining previous_hash + payload.
    """
    payload = f"{previous_hash}|{entity_type}|{entity_id}|{action}|{performed_by_name}|{performed_by_role}|{timestamp_str}|{details_json}"
    return hashlib.sha256(payload.encode('utf-8')).hexdigest()

def record_audit_event(
    db: Session,
    entity_type: str,
    entity_id: int,
    action: str,
    performed_by_name: str,
    performed_by_role: str,
    details: dict
) -> AuditEvent:
    """
    Inserts a new tamper-evident audit entry into the hash chain.
    """
    # Fetch last record to get previous_hash
    last_event = db.query(AuditEvent).order_by(AuditEvent.id.desc()).first()
    previous_hash = last_event.hash if last_event else GENESIS_HASH

    timestamp_str = datetime.datetime.utcnow().isoformat()
    details_str = json.dumps(details, sort_keys=True)

    event_hash = calculate_event_hash(
        entity_type=entity_type,
        entity_id=entity_id,
        action=action,
        performed_by_name=performed_by_name,
        performed_by_role=performed_by_role,
        timestamp_str=timestamp_str,
        details_json=details_str,
        previous_hash=previous_hash
    )

    audit_entry = AuditEvent(
        entity_type=entity_type,
        entity_id=entity_id,
        action=action,
        performed_by_name=performed_by_name,
        performed_by_role=performed_by_role,
        timestamp=timestamp_str,
        details_json=details_str,
        previous_hash=previous_hash,
        hash=event_hash
    )

    db.add(audit_entry)
    db.commit()
    db.refresh(audit_entry)
    return audit_entry

def verify_audit_ledger(db: Session) -> dict:
    """
    Traverses the entire AuditEvent ledger to verify that no hashes have been tampered with.
    """
    events = db.query(AuditEvent).order_by(AuditEvent.id.asc()).all()
    if not events:
        return {"status": "VALID", "total_records": 0, "verified": True, "tampered_index": None}

    expected_prev_hash = GENESIS_HASH
    for index, ev in enumerate(events):
        if ev.previous_hash != expected_prev_hash:
            return {
                "status": "TAMPERED",
                "total_records": len(events),
                "verified": False,
                "tampered_index": index + 1,
                "reason": f"Previous hash mismatch at ID {ev.id}"
            }

        recalculated_hash = calculate_event_hash(
            entity_type=ev.entity_type,
            entity_id=ev.entity_id,
            action=ev.action,
            performed_by_name=ev.performed_by_name,
            performed_by_role=ev.performed_by_role,
            timestamp_str=ev.timestamp,
            details_json=ev.details_json,
            previous_hash=ev.previous_hash
        )

        if recalculated_hash != ev.hash:
            return {
                "status": "TAMPERED",
                "total_records": len(events),
                "verified": False,
                "tampered_index": index + 1,
                "reason": f"Data integrity violation at ID {ev.id}. Hash does not match stored value."
            }

        expected_prev_hash = ev.hash

    return {
        "status": "VALID",
        "total_records": len(events),
        "verified": True,
        "tampered_index": None,
        "latest_hash": expected_prev_hash
    }
