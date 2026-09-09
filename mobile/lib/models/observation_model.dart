class ObservationModel {
  final int? id;
  final int regulationId;
  final String severity;
  final String description;
  final String? evidenceUrl;
  final String? localImagePath;
  final bool isViolation;
  final String? regulationCode;

  ObservationModel({
    this.id,
    required this.regulationId,
    required this.severity,
    required this.description,
    this.evidenceUrl,
    this.localImagePath,
    this.isViolation = true,
    this.regulationCode,
  });

  factory ObservationModel.fromJson(Map<String, dynamic> json) {
    return ObservationModel(
      id: json['id'] as int?,
      regulationId: json['regulation_id'] as int? ?? 1,
      severity: json['severity'] as String? ?? 'HIGH',
      description: json['description'] as String? ?? '',
      evidenceUrl: json['evidence_url'] as String?,
      localImagePath: json['local_image_path'] as String?,
      isViolation: json['is_violation'] as bool? ?? true,
      regulationCode: json['regulation_code'] as String?,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'regulation_id': regulationId,
      'severity': severity,
      'description': description,
      'evidence_url': evidenceUrl ?? (localImagePath != null ? 'file://$localImagePath' : null),
      'local_image_path': localImagePath,
      'is_violation': isViolation,
      'regulation_code': regulationCode,
    };
  }

  Map<String, dynamic> toApiJson() {
    return {
      'regulation_id': regulationId,
      'severity': severity,
      'description': description,
      'evidence_url': evidenceUrl ?? 'https://images.unsplash.com/photo-1578575437130-527eed3abbec?auto=format&fit=crop&w=600&q=80',
      'is_violation': isViolation,
    };
  }
}
