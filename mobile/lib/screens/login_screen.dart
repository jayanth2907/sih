import 'package:flutter/material.dart';
import '../config/app_constants.dart';
import '../config/theme.dart';
import '../services/auth_service.dart';
import '../widgets/custom_button.dart';
import '../widgets/custom_card.dart';
import '../widgets/network_status_bar.dart';
import '../utils/toast_helper.dart';
import 'home_screen.dart';
import 'settings_screen.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({Key? key}) : super(key: key);

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final _formKey = GlobalKey<FormState>();
  final _identifierController = TextEditingController(text: 'officer.jharia@bccl.co.in');
  final _passwordController = TextEditingController(text: 'demo');
  bool _obscurePassword = true;
  bool _isLoading = false;

  @override
  void dispose() {
    _identifierController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  Future<void> _handleLogin([String? identifier, String? password]) async {
    final id = identifier ?? _identifierController.text.trim();
    final pass = password ?? _passwordController.text.trim();

    if (id.isEmpty || pass.isEmpty) {
      ToastHelper.showError(context, 'Please enter username/email and password.');
      return;
    }

    setState(() => _isLoading = true);

    final result = await AuthService.login(id, pass);

    setState(() => _isLoading = false);

    if (result['success'] == true) {
      final user = AuthService.currentUser;
      ToastHelper.showSuccess(
        context,
        'Authenticated as ${user?.name ?? "Field Officer"} (${user?.role ?? "INSPECTOR"})',
      );
      Navigator.pushReplacement(
        context,
        MaterialPageRoute(builder: (_) => const HomeScreen()),
      );
    } else {
      ToastHelper.showError(context, result['error'] ?? 'Authentication failed.');
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        child: Column(
          children: [
            const NetworkStatusBar(),
            Expanded(
              child: SingleChildScrollView(
                padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 20),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.center,
                  children: [
                    // Top Actions: Settings / Server config
                    Align(
                      alignment: Alignment.topRight,
                      child: IconButton(
                        icon: const Icon(Icons.settings_outlined, color: AppTheme.textSecondary),
                        onPressed: () {
                          Navigator.push(
                            context,
                            MaterialPageRoute(builder: (_) => const SettingsScreen()),
                          );
                        },
                      ),
                    ),

                    const SizedBox(height: 10),

                    // Logo Emblem
                    Container(
                      width: 64,
                      height: 64,
                      decoration: BoxDecoration(
                        color: AppTheme.bgSurface,
                        borderRadius: BorderRadius.circular(20),
                        border: Border.all(color: AppTheme.accentEmerald.withOpacity(0.4), width: 1.5),
                        boxShadow: [
                          BoxShadow(
                            color: AppTheme.accentEmerald.withOpacity(0.15),
                            blurRadius: 20,
                            spreadRadius: 2,
                          ),
                        ],
                      ),
                      child: const Center(
                        child: Icon(Icons.shield_outlined, color: AppTheme.accentEmerald, size: 34),
                      ),
                    ),

                    const SizedBox(height: 16),

                    // Brand Title
                    Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        const Text(
                          AppConstants.appName,
                          style: TextStyle(
                            fontSize: 26,
                            fontWeight: FontWeight.w900,
                            letterSpacing: 1.5,
                            color: AppTheme.textPrimary,
                          ),
                        ),
                        const SizedBox(width: 8),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                          decoration: BoxDecoration(
                            color: AppTheme.bgCard,
                            borderRadius: BorderRadius.circular(6),
                            border: Border.all(color: AppTheme.accentEmerald.withOpacity(0.4)),
                          ),
                          child: const Text(
                            'FIELD',
                            style: TextStyle(
                              fontSize: 10,
                              fontWeight: FontWeight.w800,
                              color: AppTheme.accentEmerald,
                            ),
                          ),
                        ),
                      ],
                    ),

                    const SizedBox(height: 6),
                    const Text(
                      AppConstants.appSubtitle,
                      textAlign: TextAlign.center,
                      style: TextStyle(
                        fontSize: 12,
                        color: AppTheme.textSecondary,
                        height: 1.3,
                      ),
                    ),

                    const SizedBox(height: 28),

                    // Login Card
                    CustomCard(
                      padding: const EdgeInsets.all(20),
                      child: Form(
                        key: _formKey,
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Text(
                              'Official Sign In',
                              style: TextStyle(
                                fontSize: 16,
                                fontWeight: FontWeight.bold,
                                color: AppTheme.textPrimary,
                              ),
                            ),
                            const SizedBox(height: 4),
                            const Text(
                              'Enter your credentials to access field inspection logs.',
                              style: TextStyle(fontSize: 11, color: AppTheme.textMuted),
                            ),
                            const SizedBox(height: 18),

                            // Username / Email
                            TextFormField(
                              controller: _identifierController,
                              style: const TextStyle(fontSize: 14, color: AppTheme.textPrimary),
                              decoration: const InputDecoration(
                                labelText: 'Official Email / Username',
                                prefixIcon: Icon(Icons.person_outline_rounded, color: AppTheme.textMuted, size: 20),
                              ),
                            ),
                            const SizedBox(height: 14),

                            // Password
                            TextFormField(
                              controller: _passwordController,
                              obscureText: _obscurePassword,
                              style: const TextStyle(fontSize: 14, color: AppTheme.textPrimary),
                              decoration: InputDecoration(
                                labelText: 'Password',
                                prefixIcon: const Icon(Icons.lock_outline_rounded, color: AppTheme.textMuted, size: 20),
                                suffixIcon: IconButton(
                                  icon: Icon(
                                    _obscurePassword ? Icons.visibility_off_outlined : Icons.visibility_outlined,
                                    color: AppTheme.textMuted,
                                    size: 20,
                                  ),
                                  onPressed: () => setState(() => _obscurePassword = !_obscurePassword),
                                ),
                              ),
                            ),
                            const SizedBox(height: 20),

                            // Submit Button
                            CustomButton(
                              text: 'SIGN IN TO TRINETRA',
                              icon: Icons.login_rounded,
                              isLoading: _isLoading,
                              onPressed: () => _handleLogin(),
                            ),
                          ],
                        ),
                      ),
                    ),

                    const SizedBox(height: 24),

                    // Demo Personas Quick Selectors
                    Align(
                      alignment: Alignment.centerLeft,
                      child: Text(
                        'QUICK DEMO ACCESS (SIH JURORS / FIELD DEMO)',
                        style: TextStyle(
                          fontSize: 10,
                          fontWeight: FontWeight.w800,
                          letterSpacing: 0.8,
                          color: AppTheme.textMuted,
                        ),
                      ),
                    ),
                    const SizedBox(height: 10),

                    ...AppConstants.demoPersonas.map((persona) {
                      return Container(
                        margin: const EdgeInsets.only(bottom: 8),
                        child: InkWell(
                          onTap: () {
                            _identifierController.text = persona['identifier']!;
                            _passwordController.text = 'demo';
                            _handleLogin(persona['identifier'], 'demo');
                          },
                          borderRadius: BorderRadius.circular(12),
                          child: Container(
                            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                            decoration: BoxDecoration(
                              color: AppTheme.bgSurface,
                              borderRadius: BorderRadius.circular(12),
                              border: Border.all(color: AppTheme.borderColor),
                            ),
                            child: Row(
                              children: [
                                Container(
                                  width: 32,
                                  height: 32,
                                  decoration: BoxDecoration(
                                    color: AppTheme.bgCard,
                                    borderRadius: BorderRadius.circular(8),
                                    border: Border.all(color: AppTheme.accentEmerald.withOpacity(0.3)),
                                  ),
                                  child: Center(
                                    child: Text(
                                      persona['name']!.substring(0, 1),
                                      style: const TextStyle(
                                        fontWeight: FontWeight.bold,
                                        color: AppTheme.accentEmerald,
                                        fontSize: 13,
                                      ),
                                    ),
                                  ),
                                ),
                                const SizedBox(width: 12),
                                Expanded(
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      Text(
                                        persona['name']!,
                                        style: const TextStyle(
                                          fontSize: 13,
                                          fontWeight: FontWeight.bold,
                                          color: AppTheme.textPrimary,
                                        ),
                                      ),
                                      Text(
                                        '${persona['title']} • ${persona['scope']}',
                                        style: const TextStyle(
                                          fontSize: 10,
                                          color: AppTheme.textSecondary,
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                                const Icon(Icons.arrow_forward_ios_rounded, size: 14, color: AppTheme.textMuted),
                              ],
                            ),
                          ),
                        ),
                      );
                    }).toList(),

                    const SizedBox(height: 20),
                    const Text(
                      'TRINETRA • Ministry of Coal • Government of India',
                      style: TextStyle(fontSize: 10, color: AppTheme.textMuted),
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
