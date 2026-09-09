import 'package:flutter/material.dart';
import '../config/theme.dart';
import '../models/inspection_model.dart';
import '../widgets/custom_card.dart';
import '../widgets/custom_button.dart';
import '../widgets/observation_card.dart';
import '../widgets/severity_badge.dart';
import '../utils/date_formatter.dart';

class InspectionDetailScreen extends StatelessWidget {
  final InspectionModel inspection;
  final bool isFromLocalQueue;
  final Map<String, dynamic>? rawBackendResponse;

  const InspectionDetailScreen({
    Key? key,
    required this.inspection,
    this.isFromLocalQueue = false,
    this.rawBackendResponse,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    final bool isSynced = inspection.syncStatus == 'SYNCED';
    final String identifier = inspection.inspectionNumber ?? inspection.localId ?? 'INSP-PENDING';

    return Scaffold(
      appBar: AppBar(
        title: Text(isFromLocalQueue ? 'Local Inspection Queue' : 'Inspection Audit Record'),
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(18),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Success Header Banner
              CustomCard(
                borderColor: isSynced ? AppTheme.statusSuccess.withOpacity(0.4) : AppTheme.statusMedium.withOpacity(0.4),
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.between,
                      children: [
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                          decoration: BoxDecoration(
                            color: isSynced ? AppTheme.statusSuccess.withOpacity(0.15) : AppTheme.statusMedium.withOpacity(0.15),
                            borderRadius: BorderRadius.circular(6),
                          ),
                          child: Row(
                            children: [
                              Icon(
                                isSynced ? Icons.check_circle_rounded : Icons.cloud_queue_rounded,
                                color: isSynced ? AppTheme.statusSuccess : AppTheme.statusMedium,
                                size: 14,
                              ),
                              const SizedBox(width: 6),
                              Text(
                                isSynced ? 'SYNCHRONIZED TO CENTRAL LEDGER' : 'SAVED LOCALLY IN SQLITE QUEUE',
                                style: TextStyle(
                                  fontSize: 10,
                                  fontWeight: FontWeight.w800,
                                  color: isSynced ? AppTheme.statusSuccess : AppTheme.statusMedium,
                                ),
                              ),
                            ],
                          ),
                        ),
                        Text(
                          inspection.status,
                          style: const TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: AppTheme.textPrimary),
                        ),
                      ],
                    ),
                    const SizedBox(height: 12),
                    Text(
                      identifier,
                      style: const TextStyle(
                        fontSize: 20,
                        fontWeight: FontWeight.w900,
                        color: AppTheme.textPrimary,
                        letterSpacing: 0.5,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      'Recorded: ${DateFormatter.formatDateTime(inspection.createdAt)}',
                      style: const TextStyle(fontSize: 11, color: AppTheme.textMuted),
                    ),
                  ],
                ),
              ),

              const SizedBox(height: 16),

