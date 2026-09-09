class RegulationModel {
  final int id;
  final String code;
  final String title;
  final String category;
  final int responseSlaHours;

  RegulationModel({
    required this.id,
    required this.code,
    required this.title,
    required this.category,
    required this.responseSlaHours,
  });

  factory RegulationModel.fromJson(Map<String, dynamic> json) {
    return RegulationModel(
      id: json['id'] as int? ?? 1,
      code: json['code'] as String? ?? 'REG-GENERIC',
      title: json['title'] as String? ?? 'Statutory Safety Regulation',
      category: json['category'] as String? ?? 'SAFETY',
      responseSlaHours: json['response_sla_hours'] as int? ?? 48,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'code': code,
      'title': title,
      'category': category,
      'response_sla_hours': responseSlaHours,
    };
  }

  // Pre-cached statutory fallback list for offline use
  static List<RegulationModel> get defaultFallbackRegulations => [
    RegulationModel(
      id: 1,
      code: 'CMR-104',
      title: 'Continuous Mechanical Ventilation & Gas Telemetry',
      category: 'VENTILATION',
      responseSlaHours: 12,
    ),
    RegulationModel(
      id: 2,
      code: 'CMR-108',
      title: 'Slope Stability & Bench Height Ratio Compliance',
      category: 'GEOTECHNICAL',
      responseSlaHours: 24,
    ),
    RegulationModel(
      id: 3,
      code: 'CMR-115',
      title: 'Haul Road Width, Berm Height & Dust Suppression',
      category: 'HAUL_ROAD',
      responseSlaHours: 48,
    ),
    RegulationModel(
      id: 4,
      code: 'CMR-124',
      title: 'Mandatory Personal Protective Equipment (PPE) Deployment',
      category: 'PPE',
      responseSlaHours: 24,
    ),
    RegulationModel(
      id: 5,
      code: 'CMR-142',
      title: 'Explosives Magazine Security & Controlled Blasting Protocol',
      category: 'EXPLOSIVES',
      responseSlaHours: 12,
    ),
    RegulationModel(
      id: 6,
      code: 'CMR-155',
      title: 'Ground Support & Roof Bolting Density Standard',
      category: 'GROUND_CONTROL',
      responseSlaHours: 24,
    ),
  ];
}
