class MineModel {
  final int id;
  final String mineCode;
  final String name;
  final String subsidiary;
  final String district;
  final String state;
  final double lat;
  final double lng;
  final double riskScore;
  final String status;
  final int reportingFrequencyExpected;
  final int reportingFrequencyActual;

  MineModel({
    required this.id,
    required this.mineCode,
    required this.name,
    required this.subsidiary,
    required this.district,
    required this.state,
    required this.lat,
    required this.lng,
    required this.riskScore,
    required this.status,
    required this.reportingFrequencyExpected,
    required this.reportingFrequencyActual,
  });

  factory MineModel.fromJson(Map<String, dynamic> json) {
    return MineModel(
      id: json['id'] as int? ?? 0,
      mineCode: json['mine_code'] as String? ?? '',
      name: json['name'] as String? ?? '',
      subsidiary: json['subsidiary'] as String? ?? '',
      district: json['district'] as String? ?? '',
      state: json['state'] as String? ?? '',
      lat: (json['lat'] as num?)?.toDouble() ?? 23.7466,
      lng: (json['lng'] as num?)?.toDouble() ?? 86.4162,
      riskScore: (json['risk_score'] as num?)?.toDouble() ?? 50.0,
      status: json['status'] as String? ?? 'OPERATIONAL',
      reportingFrequencyExpected: json['reporting_frequency_expected'] as int? ?? 10,
      reportingFrequencyActual: json['reporting_frequency_actual'] as int? ?? 0,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'mine_code': mineCode,
      'name': name,
      'subsidiary': subsidiary,
      'district': district,
      'state': state,
      'lat': lat,
      'lng': lng,
      'risk_score': riskScore,
      'status': status,
      'reporting_frequency_expected': reportingFrequencyExpected,
      'reporting_frequency_actual': reportingFrequencyActual,
    };
  }
}
