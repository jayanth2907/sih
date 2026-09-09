import 'package:shared_preferences/shared_preferences.dart';

class ApiConfig {
  static const String defaultBaseUrl = 'https://coalgov-backend.onrender.com';
  static const String baseUrlKey = 'trinetra_api_base_url';

  static String _baseUrl = defaultBaseUrl;

  static String get baseUrl => _baseUrl;

  static Future<void> initialize() async {
    final prefs = await SharedPreferences.getInstance();
    _baseUrl = prefs.getString(baseUrlKey) ?? defaultBaseUrl;
  }

  static Future<void> setBaseUrl(String newUrl) async {
    String cleanUrl = newUrl.trim();
    if (cleanUrl.endsWith('/')) {
      cleanUrl = cleanUrl.substring(0, cleanUrl.length - 1);
    }
    _baseUrl = cleanUrl;
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(baseUrlKey, _baseUrl);
  }

  // Auth endpoints
  static String get loginUrl => '$_baseUrl/api/auth/login';
  static String get meUrl => '$_baseUrl/api/auth/me';
  static String get logoutUrl => '$_baseUrl/api/auth/logout';
  static String get rolesUrl => '$_baseUrl/api/auth/roles';

  // Mines endpoints
  static String get minesUrl => '$_baseUrl/api/mines';
  static String mineDetailUrl(int mineId) => '$_baseUrl/api/mines/$mineId';

  // Inspection endpoints
  static String get inspectionsUrl => '$_baseUrl/api/inspections';
  static String inspectionDetailUrl(int id) => '$_baseUrl/api/inspections/$id';
  static String get regulationsUrl => '$_baseUrl/api/inspections/regulations';
  static String get batchSyncUrl => '$_baseUrl/api/inspections/batch-sync';
  static String get syncUrl => '$_baseUrl/api/inspections/sync';

  // Violations endpoints
  static String get violationsUrl => '$_baseUrl/api/violations';
  static String violationExplanationUrl(int id) => '$_baseUrl/api/risk/$id/explanation';

  // Health / Root
  static String get healthUrl => '$_baseUrl/api/health';
  static String get rootUrl => '$_baseUrl/';
}
