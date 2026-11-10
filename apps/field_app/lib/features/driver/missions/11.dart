import 'dart:io';
import 'package:flutter/material.dart';
import 'package:geolocator/geolocator.dart';
import 'package:image_picker/image_picker.dart';
import 'package:path_provider/path_provider.dart';
import 'package:uuid/uuid.dart';
import '../../../core/api/api_client.dart';
import 'signature_pad.dart';

class DriverMissionsPage extends StatefulWidget {
  const DriverMissionsPage({super.key});
  @override
  State<DriverMissionsPage> createState() => _DriverMissionsPageState();
}

class _DriverMissionsPageState extends State<DriverMissionsPage> {
  final api = ApiClient();
  List<Map<String, dynamic>> shifts = [];
  String? shiftId;
  List<Map<String, dynamic>> missions = [];
  bool loading = true;
  String? error;
  bool storageOk = false;

  @override
  void initState() {
    super.initState();
    _init();
  }

  Map<String, dynamic> _asMap(dynamic v) {
    if (v is Map<String, dynamic>) return v;
    if (v is Map) return Map<String, dynamic>.from(v);
    return <String, dynamic>{};
  }

  Future<void> _init() async {
    setState(() {
      loading = true;
      error = null;
    });
    try {
      try {
        final st = await api.get('/storage/status', auth: false);
        storageOk = st is Map && st['enabled'] == true;
      } catch (_) {
        storageOk = false;
      }

      final data = await api.get('/shifts');
      final raw = data is List ? data : <dynamic>[];
      final all = raw.map(_asMap).where((m) => m['id'] != null).toList();

      final open = all.where((s) {
        final st = s['status']?.toString().toLowerCase() ?? '';
        return st == 'pending' || st == 'ready' || st == 'active' || st == 'closing';
      }).toList();

      shifts = open.isNotEmpty ? open : all;

      if (shifts.isEmpty) {
        setState(() {
          shiftId = null;
          missions = [];
          loading = false;
        });
        return;
      }

      Map<String, dynamic>? preferred;
      for (final st in ['active', 'ready', 'pending', 'closing']) {
        final hit = shifts.where((s) => s['status']?.toString().toLowerCase() == st);
        if (hit.isNotEmpty) {
          preferred = hit.first;
          break;
        }
      }
      preferred ??= shifts.first;
      shiftId = preferred['id']?.toString();

      await _loadMissions();
      if (!mounted) return;
      setState(() => loading = false);
    } catch (e) {
      if (!mounted) return;
      setState(() {
        error = e.toString();
        loading = false;
      });
    }
  }

  Future<void> _loadMissions() async {
    if (shiftId == null) {
      missions = [];
      return;
    }
    final data = await api.get('/missions/by-shift/$shiftId');
    final raw = data is List ? data : <dynamic>[];
    missions = raw.map(_asMap).toList();
  }

