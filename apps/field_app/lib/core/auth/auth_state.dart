import 'dart:convert';
import 'package:flutter/foundation.dart';
import '../api/api_client.dart';
import '../security/secure_storage.dart';

class AppUser {
  final String id;
  final String phone;
  final String fullName;
  final bool isSuperAdmin;
  final List<String> roleCodes;
  final List<String> permissions;

  AppUser({
    required this.id,
    required this.phone,
    required this.fullName,
    required this.isSuperAdmin,
    required this.roleCodes,
    required this.permissions,
  });

  factory AppUser.fromJson(Map<String, dynamic> j) {
    final roles = (j['roles'] as List?) ?? [];
    final roleCodes = roles.map((r) {
      if (r is Map) return (r['code'] ?? '').toString();
      return r.toString();
    }).where((c) => c.isNotEmpty).toList();
    final perms = (j['permissions'] as List?)?.map((e) => e.toString()).toList() ?? [];
    return AppUser(
      id: j['id']?.toString() ?? '',
      phone: j['phone']?.toString() ?? '',
      fullName: j['fullName']?.toString() ?? '',
      isSuperAdmin: j['isSuperAdmin'] == true,
      roleCodes: roleCodes,
      permissions: perms,
    );
  }

  bool get isDriver => roleCodes.contains('driver') || roleCodes.contains('super_admin');
  bool get isSupervisor =>
      roleCodes.contains('supervisor') ||
      roleCodes.contains('admin') ||
      roleCodes.contains('super_admin') ||
      isSuperAdmin;

  String get primaryRole {
    if (isSuperAdmin) return 'super_admin';
    if (roleCodes.contains('supervisor')) return 'supervisor';
    if (roleCodes.contains('driver')) return 'driver';
    if (roleCodes.contains('admin')) return 'admin';
    return roleCodes.isNotEmpty ? roleCodes.first : 'user';
  }
}

class AuthState extends ChangeNotifier {
  AuthState(this._api);
  final ApiClient _api;

  AppUser? user;
  bool loading = false;
  String? lastMockOtp;

  Future<void> hydrate() async {
    final token = await SecureStore.readToken();
    final raw = await SecureStore.readUserJson();
    if (token != null && raw != null) {
      try {
        user = AppUser.fromJson(jsonDecode(raw) as Map<String, dynamic>);
        notifyListeners();
      } catch (_) {}
    }
  }

  Future<void> requestOtp(String phone) async {
    loading = true;
    notifyListeners();
    try {
      final data = await _api.post('/auth/otp/request', body: {'phone': phone}, auth: false);
      if (data is Map && data['mockCode'] != null) {
        lastMockOtp = data['mockCode'].toString();
      } else {
        lastMockOtp = null;
      }
    } finally {
      loading = false;
      notifyListeners();
    }
  }

  Future<void> verifyOtp(String phone, String code) async {
    loading = true;
    notifyListeners();
    try {
      final data = await _api.post('/auth/otp/verify', body: {'phone': phone, 'code': code}, auth: false) as Map;
      final token = data['accessToken']?.toString();
      if (token == null) throw ApiException('توکن دریافت نشد');
      await SecureStore.saveToken(token);
      final u = data['user'];
      if (u is Map<String, dynamic>) {
        user = AppUser.fromJson(u);
        // normalize permissions from roles if missing
        if (user!.permissions.isEmpty && u['roles'] is List) {
          final perms = <String>[];
          for (final r in u['roles'] as List) {
            if (r is Map && r['permissions'] is List) {
              for (final p in r['permissions'] as List) {
                if (p is Map && p['code'] != null) perms.add(p['code'].toString());
                else perms.add(p.toString());
              }
            }
          }
          user = AppUser(
            id: user!.id,
            phone: user!.phone,
            fullName: user!.fullName,
            isSuperAdmin: user!.isSuperAdmin || perms.contains('*'),
            roleCodes: user!.roleCodes,
            permissions: perms.isEmpty ? user!.permissions : perms,
          );
        }
        await SecureStore.saveUserJson(jsonEncode({
          'id': user!.id,
          'phone': user!.phone,
          'fullName': user!.fullName,
          'isSuperAdmin': user!.isSuperAdmin,
          'roles': user!.roleCodes.map((c) => {'code': c}).toList(),
          'permissions': user!.permissions,
        }));
      }
      lastMockOtp = null;
    } finally {
      loading = false;
      notifyListeners();
    }
  }

  Future<void> logout() async {
    await SecureStore.clear();
    user = null;
    notifyListeners();
  }
}
