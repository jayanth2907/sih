import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
from fastapi.testclient import TestClient

from app.database import Base, get_db
from app.main import app
from app.models import Mine, Violation, Inspection, Observation, SeverityEnum, ViolationStatusEnum
from app.seed import seed_db
from app.silence_engine.detector import analyze_mine_reporting_silence

# StaticPool In-Memory Engine for Phase 15 Testing
TEST_DB_URL = "sqlite:///:memory:"
engine = create_engine(TEST_DB_URL, connect_args={"check_same_thread": False}, poolclass=StaticPool)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

@pytest.fixture(autouse=True)
def setup_test_database():
    Base.metadata.create_all(bind=engine)
    db = TestingSessionLocal()
    seed_db(db_session=db, force=True)
    
    def _override_get_db():
        try:
            yield db
        finally:
            pass

    app.dependency_overrides[get_db] = _override_get_db
    yield db
    db.close()

client = TestClient(app)

# 1. TEST MODEL METADATA REGISTRY & POLICY VERSIONING
def test_model_metadata_registry():
    response = client.get("/api/v1/risk/model-metadata")
    assert response.status_code == 200
    data = response.json()
    assert data["model_version"] == "risk-model-v1.2"
    assert data["rule_pack_version"] == "rule-pack-v3"
    assert data["evaluation_metrics"]["precision"] >= 0.90
    assert data["rollback_capability"] is True

# 2. TEST FALSE POSITIVE CONTROL (SILENCE-TO-RISK)
def test_silence_to_risk_false_positive_control(setup_test_database):
    db = setup_test_database
    mine_maint = Mine(
        mine_code="MINE-MAINT",
        name="Maintenance Mine",
        subsidiary="BCCL",
        state="Jharkhand",
        district="Dhanbad",
        lat=23.7,
        lng=86.4,
        reporting_frequency_expected=10,
        reporting_frequency_actual=2, # Large gap (80% drift)
        status="PLANNED_MAINTENANCE" # Authorized maintenance downtime!
    )
    db.add(mine_maint)
    db.commit()

    analysis = analyze_mine_reporting_silence(mine_maint)
    assert analysis["false_positive_suppressed"] is True
    assert analysis["is_silence_anomaly"] is False
    assert analysis["governance_status"] == "SUPPRESSED_PLANNED_DOWNTIME"

# 3. TEST KPI FRAMEWORK & GOVERNANCE RESPONSE SCORE
def test_kpi_framework_calculation():
    response = client.get("/api/v1/dashboard/kpis")
    assert response.status_code == 200
    kpis = response.json()
    assert "kpi1_detection_coverage_pct" in kpis
    assert "kpi2_sla_compliance_pct" in kpis
    assert "overall_governance_response_score" in kpis
    assert kpis["kpi1_detection_coverage_pct"] >= 90.0

# 4. TEST SECURITY DEFENSE & HARDENING HEALTH CHECK
def test_security_hardening_health():
    response = client.get("/api/v1/health/hardening")
    assert response.status_code == 200
    hardening = response.json()
    assert hardening["status"] == "HARDENED"
    assert hardening["security_controls"]["hash_chain_verified"] is True
    assert hardening["resilience_fallbacks"]["ml_classifier_fallback"] == "RULE_SCORE_FALLBACK_READY"

# 5. TEST COMPREHENSIVE FULL REGRESSION ACROSS ALL PHASES
def test_full_system_regression(setup_test_database):
    # Verify Auth Root
    root_res = client.get("/")
    assert root_res.status_code == 200

    # Verify Dashboard Summary
    dash_res = client.get("/api/v1/dashboard/summary")
    assert dash_res.status_code == 200

    # Verify What Needs Attention Ranking
    attn_res = client.get("/api/v1/dashboard/attention")
    assert attn_res.status_code == 200
    assert len(attn_res.json()["cases"]) > 0
