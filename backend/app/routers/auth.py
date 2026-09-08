from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import User, RoleEnum
from app.schemas import UserResponse, LoginRequest

router = APIRouter(prefix="/api/auth", tags=["Auth"])

@router.get("/roles")
def get_available_roles():
    return [role.value for role in RoleEnum]

@router.get("/users", response_model=list[UserResponse])
def get_all_users(db: Session = Depends(get_db)):
    return db.query(User).all()

@router.post("/login", response_model=UserResponse)
def login_user(payload: LoginRequest, db: Session = Depends(get_db)):
    # Quick role-based switch / lookup for seamless demo testing
    if payload.role:
        user = db.query(User).filter(User.role == payload.role).first()
        if user:
            return user

    user = db.query(User).filter(User.username == payload.username).first()
    if not user:
        # Fallback default inspector
        user = db.query(User).first()

    return user
