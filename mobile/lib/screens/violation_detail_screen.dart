import 'package:flutter/material.dart';
import '../config/theme.dart';
import '../models/violation_model.dart';
import '../services/inspection_service.dart';
import '../widgets/custom_card.dart';
import '../widgets/severity_badge.dart';
import '../utils/date_formatter.dart';

class ViolationDetailScreen extends StatefulWidget {
  final ViolationModel violation;

  const ViolationDetailScreen({Key? key, required this.violation}) : super(key: key);

  @override
  State<ViolationDetailScreen> createState() => _ViolationDetailScreenState();
}

class _ViolationDetailScreenState extends State<ViolationDetailScreen> {
  Map<String, dynamic>? _shapExplanation;
  bool _isLoadingShap = true;

  @override
  void initState() {
    super.initState();
    _loadShapExplanation();
  }

  Future<void> _loadShapExplanation() async {
    final res = await InspectionService.fetchRiskExplanation(widget.violation.id);
    if (mounted) {
      setState(() {
        _shapExplanation = res;
        _isLoadingShap = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final v = widget.violation;

    return Scaffold(
      appBar: AppBar(
        title: Text(v.violationCode),
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(18),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Header Card
              CustomCard(
                borderColor: v.isEscalated ? AppTheme.statusCritical.withOpacity(0.5) : AppTheme.borderColor,
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.between,
                      children: [
                        SeverityBadge(severity: v.severity, isLarge: true),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                          decoration: BoxDecoration(
                            color: v.status == 'ESCALATED' ? AppTheme.statusCritical.withOpacity(0.15) : AppTheme.bgSurface,
                            borderRadius: BorderRadius.circular(6),
                            border: Border.all(
                              color: v.status == 'ESCALATED' ? AppTheme.statusCritical.withOpacity(0.4) : AppTheme.borderColor,
                            ),
                          ),
                          child: Text(
                            v.status,
                            style: TextStyle(
                              fontSize: 10,
                              fontWeight: FontWeight.bold,
                              color: v.status == 'ESCALATED' ? AppTheme.statusCritical : AppTheme.textPrimary,
                            ),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 12),
                    Text(
                      v.title,
                      style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: AppTheme.textPrimary),
                    ),
                    const SizedBox(height: 8),
                    Text(
                      v.description,
                      style: const TextStyle(fontSize: 13, color: AppTheme.textSecondary, height: 1.4),
                    ),
                  ],
                ),
              ),

              const SizedBox(height: 16),

              // AI Risk Priority Card
              CustomCard(
                borderColor: AppTheme.accentEmerald.withOpacity(0.4),
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: const [
                        Icon(Icons.psychology_outlined, color: AppTheme.accentEmerald, size: 20),
                        SizedBox(width: 8),
                        Text(
                          'AI PRIORITY & SHAP EXPLAINABILITY',
                          style: TextStyle(
                            fontSize: 11,
                            fontWeight: FontWeight.w900,
                            letterSpacing: 0.8,
                            color: AppTheme.accentEmerald,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 14),

                    Row(
                      children: [
                        Expanded(
                          child: Container(
                            padding: const EdgeInsets.all(12),
                            decoration: BoxDecoration(
                              color: AppTheme.bgSurface,
                              borderRadius: BorderRadius.circular(10),
                            ),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                const Text('UNIFIED SCORE', style: TextStyle(fontSize: 9, color: AppTheme.textMuted, fontWeight: FontWeight.bold)),
                                const SizedBox(height: 4),
                                Text(
                                  v.priorityScore.toStringAsFixed(1),
                                  style: const TextStyle(fontSize: 22, fontWeight: FontWeight.w900, color: AppTheme.statusCritical),
                                ),
                              ],
                            ),
                          ),
                        ),
                        const SizedBox(width: 10),
                        Expanded(
                          child: Container(
                            padding: const EdgeInsets.all(12),
                            decoration: BoxDecoration(
                              color: AppTheme.bgSurface,
                              borderRadius: BorderRadius.circular(10),
                            ),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                const Text('ML PROBABILITY', style: TextStyle(fontSize: 9, color: AppTheme.textMuted, fontWeight: FontWeight.bold)),
                                const SizedBox(height: 4),
                                Text(
                                  '${(v.mlProbability * 100).toStringAsFixed(1)}%',
                                  style: const TextStyle(fontSize: 22, fontWeight: FontWeight.w900, color: AppTheme.statusHigh),
                                ),
                              ],
                            ),
                          ),
                        ),
                      ],
                    ),

                    const SizedBox(height: 14),

                    if (_isLoadingShap)
                      const Center(child: Padding(padding: EdgeInsets.all(10), child: CircularProgressIndicator(color: AppTheme.accentEmerald)))
                    else if (_shapExplanation != null) ...[
                      const Text(
                        'Top Feature Drivers (SHAP Attribution)',
                        style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: AppTheme.textSecondary),
                      ),
                      const SizedBox(height: 8),
                      ...((_shapExplanation!['top_drivers'] as List<dynamic>?) ?? []).map((driver) {
                        return Container(
                          margin: const EdgeInsets.only(bottom: 6),
                          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                          decoration: BoxDecoration(
                            color: AppTheme.bgSurface,
                            borderRadius: BorderRadius.circular(8),
                          ),
                          child: Row(
                            mainAxisAlignment: MainAxisAlignment.between,
                            children: [
                              Text(
                                driver['feature']?.toString() ?? 'Feature',
                                style: const TextStyle(fontSize: 11, color: AppTheme.textPrimary),
                              ),
                              Text(
                                '+${driver['impact']?.toString() ?? "0"}%',
                                style: const TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: AppTheme.statusCritical),
                              ),
                            ],
                          ),
                        );
                      }).toList(),
                    ],
                  ],
                ),
              ),

              const SizedBox(height: 16),

              // Compliance & SLA Metadata
              CustomCard(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text('Statutory Enforcement Metadata', style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: AppTheme.textPrimary)),
                    const SizedBox(height: 12),
                    _buildMetaRow('Recurrence Count', '${v.recurrenceCount} times'),
                    const Divider(color: AppTheme.borderColor, height: 16),
                    _buildMetaRow('Peer Percentile', '${v.peerPercentile.toStringAsFixed(1)}th percentile'),
                    const Divider(color: AppTheme.borderColor, height: 16),
                    _buildMetaRow('Reporting Drift', '${(v.reportingDrift * 100).toStringAsFixed(1)}%'),
                    const Divider(color: AppTheme.borderColor, height: 16),
                    _buildMetaRow('External Discrepancy', v.externalDiscrepancy ? 'YES (Flagged)' : 'NONE'),
                    const Divider(color: AppTheme.borderColor, height: 16),
                    _buildMetaRow('Remediation SLA Due', DateFormatter.formatDateTime(v.dueAt)),
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

  Widget _buildMetaRow(String label, String value) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.between,
      children: [
        Text(label, style: const TextStyle(fontSize: 12, color: AppTheme.textSecondary)),
        Text(value, style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: AppTheme.textPrimary)),
      ],
    );
  }
}
