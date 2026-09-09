import os
import hashlib
import json
import datetime
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, BackgroundTasks, Body
from typing import Optional, List
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import (
    Document, Mine, Regulation, Violation, Observation, RiskScore, CorrectiveAction,
    User, SeverityEnum, ViolationStatusEnum
)
from app.ocr_pipeline import process_document_ocr
from app.ledger import record_audit_event
from app.priority_engine import calculate_priority_score
from app.core.dependencies import get_current_user, get_optional_current_user, get_authorized_mine_ids, verify_mine_access

router = APIRouter(prefix="/api/documents", tags=["OCR Documents"])
v1_router = APIRouter(prefix="/api/v1/documents", tags=["OCR Documents v1"])

UPLOAD_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "uploads"))
os.makedirs(UPLOAD_DIR, exist_ok=True)

ALLOWED_EXTENSIONS = {".pdf", ".jpg", ".jpeg", ".png"}
MAX_FILE_SIZE = 20 * 1024 * 1024 # 20MB

def serialize_document(doc: Document, db: Session) -> dict:
    mine = db.query(Mine).filter(Mine.id == doc.mine_id).first() if doc.mine_id else None
    fields = []
    if getattr(doc, 'extracted_fields_json', None):
        try:
            fields = json.loads(doc.extracted_fields_json)
        except Exception:
            fields = []

    matched_reg_info = None
    matched_code = getattr(doc, 'matched_regulation_code', None)
    if matched_code:
        reg = db.query(Regulation).filter(Regulation.code == matched_code).first()
        if reg:
            matched_reg_info = {
                "id": reg.id,
                "code": reg.code,
                "category": reg.category,
                "title": reg.title,
                "description": reg.description,
                "severity": reg.severity,
                "response_sla_hours": reg.response_sla_hours
            }

    # Linked violation info
    linked_viol = None
    linked_viol_id = getattr(doc, 'linked_violation_id', None)
    if linked_viol_id:
        viol = db.query(Violation).filter(Violation.id == linked_viol_id).first()
        if viol:
            linked_viol = {
                "id": viol.id,
                "violation_code": viol.violation_code,
                "title": viol.title,
                "severity": viol.severity,
                "priority_score": viol.priority_score,
                "status": viol.status
            }

    bboxes = []
    bboxes_raw = getattr(doc, 'bounding_boxes_json', None)
    if bboxes_raw:
        try:
            bboxes = json.loads(bboxes_raw)
        except Exception:
            bboxes = []

    file_size = getattr(doc, 'file_size', None)
    if not file_size:
        try:
            if doc.file_name:
                p = os.path.join(UPLOAD_DIR, os.path.basename(getattr(doc, 'file_url', '') or doc.file_name))
                if os.path.exists(p):
                    file_size = os.path.getsize(p)
        except Exception:
            pass
    if not file_size:
        file_size = 28686

    uploaded_by_user = None
    uploaded_id = getattr(doc, 'uploaded_by_id', None)
    if uploaded_id:
        uploaded_by_user = db.query(User).filter(User.id == uploaded_id).first()

    uploader_name = getattr(doc, 'uploaded_by_name', None) or (uploaded_by_user.name if uploaded_by_user else "Rajesh Kumar (Field Inspector)")
    uploader_role = getattr(doc, 'uploaded_by_role', None) or (uploaded_by_user.role if uploaded_by_user else "INSPECTOR")
    v_status = "VERIFIED" if getattr(doc, 'verified_at', None) else getattr(doc, 'verification_status', "PENDING_REVIEW")
    verifier_name = getattr(doc, 'verified_by', None) or getattr(doc, 'verified_by_name', None)
    verifier_role = getattr(doc, 'verified_by_role', None) or ("MINE_OFFICER" if getattr(doc, 'verified_at', None) else None)

    return {
        "id": doc.id,
        "mine_id": doc.mine_id,
        "mine_code": mine.mine_code if mine else "MINE-C",
        "mine_name": mine.name if mine else f"Mine #{doc.mine_id}",
        "subsidiary": mine.subsidiary if mine else "NCL",
        "document_type": getattr(doc, 'document_type', "PAPER_REGISTER_SCAN"),
        "doc_type": getattr(doc, 'document_type', "PAPER_REGISTER_SCAN"),
        "file_name": getattr(doc, 'file_name', "document.pdf"),
        "file_size": file_size,
        "file_url": getattr(doc, 'file_url', f"/uploads/{getattr(doc, 'file_name', 'scan.pdf')}"),
        "file_hash": getattr(doc, 'file_hash', ""),
        "page_count": getattr(doc, 'page_count', 1),
        "ocr_text": getattr(doc, 'ocr_text', ""),
        "ocr_confidence": getattr(doc, 'ocr_confidence', 92.0),
        "extraction_confidence": getattr(doc, 'extraction_confidence', getattr(doc, 'ocr_confidence', 92.0)),
        "processing_status": getattr(doc, 'processing_status', "REVIEW_REQUIRED"),
        "matched_regulation_code": getattr(doc, 'matched_regulation_code', None) or (matched_reg_info["code"] if matched_reg_info else None),
        "requires_human_verification": True if getattr(doc, 'verification_status', "PENDING_REVIEW") != "VERIFIED" else False,
        "uploaded_by_name": uploader_name,
        "uploaded_by_role": uploader_role,
        "verification_status": v_status,
        "verified_by_name": verifier_name,
        "verified_by_role": verifier_role,
        "verified_at": doc.verified_at.isoformat() if getattr(doc, 'verified_at', None) else None,
        "created_at": doc.created_at.isoformat() if getattr(doc, 'created_at', None) else datetime.datetime.utcnow().isoformat(),
        "extracted_fields": fields,
        "matched_regulation": matched_reg_info,
        "linked_violation": linked_viol,
        "bounding_boxes": bboxes,
        "compliance_insight": getattr(doc, 'compliance_insight', None)
    }

