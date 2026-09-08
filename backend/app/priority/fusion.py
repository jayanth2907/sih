from app.risk_engine.rules import run_layer1_rule_engine
from app.peer_benchmark.percentile import calculate_mine_peer_percentile
from app.ml.predictor import run_layer3_ml_classifier
from app.explainability.shap_explainer import run_layer4_shap_explainer

def run_full_intelligence_pipeline(
    severity: str,
    recurrence_count: int,
    overdue_days: int,
    open_count: int,
    mine_risk_score: float,
    reporting_drift: float,
    external_discrepancy: bool,
    model_version: str = "risk-model-v1"
) -> dict:
    """
    Complete 5-Layer Intelligence Engine Fusion Pipeline
    Layer 1: Deterministic Rules
    Layer 2: Peer Benchmarking
    Layer 3: Tabular ML Classifier (XGBoost)
    Layer 4: SHAP Explainability
    Layer 5: Unified Priority Score
    """

    # 1. Layer 1 Rules
    rule_res = run_layer1_rule_engine(severity, recurrence_count, overdue_days, open_count)
    rule_score = rule_res["rule_score"]

    # 2. Layer 2 Peer Percentile
    peer_res = calculate_mine_peer_percentile(mine_risk_score)
    peer_pct = peer_res["peer_percentile"]

    # 3. Layer 3 ML Classifier
    sev_num = 4 if severity == "CRITICAL" else 3 if severity == "HIGH" else 2 if severity == "MEDIUM" else 1
    ml_features = {
        "severity_num": sev_num,
        "recurrence_count": recurrence_count,
        "inspection_gap_days": overdue_days,
        "peer_percentile": peer_pct,
        "reporting_drift": reporting_drift,
        "open_violation_count": open_count,
        "external_discrepancy": external_discrepancy
    }
    try:
        ml_res = run_layer3_ml_classifier(ml_features)
    except Exception as e:
        ml_res = {
            "ml_score": rule_score,
            "risk_probability": rule_score / 100.0,
            "status": "FALLBACK_RULE_SCORE",
            "fallback_reason": str(e)
        }
    ml_score = ml_res["ml_score"]

    # 4. Layer 4 SHAP Explainer
    shap_res = run_layer4_shap_explainer(ml_features, ml_res["risk_probability"])

    # 5. Layer 5 Unified Priority Score Fusion
    rec_score = min(recurrence_count * 20.0, 100.0)
    drift_score = min(reporting_drift * 100.0, 100.0)
    ext_score = 100.0 if external_discrepancy else 0.0

    unified_score = (
        (0.25 * rule_score) +
        (0.25 * ml_score) +
        (0.15 * rec_score) +
        (0.10 * peer_pct) +
        (0.15 * drift_score) +
        (0.10 * ext_score)
    )

    unified_score = round(min(max(unified_score, 0.0), 100.0), 1)

    if unified_score >= 81.0:
        risk_class = "CRITICAL"
    elif unified_score >= 61.0:
        risk_class = "HIGH"
    elif unified_score >= 31.0:
        risk_class = "MEDIUM"
    else:
        risk_class = "LOW"

    return {
        "unified_score": unified_score,
        "risk_class": risk_class,
        "model_version": model_version,
        "layers": {
            "layer1_rules": rule_res,
            "layer2_peer": peer_res,
            "layer3_ml": ml_res,
            "layer4_shap": shap_res,
            "layer5_score_breakdown": {
                "rule_component_25pct": round(0.25 * rule_score, 1),
                "ml_component_25pct": round(0.25 * ml_score, 1),
                "recurrence_component_15pct": round(0.15 * rec_score, 1),
                "peer_component_10pct": round(0.10 * peer_pct, 1),
                "drift_component_15pct": round(0.15 * drift_score, 1),
                "external_component_10pct": round(0.10 * ext_score, 1)
            }
        }
    }
