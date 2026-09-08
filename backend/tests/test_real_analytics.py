import datetime
import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
from fastapi.testclient import TestClient

from app.database import Base, get_db
from app.main import app
from app.models import Mine, Violation, Inspection, ViolationStatusEnum

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
    now = datetime.datetime.utcnow()
    mine = Mine(id=1, mine_code="M-AN1", name="Analytics Mine", subsidiary="BCCL", district="DH", state="JH", lat=23.0, lng=86.0, risk_score=58.0)
    db.add(mine)
    viol = Violation(id=1, violation_code="V-AN1", mine_id=1, regulation_id=1, severity="MEDIUM", status=ViolationStatusEnum.OPEN, title="Dust", description="Dust issue", due_at=now + datetime.timedelta(days=1))
    db.add(viol)
    db.commit()
    db.close()

    yield

    Base.metadata.drop_all(bind=engine)
    app.dependency_overrides.pop(get_db, None)

def test_dashboard_and_analytics_endpoints():
    client = TestClient(app)

    # 1. Dashboard summary: exactly 1 mine and 1 open violation (NOT 10 and NOT 137)
    r_sum = client.get("/api/dashboard/summary")
    assert r_sum.status_code == 200
    data_sum = r_sum.json()
    assert data_sum["total_mines"] == 1
    assert data_sum["open_violations"] == 1

    # 2. Dashboard KPIs
    r_kpis = client.get("/api/dashboard/kpis")
    assert r_kpis.status_code == 200
    data_kpi = r_kpis.json()
    assert "kpi1_detection_coverage_pct" in data_kpi
    assert "overall_governance_response_score" in data_kpi

    # 3. SLA Performance
    r_sla = client.get("/api/dashboard/sla-performance")
    assert r_sla.status_code == 200
    data_sla = r_sla.json()
    assert "completed_within_sla_pct" in data_sla
    assert len(data_sla["worst_performing_mines"]) > 0

    # 4. Fleet Risk Trend
    r_fleet = client.get("/api/analytics/fleet-trend")
    assert r_fleet.status_code == 200
    data_fleet = r_fleet.json()
    assert "current_score" in data_fleet
    assert len(data_fleet["trend"]) == 6

    # 5. Reporting Cadence
    r_cad = client.get("/api/analytics/reporting-cadence")
    assert r_cad.status_code == 200
    data_cad = r_cad.json()
    assert len(data_cad) == 6

    # 6. Notifications
    r_notif = client.get("/api/notifications")
    assert r_notif.status_code == 200
    assert isinstance(r_notif.json(), list)
