import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
from fastapi.testclient import TestClient

from app.database import Base, get_db
from app.main import app
from app.models import Mine, Regulation, User, Violation

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
    
    # Create test mine & regulation & user
    mine = Mine(
        id=1,
        mine_code="MINE-TFLOW",
        name="Creation Flow Test Mine",
        subsidiary="BCCL",
        district="Dhanbad",
        state="Jharkhand",
        lat=23.7,
        lng=86.4,
        inspection_frequency_days=7,
        reporting_frequency_expected=10,
        reporting_frequency_actual=8,
        risk_score=50.0
    )
    reg = Regulation(
        id=1,
        code="DGMS-FLOW-01",
        title="Ventilation Airway Limits",
        category="Ventilation",
        severity="HIGH",
        response_sla_hours=48
    )
    user = User(
        id=1,
        name="Inspector Flow",
        username="inspector.flow",
        email="flow@gov.in",
        password_hash="demo123",
        role="INSPECTOR"
    )
    db.add_all([mine, reg, user])
    db.commit()
    db.close()

    yield

    Base.metadata.drop_all(bind=engine)
    app.dependency_overrides.pop(get_db, None)

def test_sequential_violations_recurrence_and_priority():
    client = TestClient(app)
    
    payload = {
        "mine_id": 1,
        "gps_lat": 23.7,
        "gps_lng": 86.4,
        "notes": "First inspection with methane issue",
        "is_offline_sync": False,
        "observations": [
            {
                "regulation_id": 1,
                "severity": "HIGH",
                "description": "High methane concentration observed in airway",
                "is_violation": True
            }
        ]
    }

    # 1. Post First Inspection
    resp1 = client.post("/api/inspections", json=payload)
    assert resp1.status_code == 200

    db = TestingSessionLocal()
    v1 = db.query(Violation).filter(Violation.mine_id == 1).order_by(Violation.id.asc()).first()
    assert v1 is not None
    assert v1.recurrence_count == 0
    score1 = v1.priority_score
    db.close()

    # 2. Post Second Inspection with same regulation
    resp2 = client.post("/api/inspections", json=payload)
    assert resp2.status_code == 200

    db = TestingSessionLocal()
    v2 = db.query(Violation).filter(Violation.mine_id == 1).order_by(Violation.id.desc()).first()
    assert v2 is not None
    assert v2.id != v1.id
    assert v2.recurrence_count == 1 # Recurrence increased!
    score2 = v2.priority_score

    # Confirm priority_score is measurably different due to recurrence
    assert score2 != score1
    assert score2 > score1
    assert v2.peer_percentile is not None
    assert v2.ml_probability is not None
    db.close()
