def calculate_rule_severity_score(severity: str) -> float:
    s = (severity or "MEDIUM").upper()
    if s == "CRITICAL":
        return 60.0
    elif s == "HIGH":
        return 45.0
    elif s == "MEDIUM":
        return 25.0
    else:
        return 10.0

def calculate_rule_recurrence_score(recurrence_count: int) -> float:
    if recurrence_count >= 6:
        return 25.0
    elif recurrence_count >= 4:
        return 20.0
    elif recurrence_count >= 2:
        return 10.0
    else:
        return 0.0

def calculate_rule_inspection_gap_score(overdue_days: int) -> float:
    if overdue_days >= 15:
        return 15.0
    elif overdue_days >= 8:
        return 10.0
    elif overdue_days >= 3:
        return 5.0
    else:
        return 0.0

def calculate_rule_open_violations_score(open_count: int) -> float:
    if open_count >= 10:
        return 15.0
    elif open_count >= 6:
        return 10.0
    elif open_count >= 3:
        return 5.0
    else:
        return 0.0

def run_layer1_rule_engine(severity: str, recurrence_count: int, overdue_days: int, open_count: int) -> dict:
    """
    Layer 1 - Deterministic Rule Engine
    Combines Rule A (Severity), Rule B (Recurrence), Rule C (Inspection Gap), and Rule D (Open Violations).
    """
    s_score = calculate_rule_severity_score(severity)
    r_score = calculate_rule_recurrence_score(recurrence_count)
    g_score = calculate_rule_inspection_gap_score(overdue_days)
    o_score = calculate_rule_open_violations_score(open_count)

    total_rule_score = min(s_score + r_score + g_score + o_score, 100.0)

    return {
        "rule_score": round(total_rule_score, 1),
        "breakdown": {
            "severity_points": s_score,
            "recurrence_points": r_score,
            "inspection_gap_points": g_score,
            "open_violations_points": o_score
        }
    }
