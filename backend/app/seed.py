import datetime
from app.database import SessionLocal, engine, Base
from app.models import (
    User, Mine, Regulation, Inspection, Observation, Violation,
    CorrectiveAction, Contractor, Escalation, RoleEnum, SeverityEnum, ViolationStatusEnum,
    Role, RiskScore, Document, ExternalActivity
)
from app.ledger import record_audit_event
from app.priority_engine import calculate_priority_score

def seed_db(db_session=None, force: bool = False):
    Base.metadata.create_all(bind=engine)
    db = db_session or SessionLocal()

    # Re-seed if forced or if tables are empty
    if not force and db.query(Mine).count() >= 10:
        print("Database already contains full 10-mine dataset.")
        if not db_session:
            db.close()
        return

    print("Seeding full Phase 2 Coal Governance 14-table database...")

    # Clear existing tables for clean Phase 2 dataset
    db.query(RiskScore).delete()
    db.query(CorrectiveAction).delete()
    db.query(Escalation).delete()
    db.query(Violation).delete()
    db.query(Observation).delete()
    db.query(Inspection).delete()
    db.query(Document).delete()
    db.query(ExternalActivity).delete()
    db.query(User).delete()
    db.query(Contractor).delete()
    db.query(Mine).delete()
    db.query(Regulation).delete()
    db.query(Role).delete()
    db.commit()

    # 1. Seed Roles
    roles = [
        Role(name="INSPECTOR", description="Field Inspector - fast entry & GPS capture"),
        Role(name="MINE_OFFICER", description="Mine Safety Manager - SLA & remediation enforcement"),
        Role(name="CORPORATE", description="CIL Corporate Management - cross-mine benchmarking"),
        Role(name="REGULATOR", description="DGMS / MoC Chief Regulatory Auditor"),
        Role(name="CONTRACTOR", description="External logistics & earthmoving contractor"),
        Role(name="ADMIN", description="System Administrator")
    ]
    db.add_all(roles)
    db.commit()

    # 2. Seed 10 Synthetic Mines (Mine A through Mine J)
    mines = [
        Mine(mine_code="MINE-A", name="Mine A - Jharia Opencast", subsidiary="BCCL", state="Jharkhand", district="Dhanbad", lat=23.7466, lng=86.4162, risk_score=22.0, status="OPERATIONAL", reporting_frequency_expected=10, reporting_frequency_actual=10),
        Mine(mine_code="MINE-B", name="Mine B - Gevra Mega Project", subsidiary="SECL", state="Chhattisgarh", district="Korba", lat=22.3504, lng=82.6841, risk_score=78.5, status="WARNING", reporting_frequency_expected=10, reporting_frequency_actual=9),
        Mine(mine_code="MINE-C", name="Mine C - Singrauli Block-B", subsidiary="NCL", state="Madhya Pradesh", district="Singrauli", lat=24.2012, lng=82.6644, risk_score=87.85, status="CRITICAL", reporting_frequency_expected=10, reporting_frequency_actual=3, governance_response_score=62.0),
        Mine(mine_code="MINE-D", name="Mine D - Raniganj Sonepur", subsidiary="ECL", state="West Bengal", district="Paschim Bardhaman", lat=23.6333, lng=87.1667, risk_score=94.5, status="CRITICAL", reporting_frequency_expected=10, reporting_frequency_actual=1),
        Mine(mine_code="MINE-E", name="Mine E - Talcher Ananta", subsidiary="MCL", state="Odisha", district="Angul", lat=20.9500, lng=85.2333, risk_score=15.0, status="OPERATIONAL", reporting_frequency_expected=8, reporting_frequency_actual=8),
        Mine(mine_code="MINE-F", name="Mine F - Piparwar Opencast", subsidiary="CCL", state="Jharkhand", district="Chatra", lat=23.7167, lng=85.0333, risk_score=42.0, status="OPERATIONAL", reporting_frequency_expected=10, reporting_frequency_actual=10),
        Mine(mine_code="MINE-G", name="Mine G - Dipka Mega Project", subsidiary="SECL", state="Chhattisgarh", district="Korba", lat=22.3167, lng=82.6500, risk_score=35.0, status="OPERATIONAL", reporting_frequency_expected=12, reporting_frequency_actual=12),
        Mine(mine_code="MINE-H", name="Mine H - Rajmahal Opencast", subsidiary="ECL", state="Jharkhand", district="Godda", lat=25.0500, lng=87.3500, risk_score=62.0, status="WARNING", reporting_frequency_expected=10, reporting_frequency_actual=6),
        Mine(mine_code="MINE-I", name="Mine I - Belpahar Coalfield", subsidiary="MCL", state="Odisha", district="Jharsuguda", lat=21.6500, lng=83.8667, risk_score=28.0, status="OPERATIONAL", reporting_frequency_expected=8, reporting_frequency_actual=8),
        Mine(mine_code="MINE-J", name="Mine J - Kusmunda Project", subsidiary="SECL", state="Chhattisgarh", district="Korba", lat=22.3333, lng=82.7000, risk_score=18.0, status="OPERATIONAL", reporting_frequency_expected=10, reporting_frequency_actual=10)
    ]
    db.add_all(mines)
    db.commit()

    # 3. Seed Contractors
    contractors = [
        Contractor(contractor_code="LIC-BHME-88", name="Bharat Heavy Mining Earthmovers Ltd", category="EARTHMOVING", contact_email="ramesh@bhme.co.in", contact_phone="+91-9876543210", compliance_score=78.2),
        Contractor(contractor_code="LIC-APEX-14", name="Apex Mining Logistics & Infra", category="HAULAGE", contact_email="suresh@apexmining.in", contact_phone="+91-9812345678", compliance_score=94.0)
    ]
    db.add_all(contractors)
    db.commit()

    # 4. Seed Statutory Regulations
    regs = [
        Regulation(code="DGMS-CMR-2017-104", category="Ventilation & Gases", title="Methane Concentration & Airway Ventilation Limits", description="Inflammable gas concentration shall not exceed 0.75% in return airway.", severity=SeverityEnum.CRITICAL, response_sla_hours=24),
        Regulation(code="DGMS-CMR-2017-123", category="Strata Control & Slope Safety", title="Highwall Bench Slope Stability", description="Opencast mine benches must comply with safety slope angles.", severity=SeverityEnum.HIGH, response_sla_hours=48),
        Regulation(code="PARIVESH-ENV-2022-09", category="Environmental Governance", title="Ambient Air Quality PM10 Monitoring", description="Continuous Ambient Air Quality Monitoring system operational at mine periphery.", severity=SeverityEnum.MEDIUM, response_sla_hours=72),
        Regulation(code="DGMS-CMR-2017-182", category="Personal Protective Equipment", title="Flameproof Helmets & Gas Detectors", description="Field staff inside seam extraction zone must be equipped with certified flameproof gear.", severity=SeverityEnum.HIGH, response_sla_hours=24)
    ]
    db.add_all(regs)
    db.commit()

    # 5. Seed Core Users
    users = [
        User(username="inspector1", email="inspector.dhanbad@dgms.gov.in", name="Rajesh Kumar (Field Inspector)", password_hash="demo", role=RoleEnum.INSPECTOR, mine_id=mines[0].id),
        User(username="mine_officer1", email="officer.jharia@bccl.co.in", name="Priya Verma (Mine Safety Manager)", password_hash="demo", role=RoleEnum.MINE_OFFICER, mine_id=mines[2].id),
        User(username="corporate1", email="dir.safety@coalindia.in", name="Dr. Anil Deshmukh (Director Safety, CIL)", password_hash="demo", role=RoleEnum.CORPORATE),
        User(username="regulator1", email="dg.dgms@dgms.gov.in", name="Sanjay Chatterji (DGMS Chief Regulator)", password_hash="demo", role=RoleEnum.REGULATOR),
        User(username="contractor1", email="ramesh@bhme.co.in", name="Ramesh Sharma (BHME Lead Contractor)", password_hash="demo", role=RoleEnum.CONTRACTOR, contractor_id=contractors[0].id),
        User(username="admin1", email="admin@coalgov.gov.in", name="System Administrator", password_hash="demo", role=RoleEnum.ADMIN)
    ]
    db.add_all(users)
    db.commit()

    # 6. Seed External Satellite Activity Signals (Silence-to-Risk Hero Concept)
    ext_signals = [
        ExternalActivity(mine_id=mines[2].id, source="CMSMS_SATELLITE", external_event_id="EXT-100", activity_detected=True, confidence=88.0, raw_reference="Sentinel-2 Satellite Thermal Extraction Activity Logged"),
        ExternalActivity(mine_id=mines[3].id, source="KHANAN_PRAHARI", external_event_id="EXT-101", activity_detected=True, confidence=94.0, raw_reference="Public Geo-spatial Mining Discrepancy Signal")
    ]
    db.add_all(ext_signals)
    db.commit()

    # 7. Seed Sample Violations & Model-Versioned Risk Scores
    viol1 = Violation(
        violation_code="V-1024",
        mine_id=mines[2].id, # Mine C (Singrauli - Hero Mine)
        regulation_id=regs[3].id,
        severity=SeverityEnum.HIGH,
        status=ViolationStatusEnum.ASSIGNED,
        title="Required protective equipment was unavailable",
        description="Required protective equipment (certified flameproof helmets and multi-gas detectors) was unavailable in seam extraction area.",
        priority_score=87.85,
        ml_probability=0.91,
        recurrence_count=4,
        peer_percentile=92.0,
        reporting_drift=0.75,
        external_discrepancy=True,
        due_at=datetime.datetime.utcnow() + datetime.timedelta(hours=18),
        is_escalated=True
    )
    viol2 = Violation(
        violation_code="V-1091",
        mine_id=mines[2].id, # Mine C (Singrauli)
        regulation_id=regs[0].id,
        severity=SeverityEnum.CRITICAL,
        status=ViolationStatusEnum.OPEN,
        title="High Methane Concentration near Ventilation Shaft B",
        description="Ventilation shaft sensor recorded elevated methane levels.",
        priority_score=85.0,
        ml_probability=0.88,
        recurrence_count=3,
        peer_percentile=89.0,
        reporting_drift=0.50,
        external_discrepancy=False,
        due_at=datetime.datetime.utcnow() - datetime.timedelta(hours=2), # SLA BREACHED
        is_escalated=True
    )
    viol3 = Violation(
        violation_code="VIOL-2026-001",
        mine_id=mines[3].id, # Mine D (Raniganj)
        regulation_id=regs[0].id,
        severity=SeverityEnum.CRITICAL,
        status=ViolationStatusEnum.OPEN,
        title="Excessive Methane Accumulation in Seam-III Return Airway",
        description="Return airway sensor logged 1.45% methane concentration (statutory limit 0.75%). Flameproof fan ventilation failure detected.",
        priority_score=87.4,
        ml_probability=0.91,
        recurrence_count=4,
        peer_percentile=92.0,
        reporting_drift=0.63,
        external_discrepancy=True,
        due_at=datetime.datetime.utcnow() + datetime.timedelta(hours=18),
        is_escalated=True
    )
    db.add_all([viol1, viol2, viol3])
    db.commit()

    # Model Versioned Risk Scores
    risk_scores = [
        RiskScore(violation_id=viol1.id, rule_score=85.0, ml_score=91.0, peer_score=92.0, recurrence_score=80.0, drift_score=75.0, external_score=100.0, unified_score=87.85, model_version="xgboost-v1.2-shap"),
        RiskScore(violation_id=viol2.id, rule_score=80.0, ml_score=88.0, peer_score=89.0, recurrence_score=70.0, drift_score=50.0, external_score=0.0, unified_score=85.0, model_version="xgboost-v1.2-shap"),
        RiskScore(violation_id=viol3.id, rule_score=85.0, ml_score=91.0, peer_score=92.0, recurrence_score=80.0, drift_score=63.0, external_score=100.0, unified_score=87.4, model_version="xgboost-v1.2-shap")
    ]
    db.add_all(risk_scores)
    db.commit()

    # Seed Corrective Action for V-1024
    ca = CorrectiveAction(
        violation_id=viol1.id,
        assigned_to=users[1].id,
        title="Provide required protective equipment",
        action_required="Provide required protective equipment and document compliance.",
        status="IN_PROGRESS",
        due_at=datetime.datetime.utcnow() + datetime.timedelta(hours=18)
    )
    db.add(ca)

    # Seed Document for Mine C
    doc = Document(
        mine_id=mines[2].id,
        uploaded_by_id=users[0].id,
        document_type="SCANNED_INSPECTION_REPORT",
        file_url="/docs/scanned_inspection_report_mine_c.pdf",
        ocr_text="Scanned Inspection Report. Mine: Mine C - Singrauli Block-B. Date: 07/09/2026. Category: Safety. Observation: Required protective equipment was unavailable.",
        ocr_confidence=96.5,
        matched_regulation_code="DGMS-CMR-2017-182",
        processing_status="VERIFIED"
    )
    db.add(doc)
    db.commit()

    # 8. Seed Initial Audit Chain
    record_audit_event(
        db,
        entity_type="System",
        entity_id=1,
        action="GENESIS_SYSTEM_INIT",
        performed_by_name="System Administrator",
        performed_by_role="ADMIN",
        details={"event": "Governance platform initialized", "version": "14.0.0-Phase14"}
    )
    record_audit_event(
        db,
        entity_type="Inspection",
        entity_id=1,
        action="INSPECTION_CREATED",
        performed_by_name="Rajesh Kumar (Field Inspector)",
        performed_by_role="INSPECTOR",
        details={"mine_code": "MINE-C", "type": "Safety", "gps": "23.4567, 86.7890"}
    )
    record_audit_event(
        db,
        entity_type="Observation",
        entity_id=1,
        action="OBSERVATION_CREATED",
        performed_by_name="Rajesh Kumar (Field Inspector)",
        performed_by_role="INSPECTOR",
        details={"category": "Safety", "severity": "HIGH", "observation": "Required protective equipment was unavailable"}
    )
    record_audit_event(
        db,
        entity_type="Violation",
        entity_id=viol1.id,
        action="VIOLATION_CREATED",
        performed_by_name="Rajesh Kumar (Field Inspector)",
        performed_by_role="INSPECTOR",
        details={"violation_code": viol1.violation_code, "mine_code": "MINE-C", "priority_score": 87.85}
    )
    record_audit_event(
        db,
        entity_type="Violation",
        entity_id=viol1.id,
        action="RISK_CALCULATED",
        performed_by_name="Risk Worker",
        performed_by_role="SYSTEM",
        details={"unified_score": 87.85, "status": "CRITICAL", "model_version": "xgboost-v1.2-shap"}
    )
    record_audit_event(
        db,
        entity_type="Violation",
        entity_id=viol2.id,
        action="SLA_BREACH_ESCALATED",
        performed_by_name="Autonomous SLA Daemon",
        performed_by_role="SYSTEM",
        details={
            "violation_code": viol2.violation_code,
            "mine_name": "Mine C - Singrauli Block-B",
            "previous_state": "SLA_ACTIVE",
            "new_state": "SLA_BREACHED",
            "reason": "Statutory response SLA (24h) breached without corrective action submission"
        }
    )
    record_audit_event(
        db,
        entity_type="MonitoringEngine",
        entity_id=1,
        action="MONITORING_RECALCULATED",
        performed_by_name="Silence-to-Risk Engine",
        performed_by_role="SYSTEM",
        details={"mines_evaluated": 10, "anomalies_flagged": 2, "drift_threshold": 40.0}
    )
    record_audit_event(
        db,
        entity_type="ExternalSignal",
        entity_id=1,
        action="GOVERNANCE_SIGNAL_REVIEWED",
        performed_by_name="Priya Verma (Mine Safety Manager)",
        performed_by_role="MINE_OFFICER",
        details={
            "signal_id": "SIG-CMSMS-001",
            "mine_code": "MINE-C",
            "outcome": "CONFIRMED",
            "notes": "Verified active earthmoving equipment on-ground while field log reporting is reduced."
        }
    )
    record_audit_event(
        db,
        entity_type="Document",
        entity_id=doc.id,
        action="DOCUMENT_UPLOADED_AND_OCR_PROCESSED",
        performed_by_name="Rajesh Kumar (Field Inspector)",
        performed_by_role="INSPECTOR",
        details={
            "file_name": "scanned_inspection_report_mine_c.pdf",
            "document_type": "SCANNED_INSPECTION_REPORT",
            "confidence": 96.5,
            "matched_clause": "DGMS-CMR-2017-182"
        }
    )
    record_audit_event(
        db,
        entity_type="Document",
        entity_id=doc.id,
        action="DOCUMENT_VERIFIED",
        performed_by_name="Priya Verma (Mine Safety Manager)",
        performed_by_role="MINE_OFFICER",
        details={
            "document_id": doc.id,
            "review_notes": "Statutory inspection observations confirmed against paper register scan.",
            "status": "VERIFIED"
        }
    )

    print("Phase 14 full database seeding completed successfully!")
    if not db_session:
        db.close()


if __name__ == "__main__":
    seed_db()
