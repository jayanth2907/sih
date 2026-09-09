import 'package:flutter/material.dart';
import '../config/app_constants.dart';
import '../config/theme.dart';
import '../models/user_model.dart';
import '../models/mine_model.dart';
import '../services/auth_service.dart';
import '../services/inspection_service.dart';
import '../sync/sync_manager.dart';
import '../widgets/custom_button.dart';
import '../widgets/custom_card.dart';
import '../widgets/network_status_bar.dart';
import 'new_inspection_screen.dart';
import 'sync_queue_screen.dart';
import 'violations_screen.dart';
import 'settings_screen.dart';
import 'login_screen.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({Key? key}) : super(key: key);

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  UserModel? _user;
  List<MineModel> _mines = [];
  int _openViolationsCount = 0;
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  Future<void> _loadData() async {
    setState(() => _isLoading = true);
    _user = AuthService.currentUser;

    // Load mines & violations
    final mines = await InspectionService.fetchMines();
    final violations = await InspectionService.fetchViolations();

    if (mounted) {
      setState(() {
        _mines = mines;
        _openViolationsCount = violations.where((v) => v.status == 'OPEN' || v.status == 'ESCALATED').length;
        _isLoading = false;
      });
    }
  }

  Future<void> _handleLogout() async {
    final confirm = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: AppTheme.bgCard,
        title: const Text('End Session', style: TextStyle(color: AppTheme.textPrimary, fontSize: 16)),
        content: const Text('Do you want to log out of TRINETRA field terminal?', style: TextStyle(color: AppTheme.textSecondary, fontSize: 13)),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx, false),
            child: const Text('Cancel', style: TextStyle(color: AppTheme.textMuted)),
          ),
          ElevatedButton(
            onPressed: () => Navigator.pop(ctx, true),
            style: ElevatedButton.styleFrom(backgroundColor: AppTheme.statusCritical),
            child: const Text('Logout', style: TextStyle(color: Colors.white)),
          ),
        ],
      ),
    );

    if (confirm == true) {
      await AuthService.logout();
      if (mounted) {
        Navigator.pushReplacement(
          context,
          MaterialPageRoute(builder: (_) => const LoginScreen()),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final user = _user ?? AuthService.currentUser;
    final assignedMineName = user?.mineName ?? (user?.mineId != null ? 'Mine #${user!.mineId}' : 'All India Jurisdiction');
    final subsidiary = user?.subsidiary ?? 'Enterprise Scope';

    return Scaffold(
      appBar: AppBar(
        title: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(6),
              decoration: BoxDecoration(
                color: AppTheme.accentEmerald.withOpacity(0.15),
                borderRadius: BorderRadius.circular(8),
                border: Border.all(color: AppTheme.accentEmerald.withOpacity(0.4)),
              ),
              child: const Icon(Icons.shield_outlined, color: AppTheme.accentEmerald, size: 18),
            ),
            const SizedBox(width: 10),
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: const [
                Text(
                  AppConstants.appName,
                  style: TextStyle(fontSize: 16, fontWeight: FontWeight.w900, letterSpacing: 1),
                ),
                Text(
                  'FIELD COMMAND CENTER',
                  style: TextStyle(fontSize: 9, fontWeight: FontWeight.bold, color: AppTheme.accentEmerald, letterSpacing: 0.8),
                ),
              ],
            ),
          ],
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh_rounded, color: AppTheme.textSecondary),
            onPressed: _loadData,
          ),
          IconButton(
            icon: const Icon(Icons.settings_outlined, color: AppTheme.textSecondary),
            onPressed: () {
              Navigator.push(
                context,
                MaterialPageRoute(builder: (_) => const SettingsScreen()),
              );
            },
          ),
          IconButton(
            icon: const Icon(Icons.logout_rounded, color: AppTheme.statusCritical),
            onPressed: _handleLogout,
          ),
        ],
      ),
      body: SafeArea(
        child: Column(
          children: [
            const NetworkStatusBar(),
            Expanded(
              child: RefreshIndicator(
                onRefresh: _loadData,
                color: AppTheme.accentEmerald,
                backgroundColor: AppTheme.bgCard,
                child: SingleChildScrollView(
                  physics: const AlwaysScrollableScrollPhysics(),
                  padding: const EdgeInsets.all(18),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      // User Identity Card
                      CustomCard(
                        padding: const EdgeInsets.all(16),
                        child: Row(
                          children: [
                            Container(
                              width: 46,
                              height: 46,
                              decoration: BoxDecoration(
                                color: AppTheme.bgSurface,
                                borderRadius: BorderRadius.circular(12),
                                border: Border.all(color: AppTheme.accentEmerald.withOpacity(0.4)),
                              ),
                              child: Center(
                                child: Text(
                                  (user?.name ?? 'O').substring(0, 1),
                                  style: const TextStyle(
                                    fontSize: 18,
                                    fontWeight: FontWeight.bold,
                                    color: AppTheme.accentEmerald,
                                  ),
                                ),
                              ),
                            ),
                            const SizedBox(width: 14),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    user?.name ?? 'Field Officer',
                                    style: const TextStyle(
                                      fontSize: 15,
                                      fontWeight: FontWeight.bold,
                                      color: AppTheme.textPrimary,
                                    ),
                                  ),
                                  const SizedBox(height: 2),
                                  Row(
                                    children: [
                                      Container(
                                        padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                                        decoration: BoxDecoration(
                                          color: AppTheme.accentEmerald.withOpacity(0.15),
                                          borderRadius: BorderRadius.circular(4),
                                          border: Border.all(color: AppTheme.accentEmerald.withOpacity(0.3)),
                                        ),
                                        child: Text(
                                          user?.role ?? 'INSPECTOR',
                                          style: const TextStyle(
                                            fontSize: 9,
                                            fontWeight: FontWeight.w800,
                                            color: AppTheme.accentEmerald,
                                          ),
                                        ),
                                      ),
                                      const SizedBox(width: 8),
                                      Expanded(
                                        child: Text(
                                          subsidiary,
                                          overflow: TextOverflow.ellipsis,
                                          style: const TextStyle(fontSize: 11, color: AppTheme.textSecondary),
                                        ),
                                      ),
                                    ],
                                  ),
                                ],
                              ),
                            ),
                          ],
                        ),
                      ),

                      const SizedBox(height: 16),

                      // Assigned Mine Banner
                      CustomCard(
                        borderColor: AppTheme.accentEmerald.withOpacity(0.3),
                        padding: const EdgeInsets.all(16),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              mainAxisAlignment: MainAxisAlignment.between,
                              children: [
                                Row(
                                  children: const [
                                    Icon(Icons.location_on_rounded, color: AppTheme.accentEmerald, size: 16),
                                    SizedBox(width: 6),
                                    Text(
                                      'ASSIGNED MINE SCOPE',
                                      style: TextStyle(
                                        fontSize: 11,
                                        fontWeight: FontWeight.bold,
                                        letterSpacing: 0.5,
                                        color: AppTheme.textMuted,
                                      ),
                                    ),
                                  ],
                                ),
                                Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                                  decoration: BoxDecoration(
                                    color: AppTheme.statusSuccess.withOpacity(0.15),
                                    borderRadius: BorderRadius.circular(4),
                                  ),
                                  child: const Text(
                                    'ACTIVE',
                                    style: TextStyle(fontSize: 9, fontWeight: FontWeight.bold, color: AppTheme.statusSuccess),
                                  ),
                                ),
                              ],
                            ),
                            const SizedBox(height: 8),
                            Text(
                              assignedMineName,
                              style: const TextStyle(
                                fontSize: 16,
                                fontWeight: FontWeight.w800,
                                color: AppTheme.textPrimary,
                              ),
                            ),
                            const SizedBox(height: 2),
                            Text(
                              'Statutory compliance tracking and field telemetry under DGMS CMR 2017.',
                              style: TextStyle(fontSize: 11, color: AppTheme.textSecondary),
                            ),
                          ],
                        ),
                      ),

                      const SizedBox(height: 16),

                      // Primary Action: START INSPECTION
                      CustomButton(
                        text: 'START FIELD INSPECTION',
                        icon: Icons.add_circle_outline_rounded,
                        height: 56,
                        onPressed: () async {
                          final result = await Navigator.push(
                            context,
                            MaterialPageRoute(builder: (_) => const NewInspectionScreen()),
                          );
                          if (result == true) {
                            _loadData();
                          }
                        },
                      ),

                      const SizedBox(height: 20),

                      // Metric Cards Grid
                      Row(
                        children: [
                          // Open Violations Card
                          Expanded(
                            child: CustomCard(
                              padding: const EdgeInsets.all(14),
                              onTap: () {
                                Navigator.push(
                                  context,
                                  MaterialPageRoute(builder: (_) => const ViolationsScreen()),
                                );
                              },
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Row(
                                    mainAxisAlignment: MainAxisAlignment.between,
                                    children: const [
                                      Icon(Icons.warning_amber_rounded, color: AppTheme.statusCritical, size: 22),
                                      Icon(Icons.arrow_forward_ios_rounded, color: AppTheme.textMuted, size: 12),
                                    ],
                                  ),
                                  const SizedBox(height: 10),
                                  Text(
                                    '$_openViolationsCount',
                                    style: const TextStyle(
                                      fontSize: 24,
                                      fontWeight: FontWeight.w900,
                                      color: AppTheme.statusCritical,
                                    ),
                                  ),
                                  const SizedBox(height: 2),
                                  const Text(
                                    'Open Violations',
                                    style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: AppTheme.textPrimary),
                                  ),
                                  Text(
                                    'SLA Overdue alerts',
                                    style: TextStyle(fontSize: 10, color: AppTheme.textMuted),
                                  ),
                                ],
                              ),
                            ),
                          ),
                          const SizedBox(width: 12),

                          // Offline Queue Card
                          Expanded(
                            child: ValueListenableBuilder<int>(
                              valueListenable: SyncManager().pendingCountNotifier,
                              builder: (context, pendingCount, _) {
                                return CustomCard(
                                  padding: const EdgeInsets.all(14),
                                  onTap: () {
                                    Navigator.push(
                                      context,
                                      MaterialPageRoute(builder: (_) => const SyncQueueScreen()),
                                    );
                                  },
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      Row(
                                        mainAxisAlignment: MainAxisAlignment.between,
                                        children: [
                                          Icon(
                                            pendingCount > 0 ? Icons.cloud_upload_outlined : Icons.cloud_done_outlined,
                                            color: pendingCount > 0 ? AppTheme.statusMedium : AppTheme.accentEmerald,
                                            size: 22,
                                          ),
                                          const Icon(Icons.arrow_forward_ios_rounded, color: AppTheme.textMuted, size: 12),
                                        ],
                                      ),
                                      const SizedBox(height: 10),
                                      Text(
                                        '$pendingCount',
                                        style: TextStyle(
                                          fontSize: 24,
                                          fontWeight: FontWeight.w900,
                                          color: pendingCount > 0 ? AppTheme.statusMedium : AppTheme.accentEmerald,
                                        ),
                                      ),
                                      const SizedBox(height: 2),
                                      const Text(
                                        'Offline Queue',
                                        style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: AppTheme.textPrimary),
                                      ),
                                      Text(
                                        pendingCount > 0 ? 'Pending sync' : 'All synced',
                                        style: const TextStyle(fontSize: 10, color: AppTheme.textMuted),
                                      ),
                                    ],
                                  ),
                                );
                              },
                            ),
                          ),
                        ],
                      ),

                      const SizedBox(height: 20),

                      // Quick Sync Action Card
                      ValueListenableBuilder<int>(
                        valueListenable: SyncManager().pendingCountNotifier,
                        builder: (context, pendingCount, _) {
                          if (pendingCount == 0) return const SizedBox.shrink();
                          return Container(
                            margin: const EdgeInsets.only(bottom: 20),
                            child: CustomCard(
                              borderColor: AppTheme.statusMedium.withOpacity(0.4),
                              padding: const EdgeInsets.all(14),
                              child: Row(
                                children: [
                                  const Icon(Icons.sync_problem_rounded, color: AppTheme.statusMedium, size: 24),
                                  const SizedBox(width: 12),
                                  Expanded(
                                    child: Column(
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      children: [
                                        Text(
                                          '$pendingCount Unsynced Inspection(s)',
                                          style: const TextStyle(
                                            fontSize: 13,
                                            fontWeight: FontWeight.bold,
                                            color: AppTheme.textPrimary,
                                          ),
                                        ),
                                        const Text(
                                          'Stored securely in local SQLite database.',
                                          style: TextStyle(fontSize: 11, color: AppTheme.textSecondary),
                                        ),
                                      ],
                                    ),
                                  ),
                                  ElevatedButton(
                                    onPressed: () => SyncManager().syncPendingQueue(),
                                    style: ElevatedButton.styleFrom(
                                      backgroundColor: AppTheme.statusMedium,
                                      foregroundColor: Colors.black,
                                      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                                      minimumSize: Size.zero,
                                    ),
                                    child: const Text('SYNC', style: TextStyle(fontSize: 11, fontWeight: FontWeight.w800)),
                                  ),
                                ],
                              ),
                            ),
                          );
                        },
                      ),

                      // Available Mines List Header
                      Row(
                        mainAxisAlignment: MainAxisAlignment.between,
                        children: [
                          const Text(
                            'REGISTERED MINES JURISDICTION',
                            style: TextStyle(
                              fontSize: 11,
                              fontWeight: FontWeight.bold,
                              letterSpacing: 0.8,
                              color: AppTheme.textMuted,
                            ),
                          ),
                          Text(
                            '${_mines.length} Mines',
                            style: const TextStyle(fontSize: 11, color: AppTheme.accentEmerald, fontWeight: FontWeight.bold),
                          ),
                        ],
                      ),
                      const SizedBox(height: 10),

                      if (_isLoading)
                        const Center(
                          child: Padding(
                            padding: EdgeInsets.all(20),
                            child: CircularProgressIndicator(color: AppTheme.accentEmerald),
                          ),
                        )
                      else if (_mines.isEmpty)
                        Container(
                          padding: const EdgeInsets.all(20),
                          alignment: Alignment.center,
                          child: const Text(
                            'No mines cached locally. Connect to network to load.',
                            style: TextStyle(fontSize: 12, color: AppTheme.textMuted),
                          ),
                        )
                      else
                        ..._mines.take(4).map((mine) {
                          return Container(
                            margin: const EdgeInsets.only(bottom: 8),
                            child: CustomCard(
                              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                              child: Row(
                                children: [
                                  Container(
                                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                                    decoration: BoxDecoration(
                                      color: AppTheme.bgSurface,
                                      borderRadius: BorderRadius.circular(6),
                                      border: Border.all(color: AppTheme.borderColor),
                                    ),
                                    child: Text(
                                      mine.mineCode,
                                      style: const TextStyle(
                                        fontSize: 11,
                                        fontWeight: FontWeight.bold,
                                        color: AppTheme.accentEmerald,
                                      ),
                                    ),
                                  ),
                                  const SizedBox(width: 12),
                                  Expanded(
                                    child: Column(
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      children: [
                                        Text(
                                          mine.name,
                                          style: const TextStyle(
                                            fontSize: 13,
                                            fontWeight: FontWeight.bold,
                                            color: AppTheme.textPrimary,
                                          ),
                                        ),
                                        Text(
                                          '${mine.subsidiary} • ${mine.district}, ${mine.state}',
                                          style: const TextStyle(fontSize: 10, color: AppTheme.textSecondary),
                                        ),
                                      ],
                                    ),
                                  ),
                                  Container(
                                    padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                                    decoration: BoxDecoration(
                                      color: AppTheme.getSeverityColor(mine.status == 'CRITICAL' ? 'CRITICAL' : mine.status == 'WARNING' ? 'HIGH' : 'LOW').withOpacity(0.15),
                                      borderRadius: BorderRadius.circular(4),
                                    ),
                                    child: Text(
                                      mine.status,
                                      style: TextStyle(
                                        fontSize: 9,
                                        fontWeight: FontWeight.bold,
                                        color: AppTheme.getSeverityColor(mine.status == 'CRITICAL' ? 'CRITICAL' : mine.status == 'WARNING' ? 'HIGH' : 'LOW'),
                                      ),
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          );
                        }).toList(),
                    ],
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
