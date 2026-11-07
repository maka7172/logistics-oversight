import 'package:flutter/material.dart';
import 'package:geolocator/geolocator.dart';
import '../../../core/api/api_client.dart';
import '../../../core/theme/app_theme.dart';
import 'location_service.dart';

class LiveMapPage extends StatefulWidget {
  const LiveMapPage({super.key, this.supervisorMode = false});
  final bool supervisorMode;

  @override
  State<LiveMapPage> createState() => _LiveMapPageState();
}

class _LiveMapPageState extends State<LiveMapPage> {
  final api = ApiClient();
  String? status;
  List live = [];
  Position? lastPos;
  bool loading = false;

  @override
  void initState() {
    super.initState();
    _refresh();
  }

  Future<void> _refresh() async {
    setState(() => loading = true);
    try {
      if (widget.supervisorMode) {
        final data = await api.get('/reports/live-drivers');
        live = data is List ? data : [];
        status = '${live.length} راننده';
      } else {
        final perm = await Geolocator.checkPermission();
        if (perm == LocationPermission.denied) {
          await Geolocator.requestPermission();
        }
        lastPos = await Geolocator.getCurrentPosition();
        await LocationService.instance.forcePing();
        status = 'موقعیت ارسال شد';
      }
    } catch (e) {
      status = e.toString();
    }
    if (mounted) setState(() => loading = false);
  }

  @override
  Widget build(BuildContext context) {
    return RefreshIndicator(
      onRefresh: _refresh,
      child: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          Text(widget.supervisorMode ? 'موقعیت زنده راننده‌ها' : 'موقعیت من',
              style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w800)),
          const SizedBox(height: 8),
          Text(
            widget.supervisorMode
                ? 'آخرین پینگ ذخیره‌شده در سرور'
                : 'مختصات هر ${20} ثانیه به سرور ارسال می‌شود',
            style: const TextStyle(color: AppTheme.muted, fontSize: 12),
          ),
          const SizedBox(height: 16),
          if (loading) const LinearProgressIndicator(),
          if (status != null) Text(status!, style: const TextStyle(fontWeight: FontWeight.w600)),
          if (!widget.supervisorMode && lastPos != null) ...[
            const SizedBox(height: 12),
            Card(
              child: ListTile(
                leading: const Icon(Icons.my_location, color: AppTheme.brand),
                title: Text('Lat: ${lastPos!.latitude.toStringAsFixed(6)}'),
                subtitle: Text('Lng: ${lastPos!.longitude.toStringAsFixed(6)}\nسرعت: ${lastPos!.speed.toStringAsFixed(1)}'),
              ),
            ),
          ],
          if (widget.supervisorMode) ...[
            const SizedBox(height: 12),
            if (live.isEmpty) const Text('هنوز موقعیتی ثبت نشده'),
            ...live.cast<Map>().map((d) {
              final loc = d['lastLocation'];
              final name = d['fullName'] ?? d['name'] ?? 'راننده';
              if (loc is! Map) {
                return Card(child: ListTile(title: Text('$name'), subtitle: const Text('بدون پینگ')));
              }
              return Card(
                child: ListTile(
                  leading: const Icon(Icons.directions_car),
                  title: Text('$name'),
                  subtitle: Text('Lat ${loc['lat']} · Lng ${loc['lng']}\n${loc['recordedAt'] ?? ''}'),
                ),
              );
            }),
          ],
          const SizedBox(height: 16),
          FilledButton.icon(onPressed: _refresh, icon: const Icon(Icons.refresh), label: const Text('بروزرسانی')),
        ],
      ),
    );
  }
}
