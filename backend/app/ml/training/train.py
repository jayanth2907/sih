from sklearn.ensemble import HistGradientBoostingClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import precision_score, recall_score, f1_score, accuracy_score
from app.ml.training.generate_data import generate_synthetic_governance_dataset

def train_governance_risk_model():
    """
    Phase 13 ML Training Pipeline:
    Generates synthetic dataset -> 80/20 train/test split -> HistGradientBoostingClassifier -> Evaluation Metrics
    """
    raw_data = generate_synthetic_governance_dataset(num_records=1200)

    X = [
        [
            r["severity"],
            r["recurrence_count"],
            r["inspection_gap_days"],
            r["open_violation_count"],
            r["site_violation_rate"],
            r["peer_percentile"],
            r["reporting_drift"],
            r["external_discrepancy"]
        ]
        for r in raw_data
    ]

    y = [r["target_priority"] for r in raw_data]

    # 80/20 Train/Test Split (Time-based / Stratified)
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.20, random_state=42, stratify=y)

    # Gradient Boosting Tree Classifier
    clf = HistGradientBoostingClassifier(max_iter=100, random_state=42)
    clf.fit(X_train, y_train)

    # Predictions & Evaluation
    y_pred = clf.predict(X_test)

    acc = accuracy_score(y_test, y_pred)
    prec = precision_score(y_test, y_pred, zero_division=0)
    rec = recall_score(y_test, y_pred, zero_division=0)
    f1 = f1_score(y_test, y_pred, zero_division=0)

    model_metadata = {
        "model_version": "risk-model-v1.0.pkl",
        "training_samples": len(X_train),
        "test_samples": len(X_test),
        "metrics": {
            "accuracy": round(acc, 4),
            "precision": round(prec, 4),
            "recall": round(rec, 4),
            "f1_score": round(f1, 4)
        },
        "status": "TRAINED_AND_VALIDATED"
    }

    return model_metadata, clf

if __name__ == "__main__":
    meta, _ = train_governance_risk_model()
    print("ML Training Complete:", meta)
