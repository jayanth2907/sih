import 'dart:io';
import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import '../config/app_constants.dart';
import '../config/theme.dart';
import '../models/inspection_model.dart';
import '../models/mine_model.dart';
import '../models/observation_model.dart';
import '../models/regulation_model.dart';
import '../services/auth_service.dart';
import '../services/connectivity_service.dart';
import '../services/inspection_service.dart';
import '../services/location_service.dart';
import '../database/inspection_dao.dart';
import '../sync/sync_manager.dart';
import '../widgets/custom_button.dart';
import '../widgets/custom_card.dart';
import '../widgets/network_status_bar.dart';
import '../widgets/observation_card.dart';
import '../widgets/severity_badge.dart';
import '../utils/toast_helper.dart';
import 'inspection_detail_screen.dart';

class NewInspectionScreen extends StatefulWidget {
  const NewInspectionScreen({Key? key}) : super(key: key);

  @override
  State<NewInspectionScreen> createState() => _NewInspectionScreenState();
}

class _NewInspectionScreenState extends State<NewInspectionScreen> {
  final _notesController = TextEditingController();
  final ImagePicker _picker = ImagePicker();

  List<MineModel> _mines = [];
  MineModel? _selectedMine;
  List<RegulationModel> _regulations = [];

  // GPS state
  double _lat = 23.7466;
  double _lng = 86.4162;
  bool _isFetchingGps = true;
  String _gpsStatus = 'Acquiring GPS location...';
  bool _isMockGps = false;

  // Observations list
  final List<ObservationModel> _observations = [];

  bool _isSubmitting = false;

  @override
  void initState() {
    super.initState();
    _initData();
    _fetchGpsLocation();
  }

  @override
  void dispose() {
    _notesController.dispose();
    super.dispose();
  }

  Future<void> _initData() async {
    final mines = await InspectionService.fetchMines();
    final regs = await InspectionService.fetchRegulations();

    setState(() {
      _mines = mines;
      _regulations = regs;

      // Auto-select user assigned mine or first mine
      final user = AuthService.currentUser;
      if (user?.mineId != null) {
        _selectedMine = mines.firstWhere(
          (m) => m.id == user!.mineId,
          orElse: () => mines.isNotEmpty ? mines.first : MineModel(
            id: 1,
            mineCode: 'MINE-C',
            name: 'Mine C - Singrauli Block-B',
            subsidiary: 'NCL',
            district: 'Singrauli',
            state: 'Madhya Pradesh',
            lat: 24.2012,
            lng: 82.6644,
            riskScore: 87.85,
            status: 'CRITICAL',
            reportingFrequencyExpected: 10,
            reportingFrequencyActual: 3,
          ),
        );
      } else if (mines.isNotEmpty) {
        _selectedMine = mines.first;
      }
    });
  }

  Future<void> _fetchGpsLocation() async {
    setState(() {
      _isFetchingGps = true;
      _gpsStatus = 'Acquiring high-precision GPS satellite fix...';
    });

    final result = await LocationService.getCurrentLocation();

    if (mounted) {
      setState(() {
        _lat = result.latitude;
        _lng = result.longitude;
        _isMockGps = result.isMockOrFallback;
        _isFetchingGps = false;
        _gpsStatus = _isMockGps
            ? 'Default Field Coords: ${_lat.toStringAsFixed(4)}, ${_lng.toStringAsFixed(4)}'
            : 'GPS Locked: ${_lat.toStringAsFixed(5)}, ${_lng.toStringAsFixed(5)} (±${result.accuracy.toStringAsFixed(1)}m)';
      });
    }
  }

