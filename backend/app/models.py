import datetime
import enum
from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Text, Boolean, UniqueConstraint
from sqlalchemy.orm import relationship
from app.database import Base

class RoleEnum(str, enum.Enum):
    INSPECTOR = "INSPECTOR"
    MINE_OFFICER = "MINE_OFFICER"
    CORPORATE = "CORPORATE"
    REGULATOR = "REGULATOR"
    CONTRACTOR = "CONTRACTOR"
    ADMIN = "ADMIN"

class SeverityEnum(str, enum.Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"

class ViolationStatusEnum(str, enum.Enum):
    OPEN = "OPEN"
    ASSIGNED = "ASSIGNED"
    IN_PROGRESS = "IN_PROGRESS"
    REMEDIATION_PENDING = "REMEDIATION_PENDING"
    ESCALATED = "ESCALATED"
    RESOLVED = "RESOLVED"
    CLOSED = "CLOSED"

# 1. ROLES TABLE
class Role(Base):
    __tablename__ = "roles"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(50), unique=True, nullable=False)
    description = Column(Text, nullable=True)

# 2. PERMISSIONS TABLE (Phase 11 Granular RBAC)
class Permission(Base):
    __tablename__ = "permissions"

    id = Column(Integer, primary_key=True, index=True)
    code = Column(String(100), unique=True, nullable=False) # e.g. violation.close, risk.calculate
    description = Column(Text, nullable=True)

# 3. ROLE PERMISSIONS TABLE
class RolePermission(Base):
    __tablename__ = "role_permissions"

    id = Column(Integer, primary_key=True, index=True)
    role_name = Column(String(50), nullable=False)
    permission_code = Column(String(100), nullable=False)

# 4. USERS TABLE
class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(150), nullable=False)
    username = Column(String(50), unique=True, index=True, nullable=False)
    email = Column(String(255), unique=True, index=True, nullable=False)
    phone = Column(String(20), nullable=True)
    password_hash = Column(String(200), nullable=False)
    role = Column(String(20), nullable=False, default=RoleEnum.INSPECTOR)
    mine_id = Column(Integer, ForeignKey("mines.id"), nullable=True)
    subsidiary = Column(String(100), nullable=True)
    contractor_id = Column(Integer, ForeignKey("contractors.id"), nullable=True)
    preferred_language = Column(String(10), default="en")
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)


    mine = relationship("Mine", back_populates="users")
    inspections = relationship("Inspection", back_populates="inspector")

# 5. MINES TABLE
class Mine(Base):
    __tablename__ = "mines"

    id = Column(Integer, primary_key=True, index=True)
    mine_code = Column(String(100), unique=True, index=True, nullable=False)
    name = Column(String(200), nullable=False)
    subsidiary = Column(String(100), nullable=False)
    mine_type = Column(String(100), default="OPEN_CAST")
    district = Column(String(150), nullable=False)
    state = Column(String(100), nullable=False)
    lat = Column(Float, nullable=False)
    lng = Column(Float, nullable=False)
    boundary_geojson = Column(Text, nullable=True)
    inspection_frequency_days = Column(Integer, default=7)
    reporting_frequency_expected = Column(Integer, default=10)
    reporting_frequency_actual = Column(Integer, default=10)
    risk_score = Column(Float, default=15.0)
    governance_response_score = Column(Float, default=94.0)
    status = Column(String(20), default="OPERATIONAL")
    active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    users = relationship("User", back_populates="mine")
    inspections = relationship("Inspection", back_populates="mine")
    violations = relationship("Violation", back_populates="mine")
    documents = relationship("Document", back_populates="mine")
    external_activities = relationship("ExternalActivity", back_populates="mine")

# 6. CONTRACTORS TABLE
class Contractor(Base):
    __tablename__ = "contractors"

    id = Column(Integer, primary_key=True, index=True)
    contractor_code = Column(String(100), unique=True, nullable=False)
    name = Column(String(250), nullable=False)
    mine_id = Column(Integer, ForeignKey("mines.id"), nullable=True)
    category = Column(String(100), default="EARTHMOVING_AND_HAULAGE")
    contact_email = Column(String(255), nullable=True)
    contact_phone = Column(String(20), nullable=True)
    compliance_score = Column(Float, default=88.5)
    active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

# 7. REGULATIONS TABLE
class Regulation(Base):
    __tablename__ = "regulations"

    id = Column(Integer, primary_key=True, index=True)
    code = Column(String(100), unique=True, index=True, nullable=False)
    title = Column(String(300), nullable=False)
    category = Column(String(100), nullable=False)
    description = Column(Text, nullable=True)
    severity = Column(String(30), default=SeverityEnum.MEDIUM)
    response_sla_hours = Column(Integer, default=48)
    version = Column(String(50), default="v2017")
    active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

