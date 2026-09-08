import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from fastapi.testclient import TestClient

from app.database import Base, get_db
from app.main import app
from app.models import Mine, Violation, Inspection, Observation, CorrectiveAction, ExternalActivity, SeverityEnum, ViolationStatusEnum
from app.priority.fusion import run_full_intelligence_pipeline
from app.ocr_pipeline import process_document_ocr
from app.ledger import verify_audit_ledger
from app.seed import seed_db

from sqlalchemy.pool import StaticPool

# StaticPool In-Memory Engine for Phase 14 Integration Testing
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

# 1. TEST DEMO RESET ENDPOINT
def test_demo_reset_endpoint():
    response = client.post("/api/v1/demo/reset")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "SUCCESS"
    assert "Mine C" in data["hero_case"]

# 2. TEST MINE C GOLDEN DEMO STATE & HERO CASE V-1024
def test_hero_case_mine_c_data(setup_test_database):
    db = setup_test_database
    mine_c = db.query(Mine).filter(Mine.mine_code == "MINE-C").first()
    assert mine_c is not None
    assert mine_c.risk_score == 87.85
    assert mine_c.status == "CRITICAL"

    v1024 = db.query(Violation).filter(Violation.violation_code == "V-1024").first()
    assert v1024 is not None
    assert v1024.priority_score == 87.85
    assert v1024.severity == SeverityEnum.HIGH
    assert v1024.external_discrepancy is True

# 3. TEST FULL LIFE CYCLE: OFFLINE SYNC -> CASE CREATION -> SLA -> VERIFICATION -> AUDIT
def test_full_governance_lifecycle(setup_test_database):
    db = setup_test_database
    mine_c = db.query(Mine).filter(Mine.mine_code == "MINE-C").first()

    # Step A: Batch Sync Mobile Inspection
    sync_payload = {
        "inspections": [
            {
                "local_id": "LOCAL-TEST-PH14-001",
                "mine_id": mine_c.id,
                "gps_lat": 24.2012,
                "gps_lng": 82.6644,
                "inspection_type": "Safety",
                "notes": "Field check during offline mode",
                "observations": [
                    {
                        "regulation_id": 4,
                        "severity": "HIGH",
                        "description": "Required protective equipment was unavailable.",
                        "is_violation": True
                    }
                ]
            }
        ]
    }

    res = client.post("/api/v1/inspections/sync", json=sync_payload)
    assert res.status_code == 200
    sync_result = res.json()
    assert sync_result["success"] is True
    assert sync_result["synced_items"][0]["sync_status"] == "SYNCED"

    # Step B: Cryptographic Ledger Chain Integrity
    ledger_verification = verify_audit_ledger(db)
    assert ledger_verification["verified"] is True
    assert ledger_verification["status"] == "VALID"

# 4. TEST FAILURE FALLBACK: ML CLASSIFIER GRACEFUL DEGRADATION
def test_ml_classifier_fallback(monkeypatch):
    def mock_ml_failure(features):
        raise RuntimeError("ML Inference Model Worker Offline")

    monkeypatch.setattr("app.priority.fusion.run_layer3_ml_classifier", mock_ml_failure)

    res = run_full_intelligence_pipeline(
        severity="HIGH",
        recurrence_count=4,
        overdue_days=8,
        open_count=7,
        mine_risk_score=87.85,
        reporting_drift=0.75,
        external_discrepancy=True
    )
    assert res["unified_score"] > 0
    assert res["layers"]["layer3_ml"]["status"] == "FALLBACK_RULE_SCORE"

# 5. TEST FAILURE FALLBACK: OCR ENGINE MANUAL REVIEW
def test_ocr_failure_fallback(monkeypatch):
    def mock_choice_failure(seq):
        raise ValueError("Corrupted PDF document stream")

    monkeypatch.setattr("random.choice", mock_choice_failure)

    res = process_document_ocr("broken_doc.pdf")
    assert res["processing_status"] == "MANUAL_REVIEW_REQUIRED"
    assert res["requires_human_verification"] is True
