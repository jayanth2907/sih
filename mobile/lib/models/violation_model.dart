class ViolationModel {
  final int id;
  final String violationCode;
  final int mineId;
  final int regulationId;
  final String severity;
  final String status;
  final String title;
  final String description;
  final double priorityScore;
  final double mlProbability;
  final int recurrenceCount;
  final double peerPercentile;
  final double reportingDrift;
  final bool externalDiscrepancy;
  final String? dueAt;
  final bool isEscalated;
  final String? createdAt;

  ViolationModel({
    required this.id,
    required this.violationCode,
    required this.mineId,
    required this.regulationId,
    required this.severity,
    required this.status,
    required this.title,
    required this.description,
    required this.priorityScore,
    required this.mlProbability,
    required this.recurrenceCount,
    required this.peerPercentile,
    required this.reportingDrift,
    required this.externalDiscrepancy,
    this.dueAt,
    required this.isEscalated,
    this.createdAt,
  });

  factory ViolationModel.fromJson(Map<String, dynamic> json) {
    return ViolationModel(
      id: json['id'] as int? ?? 0,
      violationCode: json['violation_code'] as String? ?? 'VIOL-UNKNOWN',
      mineId: json['mine_id'] as int? ?? 1,
      regulationId: json['regulation_id'] as int? ?? 1,
      severity: json['severity'] as String? ?? 'HIGH',
      status: json['status'] as String? ?? 'OPEN',
      title: json['title'] as String? ?? 'Safety Compliance Violation',
      description: json['description'] as String? ?? '',
      priorityScore: (json['priority_score'] as num?)?.toDouble() ?? 50.0,
      mlProbability: (json['ml_probability'] as num?)?.toDouble() ?? 0.5,
      recurrenceCount: json['recurrence_count'] as int? ?? 0,
      peerPercentile: (json['peer_percentile'] as num?)?.toDouble() ?? 50.0,
      reportingDrift: (json['reporting_drift'] as num?)?.toDouble() ?? 0.0,
      externalDiscrepancy: json['external_discrepancy'] as bool? ?? false,
      dueAt: json['due_at']?.toString(),
      isEscalated: json['is_escalated'] as bool? ?? false,
      createdAt: json['created_at']?.toString(),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'violation_code': violationCode,
      'mine_id': mineId,
      'regulation_id': regulationId,
      'severity': severity,
      'status': status,
      'title': title,
      'description': description,
      'priority_score': priorityScore,
      'ml_probability': mlProbability,
      'recurrence_count': recurrenceCount,
      'peer_percentile': peerPercentile,
      'reporting_drift': reportingDrift,
      'external_discrepancy': externalDiscrepancy,
      'due_at': dueAt,
      'is_escalated': isEscalated,
      'created_at': createdAt,
    };
  }
}
