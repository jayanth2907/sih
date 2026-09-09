import 'package:sqflite/sqflite.dart';
import '../models/inspection_model.dart';
import '../models/observation_model.dart';
import '../models/mine_model.dart';
import '../models/regulation_model.dart';
import '../models/violation_model.dart';
import 'app_database.dart';

class InspectionDao {
  // Save an inspection locally to SQLite queue
  static Future<int> insertInspection(InspectionModel inspection) async {
    final db = await AppDatabase.database;
    final now = DateTime.now().toIso8601String();
    final localId = inspection.localId ?? 'LOCAL-${DateTime.now().millisecondsSinceEpoch}';

    return await db.transaction((txn) async {
      final inspId = await txn.insert(
        'local_inspections',
        {
          'local_id': localId,
          'server_id': inspection.inspectionNumber,
          'mine_id': inspection.mineId,
          'mine_name': inspection.mineName,
          'inspector_id': inspection.inspectorId,
          'status': inspection.status,
          'gps_lat': inspection.gpsLat,
          'gps_lng': inspection.gpsLng,
          'notes': inspection.notes,
          'is_offline_sync': 1,
          'sync_status': inspection.syncStatus,
          'retry_count': inspection.retryCount,
          'created_at': inspection.createdAt ?? now,
          'updated_at': now,
        },
        conflictAlgorithm: ConflictAlgorithm.replace,
      );

      for (var obs in inspection.observations) {
        await txn.insert(
          'local_observations',
          {
            'local_inspection_id': localId,
            'regulation_id': obs.regulationId,
            'regulation_code': obs.regulationCode,
            'severity': obs.severity,
            'description': obs.description,
            'evidence_url': obs.evidenceUrl,
            'local_image_path': obs.localImagePath,
            'is_violation': obs.isViolation ? 1 : 0,
          },
          conflictAlgorithm: ConflictAlgorithm.replace,
        );
      }

      return inspId;
    });
  }

  // Get all inspections in local queue
  static Future<List<InspectionModel>> getAllLocalInspections() async {
    final db = await AppDatabase.database;
    final inspectionRows = await db.query(
      'local_inspections',
      orderBy: 'created_at DESC',
    );

    List<InspectionModel> results = [];
    for (var row in inspectionRows) {
      final localId = row['local_id'] as String;
      final obsRows = await db.query(
        'local_observations',
        where: 'local_inspection_id = ?',
        whereArgs: [localId],
      );

      final observations = obsRows.map((o) => ObservationModel(
        id: o['id'] as int?,
        regulationId: o['regulation_id'] as int,
        regulationCode: o['regulation_code'] as String?,
        severity: o['severity'] as String,
        description: o['description'] as String,
        evidenceUrl: o['evidence_url'] as String?,
        localImagePath: o['local_image_path'] as String?,
        isViolation: (o['is_violation'] as int) == 1,
      )).toList();

      results.add(InspectionModel(
        id: row['id'] as int?,
        localId: localId,
        inspectionNumber: row['server_id'] as String?,
        mineId: row['mine_id'] as int,
        mineName: row['mine_name'] as String?,
        inspectorId: row['inspector_id'] as int,
        status: row['status'] as String,
        gpsLat: (row['gps_lat'] as num).toDouble(),
        gpsLng: (row['gps_lng'] as num).toDouble(),
        notes: row['notes'] as String? ?? '',
        isOfflineSync: (row['is_offline_sync'] as int) == 1,
        syncStatus: row['sync_status'] as String,
        retryCount: row['retry_count'] as int,
        createdAt: row['created_at'] as String?,
        updatedAt: row['updated_at'] as String?,
        observations: observations,
      ));
    }

    return results;
  }

  // Get only pending/failed inspections ready for sync
  static Future<List<InspectionModel>> getPendingInspections() async {
    final all = await getAllLocalInspections();
    return all.where((i) => i.syncStatus == 'PENDING' || i.syncStatus == 'FAILED').toList();
  }

  // Count pending inspections
  static Future<int> getPendingCount() async {
    final db = await AppDatabase.database;
    final result = await db.rawQuery(
      "SELECT COUNT(*) as cnt FROM local_inspections WHERE sync_status = 'PENDING' OR sync_status = 'FAILED'"
    );
    return Sqflite.firstIntValue(result) ?? 0;
  }