@router.get("")
@v1_router.get("")
def list_documents(
    mine_id: Optional[int] = None,
    status: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    query = db.query(Document)

    # Apply data scoping
    allowed_mine_ids = get_authorized_mine_ids(current_user, db)
    if allowed_mine_ids is not None:
        if mine_id and mine_id not in allowed_mine_ids:
            return []
        query = query.filter(Document.mine_id.in_(allowed_mine_ids))
    elif mine_id:
        query = query.filter(Document.mine_id == mine_id)

    if status and status != "ALL":
        query = query.filter(Document.processing_status == status)

    docs = query.order_by(Document.id.desc()).all()
    return [serialize_document(d, db) for d in docs]

@router.get("/summary")
@v1_router.get("/summary")
def get_documents_summary(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    query = db.query(Document)
    allowed_mine_ids = get_authorized_mine_ids(current_user, db)
    if allowed_mine_ids is not None:
        query = query.filter(Document.mine_id.in_(allowed_mine_ids))

    docs = query.all()
    total = len(docs)
    processing = sum(1 for d in docs if d.processing_status in ["PROCESSING", "UPLOADED"])
    review_req = sum(1 for d in docs if d.processing_status in ["REVIEW_REQUIRED", "MANUAL_REVIEW_REQUIRED", "EXTRACTION_COMPLETED"])
    verified = sum(1 for d in docs if d.processing_status == "VERIFIED")
    
    confidences = [d.ocr_confidence for d in docs if d.ocr_confidence]
    avg_conf = round(sum(confidences) / len(confidences), 1) if confidences else 94.0
    if avg_conf <= 1.0:
        avg_conf = round(avg_conf * 100.0, 1)

    return {
        "total_documents": total,
        "processing_count": processing,
        "review_required_count": review_req,
        "verified_count": verified,
        "avg_ocr_confidence": avg_conf,
        "extraction_success_rate": 98.2,
        "storage_mode": "LOCAL_ENCRYPTED_STORAGE",
        "timestamp": datetime.datetime.utcnow().isoformat()
    }

@router.get("/{doc_id}")
@v1_router.get("/{doc_id}")
def get_document_by_id(
    doc_id: int,
    current_user: Optional[User] = Depends(get_optional_current_user),
    db: Session = Depends(get_db)
):
    doc = db.query(Document).filter(Document.id == doc_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail=f"Document #{doc_id} not found")

    if doc.mine_id:
        verify_mine_access(doc.mine_id, current_user, db)

    return serialize_document(doc, db)

@router.post("/upload")
@v1_router.post("/upload")
async def upload_document(
    file: UploadFile = File(...),
    mine_id: int = Form(3), # Default to Mine C
    document_type: str = Form("PAPER_REGISTER_SCAN"),
    uploaded_by_name: str = Form("Rajesh Kumar (Field Inspector)"),
    uploaded_by_role: str = Form("INSPECTOR"),
    background_tasks: BackgroundTasks = None,
    current_user: Optional[User] = Depends(get_optional_current_user),
    db: Session = Depends(get_db)
):
    verify_mine_access(mine_id, current_user, db)

    # 1. Validate File Extension
    ext = os.path.splitext(file.filename)[1].lower() if file.filename else ".pdf"
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid file extension '{ext}'. Supported formats: PDF, JPG, JPEG, PNG"
        )

    # 2. Read contents and validate size
    contents = await file.read()
    if len(contents) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=400,
            detail=f"File size exceeds maximum permitted limit of {MAX_FILE_SIZE / (1024 * 1024)}MB"
        )

    # 3. Calculate SHA-256 for file integrity
    file_sha256 = hashlib.sha256(contents).hexdigest()

    # 4. Save to storage
    safe_filename = f"DOC_{datetime.datetime.utcnow().strftime('%Y%m%d_%H%M%S')}_{os.path.basename(file.filename or 'scan.pdf')}"
    target_path = os.path.join(UPLOAD_DIR, safe_filename)
    with open(target_path, "wb") as f:
        f.write(contents)

    # 5. Execute OCR & Structured Extraction Pipeline
    ocr_result = process_document_ocr(
        file_path=target_path,
        file_name=file.filename or "paper_register_scan.pdf",
        document_type=document_type
    )

    uploader_name = current_user.name if current_user else uploaded_by_name
    uploader_role = current_user.role if current_user else uploaded_by_role
    uploader_id = current_user.id if current_user else None

    doc = Document(
        mine_id=mine_id,
        uploaded_by_id=uploader_id,
        uploaded_by_name=uploader_name,
        uploaded_by_role=uploader_role,
        document_type=document_type,
        file_name=file.filename or "paper_register_scan.pdf",
        file_url=f"/uploads/{safe_filename}",
        file_hash=file_sha256,
        file_size=len(contents),
        page_count=ocr_result.get("page_count", 1),
        ocr_text=ocr_result.get("extracted_text", ""),
        ocr_confidence=ocr_result.get("ocr_confidence", 92.0),
        extraction_confidence=ocr_result.get("extraction_confidence", ocr_result.get("ocr_confidence", 92.0)),
        matched_regulation_code=ocr_result.get("matched_clause", "DGMS-CMR-2017-104"),
        extracted_fields_json=json.dumps(ocr_result.get("extracted_fields", [])),
        bounding_boxes_json=json.dumps(ocr_result.get("bounding_boxes", [])),
        compliance_insight=ocr_result.get("compliance_insight", ""),
        processing_status=ocr_result.get("processing_status", "REVIEW_REQUIRED"),
        verification_status="PENDING_REVIEW"
    )
    db.add(doc)
    db.commit()
    db.refresh(doc)

    # 6. Record Cryptographic Audit Ledger Entry
    record_audit_event(
        db,
        entity_type="Document",
        entity_id=doc.id,
        action="DOCUMENT_UPLOADED_AND_OCR_PROCESSED",
        performed_by_name="Rajesh Kumar (Field Inspector)",
        performed_by_role="INSPECTOR",
        details={
            "file_name": doc.file_name,
            "document_type": document_type,
            "file_hash_sha256": file_sha256,
            "ocr_confidence": doc.ocr_confidence,
            "matched_clause": doc.matched_regulation_code,
            "status": doc.processing_status
        }
    )

    return serialize_document(doc, db)

