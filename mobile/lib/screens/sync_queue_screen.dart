import 'package:flutter/material.dart';
import '../config/theme.dart';
import '../database/inspection_dao.dart';
import '../models/inspection_model.dart';
import '../sync/sync_manager.dart';
import '../widgets/custom_button.dart';
import '../widgets/custom_card.dart';
import '../widgets/network_status_bar.dart';
import '../utils/date_formatter.dart';
import '../utils/toast_helper.dart';
import 'inspection_detail_screen.dart';

class SyncQueueScreen extends StatefulWidget {
  const SyncQueueScreen({Key? key}) : super(key: key);

  @override
  State<SyncQueueScreen> createState() => _SyncQueueScreenState();
}

class _SyncQueueScreenState extends State<SyncQueueScreen> {
  List<InspectionModel> _queue = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadQueue();
  }

  Future<void> _loadQueue() async {
    setState(() => _isLoading = true);
    final items = await InspectionDao.getAllLocalInspections();
    if (mounted) {
      setState(() {
        _queue = items;
        _isLoading = false;
      });
    }
  }

  Future<void> _triggerSync() async {
    final result = await SyncManager().syncPendingQueue();
    if (result['success'] == true) {
      ToastHelper.showSuccess(context, 'Sync completed: ${result['synced_count']} items updated.');
    } else {
      ToastHelper.showError(context, result['error'] ?? result['message'] ?? 'Sync failed.');
    }
    _loadQueue();
  }

  @override
  Widget build(BuildContext context) {
    final pendingCount = _queue.where((i) => i.syncStatus == 'PENDING' || i.syncStatus == 'FAILED').length;
    final syncedCount = _queue.where((i) => i.syncStatus == 'SYNCED').length;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Offline Sync Queue'),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh_rounded, color: AppTheme.textSecondary),
            onPressed: _loadQueue,
          ),
        ],
      ),
      body: SafeArea(
        child: Column(
          children: [
            const NetworkStatusBar(),
            Expanded(
              child: RefreshIndicator(
                onRefresh: _loadQueue,
                color: AppTheme.accentEmerald,
                backgroundColor: AppTheme.bgCard,
                child: SingleChildScrollView(
                  physics: const AlwaysScrollableScrollPhysics(),
                  padding: const EdgeInsets.all(18),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      // Overview Banner
                      CustomCard(
                        padding: const EdgeInsets.all(16),
                        child: Row(
                          children: [
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  const Text('QUEUE STATUS', style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: AppTheme.textMuted)),
                                  const SizedBox(height: 4),
                                  Text(
                                    pendingCount > 0 ? '$pendingCount Pending Upload' : 'All Records Synced',
                                    style: TextStyle(
                                      fontSize: 16,
                                      fontWeight: FontWeight.w800,
                                      color: pendingCount > 0 ? AppTheme.statusMedium : AppTheme.statusSuccess,
                                    ),
                                  ),
                                  const SizedBox(height: 2),
                                  Text(
                                    '$syncedCount synced • ${_queue.length} total local records',
                                    style: const TextStyle(fontSize: 11, color: AppTheme.textSecondary),
                                  ),
                                ],
                              ),
                            ),
                            if (pendingCount > 0)
                              ValueListenableBuilder<SyncState>(
                                valueListenable: SyncManager().stateNotifier,
                                builder: (context, state, _) {
                                  return CustomButton(
                                    text: 'SYNC NOW',
                                    height: 40,
                                    isLoading: state == SyncState.syncing,
                                    onPressed: _triggerSync,
                                  );
                                },
                              ),
                          ],
                        ),
                      ),

                      const SizedBox(height: 20),

                      // Queue List
                      Row(
                        mainAxisAlignment: MainAxisAlignment.between,
                        children: [
                          const Text(
                            'LOCAL AUDIT QUEUE',
                            style: TextStyle(
                              fontSize: 11,
                              fontWeight: FontWeight.bold,
                              letterSpacing: 0.8,
                              color: AppTheme.textMuted,
                            ),
                          ),
                          Text(
                            '${_queue.length} Records',
                            style: const TextStyle(fontSize: 11, color: AppTheme.accentEmerald, fontWeight: FontWeight.bold),
                          ),
                        ],
                      ),
                      const SizedBox(height: 10),

                      if (_isLoading)
                        const Center(child: Padding(padding: EdgeInsets.all(20), child: CircularProgressIndicator(color: AppTheme.accentEmerald)))
                      else if (_queue.isEmpty)
                        CustomCard(
                          padding: const EdgeInsets.all(30),
                          child: Column(
                            children: const [
                              Icon(Icons.inbox_outlined, color: AppTheme.textMuted, size: 40),
                              SizedBox(height: 10),
                              Text('No local inspections in queue', style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: AppTheme.textSecondary)),
                              SizedBox(height: 4),
                              Text('Inspections recorded offline will appear here.', style: TextStyle(fontSize: 11, color: AppTheme.textMuted)),
                            ],
                          ),
                        )
                      else
                        ..._queue.map((item) {
                          final isSynced = item.syncStatus == 'SYNCED';
                          final isFailed = item.syncStatus == 'FAILED';
                          Color statusColor = isSynced
                              ? AppTheme.statusSuccess
                              : isFailed
                                  ? AppTheme.statusCritical
                                  : AppTheme.statusMedium;

                          return Container(
                            margin: const EdgeInsets.only(bottom: 10),
                            child: CustomCard(
                              padding: const EdgeInsets.all(14),
                              onTap: () {
                                Navigator.push(
                                  context,
                                  MaterialPageRoute(
                                    builder: (_) => InspectionDetailScreen(
                                      inspection: item,
                                      isFromLocalQueue: true,
                                    ),
                                  ),
                                );
                              },
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Row(
                                    mainAxisAlignment: MainAxisAlignment.between,
                                    children: [
                                      Text(
                                        item.localId ?? 'LOCAL-ITEM',
                                        style: const TextStyle(
                                          fontSize: 13,
                                          fontWeight: FontWeight.bold,
                                          fontFamily: 'monospace',
                                          color: AppTheme.textPrimary,
                                        ),
                                      ),
                                      Container(
                                        padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                                        decoration: BoxDecoration(
                                          color: statusColor.withOpacity(0.15),
                                          borderRadius: BorderRadius.circular(4),
                                          border: Border.all(color: statusColor.withOpacity(0.4)),
                                        ),
                                        child: Text(
                                          item.syncStatus,
                                          style: TextStyle(
                                            fontSize: 9,
                                            fontWeight: FontWeight.w800,
                                            color: statusColor,
                                          ),
                                        ),
                                      ),
                                    ],
                                  ),
                                  const SizedBox(height: 6),
                                  Text(
                                    item.mineName ?? 'Mine #${item.mineId}',
                                    style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: AppTheme.textSecondary),
                                  ),
                                  const SizedBox(height: 2),
                                  Row(
                                    mainAxisAlignment: MainAxisAlignment.between,
                                    children: [
                                      Text(
                                        '${item.observations.length} observation(s) • Coords: ${item.gpsLat.toStringAsFixed(3)}, ${item.gpsLng.toStringAsFixed(3)}',
                                        style: const TextStyle(fontSize: 10, color: AppTheme.textMuted),
                                      ),
                                      Text(
                                        DateFormatter.formatDate(item.createdAt),
                                        style: const TextStyle(fontSize: 10, color: AppTheme.textMuted),
                                      ),
                                    ],
                                  ),
                                  if (item.retryCount > 0 && !isSynced) ...[
                                    const SizedBox(height: 6),
                                    Text(
                                      'Retry count: ${item.retryCount}',
                                      style: const TextStyle(fontSize: 10, color: AppTheme.statusCritical, fontWeight: FontWeight.bold),
                                    ),
                                  ],
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
