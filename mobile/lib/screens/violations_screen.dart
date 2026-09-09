import 'package:flutter/material.dart';
import '../config/theme.dart';
import '../models/violation_model.dart';
import '../services/inspection_service.dart';
import '../widgets/custom_card.dart';
import '../widgets/severity_badge.dart';
import '../widgets/network_status_bar.dart';
import '../utils/date_formatter.dart';
import 'violation_detail_screen.dart';

class ViolationsScreen extends StatefulWidget {
  const ViolationsScreen({Key? key}) : super(key: key);

  @override
  State<ViolationsScreen> createState() => _ViolationsScreenState();
}

class _ViolationsScreenState extends State<ViolationsScreen> {
  List<ViolationModel> _violations = [];
  String _selectedStatus = 'ALL';
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadViolations();
  }

  Future<void> _loadViolations() async {
    setState(() => _isLoading = true);
    final list = await InspectionService.fetchViolations(
      status: _selectedStatus == 'ALL' ? null : _selectedStatus,
    );
    if (mounted) {
      setState(() {
        _violations = list;
        _isLoading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Safety Violations Register'),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh_rounded, color: AppTheme.textSecondary),
            onPressed: _loadViolations,
          ),
        ],
      ),
      body: SafeArea(
        child: Column(
          children: [
            const NetworkStatusBar(),

            // Filter Tabs
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
              decoration: const BoxDecoration(
                color: AppTheme.bgSurface,
                border: Border(bottom: BorderSide(color: AppTheme.borderColor)),
              ),
              child: SingleChildScrollView(
                scrollDirection: Axis.horizontal,
                child: Row(
                  children: ['ALL', 'OPEN', 'ESCALATED', 'RESOLVED', 'CLOSED'].map((st) {
                    final isSelected = _selectedStatus == st;
                    return Padding(
                      padding: const EdgeInsets.only(right: 8),
                      child: GestureDetector(
                        onTap: () {
                          setState(() => _selectedStatus = st);
                          _loadViolations();
                        },
                        child: Container(
                          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                          decoration: BoxDecoration(
                            color: isSelected ? AppTheme.accentEmerald.withOpacity(0.2) : AppTheme.bgCard,
                            borderRadius: BorderRadius.circular(8),
                            border: Border.all(
                              color: isSelected ? AppTheme.accentEmerald : AppTheme.borderColor,
                            ),
                          ),
                          child: Text(
                            st,
                            style: TextStyle(
                              fontSize: 11,
                              fontWeight: FontWeight.bold,
                              color: isSelected ? AppTheme.accentEmerald : AppTheme.textSecondary,
                            ),
                          ),
                        ),
                      ),
                    );
                  }).toList(),
                ),
              ),
            ),

            // Violations List
            Expanded(
              child: RefreshIndicator(
                onRefresh: _loadViolations,
                color: AppTheme.accentEmerald,
                backgroundColor: AppTheme.bgCard,
                child: _isLoading
                    ? const Center(child: CircularProgressIndicator(color: AppTheme.accentEmerald))
                    : _violations.isEmpty
                        ? const Center(
                            child: Text(
                              'No violations found in this view.',
                              style: TextStyle(color: AppTheme.textMuted, fontSize: 13),
                            ),
                          )
                        : ListView.builder(
                            padding: const EdgeInsets.all(16),
                            itemCount: _violations.length,
                            itemBuilder: (context, index) {
                              final viol = _violations[index];
                              return Container(
                                margin: const EdgeInsets.only(bottom: 10),
                                child: CustomCard(
                                  padding: const EdgeInsets.all(14),
                                  onTap: () {
                                    Navigator.push(
                                      context,
                                      MaterialPageRoute(
                                        builder: (_) => ViolationDetailScreen(violation: viol),
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
                                            viol.violationCode,
                                            style: const TextStyle(
                                              fontSize: 12,
                                              fontWeight: FontWeight.bold,
                                              fontFamily: 'monospace',
                                              color: AppTheme.accentEmerald,
                                            ),
                                          ),
                                          Row(
                                            children: [
                                              SeverityBadge(severity: viol.severity),
                                              const SizedBox(width: 6),
                                              Container(
                                                padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                                                decoration: BoxDecoration(
                                                  color: viol.status == 'ESCALATED'
                                                      ? AppTheme.statusCritical.withOpacity(0.15)
                                                      : AppTheme.bgSurface,
                                                  borderRadius: BorderRadius.circular(4),
                                                  border: Border.all(
                                                    color: viol.status == 'ESCALATED'
                                                        ? AppTheme.statusCritical.withOpacity(0.4)
                                                        : AppTheme.borderColor,
                                                  ),
                                                ),
                                                child: Text(
                                                  viol.status,
                                                  style: TextStyle(
                                                    fontSize: 9,
                                                    fontWeight: FontWeight.w800,
                                                    color: viol.status == 'ESCALATED'
                                                        ? AppTheme.statusCritical
                                                        : AppTheme.textSecondary,
                                                  ),
                                                ),
                                              ),
                                            ],
                                          ),
                                        ],
                                      ),
                                      const SizedBox(height: 8),
                                      Text(
                                        viol.title,
                                        style: const TextStyle(
                                          fontSize: 13,
                                          fontWeight: FontWeight.bold,
                                          color: AppTheme.textPrimary,
                                        ),
                                      ),
                                      const SizedBox(height: 4),
                                      Text(
                                        viol.description,
                                        maxLines: 2,
                                        overflow: TextOverflow.ellipsis,
                                        style: const TextStyle(fontSize: 11, color: AppTheme.textSecondary),
                                      ),
                                      const SizedBox(height: 10),
                                      Row(
                                        mainAxisAlignment: MainAxisAlignment.between,
                                        children: [
                                          Row(
                                            children: [
                                              const Icon(Icons.bolt_rounded, size: 14, color: AppTheme.statusMedium),
                                              const SizedBox(width: 4),
                                              Text(
                                                'Priority: ${viol.priorityScore.toStringAsFixed(1)}',
                                                style: const TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: AppTheme.textPrimary),
                                              ),
                                            ],
                                          ),
                                          if (viol.dueAt != null)
                                            Text(
                                              'Due: ${DateFormatter.formatDate(viol.dueAt)}',
                                              style: TextStyle(
                                                fontSize: 10,
                                                fontWeight: FontWeight.w600,
                                                color: viol.isEscalated ? AppTheme.statusCritical : AppTheme.textMuted,
                                              ),
                                            ),
                                        ],
                                      ),
                                    ],
                                  ),
                                ),
                              );
                            },
                          ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