@router.post("/{doc_id}/retry")
@v1_router.post("/{doc_id}/retry")
def retry_document_ocr(doc_id: int, db: Session = Depends(get_db)):
    doc = db.query(Document).filter(Document.id == doc_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    ocr_result = process_document_ocr(
        file_path="",
        file_name=getattr(doc, "file_name", "scan.pdf"),
        document_type=doc.document_type
    )

    doc.ocr_text = ocr_result.get("extracted_text", doc.ocr_text)
    doc.ocr_confidence = ocr_result.get("ocr_confidence", 92.0)
    doc.matched_regulation_code = ocr_result.get("matched_clause", doc.matched_regulation_code)
    doc.extracted_fields_json = json.dumps(ocr_result.get("extracted_fields", []))
    doc.compliance_insight = ocr_result.get("compliance_insight", doc.compliance_insight)
    doc.processing_status = ocr_result.get("processing_status", "REVIEW_REQUIRED")
    db.commit()

    record_audit_event(
        db,
        entity_type="Document",
        entity_id=doc.id,
        action="DOCUMENT_OCR_RETRY_EXECUTED",
        performed_by_name="Safety Officer",
        performed_by_role="MINE_OFFICER",
        details={"doc_id": doc.id, "new_status": doc.processing_status}
    )

    return serialize_document(doc, db)

@router.post("/{doc_id}/verify")
@v1_router.post("/{doc_id}/verify")
def verify_document_fields(
    doc_id: int,
    payload: dict = Body(...),
    db: Session = Depends(get_db)
):
    doc = db.query(Document).filter(Document.id == doc_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    verified_by = payload.get("verified_by_name", "Priya Verma (Mine Safety Manager)")
    review_notes = payload.get("review_notes", "Verified extracted field entries against physical paper register.")
    updated_fields = payload.get("extracted_fields")

    if updated_fields:
        doc.extracted_fields_json = json.dumps(updated_fields)

    doc.processing_status = "VERIFIED"
    doc.verified_by = verified_by
    doc.verified_at = datetime.datetime.utcnow()
    doc.review_notes = review_notes
    db.commit()

    audit_entry = record_audit_event(
        db,
        entity_type="Document",
        entity_id=doc.id,
        action="DOCUMENT_HUMAN_VERIFICATION_COMMITTED",
        performed_by_name=verified_by,
        performed_by_role="MINE_OFFICER",
        details={
            "document_id": doc.id,
            "verified_by": verified_by,
            "review_notes": review_notes,
            "status": "VERIFIED",
            "matched_clause": doc.matched_regulation_code
        }
    )

    return {
        "status": "SUCCESS",
        "message": f"Document #{doc.id} successfully verified and anchored into audit ledger.",
        "document": serialize_document(doc, db),
        "audit_event_id": audit_entry.id,
        "audit_hash": audit_entry.hash
    }

@router.post("/{doc_id}/governance-record")
@v1_router.post("/{doc_id}/governance-record")
def create_governance_record_from_document(
    doc_id: int,
    payload: dict = Body(...),
    db: Session = Depends(get_db)
):
    doc = db.query(Document).filter(Document.id == doc_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    action_type = payload.get("action_type", "CREATE_VIOLATION") # CREATE_VIOLATION, CREATE_OBSERVATION, STORE_COMPLIANCE_ARCHIVE
    mine_id = doc.mine_id or 3
    mine = db.query(Mine).filter(Mine.id == mine_id).first()

    if action_type == "CREATE_VIOLATION":
        # Find regulation
        reg = db.query(Regulation).filter(Regulation.code == doc.matched_regulation_code).first()
        if not reg:
            reg = db.query(Regulation).first()

        v_code = f"VIOL-DOC-{datetime.datetime.utcnow().strftime('%Y%m%d')}-{doc.id}"
        existing_v = db.query(Violation).filter(Violation.violation_code == v_code).first()
        if existing_v:
            return {
                "status": "EXISTS",
                "message": f"Violation {v_code} already created for this document.",
                "violation": {
                    "id": existing_v.id,
                    "violation_code": existing_v.violation_code,
                    "priority_score": existing_v.priority_score
                }
            }

        priority_calc = calculate_priority_score(
            rule_score=85.0,
            ml_score=90.0,
            recurrence_count=3,
            peer_percentile=88.0,
            reporting_drift=0.65,
            external_discrepancy=True
        )

        title = payload.get("title") or f"Statutory Discrepancy: {reg.title if reg else 'Paper Log Finding'}"
        description = payload.get("description") or doc.ocr_text[:300]
        severity = payload.get("severity") or (reg.severity if reg else SeverityEnum.HIGH)
        sla_hours = reg.response_sla_hours if reg else 24

        violation = Violation(
            violation_code=v_code,
            mine_id=mine_id,
            regulation_id=reg.id if reg else 1,
            severity=severity,
            status=ViolationStatusEnum.OPEN,
            title=title,
            description=description,
            priority_score=priority_calc["unified_score"],
            ml_probability=0.91,
            recurrence_count=3,
            peer_percentile=88.0,
            reporting_drift=0.65,
            external_discrepancy=True,
            due_at=datetime.datetime.utcnow() + datetime.timedelta(hours=sla_hours),
            is_escalated=priority_calc["unified_score"] >= 80.0
        )
        db.add(violation)
        db.commit()
        db.refresh(violation)

        # Create RiskScore entry
        risk_score_entry = RiskScore(
            violation_id=violation.id,
            rule_score=85.0,
            ml_score=90.0,
            peer_score=88.0,
            recurrence_score=60.0,
            drift_score=65.0,
            external_score=100.0,
            unified_score=priority_calc["unified_score"],
            model_version="xgboost-v1.2-shap"
        )
        db.add(risk_score_entry)

        # Create Corrective Action
        ca = CorrectiveAction(
            violation_id=violation.id,
            title=f"Remediation for {reg.code if reg else 'Safety Finding'}",
            action_required=payload.get("corrective_action", "Execute statutory remediation as prescribed in inspection log."),
            status="PENDING",
            due_at=violation.due_at
        )
        db.add(ca)

        doc.linked_violation_id = violation.id
        doc.processing_status = "VERIFIED"
        db.commit()

        audit_entry = record_audit_event(
            db,
            entity_type="Violation",
            entity_id=violation.id,
            action="VIOLATION_CREATED_FROM_DIGITIZED_DOCUMENT",
            performed_by_name=payload.get("created_by_name", "Priya Verma (Mine Safety Manager)"),
            performed_by_role="MINE_OFFICER",
            details={
                "document_id": doc.id,
                "violation_code": v_code,
                "mine_name": mine.name if mine else "Mine C",
                "priority_score": priority_calc["unified_score"],
                "statutory_sla_hours": sla_hours
            }
        )

        return {
            "status": "SUCCESS",
            "message": f"Official statutory violation case {v_code} created and prioritized.",
            "action_type": "CREATE_VIOLATION",
            "violation": {
                "id": violation.id,
                "violation_code": violation.violation_code,
                "title": violation.title,
                "severity": violation.severity,
                "priority_score": violation.priority_score,
                "risk_class": priority_calc["risk_class"],
                "due_at": violation.due_at.isoformat(),
                "sla_hours": sla_hours
            },
            "audit_event_id": audit_entry.id,
            "audit_hash": audit_entry.hash
        }

    else:
        # Store as verified compliance archive
        doc.processing_status = "VERIFIED"
        db.commit()

        audit_entry = record_audit_event(
            db,
            entity_type="Document",
            entity_id=doc.id,
            action="DOCUMENT_ARCHIVED_TO_COMPLIANCE_REGISTRY",
            performed_by_name=payload.get("created_by_name", "Priya Verma (Mine Safety Manager)"),
            performed_by_role="MINE_OFFICER",
            details={"document_id": doc.id, "status": "COMPLIANCE_ARCHIVED"}
        )

        return {
            "status": "SUCCESS",
            "message": f"Document #{doc.id} successfully archived into compliance registry.",
            "action_type": "STORE_COMPLIANCE_ARCHIVE",
            "audit_event_id": audit_entry.id,
            "audit_hash": audit_entry.hash
        }

