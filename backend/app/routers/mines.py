from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import Mine
from app.schemas import MineResponse

router = APIRouter(prefix="/api/mines", tags=["Mines"])

@router.get("", response_model=list[MineResponse])
def list_mines(subsidiary: str = None, db: Session = Depends(get_db)):
    query = db.query(Mine)
    if subsidiary:
        query = query.filter(Mine.subsidiary == subsidiary)
    return query.all()

@router.get("/{mine_id}", response_model=MineResponse)
def get_mine(mine_id: int, db: Session = Depends(get_db)):
    mine = db.query(Mine).filter(Mine.id == mine_id).first()
    if not mine:
        raise HTTPException(status_code=404, detail="Mine not found")
    return mine