  Future<void> _onShiftChanged(String? v) async {
    if (v == null) return;
    setState(() {
      shiftId = v;
      loading = true;
      error = null;
    });
    try {
      await _loadMissions();
    } catch (e) {
      error = e.toString();
    }
    if (mounted) setState(() => loading = false);
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
        setState(() {});
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('ورود به مقصد ثبت شد')),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('$e')));
      }
    }
  }

  Future<void> _complete(Map<String, dynamic> m) async {
    final result = await showDialog<Map<String, dynamic>>(
      context: context,
      barrierDismissible: false,
      builder: (_) => _CompleteDialog(storageEnabled: storageOk),
    );
    if (result == null) return;

    try {
      String? photoUrl;
      String? signatureUrl;

      if (storageOk) {
        final photoPath = result['photoPath'] as String?;
        final sigBytes = result['signatureBytes'] as List<int>?;
        if (photoPath != null) {
          try {
            final up = await api.uploadFile(
              '/storage/upload',
              File(photoPath),
              query: {'kind': 'photo'},
            );
            photoUrl = up['url']?.toString();
          } catch (_) {}
        }
        if (sigBytes != null && sigBytes.isNotEmpty) {
          try {
            final dir = await getTemporaryDirectory();
            final f = File('${dir.path}/sig_${const Uuid().v4()}.png');
            await f.writeAsBytes(sigBytes);
            final up = await api.uploadFile(
              '/storage/upload',
              f,
              query: {'kind': 'signature'},
            );
            signatureUrl = up['url']?.toString();
          } catch (_) {}
        }
      }

      Position? pos;
      try {
        pos = await Geolocator.getCurrentPosition();
      } catch (_) {}

      final opId = const Uuid().v4();
      await api.post(
        '/missions/${m['id']}/complete',
        headers: {
          'Idempotency-Key': opId,
          'X-Client-Op-Id': opId,
        },
        body: {
          'items': <dynamic>[],
          'payments': [
            if ((result['amount'] as int? ?? 0) > 0)
              {'method': 'cash', 'amount': result['amount']},
          ],
          'pod': {
            'recipientName': result['name'],
            if (photoUrl != null) 'photoUrl': photoUrl,
            if (signatureUrl != null) 'signatureUrl': signatureUrl,
            if (pos != null) 'lat': pos.latitude,
            if (pos != null) 'lng': pos.longitude,
          },
        },
      );
      await _loadMissions();
      if (mounted) {
        setState(() {});
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('مأموریت تکمیل شد')),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('$e')));
      }
    }
  }

  String _shiftLabel(Map<String, dynamic> s) {
    final st = s['status']?.toString() ?? '?';
    final id = s['id']?.toString() ?? '';
    final short = id.length > 8 ? id.substring(0, 8) : id;
    return '$short — $st';
  }

  @override
  Widget build(BuildContext context) {
    if (loading) {
      return const Center(child: CircularProgressIndicator());
    }

    if (error != null) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Text(error!, textAlign: TextAlign.center),
              const SizedBox(height: 12),
              FilledButton(onPressed: _init, child: const Text('تلاش مجدد')),
            ],
          ),
        ),
      );
    }

    if (shifts.isEmpty) {
      return Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Text('هیچ شیفتی برای شما ثبت نشده'),
            const SizedBox(height: 8),
            const Text(
              'از پنل وب شیفت بسازید و مأموریت ثبت کنید',
              style: TextStyle(fontSize: 12, color: Colors.grey),
            ),
            const SizedBox(height: 12),
            OutlinedButton(onPressed: _init, child: const Text('بروزرسانی')),
          ],
        ),
      );
    }

    // ensure dropdown value exists in items
    final ids = shifts.map((s) => s['id']?.toString()).whereType<String>().toList();
    final safeShiftId = (shiftId != null && ids.contains(shiftId)) ? shiftId : ids.first;

    final current = shifts.firstWhere(
      (s) => s['id']?.toString() == safeShiftId,
      orElse: () => shifts.first,
    );
    final shiftStatus = current['status']?.toString() ?? '';

    return RefreshIndicator(
      onRefresh: _init,
      child: ListView.builder(
        padding: const EdgeInsets.all(12),
        itemCount: missions.length + 1,
        itemBuilder: (context, index) {
          if (index == 0) {
            return Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                InputDecorator(
                  decoration: const InputDecoration(
                    labelText: 'شیفت',
                    border: OutlineInputBorder(),
                    isDense: true,
                  ),
                  child: DropdownButtonHideUnderline(
                    child: DropdownButton<String>(
                      isExpanded: true,
                      value: safeShiftId,
                      items: shifts.map((s) {
                        final id = s['id'].toString();
                        return DropdownMenuItem<String>(
                          value: id,
                          child: Text(_shiftLabel(s), overflow: TextOverflow.ellipsis),
                        );
                      }).toList(),
                      onChanged: _onShiftChanged,
                    ),
                  ),
                ),
                const SizedBox(height: 8),
                Text(
                  'وضعیت شیفت: $shiftStatus | مأموریت‌ها: ${missions.length}',
                  style: const TextStyle(color: Colors.blueGrey),
                ),
                if (shiftStatus == 'pending')
                  const Padding(
                    padding: EdgeInsets.only(top: 6, bottom: 4),
                    child: Text(
                      'شیفت pending است. برای کار کامل، بار را تأیید کنید (ready) و شیفت را Start کنید.',
                      style: TextStyle(color: Colors.orange, fontSize: 12),
                    ),
                  ),
                if (missions.isEmpty)
                  const Padding(
                    padding: EdgeInsets.symmetric(vertical: 32),
                    child: Center(child: Text('برای این شیفت مأموریتی ثبت نشده')),
                  )
                else
                  const SizedBox(height: 8),
              ],
            );
          }

          final m = missions[index - 1];
          final status = (m['status']?.toString() ?? '').toLowerCase();
          final done = status == 'completed' || status == 'failed';
          final arrived =
              m['arrivalAt'] != null || status == 'in_progress' || status == 'accepted';
          final customer = m['customer'];
          String title = 'مأموریت';
          if (customer is Map) {
            title = (customer['name'] ??
                    customer['title'] ??
                    customer['shopName'] ??
                    'مشتری')
                .toString();
          }

          return Card(
            margin: const EdgeInsets.only(bottom: 10),
            child: Padding(
              padding: const EdgeInsets.all(12),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  Text(title, style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 16)),
                  const SizedBox(height: 4),
                  Text('وضعیت: $status${arrived ? ' | ورود ثبت شده' : ''}'),
                  const SizedBox(height: 10),
                  if (!done)
                    Row(
                      children: [
                        if (!arrived)
                          Expanded(
                            child: OutlinedButton(
                              onPressed: () => _arrive(m['id'].toString()),
                              child: const Text('ورود'),
                            ),
                          )
                        else
                          const Expanded(
                            child: Text('رسیده', style: TextStyle(color: Colors.green)),
                          ),
                        const SizedBox(width: 8),
                        Expanded(
                          child: FilledButton(
                            onPressed: () => _complete(m),
                            child: const Text('تحویل'),
                          ),
                        ),
                      ],
                    )
                  else
                    const Align(
                      alignment: Alignment.centerRight,
                      child: Icon(Icons.check_circle, color: Colors.green),
                    ),
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
  const _CompleteDialog({required this.storageEnabled});
  final bool storageEnabled;

  @override
  State<_CompleteDialog> createState() => _CompleteDialogState();
}

class _CompleteDialogState extends State<_CompleteDialog> {
  final formKey = GlobalKey<FormState>();
  final nameCtrl = TextEditingController();
  final amountCtrl = TextEditingController(text: '0');
  final sigKey = GlobalKey<SignaturePadState>();
  final picker = ImagePicker();
  String? photoPath;
  bool busy = false;

  @override
  void dispose() {
    nameCtrl.dispose();
    amountCtrl.dispose();
    super.dispose();
  }

  Future<void> _pickPhoto(ImageSource source) async {
    try {
      final x = await picker.pickImage(source: source, imageQuality: 75, maxWidth: 1600);
      if (x != null) setState(() => photoPath = x.path);
    } catch (_) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('دسترسی دوربین/گالری در دسترس نیست')),
        );
      }
    }
  }

  Future<void> _submit() async {
    if (!(formKey.currentState?.validate() ?? false)) return;
    setState(() => busy = true);
    final sigBytes = await sigKey.currentState?.toPngBytes();
    if (!mounted) return;
    Navigator.pop(context, {
      'name': nameCtrl.text.trim(),
      'amount': int.tryParse(amountCtrl.text.trim()) ?? 0,
      'photoPath': photoPath,
      'signatureBytes': sigBytes,
    });
  }

  @override
  Widget build(BuildContext context) {
    final maxH = MediaQuery.of(context).size.height * 0.75;
    return AlertDialog(
      title: const Text('ثبت تحویل'),
      content: SizedBox(
        width: 400,
        child: ConstrainedBox(
          constraints: BoxConstraints(maxHeight: maxH),
          child: Form(
            key: formKey,
            child: SingleChildScrollView(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  TextFormField(
                    controller: nameCtrl,
                    decoration: const InputDecoration(labelText: 'نام گیرنده'),
                    validator: (v) => (v == null || v.trim().isEmpty) ? 'الزامی' : null,
                  ),
                  const SizedBox(height: 10),
                  TextFormField(
                    controller: amountCtrl,
                    keyboardType: TextInputType.number,
                    decoration: const InputDecoration(labelText: 'مبلغ نقد (ریال)', hintText: '0'),
                  ),
                  const SizedBox(height: 12),
                  if (!widget.storageEnabled)
                    const Padding(
                      padding: EdgeInsets.only(bottom: 8),
                      child: Text(
                        'ذخیره‌سازی فایل فعلاً غیرفعال است؛ عکس/امضا آپلود نمی‌شود.',
                        style: TextStyle(color: Colors.orange, fontSize: 12),
                      ),
                    ),
                  const Text('عکس تحویل (اختیاری)', style: TextStyle(fontWeight: FontWeight.w600)),
                  const SizedBox(height: 6),
                  Row(
                    children: [
                      Expanded(
                        child: OutlinedButton.icon(
                          onPressed: () => _pickPhoto(ImageSource.camera),
                          icon: const Icon(Icons.photo_camera),
                          label: const Text('دوربین'),
                        ),
                      ),
                      const SizedBox(width: 8),
                      Expanded(
                        child: OutlinedButton.icon(
                          onPressed: () => _pickPhoto(ImageSource.gallery),
                          icon: const Icon(Icons.photo_library),
                          label: const Text('گالری'),
                        ),
                      ),
                    ],
                  ),
                  if (photoPath != null)
                    Padding(
                      padding: const EdgeInsets.only(top: 8),
                      child: ClipRRect(
                        borderRadius: BorderRadius.circular(8),
                        child: Image.file(
                          File(photoPath!),
                          height: 120,
                          width: double.infinity,
                          fit: BoxFit.cover,
                        ),
                      ),
                    ),
                  const SizedBox(height: 12),
                  const Text('امضا (اختیاری)', style: TextStyle(fontWeight: FontWeight.w600)),
                  const SizedBox(height: 6),
                  SignaturePad(key: sigKey),
                ],
              ),
            ),
          ),
        ),
      ),
      actions: [
        TextButton(onPressed: busy ? null : () => Navigator.pop(context), child: const Text('انصراف')),
        FilledButton(
          onPressed: busy ? null : _submit,
          child: busy
              ? const SizedBox(
                  width: 18,
                  height: 18,
                  child: CircularProgressIndicator(strokeWidth: 2),
                )
              : const Text('ثبت نهایی'),
        ),
      ],
    );
  }
}
