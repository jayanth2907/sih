import random
import math
import datetime

def generate_synthetic_governance_dataset(num_records: int = 1000) -> list[dict]:
    """
    Generates 1,000+ synthetic governance records reflecting realistic coal mining compliance patterns.
    Columns: mine_id, mine_type, severity, recurrence_count, inspection_gap_days, open_violation_count,
             site_violation_rate, peer_percentile, reporting_drift, external_discrepancy, contractor_history, target_priority
    """
    dataset = []
    mine_types = ["OPEN_CAST", "UNDERGROUND", "MIXED"]

    for i in range(num_records):
        severity = random.choice([1, 2, 3, 4]) # 1=LOW, 2=MED, 3=HIGH, 4=CRITICAL
        recurrence = random.randint(0, 8)
        gap_days = random.randint(1, 20)
        open_cases = random.randint(1, 15)
        site_viol_rate = round(random.uniform(0.05, 0.45), 2)
        peer_pct = round(random.uniform(10.0, 99.0), 1)
        drift = round(random.uniform(0.0, 0.9), 2)
        ext_disc = 1 if random.random() < 0.25 else 0

        # Calculate target priority class (0=LOW/MED, 1=HIGH/CRITICAL) via calibrated risk logit
        logit = (
            0.40 * severity +
            0.45 * recurrence +
            0.06 * gap_days +
            0.04 * open_cases +
            0.02 * peer_pct +
            1.60 * drift +
            1.30 * ext_disc -
            3.60
        )
        prob = 1.0 / (1.0 + math.exp(-logit))
        target = 1 if prob >= 0.50 else 0

        timestamp = (datetime.datetime(2025, 1, 1) + datetime.timedelta(hours=i * 6)).isoformat()
        dataset.append({
            "record_id": f"REC-{i+1:04d}",
            "timestamp": timestamp,
            "mine_id": random.randint(1, 10),
            "mine_type": random.choice(mine_types),
            "severity": severity,
            "recurrence_count": recurrence,
            "inspection_gap_days": gap_days,
            "open_violation_count": open_cases,
            "site_violation_rate": site_viol_rate,
            "peer_percentile": peer_pct,
            "reporting_drift": drift,
            "external_discrepancy": ext_disc,
            "contractor_history_score": round(random.uniform(60.0, 98.0), 1),
            "target_priority": target
        })

    return dataset
