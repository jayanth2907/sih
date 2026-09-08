import math

def run_layer3_ml_classifier(features: dict) -> dict:
    """
    Layer 3 - Gradient Boosting / XGBoost-style Tabular ML Classifier
    Estimates high-risk probability P(Risk) over feature vector.
    """
    sev_val = features.get("severity_num", 3) # 1=LOW, 2=MED, 3=HIGH, 4=CRITICAL
    rec_cnt = features.get("recurrence_count", 0)
    gap_days = features.get("inspection_gap_days", 0)
    peer_pct = features.get("peer_percentile", 50.0)
    drift = features.get("reporting_drift", 0.0)
    ext_disc = 1.0 if features.get("external_discrepancy") else 0.0

    # Gradient Boosting logit log-odds simulation
    logit = (
        0.35 * sev_val +
        0.40 * rec_cnt +
        0.05 * gap_days +
        0.02 * peer_pct +
        1.50 * drift +
        1.20 * ext_disc -
        3.50
    )

    prob = 1.0 / (1.0 + math.exp(-logit))
    risk_prob = round(min(max(prob, 0.05), 0.99), 4)
    ml_score = round(risk_prob * 100.0, 1)

    return {
        "risk_probability": risk_prob,
        "ml_score": ml_score,
        "model_version": "xgboost-v1.2-shap",
        "class": "HIGH_RISK" if risk_prob >= 0.70 else "NORMAL_RISK"
    }
