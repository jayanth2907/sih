import random

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

        # Calculate target priority class (0=LOW/MED, 1=HIGH/CRITICAL)
        score = (0.25 * severity * 25) + (0.25 * recurrence * 12) + (0.15 * gap_days * 5) + (0.10 * peer_pct) + (0.15 * drift * 100) + (0.10 * ext_disc * 100)
        target = 1 if score >= 60.0 else 0

        dataset.append({
            "record_id": f"REC-{i+1:04d}",
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
