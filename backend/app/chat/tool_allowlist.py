ALLOWED_TOOLS = [
    "get_mine_summary",
    "get_mine_risk",
    "get_critical_mines",
    "get_critical_violations",
    "get_open_violations",
    "get_sla_breaches",
    "get_pending_actions",
    "get_inspection_history",
    "get_governance_signals",
    "get_violation_details",
    "get_violation_evidence",
    "get_risk_explanation",
    "get_reporting_compliance",
    "get_peer_benchmark",
    "get_recurring_violations",
    "get_audit_history",
    "get_document_status",
    "compare_mines"
]

def validate_tool_request(tool_name: str, user_role: str = "ADMIN", target_mine_id: int = None, user_mine_id: int = None) -> bool:
    """
    Phase 13 AI Security Guardrail:
    Enforces tool allow-list & mine-level data scope check.
    Prevents prompt injection & unauthorized database access.
    """
    if tool_name not in ALLOWED_TOOLS:
        return False

    # Mine Officer role data isolation
    if user_role == "MINE_OFFICER" and user_mine_id and target_mine_id and target_mine_id != user_mine_id:
        return False

    return True

