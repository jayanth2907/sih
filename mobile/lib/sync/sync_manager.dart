import 'dart:async';
import 'package:flutter/foundation.dart';
import '../database/inspection_dao.dart';
import '../services/connectivity_service.dart';
import '../services/inspection_service.dart';

enum SyncState { idle, syncing, success, error }

class SyncManager {
  static final SyncManager _instance = SyncManager._internal();
  factory SyncManager() => _instance;
  SyncManager._internal();

  final ValueNotifier<SyncState> stateNotifier = ValueNotifier<SyncState>(SyncState.idle);
  final ValueNotifier<int> pendingCountNotifier = ValueNotifier<int>(0);
  final ValueNotifier<String?> lastSyncMessageNotifier = ValueNotifier<String?>(null);

  bool _isSyncRunning = false;

  void initialize() {
    _refreshPendingCount();

    // Listen to network transitions: auto sync on internet restoration
    ConnectivityService().statusNotifier.addListener(() {
      if (ConnectivityService().isOnline) {
        syncPendingQueue();
      }
    });
  }

  Future<void> _refreshPendingCount() async {
    final count = await InspectionDao.getPendingCount();
    pendingCountNotifier.value = count;
  }

  Future<Map<String, dynamic>> syncPendingQueue() async {
    if (_isSyncRunning) {
      return {'success': false, 'message': 'Sync already in progress.'};
    }

    final isOnline = await ConnectivityService().forceCheck();
    if (!isOnline) {
      stateNotifier.value = SyncState.error;
      lastSyncMessageNotifier.value = 'Cannot sync: Device is offline.';
      return {'success': false, 'message': 'Device is offline.'};
    }

    final pendingList = await InspectionDao.getPendingInspections();
    if (pendingList.isEmpty) {
      stateNotifier.value = SyncState.idle;
      await _refreshPendingCount();
      return {'success': true, 'synced_count': 0, 'message': 'All local records are synchronized.'};
    }

    _isSyncRunning = true;
    stateNotifier.value = SyncState.syncing;
    lastSyncMessageNotifier.value = 'Synchronizing ${pendingList.length} local inspection(s)...';

    try {
      // Mark all pending as SYNCING in local db
      for (var item in pendingList) {
        if (item.localId != null) {
          await InspectionDao.updateSyncStatus(
            localId: item.localId!,
            syncStatus: 'SYNCING',
          );
        }
      }

      // Call existing backend batch sync endpoint
      final syncResult = await InspectionService.syncBatch(pendingList);

      if (syncResult['success'] == true) {
        final data = syncResult['data'] as Map<String, dynamic>;
        final syncedItems = (data['synced_items'] as List<dynamic>?) ?? [];

        for (var item in syncedItems) {
          final localId = item['local_id'] as String?;
          final serverId = item['server_id'] as String?;
          final status = item['sync_status'] as String? ?? 'SYNCED';

          if (localId != null) {
            await InspectionDao.updateSyncStatus(
              localId: localId,
              syncStatus: status,
              serverId: serverId,
            );
          }
        }

        stateNotifier.value = SyncState.success;
        lastSyncMessageNotifier.value = 'Successfully synced ${syncedItems.length} inspection(s) to central audit chain.';
        await _refreshPendingCount();
        _isSyncRunning = false;
        return {'success': true, 'synced_count': syncedItems.length};
      } else {
        // Mark failed with incremented retry count
        for (var item in pendingList) {
          if (item.localId != null) {
            await InspectionDao.updateSyncStatus(
              localId: item.localId!,
              syncStatus: 'FAILED',
              incrementRetry: true,
            );
          }
        }

        stateNotifier.value = SyncState.error;
        lastSyncMessageNotifier.value = syncResult['error'] ?? 'Synchronization failed.';
        await _refreshPendingCount();
        _isSyncRunning = false;
        return {'success': false, 'error': syncResult['error']};
      }
    } catch (e) {
      for (var item in pendingList) {
        if (item.localId != null) {
          await InspectionDao.updateSyncStatus(
            localId: item.localId!,
            syncStatus: 'FAILED',
            incrementRetry: true,
          );
        }
      }
      stateNotifier.value = SyncState.error;
      lastSyncMessageNotifier.value = 'Sync error: $e';
      await _refreshPendingCount();
      _isSyncRunning = false;
      return {'success': false, 'error': e.toString()};
    }
  }
}
