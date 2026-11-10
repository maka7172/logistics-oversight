import 'package:flutter/material.dart';
import '../../../core/api/api_client.dart';
import '../../../core/theme/app_theme.dart';
import '../../../shared/widgets/rook_ui.dart';

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
    return Column(
      children: [
        const RookPageHeader('بار انبار', subtitle: 'ثبت و تأیید بار شیفت'),
        Expanded(child: _body()),
      ],
    );
  }

  Widget _body() {
    if (loading) return const Center(child: CircularProgressIndicator());
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        RookSectionCard(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              DropdownButtonFormField<String>(
                value: shiftId,
                decoration: const InputDecoration(labelText: 'شیفت'),
                items: shifts.cast<Map>().map((s) {
                  final id = s['id'].toString();
                  final st = s['status'];
                  return DropdownMenuItem(value: id, child: Text('${id.length > 8 ? id.substring(0, 8) : id} — $st'));
                }).toList(),
                onChanged: (v) => setState(() => shiftId = v),
              ),
              const SizedBox(height: 12),
              TextField(
                controller: cashCtrl,
                keyboardType: TextInputType.number,
                decoration: const InputDecoration(labelText: 'نقد اولیه (ریال)'),
              ),
              const SizedBox(height: 12),
              const Text('اقلام بار', style: TextStyle(fontWeight: FontWeight.w700)),
              const SizedBox(height: 8),
              ...List.generate(lines.length, (i) {
                final line = lines[i];
                return Padding(
                  padding: const EdgeInsets.only(bottom: 8),
                  child: Row(
                    children: [
                      Expanded(
                        flex: 2,
                        child: DropdownButtonFormField<String>(
                          value: (line['productId']?.isEmpty ?? true) ? null : line['productId'],
                          decoration: const InputDecoration(labelText: 'کالا'),
                          items: products.cast<Map>().map((p) {
                            return DropdownMenuItem(
                              value: p['id'].toString(),
                              child: Text('${p['name']}'),
                            );
                          }).toList(),
                          onChanged: (v) => setState(() => lines[i]['productId'] = v ?? ''),
                        ),
                      ),
                      const SizedBox(width: 8),
                      Expanded(
                        child: TextFormField(
                          initialValue: line['qty'],
                          keyboardType: TextInputType.number,
                          decoration: const InputDecoration(labelText: 'تعداد'),
                          onChanged: (v) => lines[i]['qty'] = v,
                        ),
                      ),
                    ],
                  ),
                );
              }),
              TextButton.icon(
                onPressed: () => setState(() => lines.add({'productId': '', 'qty': '1'})),
                icon: const Icon(Icons.add),
                label: const Text('ردیف کالا'),
              ),
              const SizedBox(height: 8),
              FilledButton(onPressed: _submit, child: const Text('ثبت بار')),
            ],
          ),
        ),
      ],
    );
  }
}
