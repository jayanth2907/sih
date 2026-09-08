import datetime
import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
from app.database import Base
from app.models import Mine, Violation, Escalation, AuditEvent, ViolationStatusEnum
from app.escalation_engine import evaluate_sla_and_escalate_violations

TEST_DB_URL = "sqlite:///:memory:"
engine = create_engine(TEST_DB_URL, connect_args={"check_same_thread": False}, poolclass=StaticPool)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

@pytest.fixture
def db():
    Base.metadata.create_all(bind=engine)
    session = TestingSessionLocal()
    yield session
    session.close()
    Base.metadata.drop_all(bind=engine)

def test_sla_breach_escalation_and_audit(db):
    mine = Mine(
        mine_code="MINE-SLA-TEST",
        name="SLA Mine",
        subsidiary="BCCL",
        district="Dhanbad",
        state="JH",
        lat=23.7,
        lng=86.4
    )
    db.add(mine)
    db.commit()

    # Create past due violation
    now = datetime.datetime.utcnow()
    v = Violation(
        violation_code="V-OVERDUE-01",
        mine_id=mine.id,
        regulation_id=1,
        severity="HIGH",
        status=ViolationStatusEnum.OPEN,
        title="Unresolved ventilation issue",
        description="Air flow obstructed",
        due_at=now - datetime.timedelta(hours=5), # 5 hours overdue!
        is_escalated=False
    )
    db.add(v)
    db.commit()

    # Execute SLA evaluation
    result = evaluate_sla_and_escalate_violations(db)

    assert result["newly_escalated_count"] == 1
    assert "V-OVERDUE-01" in result["escalated_codes"]

    # Refresh violation
    db.refresh(v)
    assert v.status == ViolationStatusEnum.ESCALATED
    assert v.is_escalated is True

    # Check Escalation row
    esc = db.query(Escalation).filter(Escalation.violation_id == v.id).first()
    assert esc is not None
    assert esc.new_state == ViolationStatusEnum.ESCALATED
    assert "SLA deadline breached" in esc.reason

    # Check AuditEvent row
    audit = db.query(AuditEvent).filter(
        AuditEvent.entity_type == "Violation",
        AuditEvent.entity_id == v.id,
        AuditEvent.action == "SLA_BREACH_AUTOMATIC_ESCALATION"
    ).first()
    assert audit is not None
    assert audit.performed_by_name == "SLA Escalation Engine"
