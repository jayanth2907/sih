from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.schemas import ChatQueryRequest, ChatQueryResponse
from app.chat.tool_orchestrator import execute_chat_tool_orchestrator

router = APIRouter(prefix="/api/v1/chat", tags=["Governance Assistant"])

@router.post("/query")
def query_governance_chat_endpoint(payload: ChatQueryRequest, db: Session = Depends(get_db)):
    """
    Phase 9 Tool-Based Multilingual AI Governance Assistant:
    Natural language query -> Intent Detection -> Tool Allow-List -> Evidence Citations
    """
    result = execute_chat_tool_orchestrator(
        message=payload.message,
        language=payload.language or "en",
        db=db
    )
    return result
