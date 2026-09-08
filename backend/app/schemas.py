import datetime
from pydantic import BaseModel
from typing import List, Optional, Any

# --- Auth & User ---
class UserBase(BaseModel):
    username: str
    email: str
    name: str
    role: str
    mine_id: Optional[int] = None
    contractor_id: Optional[int] = None

class UserResponse(UserBase):
    id: int
    class Config:
        from_attributes = True

class LoginRequest(BaseModel):
    username: str
    role: Optional[str] = None

# --- Mine ---
class MineBase(BaseModel):
    mine_code: str
    name: str
    subsidiary: str
    district: str
    state: str
    lat: float
    lng: float
    risk_score: float
    status: str
    reporting_frequency_expected: int
    reporting_frequency_actual: int

class MineResponse(MineBase):
    id: int
    class Config:
        from_attributes = True

# --- Inspection & Observation ---
class ObservationCreate(BaseModel):
    regulation_id: int
    severity: str
    description: str
    evidence_url: Optional[str] = None
    is_violation: bool = False

class ObservationResponse(BaseModel):
    id: int
    regulation_id: int
    severity: str
    description: str
    evidence_url: Optional[str]
    is_violation: bool
    class Config:
        from_attributes = True

class InspectionCreate(BaseModel):
    mine_id: int
    gps_lat: float
    gps_lng: float
    notes: Optional[str] = None
    is_offline_sync: bool = False
    observations: List[ObservationCreate] = []

class InspectionResponse(BaseModel):
    id: int
    inspection_number: str
    mine_id: int
    inspector_id: int
    status: str
    gps_lat: float
    gps_lng: float
    notes: Optional[str]
    is_offline_sync: bool
    created_at: Any
    observations: List[ObservationResponse] = []
    class Config:
        from_attributes = True

# --- Violation & Corrective Action ---
class ViolationResponse(BaseModel):
    id: int
    violation_code: str
    mine_id: int
    regulation_id: int
    severity: str
    status: str
    title: str
    description: str
    priority_score: float
    ml_probability: float
    recurrence_count: int
    peer_percentile: float
    reporting_drift: float
    external_discrepancy: bool
    due_at: Any
    is_escalated: bool
    created_at: Any
    class Config:
        from_attributes = True

class CorrectiveActionUpdate(BaseModel):
    status: str
    completion_notes: Optional[str] = None
    evidence_url: Optional[str] = None

# --- Risk & SHAP Explainer Schemas ---
class CalculateRiskRequest(BaseModel):
    rule_score: float
    ml_score: float
    recurrence_count: int
    peer_percentile: float
    reporting_drift: float
    external_discrepancy: bool

class RiskExplanationResponse(BaseModel):
    priority_score: float
    primary_reasons: List[dict]
    recommended_action: str

# --- OCR & Document Schemas ---
class DocumentUploadResponse(BaseModel):
    id: int
    file_url: str
    document_type: str
    ocr_text: Optional[str]
    ocr_confidence: float
    matched_regulation_code: Optional[str]
    processing_status: str

# --- Chat Query Schemas ---
class ChatQueryRequest(BaseModel):
    message: str
    language: Optional[str] = "en"

class ChatQueryResponse(BaseModel):
    query: str
    intent: str
    language: str
    answer: str
    filters: dict

# --- Audit Event ---
class AuditEventResponse(BaseModel):
    id: int
    entity_type: str
    entity_id: int
    action: str
    performed_by_name: str
    performed_by_role: str
    timestamp: str
    details_json: str
    previous_hash: str
    hash: str
    class Config:
        from_attributes = True
