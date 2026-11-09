import 'package:flutter/material.dart';
import 'package:geolocator/geolocator.dart';
import 'package:uuid/uuid.dart';
import '../../../core/api/api_client.dart';
import '../../../core/theme/app_theme.dart';

class DriverMissionsPage extends StatefulWidget {
  const DriverMissionsPage({super.key});
  @override
  State<DriverMissionsPage> createState() => _DriverMissionsPageState();
}

class _DriverMissionsPageState extends State<DriverMissionsPage> {
  final api = ApiClient();
  String? shiftId;
  List missions = [];
  bool loading = true;
  String? error;

  @override
  void initState() {
    super.initState();
    _init();
  }

  Future<void> _init() async {
    setState(() { loading = true; error = null; });
    try {
      final data = await api.get('/shifts');
      final shifts = data is List ? data : [];
      final active = shifts.cast<Map>().where((s) {
        final st = s['status']?.toString();
        return st == 'active' || st == 'ready';
      }).toList();
      if (active.isEmpty) {
        setState(() { shiftId = null; missions = []; loading = false; });
        return;
      }
      shiftId = active.first['id']?.toString();
      await _loadMissions();
      setState(() => loading = false);
    } catch (e) {
      setState(() { error = e.toString(); loading = false; });
    }
  }

  Future<void> _loadMissions() async {
    if (shiftId == null) return;
    final data = await api.get('/missions/by-shift/$shiftId');
    if (!mounted) return;
    setState(() => missions = data is List ? data : []);
  }

  Future<void> _arrive(String id) async {
    try {
      Position? pos;
      try {
        pos = await Geolocator.getCurrentPosition();
      } catch (_) {}
      await api.post('/missions/$id/arrive', body: {
        if (pos != null) 'lat': pos.latitude,
        if (pos != null) 'lng': pos.longitude,
      });
      await _loadMissions();
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(pos != null
              ? 'رسیدن ثبت شد (${pos.latitude.toStringAsFixed(5)}, ${pos.longitude.toStringAsFixed(5)})'
              : 'رسیدن ثبت شد')),
        );
      }
    } catch (e) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('$e')));
    }
  }

  Future<void> _complete(Map m) async {
    final result = await showDialog<Map<String, dynamic>>(
      context: context,
      barrierDismissible: false,
      builder: (ctx) => _CompleteDialog(customerName: m['customer'] is Map ? '${m['customer']['name']}' : null),
    );
    if (result == null || !mounted) return;
    try {
      final opId = const Uuid().v4();
      final amount = result['amount'] as int;
      final rawItems = m['items'];
      final items = <Map<String, dynamic>>[];
      if (rawItems is List) {
        for (final it in rawItems) {
          if (it is Map && it['productId'] != null) {
            final ordered = it['orderedQty'] ?? it['deliveredQty'] ?? 0;
            items.add({
              'productId': it['productId'].toString(),
              'deliveredQty': ordered is num ? ordered : num.tryParse(ordered.toString()) ?? 0,
            });
          }
        }
      }
      await api.post(
        '/missions/${m['id']}/complete',
        body: {
          'items': items,
          'payments': amount > 0 ? [{'amount': amount, 'method': 'cash', 'isPartial': false}] : [],
          'pod': {'recipientName': result['name']},
          'returns': [],
        },
        headers: {'X-Client-Op-Id': opId},
      );
      await _loadMissions();
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('مأموریت بسته شد')));
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('خطا: $e'), backgroundColor: Colors.red.shade700),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    if (loading) return const Center(child: CircularProgressIndicator());
    if (error != null) {
      return Center(child: Column(mainAxisSize: MainAxisSize.min, children: [
        Text(error!, textAlign: TextAlign.center),
        FilledButton(onPressed: _init, child: const Text('تلاش مجدد')),
      ]));
    }
    if (shiftId == null) {
      return const Center(child: Text('شیفت ready یا active ندارید'));
    }
    if (missions.isEmpty) {
      return RefreshIndicator(
        onRefresh: _loadMissions,
        child: ListView(children: const [
          SizedBox(height: 80),
          Center(child: Text('مأموریتی ثبت نشده')),
          Center(child: Text('ناظر باید مأموریت و مشتری را تعریف کند', style: TextStyle(color: AppTheme.muted, fontSize: 12))),
        ]),
      );
    }
    return RefreshIndicator(
      onRefresh: _loadMissions,
      child: ListView.separated(
        padding: const EdgeInsets.all(16),
        itemCount: missions.length,
        separatorBuilder: (_, __) => const SizedBox(height: 10),
        itemBuilder: (_, i) {
          final m = missions[i] as Map;
          final status = m['status']?.toString() ?? '';
          final customer = m['customer'] is Map ? m['customer']['name'] : '—';
          final done = status == 'completed' || status == 'failed';
          return Card(
            elevation: 2,
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
            child: Padding(
              padding: const EdgeInsets.all(14),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(children: [
                    Expanded(child: Text('$customer', style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 16))),
                    Text(status, style: const TextStyle(fontSize: 11, color: AppTheme.muted)),
                  ]),
                  if (!done) ...[
                    const SizedBox(height: 12),
                    Wrap(spacing: 8, runSpacing: 8, children: [
                      FilledButton.tonal(onPressed: () => _arrive(m['id'].toString()), child: const Text('ثبت رسیدن')),
                      FilledButton(onPressed: () => _complete(m), child: const Text('اتمام تحویل')),
                    ]),
                  ],
                ],
              ),
            ),
          );
        },
      ),
    );
  }
}

class _CompleteDialog extends StatefulWidget {
  const _CompleteDialog({this.customerName});
  final String? customerName;
  @override
  State<_CompleteDialog> createState() => _CompleteDialogState();
}

class _CompleteDialogState extends State<_CompleteDialog> {
  final nameCtrl = TextEditingController();
  final amountCtrl = TextEditingController();
  final formKey = GlobalKey<FormState>();

  @override
  void dispose() {
    nameCtrl.dispose();
    amountCtrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AlertDialog(
      title: const Text('اتمام تحویل'),
      content: Form(
        key: formKey,
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            if (widget.customerName != null)
              Padding(
                padding: const EdgeInsets.only(bottom: 10),
                child: Text('مشتری: ${widget.customerName}', style: const TextStyle(color: AppTheme.muted, fontSize: 13)),
              ),
            TextFormField(
              controller: nameCtrl,
              decoration: const InputDecoration(labelText: 'نام گیرنده کالا', hintText: 'مثلاً آقای محمدی'),
              validator: (v) => (v == null || v.trim().isEmpty) ? 'الزامی' : null,
            ),
            const SizedBox(height: 10),
            TextFormField(
              controller: amountCtrl,
              keyboardType: TextInputType.number,
              decoration: const InputDecoration(labelText: 'مبلغ نقد (ریال)', hintText: '0'),
            ),
          ],
        ),
      ),
      actions: [
        TextButton(onPressed: () => Navigator.pop(context), child: const Text('انصراف')),
        FilledButton(
          onPressed: () {
            if (!(formKey.currentState?.validate() ?? false)) return;
            Navigator.pop(context, {
              'name': nameCtrl.text.trim(),
              'amount': int.tryParse(amountCtrl.text.trim()) ?? 0,
            });
          },
          child: const Text('ثبت نهایی'),
        ),
      ],
    );
  }
}
