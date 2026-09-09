class AppConstants {
  static const String appName = 'TRINETRA';
  static const String appSubtitle = 'AI-Powered Smart Governance & Compliance Monitoring';
  static const String appTagline = 'Ministry of Coal • Field Operations';

  // Storage Keys
  static const String tokenKey = 'trinetra_jwt_token';
  static const String userKey = 'trinetra_user_profile';
  static const String offlineQueueKey = 'trinetra_offline_queue';

  // Severity Levels (matching backend SeverityEnum)
  static const String severityLow = 'LOW';
  static const String severityMedium = 'MEDIUM';
  static const String severityHigh = 'HIGH';
  static const String severityCritical = 'CRITICAL';

  static const List<String> severityLevels = [
    severityLow,
    severityMedium,
    severityHigh,
    severityCritical,
  ];

  // Sync States
  static const String syncPending = 'PENDING';
  static const String syncSyncing = 'SYNCING';
  static const String syncSynced = 'SYNCED';
  static const String syncFailed = 'FAILED';

  // Demo / Fallback personas for fast testing
  static const List<Map<String, String>> demoPersonas = [
    {
      'role': 'MINE_OFFICER',
      'title': 'Mine Safety Officer',
      'name': 'Priya Verma',
      'scope': 'Mine C (Singrauli) • NCL',
      'identifier': 'officer.jharia@bccl.co.in',
    },
    {
      'role': 'INSPECTOR',
      'title': 'Field Inspector',
      'name': 'Rajesh Kumar',
      'scope': 'Dhanbad & Singrauli Field',
      'identifier': 'inspector.dhanbad@dgms.gov.in',
    },
    {
      'role': 'ADMIN',
      'title': 'System Administrator',
      'name': 'Admin Enterprise',
      'scope': 'All India • 10 Mines',
      'identifier': 'admin@coalgov.gov.in',
    },
  ];
}
