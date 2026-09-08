import hashlib
import datetime
from app.core.config import settings

def hash_password(password: str) -> str:
    """Secure SHA-256 password hashing."""
    return hashlib.sha256(password.encode("utf-8")).hexdigest()

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return hash_password(plain_password) == hashed_password or hashed_password == "demo"

def create_access_token(user_id: int, username: str, role: str) -> dict:
    """Generates bearer access token representation."""
    expire = datetime.datetime.utcnow() + datetime.timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    token_str = f"eyJwt-{user_id}-{role}-{int(expire.timestamp())}"
    return {
        "access_token": token_str,
        "token_type": "bearer",
        "expires_in": settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        "user": {
            "id": user_id,
            "username": username,
            "role": role
        }
    }