# 8. INSPECTIONS TABLE
class Inspection(Base):
    __tablename__ = "inspections"

    id = Column(Integer, primary_key=True, index=True)
    inspection_number = Column(String(50), unique=True, index=True, nullable=False)
    mine_id = Column(Integer, ForeignKey("mines.id"), nullable=False)
    inspector_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    contractor_id = Column(Integer, ForeignKey("contractors.id"), nullable=True)
    inspection_type = Column(String(100), default="SAFETY_ROUTINE")
    status = Column(String(50), default="COMPLETED")
    inspection_time = Column(DateTime, default=datetime.datetime.utcnow)
    gps_lat = Column(Float, nullable=False)
    gps_lng = Column(Float, nullable=False)
    notes = Column(Text, nullable=True)
    source = Column(String(50), default="MOBILE")
    is_offline_sync = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    mine = relationship("Mine", back_populates="inspections")
    inspector = relationship("User", back_populates="inspections")
    observations = relationship("Observation", back_populates="inspection")

# 9. OBSERVATIONS TABLE
class Observation(Base):
    __tablename__ = "observations"

    id = Column(Integer, primary_key=True, index=True)
    inspection_id = Column(Integer, ForeignKey("inspections.id"), nullable=False)
    regulation_id = Column(Integer, ForeignKey("regulations.id"), nullable=True)
    description = Column(Text, nullable=False)
    severity = Column(String(30), default=SeverityEnum.LOW)
    evidence_url = Column(Text, nullable=True)
    is_violation = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    inspection = relationship("Inspection", back_populates="observations")
    regulation = relationship("Regulation")

# 10. VIOLATIONS TABLE
class Violation(Base):
    __tablename__ = "violations"

    id = Column(Integer, primary_key=True, index=True)
    violation_code = Column(String(50), unique=True, index=True, nullable=False)
    observation_id = Column(Integer, ForeignKey("observations.id"), nullable=True)
    mine_id = Column(Integer, ForeignKey("mines.id"), nullable=False)
    regulation_id = Column(Integer, ForeignKey("regulations.id"), nullable=False)
    responsible_user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    contractor_id = Column(Integer, ForeignKey("contractors.id"), nullable=True)
    severity = Column(String(30), nullable=False)
    status = Column(String(50), default=ViolationStatusEnum.OPEN)
    title = Column(String(200), nullable=False)
    description = Column(Text, nullable=False)
    priority_score = Column(Float, default=50.0)
    ml_probability = Column(Float, default=0.50)
    recurrence_count = Column(Integer, default=0)
    peer_percentile = Column(Float, default=50.0)
    reporting_drift = Column(Float, default=0.0)
    external_discrepancy = Column(Boolean, default=False)
    due_at = Column(DateTime, nullable=False)
    is_escalated = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    mine = relationship("Mine", back_populates="violations")
    regulation = relationship("Regulation")
    risk_scores = relationship("RiskScore", back_populates="violation")
    corrective_actions = relationship("CorrectiveAction", back_populates="violation")
    escalations = relationship("Escalation", back_populates="violation")

# 11. RISK SCORES TABLE
class RiskScore(Base):
    __tablename__ = "risk_scores"

    id = Column(Integer, primary_key=True, index=True)
    violation_id = Column(Integer, ForeignKey("violations.id"), nullable=False)
    rule_score = Column(Float, default=0.0)
    ml_score = Column(Float, default=0.0)
    peer_score = Column(Float, default=0.0)
    recurrence_score = Column(Float, default=0.0)
    drift_score = Column(Float, default=0.0)
    external_score = Column(Float, default=0.0)
    unified_score = Column(Float, default=0.0)
    model_version = Column(String(100), default="xgboost-v1.2-shap")
    calculated_at = Column(DateTime, default=datetime.datetime.utcnow)

    violation = relationship("Violation", back_populates="risk_scores")

# 12. CORRECTIVE ACTIONS TABLE
class CorrectiveAction(Base):
    __tablename__ = "corrective_actions"

    id = Column(Integer, primary_key=True, index=True)
    violation_id = Column(Integer, ForeignKey("violations.id"), nullable=False)
    assigned_to = Column(Integer, ForeignKey("users.id"), nullable=True)
    title = Column(String(200), default="Remediation Task")
    action_required = Column(Text, nullable=False)
    status = Column(String(50), default="PENDING")
    due_at = Column(DateTime, nullable=True)
    completed_at = Column(DateTime, nullable=True)
    completion_notes = Column(Text, nullable=True)
    evidence_url = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    violation = relationship("Violation", back_populates="corrective_actions")

# 13. ESCALATIONS TABLE
class Escalation(Base):
    __tablename__ = "escalations"

    id = Column(Integer, primary_key=True, index=True)
    violation_id = Column(Integer, ForeignKey("violations.id"), nullable=False)
    previous_state = Column(String(50), nullable=True)
    new_state = Column(String(50), nullable=False)
    triggered_by = Column(String(50), default="SYSTEM_SLA_TIMER")
    assigned_role = Column(String(100), nullable=False)
    reason = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    violation = relationship("Violation", back_populates="escalations")

