import 'package:flutter/material.dart';
import '../../../core/api/api_client.dart';
import '../../../core/theme/app_theme.dart';
import '../../../core/utils/jalali.dart';
import '../../../shared/widgets/rook_ui.dart';
import '../location/location_service.dart';

class DriverShiftsPage extends StatefulWidget {
  const DriverShiftsPage({super.key});
  @override
  State<DriverShiftsPage> createState() => _DriverShiftsPageState();
}

class _DriverShiftsPageState extends State<DriverShiftsPage> {
  final api = ApiClient();
  List shifts = [];
  bool loading = true;
  String? error;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() {
      loading = true;
      error = null;
    });
    try {
      final data = await api.get('/shifts');
      final list = data is List ? List.from(data) : <dynamic>[];
      setState(() {
        shifts = list;
        loading = false;
      });
    } catch (e) {
      setState(() {
        error = e.toString();
        loading = false;
      });
    }
  }

  Future<void> _start(String id) async {
    try {
      await api.post('/shifts/$id/start');
      LocationService.instance.setShiftId(id);
      await _load();
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('شیفت شروع شد — ارسال موقعیت فعال است')),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('$e')));
      }
    }
  }

  Future<void> _close(String id) async {
    final result = await showDialog<int>(
      context: context,
      builder: (ctx) {
        final ctrl = TextEditingController(text: '0');
        return AlertDialog(
          title: const Text('بستن شیفت'),
          content: TextField(
            controller: ctrl,
            keyboardType: TextInputType.number,
            decoration: const InputDecoration(labelText: 'نقد گزارش‌شده (ریال)'),
          ),
          actions: [
            TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('انصراف')),
            FilledButton(
              onPressed: () => Navigator.pop(ctx, int.tryParse(ctrl.text.trim()) ?? 0),
              child: const Text('بستن'),
            ),
          ],
        );
      },
    );
    if (result == null) return;
    try {
      await api.post('/shifts/$id/close', body: {'closingCashReported': result});
      LocationService.instance.setShiftId(null);
      await _load();
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('شیفت بسته شد')));
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('$e')));
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        const RookPageHeader('شیفت‌های من', subtitle: 'شروع، پیگیری و بستن شیفت'),
        Expanded(child: _body()),
      ],
    );
  }

  Widget _body() {
    if (loading) return const Center(child: CircularProgressIndicator());
    if (error != null) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Text(error!, textAlign: TextAlign.center),
              const SizedBox(height: 12),
              FilledButton(onPressed: _load, child: const Text('تلاش مجدد')),
            ],
          ),
        ),
      );
    }
    if (shifts.isEmpty) {
      return RefreshIndicator(
        onRefresh: _load,
        child: ListView(
          children: const [
            SizedBox(height: 100),
            Icon(Icons.event_busy, size: 56, color: AppTheme.muted),
            SizedBox(height: 12),
            Center(child: Text('شیفتی برای نمایش نیست')),
            SizedBox(height: 8),
            Center(
              child: Text(
                'از پنل وب برای راننده شیفت بسازید',
                style: TextStyle(color: AppTheme.muted, fontSize: 12),
              ),
            ),
          ],
        ),
      );
    }
    return RefreshIndicator(
      onRefresh: _load,
      child: ListView.separated(
        padding: const EdgeInsets.all(16),
        itemCount: shifts.length,
        separatorBuilder: (_, __) => const SizedBox(height: 10),
        itemBuilder: (_, i) {
          final s = shifts[i] as Map;
          final id = s['id']?.toString() ?? '';
          final status = s['status']?.toString() ?? '';
          final date = (Jalali.tryParse(s['startedAt']) ??
                  Jalali.tryParse(s['createdAt']) ??
                  Jalali.fromDateTime(DateTime.now()))
              .formatLong();
          return RookSectionCard(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    const Expanded(
                      child: Text('شیفت', style: TextStyle(fontWeight: FontWeight.w700, fontSize: 16)),
                    ),
                    RookStatusChip(status, color: _statusColor(status)),
                  ],
                ),
                const SizedBox(height: 6),
                Text('تاریخ: $date', style: const TextStyle(fontSize: 12, color: AppTheme.muted)),
                const SizedBox(height: 12),
                if (status == 'ready')
                  FilledButton(onPressed: () => _start(id), child: const Text('شروع شیفت')),
                if (status == 'active')
                  OutlinedButton(onPressed: () => _close(id), child: const Text('بستن شیفت')),
              ],
            ),
          );
        },
      ),
    );
  }

  Color _statusColor(String status) {
    return switch (status) {
      'active' => AppTheme.success,
      'ready' => AppTheme.brand,
      'closed' => AppTheme.muted,
      _ => AppTheme.warning,
    };
  }
}
