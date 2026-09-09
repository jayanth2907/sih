import 'package:flutter/material.dart';
import '../config/theme.dart';
import '../services/connectivity_service.dart';
import '../sync/sync_manager.dart';

class NetworkStatusBar extends StatelessWidget {
  const NetworkStatusBar({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return ValueListenableBuilder<NetworkStatus>(
      valueListenable: ConnectivityService().statusNotifier,
      builder: (context, networkStatus, _) {
        return ValueListenableBuilder<SyncState>(
          valueListenable: SyncManager().stateNotifier,
          builder: (context, syncState, _) {
            return ValueListenableBuilder<int>(
              valueListenable: SyncManager().pendingCountNotifier,
              builder: (context, pendingCount, _) {
                final bool isOffline = networkStatus == NetworkStatus.offline;
                final bool isSyncing = syncState == SyncState.syncing;

                Color bgColor;
                Color textColor;
                IconData icon;
                String label;

                if (isSyncing) {
                  bgColor = AppTheme.statusInfo.withOpacity(0.15);
                  textColor = AppTheme.statusInfo;
                  icon = Icons.sync_rounded;
                  label = 'SYNCING LOCAL QUEUE ($pendingCount)...';
                } else if (isOffline) {
                  bgColor = AppTheme.statusCritical.withOpacity(0.15);
                  textColor = AppTheme.statusCritical;
                  icon = Icons.cloud_off_rounded;
                  label = pendingCount > 0
                      ? 'OFFLINE — $pendingCount INSPECTION(S) QUEUED'
                      : 'OFFLINE MODE (LOCAL STORAGE)';
                } else if (pendingCount > 0) {
                  bgColor = AppTheme.statusMedium.withOpacity(0.15);
                  textColor = AppTheme.statusMedium;
                  icon = Icons.cloud_upload_outlined;
                  label = 'ONLINE — $pendingCount PENDING SYNC';
                } else {
                  bgColor = AppTheme.accentEmerald.withOpacity(0.15);
                  textColor = AppTheme.accentEmerald;
                  icon = Icons.cloud_done_rounded;
                  label = 'ONLINE — CENTRAL LEDGER CONNECTED';
                }

                return Container(
                  width: double.infinity,
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                  decoration: BoxDecoration(
                    color: bgColor,
                    border: Border(
                      bottom: BorderSide(color: textColor.withOpacity(0.3), width: 1),
                    ),
                  ),
                  child: Row(
                    children: [
                      isSyncing
                          ? SizedBox(
                              width: 14,
                              height: 14,
                              child: CircularProgressIndicator(
                                strokeWidth: 2,
                                color: textColor,
                              ),
                            )
                          : Icon(icon, color: textColor, size: 16),
                      const SizedBox(width: 8),
                      Expanded(
                        child: Text(
                          label,
                          style: TextStyle(
                            color: textColor,
                            fontSize: 11,
                            fontWeight: FontWeight.w700,
                            letterSpacing: 0.5,
                          ),
                        ),
                      ),
                      if (pendingCount > 0 && !isSyncing && !isOffline)
                        GestureDetector(
                          onTap: () => SyncManager().syncPendingQueue(),
                          child: Container(
                            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                            decoration: BoxDecoration(
                              color: textColor.withOpacity(0.2),
                              borderRadius: BorderRadius.circular(6),
                              border: Border.all(color: textColor.withOpacity(0.5)),
                            ),
                            child: Text(
                              'SYNC NOW',
                              style: TextStyle(
                                color: textColor,
                                fontSize: 10,
                                fontWeight: FontWeight.w800,
                              ),
                            ),
                          ),
                        ),
                    ],
                  ),
                );
              },
            );
          },
        );
      },
    );
  }
}
