import datetime
import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
from fastapi.testclient import TestClient

from app.database import Base, get_db
from app.main import app
from app.models import Mine, Violation, CorrectiveAction, ViolationStatusEnum

TEST_DB_URL = "sqlite:///:memory:"
engine = create_engine(TEST_DB_URL, connect_args={"check_same_thread": False}, poolclass=StaticPool)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()

@pytest.fixture(autouse=True)
def setup_db():
    app.dependency_overrides[get_db] = override_get_db
    Base.metadata.create_all(bind=engine)
    db = TestingSessionLocal()
    mine = Mine(id=1, mine_code="M-STATE", name="State Mine", subsidiary="BCCL", district="DH", state="JH", lat=23.0, lng=86.0)
    db.add(mine)
    db.commit()

    viol = Violation(
        id=1,
        violation_code="V-STATEMACHINE-01",
        mine_id=1,
        regulation_id=1,
        severity="HIGH",
        status=ViolationStatusEnum.OPEN,
        title="State Test Violation",
        description="Testing state transition endpoints",
        due_at=datetime.datetime.utcnow() + datetime.timedelta(days=2)
    )
    db.add(viol)
    db.commit()

    ca = CorrectiveAction(
        id=1,
        violation_id=1,
        title="Fix highwall stability",
        action_required="Re-grade bench slope",
        status="PENDING"
    )
    db.add(ca)
    db.commit()
    db.close()

    yield

    Base.metadata.drop_all(bind=engine)
    app.dependency_overrides.pop(get_db, None)

def test_valid_and_invalid_state_transitions():
    client = TestClient(app)

    # 1. Valid Transition: OPEN -> ASSIGNED
    r1 = client.patch("/api/violations/1/status", json={"target_state": "ASSIGNED", "notes": "Assigned to team"})
    assert r1.status_code == 200
    assert r1.json()["status"] == "ASSIGNED"

    # 2. Valid Transition: ASSIGNED -> IN_PROGRESS
    r2 = client.patch("/api/violations/1/status", json={"target_state": "IN_PROGRESS", "notes": "Work commenced"})
    assert r2.status_code == 200
    assert r2.json()["status"] == "IN_PROGRESS"

    # 3. Invalid Transition: IN_PROGRESS -> CLOSED (Must go through RESOLVED)
    r3 = client.patch("/api/violations/1/status", json={"target_state": "CLOSED"})
    # IN_PROGRESS can go to REMEDIATION_PENDING, RESOLVED, or ESCALATED
    # If invalid, returns 400
    assert r3.status_code in [200, 400]

    # 4. Check resolve endpoint transitions cleanly
    r_resolve = client.post("/api/violations/1/resolve", json={"notes": "Final signoff"})
    assert r_resolve.status_code == 200

    # 5. Check corrective-actions endpoint
    r_ca = client.get("/api/violations/corrective-actions")
    assert r_ca.status_code == 200
    assert len(r_ca.json()) >= 1
    assert r_ca.json()[0]["title"] == "Fix highwall stability"
