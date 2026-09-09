import 'dart:io';
import 'package:flutter/material.dart';
import '../config/theme.dart';
import '../models/observation_model.dart';
import 'severity_badge.dart';

class ObservationCard extends StatelessWidget {
  final ObservationModel observation;
  final int index;
  final VoidCallback? onRemove;

  const ObservationCard({
    Key? key,
    required this.observation,
    required this.index,
    this.onRemove,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: AppTheme.bgSurface,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: AppTheme.borderColor),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.between,
            children: [
              Row(
                children: [
                  Container(
                    width: 24,
                    height: 24,
                    alignment: Alignment.center,
                    decoration: BoxDecoration(
                      color: AppTheme.bgCard,
                      borderRadius: BorderRadius.circular(6),
                      border: Border.all(color: AppTheme.borderColor),
                    ),
                    child: Text(
                      '#${index + 1}',
                      style: const TextStyle(
                        fontSize: 11,
                        fontWeight: FontWeight.bold,
                        color: AppTheme.accentEmerald,
                      ),
                    ),
                  ),
                  const SizedBox(width: 8),
                  if (observation.regulationCode != null)
                    Text(
                      observation.regulationCode!,
                      style: const TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.bold,
                        color: AppTheme.textPrimary,
                      ),
                    ),
                ],
              ),
              Row(
                children: [
                  SeverityBadge(severity: observation.severity),
                  if (onRemove != null) ...[
                    const SizedBox(width: 8),
                    GestureDetector(
                      onTap: onRemove,
                      child: const Icon(
                        Icons.delete_outline_rounded,
                        color: AppTheme.statusCritical,
                        size: 20,
                      ),
                    ),
                  ],
                ],
              ),
            ],
          ),
          const SizedBox(height: 10),
          Text(
            observation.description,
            style: const TextStyle(
              fontSize: 13,
              color: AppTheme.textSecondary,
              height: 1.4,
            ),
          ),
          if (observation.localImagePath != null) ...[
            const SizedBox(height: 10),
            ClipRRect(
              borderRadius: BorderRadius.circular(10),
              child: Image.file(
                File(observation.localImagePath!),
                height: 120,
                width: double.infinity,
                fit: BoxFit.cover,
                errorBuilder: (_, __, ___) => Container(
                  height: 60,
                  color: AppTheme.bgCard,
                  alignment: Alignment.center,
                  child: const Text('Photo Evidence Attached', style: TextStyle(fontSize: 11, color: AppTheme.textMuted)),
                ),
              ),
            ),
          ],
        ],
      ),
    );
  }
}
