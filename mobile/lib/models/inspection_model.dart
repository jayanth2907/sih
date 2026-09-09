import 'observation_model.dart';

class InspectionModel {
  final int? id;
  final String? localId;
  final String? inspectionNumber;
  final int mineId;
  final String? mineName;
  final int inspectorId;
  final String status;
  final double gpsLat;
  final double gpsLng;
  final String notes;
  final bool isOfflineSync;
  final String syncStatus;
  final int retryCount;
  final String? createdAt;
  final String? updatedAt;
  final List<ObservationModel> observations;

  InspectionModel({
    this.id,
    this.localId,
    this.inspectionNumber,
    required this.mineId,
    this.mineName,
    this.inspectorId = 1,
    this.status = 'COMPLETED',
    required this.gpsLat,
    required this.gpsLng,
    this.notes = '',
    this.isOfflineSync = false,
    this.syncStatus = 'PENDING',
    this.retryCount = 0,
    this.createdAt,
    this.updatedAt,
    this.observations = const [],
  });

  factory InspectionModel.fromJson(Map<String, dynamic> json) {
    var obsList = <ObservationModel>[];
    if (json['observations'] != null) {
      obsList = (json['observations'] as List<dynamic>)
          .map((item) => ObservationModel.fromJson(item as Map<String, dynamic>))
          .toList();
    }

    return InspectionModel(
      id: json['id'] as int?,
      localId: json['local_id'] as String?,
      inspectionNumber: json['inspection_number'] as String?,
      mineId: json['mine_id'] as int? ?? 1,
      mineName: json['mine_name'] as String?,
      inspectorId: json['inspector_id'] as int? ?? 1,
      status: json['status'] as String? ?? 'COMPLETED',
      gpsLat: (json['gps_lat'] as num?)?.toDouble() ?? 0.0,
      gpsLng: (json['gps_lng'] as num?)?.toDouble() ?? 0.0,
      notes: json['notes'] as String? ?? '',
      isOfflineSync: json['is_offline_sync'] as bool? ?? false,
      syncStatus: json['sync_status'] as String? ?? 'PENDING',
      retryCount: json['retry_count'] as int? ?? 0,
      createdAt: json['created_at']?.toString(),
      updatedAt: json['updated_at']?.toString(),
      observations: obsList,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'local_id': localId,
      'inspection_number': inspectionNumber,
      'mine_id': mineId,
      'mine_name': mineName,
      'inspector_id': inspectorId,
      'status': status,
      'gps_lat': gpsLat,
      'gps_lng': gpsLng,
      'notes': notes,
      'is_offline_sync': isOfflineSync,
      'sync_status': syncStatus,
      'retry_count': retryCount,
      'created_at': createdAt,
      'updated_at': updatedAt,
      'observations': observations.map((e) => e.toJson()).toList(),
    };
  }

  Map<String, dynamic> toApiJson() {
    return {
      'mine_id': mineId,
      'gps_lat': gpsLat,
      'gps_lng': gpsLng,
      'notes': notes,
      'is_offline_sync': isOfflineSync,
      'observations': observations.map((e) => e.toApiJson()).toList(),
    };
  }

  Map<String, dynamic> toBatchSyncJson() {
    return {
      'local_id': localId ?? 'LOCAL-${DateTime.now().millisecondsSinceEpoch}',
      'mine_id': mineId,
      'inspector_id': inspectorId,
      'gps_lat': gpsLat,
      'gps_lng': gpsLng,
      'notes': notes,
      'observations': observations.map((e) => e.toApiJson()).toList(),
    };
  }

  InspectionModel copyWith({
    int? id,
    String? localId,
    String? inspectionNumber,
    int? mineId,
    String? mineName,
    int? inspectorId,
    String? status,
    double? gpsLat,
    double? gpsLng,
    String? notes,
    bool? isOfflineSync,
    String? syncStatus,
    int? retryCount,
    String? createdAt,
    String? updatedAt,
    List<ObservationModel>? observations,
  }) {
    return InspectionModel(
      id: id ?? this.id,
      localId: localId ?? this.localId,
      inspectionNumber: inspectionNumber ?? this.inspectionNumber,
      mineId: mineId ?? this.mineId,
      mineName: mineName ?? this.mineName,
      inspectorId: inspectorId ?? this.inspectorId,
      status: status ?? this.status,
      gpsLat: gpsLat ?? this.gpsLat,
      gpsLng: gpsLng ?? this.gpsLng,
      notes: notes ?? this.notes,
      isOfflineSync: isOfflineSync ?? this.isOfflineSync,
      syncStatus: syncStatus ?? this.syncStatus,
      retryCount: retryCount ?? this.retryCount,
      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
      observations: observations ?? this.observations,
    );
  }
}
