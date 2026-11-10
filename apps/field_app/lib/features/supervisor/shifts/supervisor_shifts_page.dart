import 'package:flutter/material.dart';
import '../../../core/api/api_client.dart';
import '../../../core/theme/app_theme.dart';
import '../../../shared/widgets/rook_ui.dart';

class SupervisorShiftsPage extends StatefulWidget {
  const SupervisorShiftsPage({super.key});
  @override
  State<SupervisorShiftsPage> createState() => _SupervisorShiftsPageState();
}

class _SupervisorShiftsPageState extends State<SupervisorShiftsPage> {
  final api = ApiClient();
  List shifts = [];
  List drivers = [];
  String? driverId;
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
      final s = await api.get('/shifts');
      final d = await api.get('/drivers');
      shifts = s is List ? s : [];
      drivers = d is List ? d : [];
    } catch (e) {
      error = e.toString();
    }
    setState(() => loading = false);
  }

  Future<void> _create() async {
    if (driverId == null) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('راننده را انتخاب کنید')));
      return;
    }
    try {
      await api.post('/shifts', body: {'driverId': driverId});
      driverId = null;
      await _load();
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('شیفت ساخته شد (pending)')));
      }
    } catch (e) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('$e')));
    }
  }

  String _driverName(Map s) {
    if (s['driver'] is Map) {
      final d = s['driver'] as Map;
      if (d['user'] is Map) return '${d['user']['fullName']}';
      return d['id']?.toString() ?? '—';
    }
    return '—';
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        const RookPageHeader('مدیریت شیفت', subtitle: 'ایجاد شیفت برای راننده'),
        Expanded(child: _body()),
      ],
    );
  }

  Widget _body() {
    if (loading) return const Center(child: CircularProgressIndicator());
    if (error != null) {
      return Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(error!, textAlign: TextAlign.center),
            FilledButton(onPressed: _load, child: const Text('تلاش مجدد')),
          ],
        ),
      );
    }
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        RookSectionCard(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              const Text('ایجاد شیفت جدید', style: TextStyle(fontWeight: FontWeight.w700)),
              const SizedBox(height: 10),
              DropdownButtonFormField<String>(
                value: driverId,
                decoration: const InputDecoration(labelText: 'راننده'),
                items: drivers.cast<Map>().map((d) {
                  final id = d['id'].toString();
                  final name = d['user'] is Map ? '${d['user']['fullName']}' : id.substring(0, 8);
                  final role = d['driverRoleLabel']?.toString();
                  return DropdownMenuItem(
                    value: id,
                    child: Text(role != null && role.isNotEmpty ? '$name ($role)' : name),
                  );
                }).toList(),
                onChanged: (v) => setState(() => driverId = v),
              ),
              const SizedBox(height: 12),
              FilledButton.icon(onPressed: _create, icon: const Icon(Icons.add), label: const Text('ثبت شیفت')),
            ],
          ),
        ),
        const SizedBox(height: 16),
        const Text('لیست شیفت‌ها', style: TextStyle(fontWeight: FontWeight.w700, color: AppTheme.ink)),
        const SizedBox(height: 8),
        if (shifts.isEmpty)
          const Text('شیفتی نیست', style: TextStyle(color: AppTheme.muted))
        else
          ...shifts.cast<Map>().map((s) {
            final st = s['status']?.toString() ?? '';
            return Padding(
              padding: const EdgeInsets.only(bottom: 8),
              child: RookSectionCard(
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                child: Row(
                  children: [
                    Expanded(child: Text(_driverName(s), style: const TextStyle(fontWeight: FontWeight.w600))),
                    RookStatusChip(st),
                  ],
                ),
              ),
            );
          }),
      ],
    );
  }
}
