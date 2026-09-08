import os
import json
import joblib
from sklearn.ensemble import HistGradientBoostingClassifier
from sklearn.metrics import precision_score, recall_score, f1_score, accuracy_score
from app.ml.training.generate_data import generate_synthetic_governance_dataset

def train_governance_risk_model():
    """
    Phase 13/14 ML Training Pipeline:
    Generates synthetic dataset -> Chronological 80/20 time-based split -> HistGradientBoostingClassifier
    -> Serializes model to risk_model.pkl -> Updates model_metadata.json with real evaluation metrics.
    """
    raw_data = generate_synthetic_governance_dataset(num_records=1200)

    # Chronological sort on timestamp to prevent future data leakage
    raw_data.sort(key=lambda r: r.get("timestamp", ""))

    split_idx = int(len(raw_data) * 0.80)
    train_data = raw_data[:split_idx]
    test_data = raw_data[split_idx:]

    def extract_features(records):
        return [
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
            for r in records
        ]

    X_train = extract_features(train_data)
    y_train = [r["target_priority"] for r in train_data]

    X_test = extract_features(test_data)
    y_test = [r["target_priority"] for r in test_data]

    # Gradient Boosting Tree Classifier
    clf = HistGradientBoostingClassifier(max_iter=100, random_state=42)
    clf.fit(X_train, y_train)

    # Predictions & Evaluation
    y_pred = clf.predict(X_test)

    acc = float(accuracy_score(y_test, y_pred))
    prec = float(precision_score(y_test, y_pred, zero_division=0))
    rec = float(recall_score(y_test, y_pred, zero_division=0))
    f1 = float(f1_score(y_test, y_pred, zero_division=0))

    metrics = {
        "accuracy": round(acc, 4),
        "precision": round(prec, 4),
        "recall": round(rec, 4),
        "f1_score": round(f1, 4)
    }

    # Model file resolution
    ml_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    model_path = os.path.join(ml_dir, "risk_model.pkl")
    joblib.dump(clf, model_path)

    # Update model_metadata.json with real metrics
    metadata_path = os.path.join(ml_dir, "model_metadata.json")
    if os.path.exists(metadata_path):
        try:
            with open(metadata_path, "r", encoding="utf-8") as f:
                meta_json = json.load(f)
            meta_json["evaluation_metrics"] = {
                "precision": round(prec, 3),
                "recall": round(rec, 3),
                "f1_score": round(f1, 3),
                "accuracy": round(acc, 3)
            }
            meta_json["training_samples"] = len(X_train)
            meta_json["test_samples"] = len(X_test)
            meta_json["deployment_timestamp"] = "2026-09-08T00:00:00Z"
            with open(metadata_path, "w", encoding="utf-8") as f:
                json.dump(meta_json, f, indent=2)
        except Exception:
            pass

    model_metadata = {
        "model_version": "risk-model-v1.0.pkl",
        "training_samples": len(X_train),
        "test_samples": len(X_test),
        "metrics": metrics,
        "status": "TRAINED_AND_VALIDATED"
    }

    return model_metadata, clf

if __name__ == "__main__":
    meta, _ = train_governance_risk_model()
    print("ML Training Complete:", meta)
