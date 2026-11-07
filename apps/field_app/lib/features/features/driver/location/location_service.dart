import 'dart:async';
import 'package:flutter/material.dart';
import 'package:geolocator/geolocator.dart';
import 'package:provider/provider.dart';
import '../../../core/api/api_client.dart';
import '../../../core/auth/auth_state.dart';
import '../../../core/config/app_config.dart';

class LocationService {
  LocationService._();
  static final instance = LocationService._();
  Timer? _timer;
  String? driverId;
  String? shiftId;
  final _api = ApiClient();

  Future<void> start(BuildContext context) async {
    final user = context.read<AuthState>().user;
    if (user == null) return;
    driverId = null;
    try {
      final list = await _api.get('/drivers');
      if (list is List) {
        for (final d in list) {
          if (d is Map && d['userId']?.toString() == user.id) {
            driverId = d['id']?.toString();
            break;
          }
        }
      }
    } catch (_) {}

    final perm = await Geolocator.checkPermission();
    if (perm == LocationPermission.denied || perm == LocationPermission.deniedForever) {
      await Geolocator.requestPermission();
    }
    _timer?.cancel();
    _timer = Timer.periodic(AppConfig.locationInterval, (_) => _ping());
    await _ping();
  }

  void setShiftId(String? id) => shiftId = id;

  Future<void> forcePing() => _ping();

  Future<void> _ping() async {
    try {
      final pos = await Geolocator.getCurrentPosition(desiredAccuracy: LocationAccuracy.high);
      final body = <String, dynamic>{
        if (driverId != null) 'driverId': driverId,
        if (shiftId != null) 'shiftId': shiftId,
        'lat': pos.latitude,
        'lng': pos.longitude,
        'speed': pos.speed,
        'heading': pos.heading,
      };
      await _api.post('/reports/location-ping', body: body);
    } catch (_) {}
  }

  void stop() {
    _timer?.cancel();
    _timer = null;
  }
}
