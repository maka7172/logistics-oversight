import 'package:flutter/material.dart';
import '../../core/theme/app_theme.dart';

class RookPageHeader extends StatelessWidget {
  const RookPageHeader(this.title, {super.key, this.subtitle});
  final String title;
  final String? subtitle;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.fromLTRB(16, 12, 16, 12),
      decoration: const BoxDecoration(
        gradient: LinearGradient(
          colors: [AppTheme.brandSoft, AppTheme.surface],
          begin: Alignment.topRight,
          end: Alignment.bottomLeft,
        ),
        border: Border(bottom: BorderSide(color: AppTheme.border)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(title, style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w800, color: AppTheme.ink)),
          if (subtitle != null) ...[
            const SizedBox(height: 4),
            Text(subtitle!, style: const TextStyle(fontSize: 12, color: AppTheme.muted)),
          ],
        ],
      ),
    );
  }
}

class RookSectionCard extends StatelessWidget {
  const RookSectionCard({super.key, required this.child, this.padding = const EdgeInsets.all(14)});
  final Widget child;
  final EdgeInsets padding;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: padding,
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppTheme.border),
        boxShadow: [
          BoxShadow(color: AppTheme.brand.withOpacity(0.04), blurRadius: 16, offset: const Offset(0, 6)),
        ],
      ),
      child: child,
    );
  }
}

class RookStatusChip extends StatelessWidget {
  const RookStatusChip(this.label, {super.key, this.color});
  final String label;
  final Color? color;

  @override
  Widget build(BuildContext context) {
    final c = color ?? AppTheme.brand;
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: c.withOpacity(0.12),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: c.withOpacity(0.25)),
      ),
      child: Text(label, style: TextStyle(color: c, fontSize: 11, fontWeight: FontWeight.w700)),
    );
  }
}