  void _showAddObservationDialog() {
    int selectedRegId = _regulations.isNotEmpty ? _regulations.first.id : 1;
    String selectedRegCode = _regulations.isNotEmpty ? _regulations.first.code : 'CMR-104';
    String selectedSeverity = AppConstants.severityHigh;
    final descController = TextEditingController(text: 'Observed non-compliance during physical bench verification.');
    String? capturedImagePath;

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: AppTheme.bgCard,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
        side: BorderSide(color: AppTheme.borderColor),
      ),
      builder: (ctx) => StatefulBuilder(
        builder: (context, setModalState) {
          return Padding(
            padding: EdgeInsets.only(
              bottom: MediaQuery.of(context).viewInsets.bottom + 20,
              left: 20,
              right: 20,
              top: 20,
            ),
            child: SingleChildScrollView(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.between,
                    children: [
                      const Text(
                        'Add Field Observation',
                        style: TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.bold,
                          color: AppTheme.textPrimary,
                        ),
                      ),
                      IconButton(
                        icon: const Icon(Icons.close, color: AppTheme.textMuted),
                        onPressed: () => Navigator.pop(ctx),
                      ),
                    ],
                  ),
                  const SizedBox(height: 14),

                  // Regulation Selector
                  const Text('Statutory Regulation (CMR 2017)', style: TextStyle(fontSize: 12, color: AppTheme.textSecondary)),
                  const SizedBox(height: 6),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 12),
                    decoration: BoxDecoration(
                      color: AppTheme.bgSurface,
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: AppTheme.borderColor),
                    ),
                    child: DropdownButtonHideUnderline(
                      child: DropdownButton<int>(
                        value: selectedRegId,
                        isExpanded: true,
                        dropdownColor: AppTheme.bgCard,
                        items: _regulations.map((reg) {
                          return DropdownMenuItem<int>(
                            value: reg.id,
                            child: Text(
                              '${reg.code} — ${reg.title}',
                              overflow: TextOverflow.ellipsis,
                              style: const TextStyle(fontSize: 12, color: AppTheme.textPrimary),
                            ),
                          );
                        }).toList(),
                        onChanged: (val) {
                          if (val != null) {
                            final reg = _regulations.firstWhere((r) => r.id == val);
                            setModalState(() {
                              selectedRegId = val;
                              selectedRegCode = reg.code;
                            });
                          }
                        },
                      ),
                    ),
                  ),

                  const SizedBox(height: 14),

                  // Severity Selector Chips
                  const Text('Severity Level', style: TextStyle(fontSize: 12, color: AppTheme.textSecondary)),
                  const SizedBox(height: 6),
                  Row(
                    children: AppConstants.severityLevels.map((sev) {
                      final isSelected = selectedSeverity == sev;
                      final color = AppTheme.getSeverityColor(sev);
                      return Expanded(
                        child: GestureDetector(
                          onTap: () => setModalState(() => selectedSeverity = sev),
                          child: Container(
                            margin: const EdgeInsets.symmetric(horizontal: 3),
                            padding: const EdgeInsets.symmetric(vertical: 8),
                            alignment: Alignment.center,
                            decoration: BoxDecoration(
                              color: isSelected ? color.withOpacity(0.2) : AppTheme.bgSurface,
                              borderRadius: BorderRadius.circular(8),
                              border: Border.all(
                                color: isSelected ? color : AppTheme.borderColor,
                                width: isSelected ? 1.5 : 1,
                              ),
                            ),
                            child: Text(
                              sev,
                              style: TextStyle(
                                fontSize: 10,
                                fontWeight: FontWeight.bold,
                                color: isSelected ? color : AppTheme.textMuted,
                              ),
                            ),
                          ),
                        ),
                      );
                    }).toList(),
                  ),

                  const SizedBox(height: 14),

                  // Description
                  const Text('Observation Notes & Description', style: TextStyle(fontSize: 12, color: AppTheme.textSecondary)),
                  const SizedBox(height: 6),
                  TextField(
                    controller: descController,
                    maxLines: 3,
                    style: const TextStyle(fontSize: 13, color: AppTheme.textPrimary),
                    decoration: const InputDecoration(
                      hintText: 'Describe physical violation, bench drift, or safety hazard...',
                    ),
                  ),

                  const SizedBox(height: 14),

                  // Photo Evidence Capture
                  const Text('Photo Evidence (Camera / Gallery)', style: TextStyle(fontSize: 12, color: AppTheme.textSecondary)),
                  const SizedBox(height: 8),

                  if (capturedImagePath != null) ...[
                    Stack(
                      children: [
                        ClipRRect(
                          borderRadius: BorderRadius.circular(12),
                          child: Image.file(
                            File(capturedImagePath!),
                            height: 120,
                            width: double.infinity,
                            fit: BoxFit.cover,
                          ),
                        ),
                        Positioned(
                          top: 6,
                          right: 6,
                          child: GestureDetector(
                            onTap: () => setModalState(() => capturedImagePath = null),
                            child: Container(
                              padding: const EdgeInsets.all(4),
                              decoration: const BoxDecoration(
                                color: Colors.black54,
                                shape: BoxShape.circle,
                              ),
                              child: const Icon(Icons.close, color: Colors.white, size: 16),
                            ),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 10),
                  ] else ...[
                    Row(
                      children: [
                        Expanded(
                          child: OutlinedButton.icon(
                            icon: const Icon(Icons.camera_alt_outlined, size: 18),
                            label: const Text('Capture Photo', style: TextStyle(fontSize: 12)),
                            style: OutlinedButton.styleFrom(
                              foregroundColor: AppTheme.accentEmerald,
                              side: const BorderSide(color: AppTheme.borderColor),
                              padding: const EdgeInsets.symmetric(vertical: 12),
                            ),
                            onPressed: () async {
                              try {
                                final photo = await _picker.pickImage(
                                  source: ImageSource.camera,
                                  imageQuality: 80,
                                );
                                if (photo != null) {
                                  setModalState(() => capturedImagePath = photo.path);
                                }
                              } catch (e) {
                                ToastHelper.showError(context, 'Camera access failed.');
                              }
                            },
                          ),
                        ),
                        const SizedBox(width: 8),
                        Expanded(
                          child: OutlinedButton.icon(
                            icon: const Icon(Icons.photo_library_outlined, size: 18),
                            label: const Text('Pick Image', style: TextStyle(fontSize: 12)),
                            style: OutlinedButton.styleFrom(
                              foregroundColor: AppTheme.textSecondary,
                              side: const BorderSide(color: AppTheme.borderColor),
                              padding: const EdgeInsets.symmetric(vertical: 12),
                            ),
                            onPressed: () async {
                              try {
                                final photo = await _picker.pickImage(
                                  source: ImageSource.gallery,
                                  imageQuality: 80,
                                );
                                if (photo != null) {
                                  setModalState(() => capturedImagePath = photo.path);
                                }
                              } catch (_) {}
                            },
                          ),
                        ),
                      ],
                    ),
                  ],

                  const SizedBox(height: 20),

                  // Confirm Add Button
                  CustomButton(
                    text: 'ADD TO INSPECTION',
                    icon: Icons.check_circle_outline_rounded,
                    onPressed: () {
                      if (descController.text.trim().isEmpty) {
                        ToastHelper.showError(context, 'Please enter an observation description.');
                        return;
                      }

                      setState(() {
                        _observations.add(ObservationModel(
                          regulationId: selectedRegId,
                          regulationCode: selectedRegCode,
                          severity: selectedSeverity,
                          description: descController.text.trim(),
                          localImagePath: capturedImagePath,
                          isViolation: true,
                        ));
                      });

                      Navigator.pop(ctx);
                      ToastHelper.showSuccess(context, 'Observation added.');
                    },
                  ),
                ],
              ),
            ),
          );
        },
      ),
    );
  }

  Future<void> _submitInspection({required bool forceOffline}) async {
    if (_selectedMine == null) {
      ToastHelper.showError(context, 'Please select a mine for this inspection.');
      return;
    }

    if (_observations.isEmpty) {
      ToastHelper.showError(context, 'Please add at least one observation.');
      return;
    }

    setState(() => _isSubmitting = true);

    final localId = 'LOCAL-${DateTime.now().millisecondsSinceEpoch}';
    final user = AuthService.currentUser;

    final inspection = InspectionModel(
      localId: localId,
      mineId: _selectedMine!.id,
      mineName: _selectedMine!.name,
      inspectorId: user?.id ?? 1,
      gpsLat: _lat,
      gpsLng: _lng,
      notes: _notesController.text.trim(),
      isOfflineSync: forceOffline || !ConnectivityService().isOnline,
      syncStatus: (forceOffline || !ConnectivityService().isOnline) ? 'PENDING' : 'SYNCED',
      observations: _observations,
      createdAt: DateTime.now().toIso8601String(),
    );

    // If offline or forced offline: save into SQLite queue
    if (forceOffline || !ConnectivityService().isOnline) {
      await InspectionDao.insertInspection(inspection);
      await SyncManager().syncPendingQueue(); // will check and update pending count

      if (mounted) {
        setState(() => _isSubmitting = false);
        ToastHelper.showSuccess(context, 'OFFLINE — Inspection saved in local queue.');
        Navigator.pushReplacement(
          context,
          MaterialPageRoute(
            builder: (_) => InspectionDetailScreen(
              inspection: inspection,
              isFromLocalQueue: true,
            ),
          ),
        );
      }
      return;
    }

    // Direct Online Submission via FastAPI
    final submitResult = await InspectionService.submitInspectionOnline(inspection);

    if (submitResult['success'] == true) {
      final serverInspection = submitResult['inspection'] as InspectionModel;

      // Save a synced copy locally for offline archive
      await InspectionDao.insertInspection(
        serverInspection.copyWith(
          localId: localId,
          syncStatus: 'SYNCED',
          mineName: _selectedMine!.name,
        ),
      );

      if (mounted) {
        setState(() => _isSubmitting = false);
        ToastHelper.showSuccess(context, 'Inspection #${serverInspection.inspectionNumber} submitted to central ledger!');
        Navigator.pushReplacement(
          context,
          MaterialPageRoute(
            builder: (_) => InspectionDetailScreen(
              inspection: serverInspection,
              rawBackendResponse: submitResult['raw'],
            ),
          ),
        );
      }
    } else {
      // Fallback: save to SQLite queue on network error
      await InspectionDao.insertInspection(inspection.copyWith(syncStatus: 'PENDING'));
      if (mounted) {
        setState(() => _isSubmitting = false);
        ToastHelper.showInfo(context, 'Online submission failed. Saved to local queue for automatic background sync.');
        Navigator.pushReplacement(
          context,
          MaterialPageRoute(
            builder: (_) => InspectionDetailScreen(
              inspection: inspection,
              isFromLocalQueue: true,
            ),
          ),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('New Field Inspection'),
        actions: [
          IconButton(
            icon: const Icon(Icons.gps_fixed_rounded, color: AppTheme.accentEmerald),
            tooltip: 'Re-acquire GPS fix',
            onPressed: _fetchGpsLocation,
          ),
        ],
      ),
      body: SafeArea(
        child: Column(
          children: [
            const NetworkStatusBar(),
            Expanded(
              child: SingleChildScrollView(
                padding: const EdgeInsets.all(18),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // GPS Telemetry Banner
                    CustomCard(
                      borderColor: _isMockGps ? AppTheme.statusMedium.withOpacity(0.4) : AppTheme.accentEmerald.withOpacity(0.4),
                      padding: const EdgeInsets.all(14),
                      child: Row(
                        children: [
                          Container(
                            padding: const EdgeInsets.all(8),
                            decoration: BoxDecoration(
                              color: (_isMockGps ? AppTheme.statusMedium : AppTheme.accentEmerald).withOpacity(0.15),
                              borderRadius: BorderRadius.circular(10),
                            ),
                            child: _isFetchingGps
                                ? const SizedBox(
                                    width: 18,
                                    height: 18,
                                    child: CircularProgressIndicator(strokeWidth: 2, color: AppTheme.accentEmerald),
                                  )
                                : Icon(
                                    _isMockGps ? Icons.location_searching_rounded : Icons.my_location_rounded,
                                    color: _isMockGps ? AppTheme.statusMedium : AppTheme.accentEmerald,
                                    size: 20,
                                  ),
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                const Text(
                                  'GPS LOCATION TELEMETRY',
                                  style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, letterSpacing: 0.5, color: AppTheme.textMuted),
                                ),
                                const SizedBox(height: 2),
                                Text(
                                  _gpsStatus,
                                  style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: AppTheme.textPrimary),
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                    ),

                    const SizedBox(height: 16),

                    // Mine Target Selector
                    const Text('Target Mine Facility', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: AppTheme.textSecondary)),
                    const SizedBox(height: 6),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 4),
                      decoration: BoxDecoration(
                        color: AppTheme.bgCard,
                        borderRadius: BorderRadius.circular(14),
                        border: Border.all(color: AppTheme.borderColor),
                      ),
                      child: DropdownButtonHideUnderline(
                        child: DropdownButton<MineModel>(
                          value: _selectedMine,
                          isExpanded: true,
                          dropdownColor: AppTheme.bgCard,
                          hint: const Text('Select target mine...', style: TextStyle(fontSize: 13, color: AppTheme.textMuted)),
                          items: _mines.map((mine) {
                            return DropdownMenuItem<MineModel>(
                              value: mine,
                              child: Text(
                                '${mine.mineCode} — ${mine.name} (${mine.subsidiary})',
                                overflow: TextOverflow.ellipsis,
                                style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: AppTheme.textPrimary),
                              ),
                            );
                          }).toList(),
                          onChanged: (val) => setState(() => _selectedMine = val),
                        ),
                      ),
                    ),

                    const SizedBox(height: 16),

                    // General Notes
                    const Text('General Inspection Notes', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: AppTheme.textSecondary)),
                    const SizedBox(height: 6),
                    TextField(
                      controller: _notesController,
                      maxLines: 2,
                      style: const TextStyle(fontSize: 13, color: AppTheme.textPrimary),
                      decoration: const InputDecoration(
                        hintText: 'Enter shift, seam number, weather, or routine inspection notes...',
                      ),
                    ),

                    const SizedBox(height: 20),

                    // Observations Section Header
                    Row(
                      mainAxisAlignment: MainAxisAlignment.between,
                      children: [
                        Text(
                          'OBSERVATIONS (${_observations.length})',
                          style: const TextStyle(
                            fontSize: 11,
                            fontWeight: FontWeight.bold,
                            letterSpacing: 0.8,
                            color: AppTheme.textMuted,
                          ),
                        ),
                        GestureDetector(
                          onTap: _showAddObservationDialog,
                          child: Container(
                            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                            decoration: BoxDecoration(
                              color: AppTheme.accentEmerald.withOpacity(0.15),
                              borderRadius: BorderRadius.circular(6),
                              border: Border.all(color: AppTheme.accentEmerald.withOpacity(0.4)),
                            ),
                            child: Row(
                              children: const [
                                Icon(Icons.add, color: AppTheme.accentEmerald, size: 14),
                                SizedBox(width: 4),
                                Text(
                                  'ADD OBSERVATION',
                                  style: TextStyle(
                                    fontSize: 10,
                                    fontWeight: FontWeight.w800,
                                    color: AppTheme.accentEmerald,
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ),
                      ],
                    ),

                    const SizedBox(height: 12),

                    if (_observations.isEmpty)
                      CustomCard(
                        padding: const EdgeInsets.all(24),
                        child: Column(
                          children: [
                            const Icon(Icons.rule_folder_outlined, color: AppTheme.textMuted, size: 36),
                            const SizedBox(height: 10),
                            const Text(
                              'No observations added yet',
                              style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: AppTheme.textSecondary),
                            ),
                            const SizedBox(height: 4),
                            const Text(
                              'Record non-compliance findings, ventilation data, or safety hazards.',
                              textAlign: TextAlign.center,
                              style: TextStyle(fontSize: 11, color: AppTheme.textMuted),
                            ),
                            const SizedBox(height: 14),
                            OutlinedButton.icon(
                              icon: const Icon(Icons.add_circle_outline_rounded, size: 16),
                              label: const Text('Add First Observation'),
                              onPressed: _showAddObservationDialog,
                            ),
                          ],
                        ),
                      )
                    else
                      ..._observations.asMap().entries.map((entry) {
                        return ObservationCard(
                          index: entry.key,
                          observation: entry.value,
                          onRemove: () => setState(() => _observations.removeAt(entry.key)),
                        );
                      }).toList(),

                    const SizedBox(height: 24),

                    // Submission Buttons
                    CustomButton(
                      text: 'SUBMIT INSPECTION TO CENTRAL LEDGER',
                      icon: Icons.send_rounded,
                      isLoading: _isSubmitting,
                      onPressed: () => _submitInspection(forceOffline: false),
                    ),

                    const SizedBox(height: 10),

                    CustomButton(
                      text: 'SAVE OFFLINE TO LOCAL QUEUE',
                      icon: Icons.save_alt_rounded,
                      isOutlined: true,
                      color: AppTheme.statusMedium,
                      isLoading: _isSubmitting,
                      onPressed: () => _submitInspection(forceOffline: true),
                    ),

                    const SizedBox(height: 20),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
