from fastapi import Depends, HTTPException, Header, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from typing import Optional, List
from app.database import get_db
from app.models import User, Mine, RoleEnum
from app.core.security import decode_access_token

# Swagger / OpenAPI Bearer Security Scheme
security = HTTPBearer(auto_error=False)

ROLE_PERMISSIONS = {
    RoleEnum.ADMIN: [
        "*", "mine.view", "mine.manage", "violation.view", "violation.create",
        "violation.update", "violation.close", "violation.escalate", "inspection.view",
        "inspection.create", "inspection.sync", "monitoring.view", "document.view",
        "document.upload", "document.verify", "analytics.view", "analytics.export",
        "audit.view", "audit.verify", "ai.query"
    ],
    RoleEnum.REGULATOR: [
        "mine.view", "violation.view", "violation.escalate", "violation.close",
        "inspection.view", "monitoring.view", "document.view", "document.verify",
        "analytics.view", "analytics.export", "audit.view", "audit.verify", "ai.query"
    ],
    RoleEnum.CORPORATE: [
        "mine.view", "violation.view", "violation.update", "inspection.view",
        "monitoring.view", "document.view", "analytics.view", "analytics.export",
        "audit.view", "ai.query"
    ],
    RoleEnum.MINE_OFFICER: [
        "mine.view", "violation.view", "violation.update", "violation.close",
        "inspection.view", "monitoring.view", "document.view", "document.upload",
        "analytics.view", "audit.view", "ai.query"
    ],
    RoleEnum.INSPECTOR: [
        "mine.view", "violation.view", "violation.create", "inspection.view",
        "inspection.create", "inspection.sync", "monitoring.view", "document.view",
        "document.upload", "audit.view", "ai.query"
    ],
    RoleEnum.CONTRACTOR: [
        "violation.view", "violation.action", "inspection.view", "document.view"
    ]
}

def get_user_permissions(role: str) -> List[str]:
    return ROLE_PERMISSIONS.get(role, ["mine.view", "violation.view", "ai.query"])

def extract_token(credentials: Optional[HTTPAuthorizationCredentials], authorization: Optional[str]) -> Optional[str]:
    if credentials and credentials.credentials:
        return credentials.credentials.strip()
    if authorization:
        if authorization.startswith("Bearer "):
            return authorization[7:].strip()
        return authorization.strip()
    return None

def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db)
) -> User:
    """
    Validates the Bearer token from Swagger Authorize / Authorization header.
    Returns the authenticated User or raises 401 Unauthorized.
    """
    token = extract_token(credentials, authorization)
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required. Please sign in.",
            headers={"WWW-Authenticate": "Bearer"}
        )

    payload = decode_access_token(token)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Session has expired or token is invalid. Please sign in again.",
            headers={"WWW-Authenticate": "Bearer"}
        )

    user_id = payload.get("user_id")
    user = db.query(User).filter(User.id == user_id).first()
    if not user or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User account not found or deactivated.",
            headers={"WWW-Authenticate": "Bearer"}
        )

    return user

def get_optional_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db)
) -> Optional[User]:
    """
    Extracts the user if a valid token is provided; otherwise returns None.
    """
    token = extract_token(credentials, authorization)
    if not token:
        return None

    payload = decode_access_token(token)
    if not payload:
        return None

    user_id = payload.get("user_id")
    return db.query(User).filter(User.id == user_id).first()

def get_authorized_mine_ids(user: Optional[User], db: Session) -> Optional[List[int]]:
    """
    Returns None if user has enterprise access (all mines),
    or a list of specific authorized mine IDs based on role, mine_id, or subsidiary scope.
    """
    if not user:
        return None

    # ADMIN and REGULATOR have enterprise/national regulatory view
    if user.role in [RoleEnum.ADMIN, RoleEnum.REGULATOR]:
        return None

    # MINE_OFFICER and INSPECTOR are scoped to assigned mine_id
    if user.role in [RoleEnum.MINE_OFFICER, RoleEnum.INSPECTOR]:
        if user.mine_id:
            return [user.mine_id]
        return []

    # CORPORATE is scoped to their subsidiary
    if user.role == RoleEnum.CORPORATE:
        subsidiary = user.subsidiary or (user.mine.subsidiary if user.mine else None)
        if subsidiary and subsidiary != "ALL":
            mines = db.query(Mine.id).filter(Mine.subsidiary == subsidiary).all()
            return [m.id for m in mines]
        return None

    # CONTRACTOR
    if user.role == RoleEnum.CONTRACTOR and user.mine_id:
        return [user.mine_id]

    return None

def verify_mine_access(mine_id: int, user: Optional[User], db: Session) -> None:
    """
    Verifies that the target mine_id falls within the authenticated user's scope.
    Raises 403 Forbidden if access is restricted.
    """
    if not user:
        return

    allowed_ids = get_authorized_mine_ids(user, db)
    if allowed_ids is not None and mine_id not in allowed_ids:
        target_mine = db.query(Mine).filter(Mine.id == mine_id).first()
        target_name = target_mine.name if target_mine else f"Mine #{mine_id}"
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Access Restricted: You do not have permission to access {target_name} records. Your assigned scope is restricted."
        )

def verify_subsidiary_access(subsidiary: str, user: Optional[User], db: Session) -> None:
    """
    Verifies that the target subsidiary matches the user's corporate jurisdiction.
    Raises 403 Forbidden if not authorized.
    """
    if not user or user.role in [RoleEnum.ADMIN, RoleEnum.REGULATOR]:
        return

    user_sub = user.subsidiary or (user.mine.subsidiary if user.mine else None)
    if user.role == RoleEnum.CORPORATE and user_sub and subsidiary and subsidiary != "ALL" and user_sub != subsidiary:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Access Restricted: Your corporate jurisdiction is {user_sub}. You are not authorized to view {subsidiary} operations."
        )
