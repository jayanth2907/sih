from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import Optional, List
from app.database import get_db
from app.models import Mine, User
from app.schemas import MineResponse
from app.core.dependencies import get_current_user, get_authorized_mine_ids, verify_mine_access

router = APIRouter(prefix="/api/mines", tags=["Mines"])

@router.get("", response_model=List[MineResponse])
def list_mines(
    subsidiary: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    List mines scoped by authenticated user role & jurisdiction:
    - ADMIN: all 10 enterprise mines
    - CORPORATE: only mines in assigned subsidiary
    - MINE_OFFICER / INSPECTOR: only assigned mine
    """
    query = db.query(Mine)
    
    # Enforce user role/mine data scope
    allowed_mine_ids = get_authorized_mine_ids(current_user, db)
    if allowed_mine_ids is not None:
        query = query.filter(Mine.id.in_(allowed_mine_ids))
    elif subsidiary and subsidiary != "ALL":
        query = query.filter(Mine.subsidiary == subsidiary)
        
    return query.all()

@router.get("/{mine_id}", response_model=MineResponse)
def get_mine(
    mine_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get mine details with RBAC authorization check:
    Returns 403 Forbidden if user is not authorized for requested mine.
    """
    # Verify permission for requested mine
    verify_mine_access(mine_id, current_user, db)

    mine = db.query(Mine).filter(Mine.id == mine_id).first()
    if not mine:
        raise HTTPException(status_code=404, detail=f"Mine #{mine_id} not found")
    return mine
