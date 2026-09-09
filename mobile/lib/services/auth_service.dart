import 'dart:convert';
import 'package:shared_preferences/shared_preferences.dart';
import '../config/api_config.dart';
import '../config/app_constants.dart';
import '../models/user_model.dart';
import 'api_service.dart';

class AuthService {
  static UserModel? _currentUser;
  static String? _token;

  static UserModel? get currentUser => _currentUser;
  static String? get token => _token;
  static bool get isAuthenticated => _token != null && _token!.isNotEmpty;

  static Future<void> initialize() async {
    final prefs = await SharedPreferences.getInstance();
    _token = prefs.getString(AppConstants.tokenKey);
    final userJson = prefs.getString(AppConstants.userKey);
    if (userJson != null) {
      try {
        _currentUser = UserModel.fromJson(jsonDecode(userJson));
      } catch (e) {
        _currentUser = null;
      }
    }
  }

  static Future<Map<String, dynamic>> login(String identifier, String password) async {
    try {
      final payload = {
        'username': identifier.trim(),
        'password': password.trim(),
      };

      final response = await ApiService.post(
        ApiConfig.loginUrl,
        body: payload,
        requireAuth: false,
      );

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body) as Map<String, dynamic>;
        _token = data['access_token'] as String;
        final userData = data['user'] as Map<String, dynamic>;
        _currentUser = UserModel.fromJson(userData);

        final prefs = await SharedPreferences.getInstance();
        await prefs.setString(AppConstants.tokenKey, _token!);
        await prefs.setString(AppConstants.userKey, jsonEncode(userData));

        return {'success': true, 'user': _currentUser};
      } else {
        String errorMsg = 'Invalid credentials. Please verify your official ID.';
        try {
          final errBody = jsonDecode(response.body);
          if (errBody['detail'] != null) {
            errorMsg = errBody['detail'].toString();
          }
        } catch (_) {}
        return {'success': false, 'error': errorMsg};
      }
    } catch (e) {
      return {
        'success': false,
        'error': 'Network connection failed. Check your connection or API Base URL.',
      };
    }
  }

  static Future<UserModel?> fetchCurrentUser() async {
    if (!isAuthenticated) return null;
    try {
      final response = await ApiService.get(ApiConfig.meUrl);
      if (response.statusCode == 200) {
        final data = jsonDecode(response.body) as Map<String, dynamic>;
        _currentUser = UserModel.fromJson(data);
        final prefs = await SharedPreferences.getInstance();
        await prefs.setString(AppConstants.userKey, jsonEncode(data));
        return _currentUser;
      }
    } catch (_) {}
    return _currentUser;
  }

  static Future<void> logout() async {
    try {
      await ApiService.post(ApiConfig.logoutUrl);
    } catch (_) {}
    _token = null;
    _currentUser = null;
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(AppConstants.tokenKey);
    await prefs.remove(AppConstants.userKey);
  }
}
