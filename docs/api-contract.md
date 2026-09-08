# CoalGov API Contract Specification (Phase 14)

This document defines the strict API contract between the CoalGov FastAPI Backend and Frontends (React Web Command Center & Flutter Mobile App).

## Base URL
`http://localhost:8000`

---

## 1. Authentication (`/api/v1/auth`)

### `POST /api/v1/auth/login`
Authenticates a user and returns a bearer access token with role and scope.

#### Request Body
```json
{
  "email": "officer.jharia@bccl.co.in",
  "password": "demo"
}
```

#### Response (200 OK)
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer",
  "role": "MINE_OFFICER",
  "scope": {
    "mine_id": 3,
    "subsidiary": "NCL"
  }
}
```

---

## 2. Mines (`/api/v1/mines`)

### `GET /api/v1/mines`
Returns list of all authorized coal mines with current risk metrics.

#### Response (200 OK)
```json
[
  {
    "id": 3,
    "mine_code": "MINE-C",
    "name": "Mine C - Singrauli Block-B",
    "subsidiary": "NCL",
    "state": "Madhya Pradesh",
    "district": "Singrauli",
    "risk_score": 87.85,
    "governance_response_score": 62.0,
    "status": "CRITICAL",
    "latitude": 24.2012,
    "longitude": 82.6644
  }
]
```

### `GET /api/v1/mines/{mine_id}/risk`
Returns risk score breakdown for a specific mine.

#### Response (200 OK)
```json
{
  "mine_id": 3,
  "mine_code": "MINE-C",
  "risk_score": 87.85,
  "risk_class": "CRITICAL",
  "open_violations_count": 12,
  "sla_breaches_count": 2,
  "reporting_drift": "HIGH",
  "external_discrepancy": true
}
```

---

## 3. Field Inspections & Sync (`/api/v1/inspections`)

### `POST /api/v1/inspections/sync`
Batch endpoint for mobile offline sync with local_id idempotency.

#### Request Body
```json
{
  "inspections": [
    {
      "local_id": "LOCAL-INS-1001",
      "mine_id": 3,
      "gps_lat": 23.4567,
      "gps_lng": 86.7890,
      "inspection_type": "Safety",
      "notes": "Required protective equipment was unavailable.",
      "observations": [
        {
          "regulation_id": 4,
          "severity": "HIGH",
          "description": "Required protective equipment was unavailable.",
          "is_violation": true
        }
      ]
    }
  ]
}
```

#### Response (200 OK)
```json
{
  "success": true,
  "synced_items": [
    {
      "local_id": "LOCAL-INS-1001",
      "server_inspection_id": 15,
      "sync_status": "SYNCED",
      "violation_code": "V-1024"
    }
  ]
}
```

---

## 4. Violations & SLA Governance (`/api/v1/violations`)

### `GET /api/v1/violations`
Returns list of violations, filterable by mine_id, status, severity.

### `PATCH /api/v1/violations/{violation_id}/status`
Transitions violation state (`OPEN` -> `ASSIGNED` -> `IN_PROGRESS` -> `RESOLVED` -> `VERIFIED` -> `CLOSED`).

---

## 5. Intelligence & Risk (`/api/v1/risk`)

### `GET /api/v1/risk/explain/{violation_id}`
Returns SHAP explainability breakdown for a violation.

#### Response (200 OK)
```json
{
  "violation_code": "V-1024",
  "unified_score": 87.85,
  "risk_class": "CRITICAL",
  "primary_reasons": [
    { "factor": "4 similar statutory violations logged in past 30 days", "impact": "+20 pts" },
    { "factor": "Field reporting frequency decreased 75%", "impact": "+19 pts" },
    { "factor": "Mine risk profile is in 92nd percentile", "impact": "+15 pts" },
    { "factor": "External satellite signal detected active mining", "impact": "+12 pts" }
  ],
  "recommended_action": "CRITICAL ESCALATION: Dispatch DGMS Inspector & halt operations in affected seam within 24h."
}
```

---

## 6. Executive Dashboard (`/api/v1/dashboard`)

### `GET /api/v1/dashboard/summary`
Returns high-level platform KPI counts (mines, open violations, critical cases, SLA breaches).

### `GET /api/v1/dashboard/attention`
"WHAT NEEDS ATTENTION?" Endpoint: Orders cases by priority score, SLA breach, reporting drift, and satellite signals.

---

## 7. Demo Reset (`/api/v1/demo/reset`)

### `POST /api/v1/demo/reset`
Resets system data to the clean baseline demo state featuring Mine C story.

#### Response (200 OK)
```json
{
  "status": "SUCCESS",
  "message": "Governance Platform demo state reset to baseline deterministic dataset.",
  "hero_case": "Mine C - Singrauli Block-B (V-1024)"
}
```
