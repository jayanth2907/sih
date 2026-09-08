import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.core.security import create_access_token

client = TestClient(app)

def test_anonymous_requests_rejected():
    """Verify all protected API endpoints strictly reject unauthenticated requests with 401."""
    # 1. Mines
    res_mines = client.get("/api/mines")
    assert res_mines.status_code == 401
    assert "Authentication required" in res_mines.json().get("detail", "")

    # 2. Violations
    res_viols = client.get("/api/violations")
    assert res_viols.status_code == 401

    # 3. Inspections
    res_insps = client.get("/api/v1/inspections")
    assert res_insps.status_code == 401

    # 4. Documents
    res_docs = client.get("/api/documents")
    assert res_docs.status_code == 401

    # 5. Analytics
    res_analytics = client.get("/api/analytics/overview")
    assert res_analytics.status_code == 401

def test_login_authentication():
    # Valid login via username or email
    res = client.post("/api/auth/login", json={"username": "mine_officer1", "password": "demo"})
    assert res.status_code == 200
    data = res.json()
    assert "access_token" in data
    assert data["user"]["role"] == "MINE_OFFICER"
    assert data["user"]["mine_id"] == 3

    # Invalid password
    res_bad = client.post("/api/auth/login", json={"username": "mine_officer1", "password": "wrongpassword"})
    assert res_bad.status_code == 401

    # Unknown user
    res_unknown = client.post("/api/auth/login", json={"username": "unknown_user_xyz", "password": "demo"})
    assert res_unknown.status_code == 401

def test_invalid_expired_token():
    # Garbage token
    res = client.get("/api/mines", headers={"Authorization": "Bearer invalid.garbage.token"})
    assert res.status_code == 401

def test_rbac_admin_scope():
    res_login = client.post("/api/auth/login", json={"username": "admin1", "password": "demo"})
    token = res_login.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    
    # Admin sees all enterprise mines
    res = client.get("/api/mines", headers=headers)
    assert res.status_code == 200
    mines = res.json()
    assert len(mines) >= 10

    # Admin sees enterprise analytics
    res_an = client.get("/api/analytics/overview", headers=headers)
    assert res_an.status_code == 200
    assert res_an.json()["total_monitored_mines"] >= 10

def test_rbac_corporate_secl_scope():
    res_login = client.post("/api/auth/login", json={"username": "corporate1", "password": "demo"})
    token = res_login.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    res = client.get("/api/mines", headers=headers)
    assert res.status_code == 200
    mines = res.json()
    assert len(mines) > 0
    for m in mines:
        assert m["subsidiary"] == "SECL"

def test_rbac_mine_officer_scope_and_isolation():
    res_login = client.post("/api/auth/login", json={"username": "mine_officer1", "password": "demo"})
    token = res_login.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    
    # Scoped mines list: only Mine C (id=3)
    res = client.get("/api/mines", headers=headers)
    assert res.status_code == 200
    mines = res.json()
    assert len(mines) == 1
    assert mines[0]["id"] == 3

    # Accessing authorized mine detail
    res_auth = client.get("/api/mines/3", headers=headers)
    assert res_auth.status_code == 200

    # Attempting to access unauthorized mine detail (e.g. mine_id 4)
    res_unauth = client.get("/api/mines/4", headers=headers)
    assert res_unauth.status_code == 403

def test_rbac_violations_isolation():
    res_login = client.post("/api/auth/login", json={"username": "mine_officer1", "password": "demo"})
    token = res_login.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    res = client.get("/api/violations", headers=headers)
    assert res.status_code == 200
    violations = res.json()
    for v in violations:
        assert v["mine_id"] == 3

def test_rbac_inspections_creation_and_isolation():
    res_login = client.post("/api/auth/login", json={"username": "inspector1", "password": "demo"})
    token = res_login.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    
    # Authorized inspection fetch
    res = client.get("/api/v1/inspections", headers=headers)
    assert res.status_code == 200

    # Attempting to create inspection for unauthorized mine (mine_id 4)
    unauth_payload = {
        "mine_id": 4,
        "gps_lat": 23.7,
        "gps_lng": 86.4,
        "notes": "Unauthorized attempt",
        "observations": []
    }
    res_create = client.post("/api/v1/inspections", json=unauth_payload, headers=headers)
    assert res_create.status_code == 403

def test_rbac_ai_assistant_isolation():
    res_login = client.post("/api/auth/login", json={"username": "mine_officer1", "password": "demo"})
    token = res_login.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    
    # Asking for unauthorized mine data (Mine D is mine_id 4)
    res = client.post("/api/v1/chat/query", json={"message": "Show me critical violations for Mine D (id: 4)", "language": "en"}, headers=headers)
    assert res.status_code == 200
    data = res.json()
    reply = data.get("response") or data.get("reply") or str(data)
    assert "Access Restricted" in reply or "restricted" in reply.lower() or "not authorized" in reply.lower()
