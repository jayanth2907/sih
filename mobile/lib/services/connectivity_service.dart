import 'dart:async';
import 'package:connectivity_plus/connectivity_plus';
import 'package:flutter/foundation.dart';
import 'package:http/http.dart' as http;
import '../config/api_config.dart';

enum NetworkStatus { online, offline, checking }

class ConnectivityService {
  static final ConnectivityService _instance = ConnectivityService._internal();
  factory ConnectivityService() => _instance;
  ConnectivityService._internal();

  final Connectivity _connectivity = Connectivity();
  final ValueNotifier<NetworkStatus> statusNotifier = ValueNotifier<NetworkStatus>(NetworkStatus.checking);

  StreamSubscription<List<ConnectivityResult>>? _subscription;
  Timer? _heartbeatTimer;

  bool get isOnline => statusNotifier.value == NetworkStatus.online;

  void initialize() {
    // Listen to network hardware state changes
    _subscription = _connectivity.onConnectivityChanged.listen((results) {
      _checkInternetReachability();
    });

    // Initial check
    _checkInternetReachability();

    // Periodic heartbeat check every 20 seconds
    _heartbeatTimer = Timer.periodic(const Duration(seconds: 20), (_) {
      _checkInternetReachability();
    });
  }

  Future<bool> _checkInternetReachability() async {
    try {
      final results = await _connectivity.checkConnectivity();
      if (results.contains(ConnectivityResult.none)) {
        statusNotifier.value = NetworkStatus.offline;
        return false;
      }

      // Quick health ping to deployed backend or fallback endpoint
      final uri = Uri.parse(ApiConfig.rootUrl);
      final response = await http.get(uri).timeout(const Duration(seconds: 4));
      if (response.statusCode == 200 || response.statusCode == 404 || response.statusCode == 405) {
        statusNotifier.value = NetworkStatus.online;
        return true;
      }
    } catch (_) {}

    // In case backend is temporarily slow or offline, check generic connectivity
    try {
      final pingResponse = await http.get(Uri.parse('https://clients3.google.com/generate_204')).timeout(const Duration(seconds: 3));
      if (pingResponse.statusCode == 204) {
        statusNotifier.value = NetworkStatus.online;
        return true;
      }
    } catch (_) {}

    statusNotifier.value = NetworkStatus.offline;
    return false;
  }

  Future<bool> forceCheck() async {
    statusNotifier.value = NetworkStatus.checking;
    return await _checkInternetReachability();
  }

  void dispose() {
    _subscription?.cancel();
    _heartbeatTimer?.cancel();
  }
}
