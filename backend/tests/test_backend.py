import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.database import Base
from app.models import User, Mine, Violation, Regulation, RoleEnum, SeverityEnum, ViolationStatusEnum
from app.priority.fusion import run_full_intelligence_pipeline
from app.services.violation_service import transition_violation_state, VALID_TRANSITIONS
from app.core.exceptions import InvalidStateTransitionException
from app.ledger import record_audit_event, verify_audit_ledger, GENESIS_HASH
from app.sync_service import process_mobile_batch_sync

# In-Memory SQLite Test Engine
TEST_DB_URL = "sqlite:///:memory:"
engine = create_engine(TEST_DB_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

@pytest.fixture
def db():
    Base.metadata.create_all(bind=engine)
    session = TestingSessionLocal()
    
    # Seed minimal test data
    mine = Mine(mine_code="MINE-TEST", name="Test Mine", subsidiary="BCCL", state="JH", district="Dhanbad", lat=23.7, lng=86.4)
    reg = Regulation(code="DGMS-TEST", category="Safety", title="Test Reg", response_sla_hours=24)
    session.add_all([mine, reg])
    session.commit()
    
    yield session
    session.close()
    Base.metadata.drop_all(bind=engine)

# 1. TEST RISK SCORING FORMULA
def test_risk_scoring_formula():
    res = run_full_intelligence_pipeline(
        severity="HIGH",
        recurrence_count=4,
        overdue_days=8,
        open_count=7,
        mine_risk_score=78.5,
        reporting_drift=0.63,
        external_discrepancy=True
    )
    assert res["unified_score"] >= 80.0
    assert res["risk_class"] == "CRITICAL"
    assert res["model_version"] == "risk-model-v1"

# 2. TEST STATE MACHINE VALIDATION
def test_state_machine_transitions(db):
    mine = db.query(Mine).first()
    reg = db.query(Regulation).first()
    
    viol = Violation(
        violation_code="VIOL-TEST-001",
        mine_id=mine.id,
        regulation_id=reg.id,
        severity=SeverityEnum.HIGH,
        status=ViolationStatusEnum.OPEN,
        title="Test Violation",
        description="Testing state machine",
        due_at=mine.created_at
    )
    db.add(viol)
    db.commit()

    # Valid transition: OPEN -> ASSIGNED
    v_updated = transition_violation_state(db, viol.id, ViolationStatusEnum.ASSIGNED)
    assert v_updated.status == ViolationStatusEnum.ASSIGNED

    # Valid transition: ASSIGNED -> IN_PROGRESS
    v_in_progress = transition_violation_state(db, viol.id, ViolationStatusEnum.IN_PROGRESS)
    assert v_in_progress.status == ViolationStatusEnum.IN_PROGRESS

# 3. TEST CRYPTOGRAPHIC HASH CHAIN INTEGRITY
def test_hash_chain_integrity(db):
    ev1 = record_audit_event(db, "System", 1, "INIT", "Admin", "ADMIN", {"test": 1})
    ev2 = record_audit_event(db, "Mine", 1, "MINE_ADD", "Admin", "ADMIN", {"test": 2})

    assert ev2.previous_hash == ev1.hash

    verification = verify_audit_ledger(db)
    assert verification["verified"] is True
    assert verification["status"] == "VALID"

# 4. TEST IDEMPOTENT MOBILE BATCH SYNC
def test_idempotent_batch_sync(db):
    mine = db.query(Mine).first()
    
    batch_payload = {
        "inspections": [
            {
                "local_id": "LOCAL-TEST-999",
                "mine_id": mine.id,
                "gps_lat": 23.7,
                "gps_lng": 86.4,
                "notes": "Test offline inspection",
                "observations": [
                    {
                        "regulation_id": 1,
                        "severity": "HIGH",
                        "description": "Test observation",
                        "is_violation": True
                    }
                ]
            }
        ]
    }

    # First sync
    res1 = process_mobile_batch_sync(db, batch_payload)
    assert res1["success"] is True
    assert res1["synced_items"][0]["sync_status"] == "SYNCED"

    # Second sync (Duplicate local_id attempt)
    res2 = process_mobile_batch_sync(db, batch_payload)
    assert res2["success"] is True
    assert "Idempotent match" in res2["synced_items"][0]["message"]
