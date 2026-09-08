import math

# Default Configurable Weights
DEFAULT_WEIGHTS = {
    "rule_risk": 0.25,
    "ml_risk": 0.25,
    "recurrence": 0.15,
    "peer_deviation": 0.10,
    "reporting_drift": 0.15,
    "external_discrepancy": 0.10
}

def calculate_priority_score(
    rule_score: float,
    ml_score: float,
    recurrence_count: int,
    peer_percentile: float,
    reporting_drift: float,
    external_discrepancy: bool,
    weights: dict = None
) -> dict:
    """
    Computes a normalized 0-100 Priority Score using the configurable SIH 2026 formula:
    Priority = 0.25*Rule + 0.25*ML + 0.15*Recurrence + 0.10*Peer + 0.15*Drift + 0.10*External
    """
    w = weights or DEFAULT_WEIGHTS

    # Normalize recurrence (0 to 5+ count -> 0 to 100)
    recurrence_score = min(recurrence_count * 20.0, 100.0)

    # Normalize reporting drift (0.0 to 1.0 -> 0 to 100)
    drift_score = min(reporting_drift * 100.0, 100.0)

    # External discrepancy score (True -> 100, False -> 0)
    external_score = 100.0 if external_discrepancy else 0.0

    raw_unified = (
        (w["rule_risk"] * rule_score) +
        (w["ml_risk"] * ml_score) +
        (w["recurrence"] * recurrence_score) +
        (w["peer_deviation"] * peer_percentile) +
        (w["reporting_drift"] * drift_score) +
        (w["external_discrepancy"] * external_score)
    )

    unified_score = round(min(max(raw_unified, 0.0), 100.0), 1)

    if unified_score >= 81:
        risk_class = "CRITICAL"
    elif unified_score >= 61:
        risk_class = "HIGH"
    elif unified_score >= 31:
        risk_class = "MEDIUM"
    else:
        risk_class = "LOW"

    return {
        "unified_score": unified_score,
        "risk_class": risk_class,
        "components": {
            "rule_score": round(rule_score, 1),
            "ml_score": round(ml_score, 1),
            "recurrence_score": round(recurrence_score, 1),
            "peer_score": round(peer_percentile, 1),
            "drift_score": round(drift_score, 1),
            "external_score": round(external_score, 1)
        }
    }

def generate_shap_explanation(
    rule_score: float,
    ml_score: float,
    recurrence_count: int,
    peer_percentile: float,
    reporting_drift: float,
    external_discrepancy: bool,
    unified_score: float
) -> dict:
    """
    Transforms raw SHAP values into human-readable governance reasons for the "Why am I seeing this?" button.
    """
    reasons = []

    if recurrence_count >= 3:
        pts = round(recurrence_count * 5.0, 1)
        reasons.append({
            "factor": f"{recurrence_count} similar statutory violations logged in past 30 days",
            "impact": f"+{pts} pts",
            "severity": "HIGH"
        })

    if reporting_drift > 0.4:
        pct = int(reporting_drift * 100)
        reasons.append({
            "factor": f"Field reporting frequency decreased {pct}% compared to mine historical baseline",
            "impact": "+19 pts",
            "severity": "CRITICAL"
        })

    if peer_percentile >= 75:
        reasons.append({
            "factor": f"Mine risk profile is in the {int(peer_percentile)}th percentile compared to CIL peer mines",
            "impact": "+15 pts",
            "severity": "MEDIUM"
        })

    if external_discrepancy:
        reasons.append({
            "factor": "External satellite/CMSMS signal detected active mining despite reporting silence",
            "impact": "+12 pts",
            "severity": "CRITICAL"
        })

    if rule_score > 70:
        reasons.append({
            "factor": "Current observation classified as high severity statutory non-compliance",
            "impact": "+25 pts",
            "severity": "HIGH"
        })

    recommended_action = "Assign Safety Officer for urgent site verification within statutory SLA deadline."
    if unified_score >= 80:
        recommended_action = "CRITICAL ESCALATION: Dispatch DGMS Inspector & halt operations in affected seam within 24h."

    return {
        "priority_score": unified_score,
        "primary_reasons": reasons,
        "recommended_action": recommended_action
    }
