import 'package:flutter/material.dart';
import '../../../core/api/api_client.dart';
import '../../../core/theme/app_theme.dart';

class SupervisorMissionsPage extends StatefulWidget {
  const SupervisorMissionsPage({super.key});
  @override
  State<SupervisorMissionsPage> createState() => _SupervisorMissionsPageState();
}

class _SupervisorMissionsPageState extends State<SupervisorMissionsPage> {
  final api = ApiClient();
  List shifts = [];
  List customers = [];
  List missions = [];
  String? shiftId;
  String? customerId;
  bool loading = true;
  String? error;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() { loading = true; error = null; });
    try {
      final s = await api.get('/shifts');
      final c = await api.get('/customers');
      shifts = s is List ? s : [];
      customers = c is List ? c : [];
      if (shiftId != null) await _loadMissions();
    } catch (e) {
      error = e.toString();
    }
    setState(() => loading = false);
  }

  Future<void> _loadMissions() async {
    if (shiftId == null) return;
    final data = await api.get('/missions/by-shift/$shiftId');
    setState(() => missions = data is List ? data : []);
  }

  Future<void> _create() async {
    if (shiftId == null || customerId == null) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('شیفت و مشتری را انتخاب کنید')));
      return;
    }
    try {
      await api.post('/missions', body: {
        'shiftId': shiftId,
        'customerId': customerId,
        'seq': missions.length + 1,
        'plannedAmount': 0,
        'items': [],
      });
      await _loadMissions();
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('مأموریت اضافه شد')));
    } catch (e) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('$e')));
    }
  }

  @override
  Widget build(BuildContext context) {
    if (loading) return const Center(child: CircularProgressIndicator());
    if (error != null) {
      return Center(child: Column(mainAxisSize: MainAxisSize.min, children: [
        Text(error!, textAlign: TextAlign.center),
        FilledButton(onPressed: _load, child: const Text('تلاش مجدد')),
      ]));
    }
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        const Text('تعریف مأموریت برای شیفت', style: TextStyle(fontSize: 18, fontWeight: FontWeight.w800)),
        const SizedBox(height: 6),
        const Text('مشتری مقصد را مشخص کنید تا راننده در لیست مأموریت ببیند.', style: TextStyle(color: AppTheme.muted, fontSize: 12)),
        const SizedBox(height: 16),
        DropdownButtonFormField<String>(
          value: shiftId,
          decoration: const InputDecoration(labelText: 'شیفت'),
          items: shifts.cast<Map>().map((s) {
            final id = s['id'].toString();
            final st = s['status'];
            final name = s['driver'] is Map && s['driver']['user'] is Map
                ? s['driver']['user']['fullName']
                : id.substring(0, 8);
            return DropdownMenuItem(value: id, child: Text('$name — $st'));
          }).toList(),
          onChanged: (v) async {
            setState(() => shiftId = v);
            await _loadMissions();
          },
        ),
        const SizedBox(height: 12),
        DropdownButtonFormField<String>(
          value: customerId,
          decoration: const InputDecoration(labelText: 'مشتری / گیرنده مقصد'),
          items: customers.cast<Map>().map((c) {
            return DropdownMenuItem(value: c['id'].toString(), child: Text('${c['name']}'));
          }).toList(),
          onChanged: (v) => setState(() => customerId = v),
        ),
        const SizedBox(height: 16),
        FilledButton.icon(
          onPressed: _create,
          icon: const Icon(Icons.add),
          label: const Text('ثبت مأموریت'),
        ),
        const SizedBox(height: 20),
        const Text('مأموریت‌های شیفت', style: TextStyle(fontWeight: FontWeight.w700)),
        const SizedBox(height: 8),
        if (missions.isEmpty) const Text('هنوز مأموریتی نیست', style: TextStyle(color: AppTheme.muted)),
        ...missions.cast<Map>().map((m) {
          final customer = m['customer'] is Map ? m['customer']['name'] : '—';
          return Card(
            margin: const EdgeInsets.only(bottom: 8),
            child: ListTile(
              title: Text('$customer'),
              subtitle: Text('وضعیت: ${m['status']}'),
            ),
          );
        }),
      ],
    );
  }
}