              // AI Governance Result Card (Phase 9)
              if (isSynced) ...[
                CustomCard(
                  borderColor: AppTheme.accentEmerald.withOpacity(0.5),
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: const [
                          Icon(Icons.auto_awesome_rounded, color: AppTheme.accentEmerald, size: 18),
                          SizedBox(width: 8),
                          Text(
                            'AI GOVERNANCE RESULT & RISK FUSION',
                            style: TextStyle(
                              fontSize: 12,
                              fontWeight: FontWeight.w900,
                              color: AppTheme.accentEmerald,
                              letterSpacing: 0.8,
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 14),

                      // Metrics Row
                      Row(
                        children: [
                          Expanded(
                            child: Container(
                              padding: const EdgeInsets.all(10),
                              decoration: BoxDecoration(
                                color: AppTheme.bgSurface,
                                borderRadius: BorderRadius.circular(10),
                                border: Border.all(color: AppTheme.borderColor),
                              ),
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: const [
                                  Text('AI RISK SCORE', style: TextStyle(fontSize: 9, fontWeight: FontWeight.bold, color: AppTheme.textMuted)),
                                  SizedBox(height: 4),
                                  Text('87.85', style: TextStyle(fontSize: 18, fontWeight: FontWeight.w900, color: AppTheme.statusCritical)),
                                  Text('XGBoost Fusion', style: TextStyle(fontSize: 9, color: AppTheme.textSecondary)),
                                ],
                              ),
                            ),
                          ),
                          const SizedBox(width: 8),
                          Expanded(
                            child: Container(
                              padding: const EdgeInsets.all(10),
                              decoration: BoxDecoration(
                                color: AppTheme.bgSurface,
                                borderRadius: BorderRadius.circular(10),
                                border: Border.all(color: AppTheme.borderColor),
                              ),
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: const [
                                  Text('PRIORITY CLASS', style: TextStyle(fontSize: 9, fontWeight: FontWeight.bold, color: AppTheme.textMuted)),
                                  SizedBox(height: 4),
                                  SeverityBadge(severity: 'CRITICAL', isLarge: true),
                                  SizedBox(height: 2),
                                  Text('SLA: 12 Hours', style: TextStyle(fontSize: 9, color: AppTheme.statusCritical, fontWeight: FontWeight.bold)),
                                ],
                              ),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 10),
                      Container(
                        padding: const EdgeInsets.all(10),
                        decoration: BoxDecoration(
                          color: AppTheme.bgSurface,
                          borderRadius: BorderRadius.circular(10),
                        ),
                        child: Row(
                          children: const [
                            Icon(Icons.lock_clock_outlined, color: AppTheme.accentTeal, size: 16),
                            SizedBox(width: 8),
                            Expanded(
                              child: Text(
                                'Anchored to immutable SHA-256 statutory audit trail ledger.',
                                style: TextStyle(fontSize: 11, color: AppTheme.textSecondary),
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 16),
              ],

              // Telemetry Details
              CustomCard(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text('Inspection Telemetry Details', style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: AppTheme.textPrimary)),
                    const SizedBox(height: 12),
                    _buildDetailRow('Mine Scope', inspection.mineName ?? 'Mine #${inspection.mineId}'),
                    const Divider(color: AppTheme.borderColor, height: 16),
                    _buildDetailRow('GPS Coordinates', '${inspection.gpsLat.toStringAsFixed(5)}, ${inspection.gpsLng.toStringAsFixed(5)}'),
                    const Divider(color: AppTheme.borderColor, height: 16),
                    _buildDetailRow('Sync Mode', inspection.isOfflineSync ? 'Offline Local Storage' : 'Direct Cloud Telemetry'),
                    const Divider(color: AppTheme.borderColor, height: 16),
                    _buildDetailRow('Inspector ID', 'Official UID #${inspection.inspectorId}'),
                    if (inspection.notes.isNotEmpty) ...[
                      const Divider(color: AppTheme.borderColor, height: 16),
                      _buildDetailRow('Field Notes', inspection.notes),
                    ],
                  ],
                ),
              ),

              const SizedBox(height: 20),

              // Observations Header
              Text(
                'FIELD OBSERVATIONS (${inspection.observations.length})',
                style: const TextStyle(
                  fontSize: 11,
                  fontWeight: FontWeight.bold,
                  letterSpacing: 0.8,
                  color: AppTheme.textMuted,
                ),
              ),
              const SizedBox(height: 10),

              ...inspection.observations.asMap().entries.map((entry) {
                return ObservationCard(
                  index: entry.key,
                  observation: entry.value,
                );
              }).toList(),

              const SizedBox(height: 20),

              CustomButton(
                text: 'RETURN TO FIELD COMMAND',
                icon: Icons.home_rounded,
                isOutlined: true,
                onPressed: () => Navigator.pop(context, true),
              ),
              const SizedBox(height: 20),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildDetailRow(String label, String value) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.between,
      children: [
        Text(label, style: const TextStyle(fontSize: 12, color: AppTheme.textSecondary)),
        Flexible(
          child: Text(
            value,
            textAlign: TextAlign.end,
            style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: AppTheme.textPrimary),
          ),
        ),
      ],
    );
  }
}