# 14. AUDIT EVENTS TABLE (Append-Only Hash Chain)
class AuditEvent(Base):
    __tablename__ = "audit_events"

    id = Column(Integer, primary_key=True, index=True)
    entity_type = Column(String(100), nullable=False)
    entity_id = Column(Integer, nullable=False)
    action = Column(String(100), nullable=False)
    performed_by_name = Column(String(100), nullable=False)
    performed_by_role = Column(String(50), nullable=False)
    timestamp = Column(String(50), nullable=False)
    details_json = Column(Text, nullable=False)
    previous_hash = Column(String(64), nullable=False)
    hash = Column(String(64), nullable=False)

# 15. DOCUMENTS TABLE
class Document(Base):
    __tablename__ = "documents"

    id = Column(Integer, primary_key=True, index=True)
    mine_id = Column(Integer, ForeignKey("mines.id"), nullable=True)
    uploaded_by_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    document_type = Column(String(100), default="PAPER_REGISTER_SCAN")
    file_name = Column(String(200), default="paper_register_scan.pdf")
    file_url = Column(Text, nullable=False)
    file_hash = Column(String(64), nullable=True)
    file_size = Column(Integer, default=245760, nullable=True)
    page_count = Column(Integer, default=1)
    ocr_text = Column(Text, nullable=True)
    ocr_confidence = Column(Float, default=0.0)
    extraction_confidence = Column(Float, default=0.0, nullable=True)
    matched_regulation_code = Column(String(100), nullable=True)
    extracted_fields_json = Column(Text, nullable=True)
    bounding_boxes_json = Column(Text, nullable=True)
    compliance_insight = Column(Text, nullable=True)
    processing_status = Column(String(50), default="PENDING")
    verification_status = Column(String(50), default="PENDING_REVIEW", nullable=True)
    uploaded_by_name = Column(String(100), nullable=True)
    uploaded_by_role = Column(String(50), nullable=True)
    verified_by = Column(String(100), nullable=True)
    verified_by_name = Column(String(100), nullable=True)
    verified_by_role = Column(String(50), nullable=True)
    verified_at = Column(DateTime, nullable=True)
    review_notes = Column(Text, nullable=True)
    linked_violation_id = Column(Integer, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    mine = relationship("Mine", back_populates="documents")


# 16. EXTERNAL ACTIVITY TABLE
class ExternalActivity(Base):
    __tablename__ = "external_activity"
    __table_args__ = (UniqueConstraint('source', 'external_event_id', name='uq_source_external_event_id'),)

    id = Column(Integer, primary_key=True, index=True)
    external_event_id = Column(String(100), nullable=True)
    mine_id = Column(Integer, ForeignKey("mines.id"), nullable=False)
    source = Column(String(100), default="CMSMS_SATELLITE")
    activity_detected = Column(Boolean, default=True)
    activity_date = Column(DateTime, default=datetime.datetime.utcnow)
    confidence = Column(Float, default=85.0)
    raw_reference = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    mine = relationship("Mine", back_populates="external_activities")

# 17. INTEGRATION SOURCES TABLE (Phase 10 Registry)
class IntegrationSource(Base):
    __tablename__ = "integration_sources"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False) # CMSMS / Khanan Prahari, CIL ICIS, PARIVESH
    system_code = Column(String(50), unique=True, nullable=False)
    type = Column(String(50), default="EXTERNAL_ACTIVITY")
    status = Column(String(50), default="ADAPTER_READY") # AVAILABLE, ADAPTER_READY, SIMULATED
    sync_frequency_minutes = Column(Integer, default=15)
    last_sync_at = Column(DateTime, default=datetime.datetime.utcnow)
    enabled = Column(Boolean, default=True)

# 18. INTEGRATION SYNC LOGS TABLE (Phase 10 Sync Audit)
class IntegrationSyncLog(Base):
    __tablename__ = "integration_sync_logs"

    id = Column(Integer, primary_key=True, index=True)
    integration_code = Column(String(50), nullable=False)
    records_received = Column(Integer, default=0)
    records_processed = Column(Integer, default=0)
    records_failed = Column(Integer, default=0)
    status = Column(String(50), default="SUCCESS")
    error_message = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

# 19. HISTORICAL RISK OBSERVATIONS TABLE (Multi-Period Analytics)
class HistoricalRiskObservation(Base):
    __tablename__ = "historical_risk_observations"

    id = Column(Integer, primary_key=True, index=True)
    mine_id = Column(Integer, ForeignKey("mines.id"), nullable=False)
    timestamp = Column(DateTime, nullable=False, index=True)
    risk_score = Column(Float, nullable=False)
    governance_response_score = Column(Float, default=85.0)
    open_violations = Column(Integer, default=0)
    sla_breaches = Column(Integer, default=0)
    reporting_compliance = Column(Float, default=100.0)

