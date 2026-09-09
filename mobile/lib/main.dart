import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'config/api_config.dart';
import 'config/app_constants.dart';
import 'config/theme.dart';
import 'services/auth_service.dart';
import 'services/connectivity_service.dart';
import 'sync/sync_manager.dart';
import 'screens/login_screen.dart';
import 'screens/home_screen.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  // Lock to portrait mode for rugged field usage
  await SystemChrome.setPreferredOrientations([
    DeviceOrientation.portraitUp,
    DeviceOrientation.portraitDown,
  ]);

  // Set system navigation & status bar styling
  SystemChrome.setSystemUIOverlayStyle(const SystemUiOverlayStyle(
    statusBarColor: Colors.transparent,
    statusBarIconBrightness: Brightness.light,
    systemNavigationBarColor: AppTheme.bgSurface,
    systemNavigationBarIconBrightness: Brightness.light,
  ));

  // Initialize Core Services
  await ApiConfig.initialize();
  await AuthService.initialize();
  ConnectivityService().initialize();
  SyncManager().initialize();

  runApp(const TrinetraApp());
}

class TrinetraApp extends StatelessWidget {
  const TrinetraApp({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: AppConstants.appName,
      debugShowCheckedModeBanner: false,
      theme: AppTheme.darkTheme,
      home: AuthService.isAuthenticated ? const HomeScreen() : const LoginScreen(),
    );
  }
}
