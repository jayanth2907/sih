import datetime
import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
from app.database import Base
from app.models import Mine, Violation, Regulation, Inspection, ExternalActivity, ViolationStatusEnum
from app.services.feature_service import (
    get_recurrence_count,
    get_inspection_gap_days,
    get_open_violation_count,
    get_site_violation_rate,
    get_reporting_drift,
    get_external_discrepancy
)
from app.peer_benchmark.percentile import calculate_mine_peer_percentile

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

def test_feature_service_recurrence_and_features(db):
    mine = Mine(
        mine_code="MINE-T1",
        name="Test Coal Mine 1",
        subsidiary="BCCL",
        mine_type="OPEN_CAST",
        district="Dhanbad",
        state="Jharkhand",
        lat=23.8,
        lng=86.4,
        inspection_frequency_days=7,
        reporting_frequency_expected=10,
        reporting_frequency_actual=4, # drift = 1 - 4/10 = 0.6
        risk_score=75.0
    )
    reg = Regulation(code="REG-METHANE-01", title="Methane Standard", category="Ventilation", response_sla_hours=24)
    db.add_all([mine, reg])
    db.commit()
    db.refresh(mine)
    db.refresh(reg)

    # Initial recurrence count should be 0
    assert get_recurrence_count(db, mine.id, reg.id) == 0

    # Add 3 violations for the same mine + regulation
    now = datetime.datetime.utcnow()
    for i in range(3):
        v = Violation(
            violation_code=f"V-TEST-{i}",
            mine_id=mine.id,
            regulation_id=reg.id,
            severity="HIGH",
            status=ViolationStatusEnum.OPEN if i < 2 else ViolationStatusEnum.CLOSED,
            title="Test Methane Violation",
            description="High methane concentration",
            due_at=now + datetime.timedelta(hours=24),
            created_at=now - datetime.timedelta(days=i)
        )
        db.add(v)
    db.commit()

    # Verify get_recurrence_count returns 3, not a constant
    rec_count = get_recurrence_count(db, mine.id, reg.id)
    assert rec_count == 3

    # Verify open count is 2 (1 was closed)
    open_count = get_open_violation_count(db, mine.id)
    assert open_count == 2

    # Verify site violation rate is 2/3 = 0.67
    viol_rate = get_site_violation_rate(db, mine.id)
    assert viol_rate == round(2/3.0, 2)

    # Verify reporting drift: 1 - 4/10 = 0.6
    drift = get_reporting_drift(db, mine.id)
    assert drift == 0.60

    # Verify external discrepancy when no external activity exists: False
    assert get_external_discrepancy(db, mine.id) is False

    # Add external activity signal
    ext = ExternalActivity(
        mine_id=mine.id,
        source="CMSMS_SATELLITE",
        activity_detected=True,
        confidence=90.0
    )
    db.add(ext)
    db.commit()

    # Now external discrepancy should be True (drift 0.6 > 0.2 and satellite active)
    assert get_external_discrepancy(db, mine.id) is True

def test_peer_percentile_from_db(db):
    # Create 4 mines with same subsidiary
    mines = []
    for i, score in enumerate([20.0, 40.0, 60.0, 80.0]):
        m = Mine(
            mine_code=f"MINE-P{i}",
            name=f"Peer Mine {i}",
            subsidiary="ECL",
            mine_type="OPEN_CAST",
            district="Asansol",
            state="West Bengal",
            lat=23.7,
            lng=86.9,
            risk_score=score
        )
        mines.append(m)
        db.add(m)
    db.commit()

    target_mine = mines[2] # score 60.0
    res = calculate_mine_peer_percentile(target_mine.risk_score, mine_id=target_mine.id, db=db)
    assert "peer_percentile" in res
    assert res["peer_percentile"] > 0
