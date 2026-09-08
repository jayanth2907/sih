from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import Optional
from app.database import get_db
from app.models import User
from app.schemas import ChatQueryRequest, ChatQueryResponse
from app.chat.tool_orchestrator import execute_chat_tool_orchestrator
from app.core.dependencies import get_optional_current_user

router = APIRouter(prefix="/api/v1/chat", tags=["Governance Assistant"])

@router.post("/query")
def query_governance_chat_endpoint(
    payload: ChatQueryRequest,
    current_user: Optional[User] = Depends(get_optional_current_user),
    db: Session = Depends(get_db)
):
    """
    Phase 9 Tool-Based Multilingual AI Governance Assistant:
    Natural language query -> Intent Detection -> RBAC Permission Check -> Tool Allow-List -> Evidence Citations
    """
    result = execute_chat_tool_orchestrator(
        message=payload.message,
        language=payload.language or "en",
        user_role=current_user.role if current_user else "ADMIN",
        user_mine_id=current_user.mine_id if current_user else None,
        db=db
    )
    return result

