import 'package:flutter/material.dart';
import '../config/api_config.dart';
import '../config/theme.dart';
import '../database/app_database.dart';
import '../services/connectivity_service.dart';
import '../sync/sync_manager.dart';
import '../widgets/custom_button.dart';
import '../widgets/custom_card.dart';
import '../utils/toast_helper.dart';

class SettingsScreen extends StatefulWidget {
  const SettingsScreen({Key? key}) : super(key: key);

  @override
  State<SettingsScreen> createState() => _SettingsScreenState();
}

class _SettingsScreenState extends State<SettingsScreen> {
  late TextEditingController _urlController;
  bool _isTesting = false;

  @override
  void initState() {
    super.initState();
    _urlController = TextEditingController(text: ApiConfig.baseUrl);
  }

  @override
  void dispose() {
    _urlController.dispose();
    super.dispose();
  }

  Future<void> _saveUrl() async {
    final newUrl = _urlController.text.trim();
    if (newUrl.isEmpty) {
      ToastHelper.showError(context, 'URL cannot be empty.');
      return;
    }

    await ApiConfig.setBaseUrl(newUrl);
    ToastHelper.showSuccess(context, 'API Base URL updated.');
    setState(() {});
  }

  Future<void> _testConnection() async {
    setState(() => _isTesting = true);
    await _saveUrl();
    final isOnline = await ConnectivityService().forceCheck();
    setState(() => _isTesting = false);

    if (mounted) {
      if (isOnline) {
        ToastHelper.showSuccess(context, 'Successfully connected to backend API!');
      } else {
        ToastHelper.showError(context, 'Cannot reach server at ${ApiConfig.baseUrl}');
      }
    }
  }

  Future<void> _resetDefault() async {
    await ApiConfig.setBaseUrl(ApiConfig.defaultBaseUrl);
    _urlController.text = ApiConfig.defaultBaseUrl;
    ToastHelper.showInfo(context, 'Reset to default deployed backend.');
    setState(() {});
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Terminal Configuration'),
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(18),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Server Endpoint Configuration
              CustomCard(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: const [
                        Icon(Icons.dns_rounded, color: AppTheme.accentEmerald, size: 20),
                        SizedBox(width: 8),
                        Text(
                          'BACKEND API BASE URL',
                          style: TextStyle(
                            fontSize: 11,
                            fontWeight: FontWeight.w900,
                            letterSpacing: 0.8,
                            color: AppTheme.accentEmerald,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 6),
                    const Text(
                      'Configure deployed FastAPI backend endpoint or local network host.',
                      style: TextStyle(fontSize: 11, color: AppTheme.textMuted),
                    ),
                    const SizedBox(height: 14),

                    TextField(
                      controller: _urlController,
                      style: const TextStyle(fontSize: 13, color: AppTheme.textPrimary, fontFamily: 'monospace'),
                      decoration: const InputDecoration(
                        labelText: 'API Endpoint Base URL',
                        hintText: 'https://coalgov-backend.onrender.com',
                      ),
                    ),
                    const SizedBox(height: 14),

                    Row(
                      children: [
                        Expanded(
                          child: CustomButton(
                            text: 'TEST CONNECTION',
                            icon: Icons.network_check_rounded,
                            height: 44,
                            isLoading: _isTesting,
                            onPressed: _testConnection,
                          ),
                        ),
                        const SizedBox(width: 8),
                        OutlinedButton(
                          onPressed: _resetDefault,
                          style: OutlinedButton.styleFrom(
                            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                            side: const BorderSide(color: AppTheme.borderColor),
                          ),
                          child: const Text('RESET', style: TextStyle(fontSize: 12, color: AppTheme.textSecondary)),
                        ),
                      ],
                    ),
                  ],
                ),
              ),

              const SizedBox(height: 16),

              // Local Offline Storage Diagnostics
              CustomCard(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text('Offline SQLite Database Diagnostics', style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: AppTheme.textPrimary)),
                    const SizedBox(height: 12),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.between,
                      children: [
                        const Text('Local DB File', style: TextStyle(fontSize: 12, color: AppTheme.textSecondary)),
                        const Text('trinetra_local.db', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: AppTheme.textPrimary)),
                      ],
                    ),
                    const Divider(color: AppTheme.borderColor, height: 16),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.between,
                      children: [
                        const Text('Queue Engine', style: TextStyle(fontSize: 12, color: AppTheme.textSecondary)),
                        const Text('Idempotent Batch Sync', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: AppTheme.accentEmerald)),
                      ],
                    ),
                    const Divider(color: AppTheme.borderColor, height: 16),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.between,
                      children: [
                        const Text('Pending Sync Items', style: TextStyle(fontSize: 12, color: AppTheme.textSecondary)),
                        ValueListenableBuilder<int>(
                          valueListenable: SyncManager().pendingCountNotifier,
                          builder: (_, count, __) => Text(
                            '$count record(s)',
                            style: TextStyle(
                              fontSize: 12,
                              fontWeight: FontWeight.bold,
                              color: count > 0 ? AppTheme.statusMedium : AppTheme.statusSuccess,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),

              const SizedBox(height: 16),

              // Device & App Info
              CustomCard(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: const [
                    Text('TRINETRA Field Terminal Info', style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: AppTheme.textPrimary)),
                    SizedBox(height: 12),
                    Text('Version: 1.0.0 (SIH 2026 Production Release)', style: TextStyle(fontSize: 11, color: AppTheme.textSecondary)),
                    SizedBox(height: 4),
                    Text('Target: Ministry of Coal & DGMS Indian Field Operations', style: TextStyle(fontSize: 11, color: AppTheme.textMuted)),
                    SizedBox(height: 4),
                    Text('Security: HMAC-SHA256 JWT + Immutable SHA-256 Ledger', style: TextStyle(fontSize: 11, color: AppTheme.textMuted)),
                  ],
                ),
              ),
              const SizedBox(height: 20),
            ],
          ),
        ),
      ),
    );
  }
}
