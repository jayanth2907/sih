import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import '../config/app_constants.dart';

class ApiService {
  static const Duration defaultTimeout = Duration(seconds: 15);

  static Future<String?> getToken() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString(AppConstants.tokenKey);
  }

  static Future<Map<String, String>> _getHeaders({bool requireAuth = true}) async {
    final headers = <String, String>{
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };

    if (requireAuth) {
      final token = await getToken();
      if (token != null && token.isNotEmpty) {
        headers['Authorization'] = 'Bearer $token';
      }
    }

    return headers;
  }

  static Future<http.Response> get(String url, {bool requireAuth = true}) async {
    final headers = await _getHeaders(requireAuth: requireAuth);
    return await http.get(Uri.parse(url), headers: headers).timeout(defaultTimeout);
  }

  static Future<http.Response> post(
    String url, {
    dynamic body,
    bool requireAuth = true,
  }) async {
    final headers = await _getHeaders(requireAuth: requireAuth);
    final encodedBody = body != null ? jsonEncode(body) : null;
    return await http
        .post(Uri.parse(url), headers: headers, body: encodedBody)
        .timeout(defaultTimeout);
  }

  static Future<http.Response> put(
    String url, {
    dynamic body,
    bool requireAuth = true,
  }) async {
    final headers = await _getHeaders(requireAuth: requireAuth);
    final encodedBody = body != null ? jsonEncode(body) : null;
    return await http
        .put(Uri.parse(url), headers: headers, body: encodedBody)
        .timeout(defaultTimeout);
  }
}
