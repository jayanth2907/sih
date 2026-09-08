import os
import math
import logging
import joblib

logger = logging.getLogger("ml_predictor")

_CACHED_MODEL = None

def _load_model():
    global _CACHED_MODEL
    if _CACHED_MODEL is not None:
        return _CACHED_MODEL

    candidates = [
        os.path.join(os.path.dirname(__file__), "risk_model.pkl"),
        os.path.abspath("app/ml/risk_model.pkl"),
        os.path.abspath("backend/app/ml/risk_model.pkl")
    ]
    for path in candidates:
        if os.path.exists(path):
            try:
                _CACHED_MODEL = joblib.load(path)
                logger.info(f"Loaded trained ML risk model from {path}")
                return _CACHED_MODEL
            except Exception as e:
                logger.warning(f"Failed to load model from {path}: {e}")

    logger.warning("Serialized ML model (risk_model.pkl) not found. Using fallback logit formula.")
    return None

# Attempt initial load at module import
_load_model()

def run_layer3_ml_classifier(features: dict) -> dict:
    """
    Layer 3 - Gradient Boosting Tabular ML Classifier
    Estimates high-risk probability P(Risk) over 8-element feature vector.
    Uses trained HistGradientBoostingClassifier if serialized, otherwise falls back to deterministic logit.
    """
    sev_val = features.get("severity_num", 3) # 1=LOW, 2=MED, 3=HIGH, 4=CRITICAL
    rec_cnt = features.get("recurrence_count", 0)
    gap_days = features.get("inspection_gap_days", 0)
    open_cases = features.get("open_violation_count", 0)
    site_rate = features.get("site_violation_rate", 0.15)
    peer_pct = features.get("peer_percentile", 50.0)
    drift = features.get("reporting_drift", 0.0)
    ext_disc = 1 if features.get("external_discrepancy") else 0

    clf = _load_model()
    if clf is not None:
        try:
            # Order matching train.py:
            # [severity, recurrence_count, inspection_gap_days, open_violation_count, site_violation_rate, peer_percentile, reporting_drift, external_discrepancy]
            vector = [[
                float(sev_val),
                float(rec_cnt),
                float(gap_days),
                float(open_cases),
                float(site_rate),
                float(peer_pct),
                float(drift),
                float(ext_disc)
            ]]
            probs = clf.predict_proba(vector)[0]
            # Probability of class 1 (HIGH_RISK)
            prob = float(probs[1]) if len(probs) > 1 else float(probs[0])
            risk_prob = round(min(max(prob, 0.05), 0.99), 4)
            ml_score = round(risk_prob * 100.0, 1)

            return {
                "risk_probability": risk_prob,
                "ml_score": ml_score,
                "model_version": "hist-gradient-boost-v1.0",
                "class": "HIGH_RISK" if risk_prob >= 0.70 else "NORMAL_RISK"
            }
        except Exception as e:
            logger.warning(f"Error executing trained model prediction: {e}. Falling back to logit.")

    # Fallback logit formula
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
        "model_version": "logit-simulation-v1.0",
        "class": "HIGH_RISK" if risk_prob >= 0.70 else "NORMAL_RISK"
    }
