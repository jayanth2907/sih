# TRINETRA — Mobile Field Inspection Terminal

**TRINETRA — AI-Powered Smart Governance & Compliance Monitoring for Coal Mines**  
*Ministry of Coal • DGMS Field Inspector & Mine Safety Officer Application (SIH 2026)*

---

## 🏗 System Architecture

The mobile application is built with Flutter and integrates seamlessly with the existing FastAPI backend (`https://coalgov-backend.onrender.com`).

```
mobile/
├── lib/
│   ├── main.dart                      # Application root & service bootstrapping
│   ├── config/
│   │   ├── api_config.dart            # Configurable API base URL & endpoints
│   │   ├── theme.dart                 # Industrial dark theme with emerald accents
│   │   └── app_constants.dart         # Roles, severities, sync states, & demo accounts
│   ├── models/
│   │   ├── user_model.dart            # User profile & JWT RBAC model
│   │   ├── mine_model.dart            # Mine telemetry & jurisdiction model
│   │   ├── regulation_model.dart      # DGMS CMR 2017 statutory regulations
│   │   ├── observation_model.dart     # Field non-compliance observations
│   │   ├── inspection_model.dart      # Full inspection report & sync model
│   │   └── violation_model.dart       # Violation & priority score model
│   ├── services/
│   │   ├── api_service.dart           # HTTP client with JWT interceptor & timeouts
│   │   ├── auth_service.dart          # Authentication, token storage, & user profile
│   │   ├── location_service.dart      # High-precision GPS capture & fallback
│   │   ├── connectivity_service.dart  # Real-time network reachability & backend ping
│   │   └── inspection_service.dart    # Inspections, batch sync, & violations API
│   ├── database/
│   │   ├── app_database.dart          # SQLite database schema initialization
│   │   └── inspection_dao.dart        # Queue operations, retry counts, & caching
│   ├── sync/
│   │   └── sync_manager.dart          # Background & manual batch sync engine
│   ├── widgets/
│   │   ├── network_status_bar.dart    # Live ONLINE / OFFLINE / SYNCING status bar
│   │   ├── custom_button.dart         # High-contrast large touch targets
│   │   ├── custom_card.dart           # Industrial card styling
│   │   ├── severity_badge.dart        # Color-coded severity chips
│   │   └── observation_card.dart      # Observation card with photo preview
│   ├── screens/
│   │   ├── login_screen.dart          # TRINETRA login with quick demo personas
│   │   ├── home_screen.dart           # Field officer dashboard & status
│   │   ├── new_inspection_screen.dart # GPS capture, camera/photo, observation workflow
│   │   ├── inspection_detail_screen.dart # AI governance results & SHAP score
│   │   ├── sync_queue_screen.dart     # Offline queue inspector & manual sync trigger
│   │   ├── violations_screen.dart     # Filterable safety violations register
│   │   ├── violation_detail_screen.dart # SHAP feature attributions & SLA metadata
│   │   └── settings_screen.dart       # Configurable API endpoint & diagnostics
│   └── utils/
│       ├── date_formatter.dart        # ISO date/time formatting
│       └── toast_helper.dart          # Toast & snackbar alerts
```

---

## 🔗 Existing Backend Endpoints Used

The mobile app strictly consumes the existing FastAPI backend without requiring any backend modifications:

1. **Authentication**: `POST /api/auth/login`
2. **Current User Profile**: `GET /api/auth/me`
3. **Mines Listing**: `GET /api/mines`
4. **Mine Detail**: `GET /api/mines/{id}`
5. **Statutory Regulations**: `GET /api/inspections/regulations`
6. **Online Inspection Creation**: `POST /api/inspections`
7. **Offline Batch Synchronization**: `POST /api/inspections/batch-sync`
8. **Violations Register**: `GET /api/violations`
9. **AI Risk / SHAP Explanation**: `GET /api/risk/{id}/explanation`
10. **Backend Health Check**: `GET /api/health`

---

## ⚡ Offline-First Architecture & Idempotency

1. **Offline Queueing**: When an inspector records an inspection in a remote mine without cellular connectivity, the report and photo evidence are saved locally in SQLite (`trinetra_local.db`) with status `PENDING`.
2. **Automatic Synchronization**: `ConnectivityService` monitors network state transitions. When internet connectivity is restored, `SyncManager` automatically transmits queued items to `POST /api/inspections/batch-sync`.
3. **Idempotency Protection**: The backend verifies `local_id` against previous uploads to prevent duplicate records on flaky field network reconnects.

---

## 🚀 How to Run & Build

### Prerequisites
- Flutter SDK (3.10+)
- Android SDK (targetSdk 34)

### Development Run:
```bash
cd mobile
flutter pub get
flutter run
```

### Production Release Build (APK):
```bash
cd mobile
flutter pub get
flutter build apk --release
```
The resulting APK is generated at:
`mobile/build/app/outputs/flutter-apk/app-release.apk`

---

## 🔑 Demo Field Personas

| Role | Username / Email | Password | Scope |
| :--- | :--- | :--- | :--- |
| **Mine Safety Officer** | `officer.jharia@bccl.co.in` | `demo` | Mine C (Singrauli) • NCL |
| **Field Inspector** | `inspector.dhanbad@gov.in` | `demo` | Dhanbad & Singrauli Field |
| **System Administrator** | `admin@coalgov.gov.in` | `demo` | All India • 10 Mines |
