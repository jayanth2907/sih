import 'package:flutter/material.dart';
import '../config/theme.dart';

class SeverityBadge extends StatelessWidget {
  final String severity;
  final bool isLarge;

  const SeverityBadge({
    Key? key,
    required this.severity,
    this.isLarge = false,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    final color = AppTheme.getSeverityColor(severity);

    return Container(
      padding: EdgeInsets.symmetric(
        horizontal: isLarge ? 10 : 8,
        vertical: isLarge ? 4 : 2,
      ),
      decoration: BoxDecoration(
        color: color.withOpacity(0.15),
        borderRadius: BorderRadius.circular(6),
        border: Border.all(color: color.withOpacity(0.4), width: 1),
      ),
      child: Text(
        severity.toUpperCase(),
        style: TextStyle(
          color: color,
          fontSize: isLarge ? 11 : 10,
          fontWeight: FontWeight.w800,
          letterSpacing: 0.5,
        ),
      ),
    );
  }
}
