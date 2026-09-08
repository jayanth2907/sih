import math

def calculate_cusum_reporting_drift(intervals: list[float], median_baseline: float = 3.0, std_dev: float = 0.8) -> dict:
    """
    Phase 8 CUSUM (Cumulative Sum Control Chart) Reporting Drift Detector:
    S_t = max(0, S_{t-1} + (x_t - mu - k)) where k = 0.5 * std_dev
    Detects gradual degradation in reporting cadence before catastrophic failure occurs.
    """
    k = 0.5 * std_dev
    threshold = 5.0

    s_t = 0.0
    cusum_series = []

    for x_t in intervals:
        s_t = max(0.0, s_t + (x_t - median_baseline - k))
        cusum_series.append(round(s_t, 2))

    drift_detected = s_t > threshold
    drift_score = min(round(s_t * 12.0, 1), 100.0)

    if drift_score >= 80:
        alert_level = "CRITICAL"
    elif drift_score >= 50:
        alert_level = "HIGH"
    elif drift_score >= 25:
        alert_level = "ATTENTION"
    elif drift_score >= 10:
        alert_level = "WATCH"
    else:
        alert_level = "INFO"

    return {
        "intervals_history": intervals,
        "median_baseline_days": median_baseline,
        "std_dev": std_dev,
        "allowable_drift_k": k,
        "final_cusum_score": s_t,
        "cusum_series": cusum_series,
        "drift_detected": drift_detected,
        "drift_score": drift_score,
        "alert_level": alert_level,
        "governance_narrative": f"CUSUM detected a statistically unusual change in reporting behavior ({alert_level} level)."
    }