  // Update sync status of a local inspection
  static Future<void> updateSyncStatus({
    required String localId,
    required String syncStatus,
    String? serverId,
    bool incrementRetry = false,
  }) async {
    final db = await AppDatabase.database;
    final now = DateTime.now().toIso8601String();

    Map<String, dynamic> values = {
      'sync_status': syncStatus,
      'updated_at': now,
    };

    if (serverId != null) {
      values['server_id'] = serverId;
    }

    if (incrementRetry) {
      await db.rawUpdate(
        'UPDATE local_inspections SET sync_status = ?, retry_count = retry_count + 1, updated_at = ? WHERE local_id = ?',
        [syncStatus, now, localId],
      );
    } else {
      await db.update(
        'local_inspections',
        values,
        where: 'local_id = ?',
        whereArgs: [localId],
      );
    }
  }

  // Cache mines for offline access
  static Future<void> cacheMines(List<MineModel> mines) async {
    final db = await AppDatabase.database;
    await db.transaction((txn) async {
      await txn.delete('cached_mines');
      for (var m in mines) {
        await txn.insert('cached_mines', m.toJson());
      }
    });
  }

  static Future<List<MineModel>> getCachedMines() async {
    final db = await AppDatabase.database;
    final rows = await db.query('cached_mines');
    return rows.map((r) => MineModel.fromJson(r)).toList();
  }

  // Cache regulations for offline access
  static Future<void> cacheRegulations(List<RegulationModel> regulations) async {
    final db = await AppDatabase.database;
    await db.transaction((txn) async {
      await txn.delete('cached_regulations');
      for (var r in regulations) {
        await txn.insert('cached_regulations', r.toJson());
      }
    });
  }

  static Future<List<RegulationModel>> getCachedRegulations() async {
    final db = await AppDatabase.database;
    final rows = await db.query('cached_regulations');
    if (rows.isEmpty) {
      return RegulationModel.defaultFallbackRegulations;
    }
    return rows.map((r) => RegulationModel.fromJson(r)).toList();
  }

  // Cache violations for offline access
  static Future<void> cacheViolations(List<ViolationModel> violations) async {
    final db = await AppDatabase.database;
    await db.transaction((txn) async {
      await txn.delete('cached_violations');
      for (var v in violations) {
        await txn.insert('cached_violations', {
          'id': v.id,
          'violation_code': v.violationCode,
          'mine_id': v.mineId,
          'regulation_id': v.regulationId,
          'severity': v.severity,
          'status': v.status,
          'title': v.title,
          'description': v.description,
          'priority_score': v.priorityScore,
          'ml_probability': v.mlProbability,
          'recurrence_count': v.recurrenceCount,
          'peer_percentile': v.peerPercentile,
          'reporting_drift': v.reportingDrift,
          'external_discrepancy': v.externalDiscrepancy ? 1 : 0,
          'due_at': v.dueAt,
          'is_escalated': v.isEscalated ? 1 : 0,
          'created_at': v.createdAt,
        });
      }
    });
  }

  static Future<List<ViolationModel>> getCachedViolations() async {
    final db = await AppDatabase.database;
    final rows = await db.query('cached_violations', orderBy: 'id DESC');
    return rows.map((r) => ViolationModel(
      id: r['id'] as int,
      violationCode: r['violation_code'] as String,
      mineId: r['mine_id'] as int,
      regulationId: r['regulation_id'] as int? ?? 1,
      severity: r['severity'] as String,
      status: r['status'] as String,
      title: r['title'] as String,
      description: r['description'] as String? ?? '',
      priorityScore: (r['priority_score'] as num).toDouble(),
      mlProbability: (r['ml_probability'] as num).toDouble(),
      recurrenceCount: r['recurrence_count'] as int? ?? 0,
      peerPercentile: (r['peer_percentile'] as num).toDouble(),
      reportingDrift: (r['reporting_drift'] as num).toDouble(),
      externalDiscrepancy: (r['external_discrepancy'] as int) == 1,
      dueAt: r['due_at'] as String?,
      isEscalated: (r['is_escalated'] as int) == 1,
      createdAt: r['created_at'] as String?,
    )).toList();
  }
}
