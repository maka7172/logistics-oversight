import 'package:flutter/material.dart';
import '../../../core/api/api_client.dart';

class SupervisorLoadPage extends StatefulWidget {
  const SupervisorLoadPage({super.key});
  @override
  State<SupervisorLoadPage> createState() => _SupervisorLoadPageState();
}

class _SupervisorLoadPageState extends State<SupervisorLoadPage> {
  final api = ApiClient();
  List shifts = [];
  List products = [];
  String? shiftId;
  final cashCtrl = TextEditingController(text: '0');
  final List<Map<String, String>> lines = [
    {'productId': '', 'qty': '1'},
  ];
  bool loading = true;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() => loading = true);
    try {
      final s = await api.get('/shifts');
      final p = await api.get('/products');
      shifts = s is List ? s : [];
      products = p is List ? p : [];
    } catch (_) {}
    setState(() => loading = false);
  }

  Future<void> _submit() async {
    if (shiftId == null) return;
    try {
      await api.post('/shifts/$shiftId/load', body: {
        'openingCash': int.tryParse(cashCtrl.text) ?? 0,
        'lines': lines
            .where((l) => (l['productId'] ?? '').isNotEmpty)
            .map((l) => {'productId': l['productId'], 'qty': int.tryParse(l['qty'] ?? '0') ?? 0})
            .toList(),
      });
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('بار ثبت شد — تأیید از پنل یا زیر')));
      final loads = await api.get('/shifts/$shiftId/loads');
      if (loads is List && loads.isNotEmpty) {
        final last = loads.first;
        final id = last['id']?.toString();
        if (id != null && mounted) {
          final ok = await showDialog<bool>(
            context: context,
            builder: (ctx) => AlertDialog(
              title: const Text('تأیید بار'),
              content: const Text('همین حالا تأیید نهایی شود؟'),
              actions: [
                TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('بعداً')),
                FilledButton(onPressed: () => Navigator.pop(ctx, true), child: const Text('تأیید')),
              ],
            ),
          );
          if (ok == true) {
            await api.post('/shifts/load/$id/approve');
            if (mounted) ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('بار تأیید و شیفت READY شد')));
          }
        }
      }
    } catch (e) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('$e')));
    }
  }

  @override
  Widget build(BuildContext context) {
    if (loading) return const Center(child: CircularProgressIndicator());
    final isTablet = MediaQuery.sizeOf(context).shortestSide >= 600;

    return ListView(
      padding: EdgeInsets.all(isTablet ? 24 : 16),
      children: [
        Text('ثبت بار ناظر', style: Theme.of(context).textTheme.titleLarge),
        const SizedBox(height: 4),
        const Text('فقط شیفت pending یا ready', style: TextStyle(fontSize: 12, color: Color(0xFF64748B))),
        const SizedBox(height: 12),
        DropdownButtonFormField<String>(
          value: shiftId,
          decoration: const InputDecoration(labelText: 'شیفت'),
          items: shifts.cast<Map>().map((s) {
            final id = s['id'].toString();
            final st = s['status'];
            final name = s['driver'] is Map && s['driver']['user'] is Map ? s['driver']['user']['fullName'] : id.substring(0, 8);
            return DropdownMenuItem(value: id, child: Text('$name — $st'));
          }).toList(),
          onChanged: (v) => setState(() => shiftId = v),
        ),
        const SizedBox(height: 12),
        TextField(controller: cashCtrl, keyboardType: TextInputType.number, decoration: const InputDecoration(labelText: 'تنخواه / نقد اولیه')),
        const SizedBox(height: 12),
        ...lines.asMap().entries.map((e) {
          final i = e.key;
          return Padding(
            padding: const EdgeInsets.only(bottom: 8),
            child: Row(
              children: [
                Expanded(
                  flex: 3,
                  child: DropdownButtonFormField<String>(
                    value: lines[i]['productId']!.isEmpty ? null : lines[i]['productId'],
                    decoration: const InputDecoration(labelText: 'کالا'),
                    items: products.cast<Map>().map((p) {
                      return DropdownMenuItem(value: p['id'].toString(), child: Text('${p['code']} — ${p['name']}'));
                    }).toList(),
                    onChanged: (v) => setState(() => lines[i]['productId'] = v ?? ''),
                  ),
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: TextFormField(
                    initialValue: lines[i]['qty'],
                    keyboardType: TextInputType.number,
                    decoration: const InputDecoration(labelText: 'تعداد'),
                    onChanged: (v) => lines[i]['qty'] = v,
                  ),
                ),
              ],
            ),
          );
        }),
        TextButton(onPressed: () => setState(() => lines.add({'productId': '', 'qty': '1'})), child: const Text('+ ردیف کالا')),
        const SizedBox(height: 16),
        FilledButton(onPressed: shiftId == null ? null : _submit, child: const Text('ثبت بار')),
      ],
    );
  }
}
