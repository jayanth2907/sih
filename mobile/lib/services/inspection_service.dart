import 'dart:convert';
import '../config/api_config.dart';
import '../models/inspection_model.dart';
import '../models/mine_model.dart';
import '../models/regulation_model.dart';
import '../models/violation_model.dart';
import '../database/inspection_dao.dart';
import 'api_service.dart';

class InspectionService {
  // 1. Fetch Mines (Online with Local SQLite Cache fallback)
  static Future<List<MineModel>> fetchMines() async {
    try {
      final response = await ApiService.get(ApiConfig.minesUrl);
      if (response.statusCode == 200) {
        final List<dynamic> data = jsonDecode(response.body);
        final mines = data.map((item) => MineModel.fromJson(item as Map<String, dynamic>)).toList();
        await InspectionDao.cacheMines(mines);
        return mines;
      }
    } catch (_) {}
    // Offline fallback from SQLite
    return await InspectionDao.getCachedMines();
  }

  // 2. Fetch Regulations (Online with Local SQLite Cache fallback)
  static Future<List<RegulationModel>> fetchRegulations() async {
    try {
      final response = await ApiService.get(ApiConfig.regulationsUrl);
      if (response.statusCode == 200) {
        final List<dynamic> data = jsonDecode(response.body);
        final regulations = data.map((item) => RegulationModel.fromJson(item as Map<String, dynamic>)).toList();
        await InspectionDao.cacheRegulations(regulations);
        return regulations;
      }
    } catch (_) {}
    // Offline fallback from SQLite or default static regulations
    return await InspectionDao.getCachedRegulations();
  }

  // 3. Online Direct Inspection Submission
  static Future<Map<String, dynamic>> submitInspectionOnline(InspectionModel inspection) async {
    try {
      final payload = inspection.toApiJson();
      final response = await ApiService.post(
        ApiConfig.inspectionsUrl,
        body: payload,
      );

      if (response.statusCode == 200 || response.statusCode == 201) {
        final data = jsonDecode(response.body) as Map<String, dynamic>;
        return {
          'success': true,
          'inspection': InspectionModel.fromJson(data),
          'raw': data,
        };
      } else {
        String err = 'Backend rejected submission.';
        try {
          final errBody = jsonDecode(response.body);
          if (errBody['detail'] != null) err = errBody['detail'].toString();
        } catch (_) {}
        return {'success': false, 'error': err};
      }
    } catch (e) {
      return {'success': false, 'error': e.toString()};
    }
  }

  // 4. Batch Sync Endpoint (Syncs offline inspection queue)
  static Future<Map<String, dynamic>> syncBatch(List<InspectionModel> pendingInspections) async {
    try {
      final batchPayload = {
        'inspections': pendingInspections.map((i) => i.toBatchSyncJson()).toList(),
      };

      final response = await ApiService.post(
        ApiConfig.batchSyncUrl,
        body: batchPayload,
      );

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body) as Map<String, dynamic>;
        return {'success': true, 'data': data};
      } else {
        return {'success': false, 'error': 'Batch sync returned code ${response.statusCode}'};
      }
    } catch (e) {
      return {'success': false, 'error': e.toString()};
    }
  }

  // 5. Fetch Violations (Online with SQLite Cache fallback)
  static Future<List<ViolationModel>> fetchViolations({int? mineId, String? status}) async {
    try {
      String url = ApiConfig.violationsUrl;
      List<String> queryParams = [];
      if (mineId != null) queryParams.add('mine_id=$mineId');
      if (status != null && status.isNotEmpty) queryParams.add('status=$status');
      if (queryParams.isNotEmpty) {
        url += '?${queryParams.join('&')}';
      }

      final response = await ApiService.get(url);
      if (response.statusCode == 200) {
        final List<dynamic> data = jsonDecode(response.body);
        final violations = data.map((item) => ViolationModel.fromJson(item as Map<String, dynamic>)).toList();
        await InspectionDao.cacheViolations(violations);
        return violations;
      }
    } catch (_) {}
    return await InspectionDao.getCachedViolations();
  }

  // 6. Fetch Risk / SHAP Explanation
  static Future<Map<String, dynamic>?> fetchRiskExplanation(int violationId) async {
    try {
      final response = await ApiService.get(ApiConfig.violationExplanationUrl(violationId));
      if (response.statusCode == 200) {
        return jsonDecode(response.body) as Map<String, dynamic>;
      }
    } catch (_) {}
    return null;
  }
}
