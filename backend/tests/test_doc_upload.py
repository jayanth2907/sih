import os
import json
import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.database import Base, get_db
from app.database import Base, get_db
from app.models import User, Mine, Document, AuditEvent
from app.core.security import create_access_token
from app.routers.documents import router as doc_router

from sqlalchemy.pool import StaticPool

def test_full_document_upload_ocr_workflow():
    # In-memory SQLite for testing with StaticPool
    engine = create_engine(
        'sqlite:///:memory:',
        connect_args={'check_same_thread': False},
        poolclass=StaticPool
    )
    TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    Base.metadata.create_all(bind=engine)

    def override_get_db():
        try:
            db = TestingSessionLocal()
            yield db
        finally:
            db.close()

    test_app = FastAPI()
    test_app.dependency_overrides[get_db] = override_get_db
    test_app.include_router(doc_router)

    client = TestClient(test_app)

    # Seed test data
    db = TestingSessionLocal()
    mine = Mine(
        id=3,
        mine_code='MINE-C',
        name='Mine C - Singrauli Block-B',
        subsidiary='NCL',
        mine_type='OPEN_CAST',
        district='Singrauli',
        state='Madhya Pradesh',
        lat=24.2012,
        lng=82.6644,
        risk_score=45.0,
        governance_response_score=88.0
    )
    user = User(
        id=1,
        name='Priya Verma',
        username='priya.verma',
        email='priya.verma@khandrishti.gov.in',
        role='MINE_OFFICER',
        mine_id=3,
        password_hash='hashed'
    )
    db.add(mine)
    db.add(user)
    db.commit()

    token = create_access_token(user_id=1, username='priya.verma', role='MINE_SAFETY_MANAGER', mine_id=3)
    headers = {'Authorization': f'Bearer {token}'}

    # Upload Demo PDF
    pdf_path = 'backend/uploads/DOC_20260908_170442_KhanDrishti_Demo_Mine_Safety_Inspection_Report.pdf'
    with open(pdf_path, 'rb') as f:
        pdf_bytes = f.read()

    resp = client.post(
        '/api/documents/upload',
        headers=headers,
        data={'mine_id': 3, 'document_type': 'PAPER_REGISTER_SCAN'},
        files={'file': ('KhanDrishti_Demo_Mine_Safety_Inspection_Report(1).pdf', pdf_bytes, 'application/pdf')}
    )

    assert resp.status_code == 200, f'Upload failed: {resp.text}'
    data = resp.json()
    
    # Assert Document Schema & Extracted Properties
    assert data['id'] is not None
    assert data['file_name'] == 'KhanDrishti_Demo_Mine_Safety_Inspection_Report(1).pdf'
    assert data['file_size'] > 0
    assert data['mine_code'] == 'MINE-C'
    assert 'Singrauli' in data['mine_name']
    assert data['processing_status'] in ['EXTRACTION_COMPLETED', 'REVIEW_REQUIRED']
    assert data['ocr_confidence'] >= 90.0
    assert data['extraction_confidence'] >= 90.0
    assert data['requires_human_verification'] is True

    # Assert Extracted Governance Fields
    field_dict = {f['field']: f['value'] for f in data['extracted_fields']}
    assert field_dict.get('mine_code') == 'MINE-C'
    assert 'Singrauli' in field_dict.get('mine_name', '')
    assert '08 September 2026' in field_dict.get('inspection_date', '')
    assert 'INSP-DEMO-2026-009' in field_dict.get('register_ref', '')
    assert 'R. Kumar' in field_dict.get('inspector_name', '')
    assert '1.45%' in field_dict.get('measured_value', '') or '1.45' in field_dict.get('measured_value', '')
    assert 'methane' in field_dict.get('observation', '').lower()
    assert 'protective equipment' in field_dict.get('observation', '').lower() or 'ppe' in field_dict.get('observation', '').lower()
    assert 'incomplete' in field_dict.get('observation', '').lower() or 'records' in field_dict.get('observation', '').lower()

    # Step: Human Verification
    doc_id = data['id']
    vresp = client.post(
        f'/api/documents/{doc_id}/verify',
        headers=headers,
        json={
            'verified_by_name': 'Priya Verma (Mine Safety Manager)',
            'review_notes': 'Verified test against statutory log.',
            'extracted_fields': data['extracted_fields']
        }
    )
    assert vresp.status_code == 200, f'Verification failed: {vresp.text}'
    vdata = vresp.json()
    assert vdata['audit_event_id'] is not None
    assert len(vdata['audit_hash']) == 64  # SHA-256 hex length

    # Step: Governance Record Creation
    gresp = client.post(
        f'/api/documents/{doc_id}/governance-record',
        headers=headers,
        json={
            'action_type': 'CREATE_VIOLATION',
            'created_by_name': 'Priya Verma (Mine Safety Manager)',
            'corrective_action': 'Review ventilation condition and methane reading immediately.'
        }
    )
    assert gresp.status_code == 200, f'Governance record failed: {gresp.text}'
    gdata = gresp.json()
    assert gdata.get('violation') is not None
    assert gdata.get('audit_event_id') is not None
    assert len(gdata.get('audit_hash', '')) == 64

if __name__ == '__main__':
    test_full_document_upload_ocr_workflow()
    print('All document upload & OCR tests passed!')
