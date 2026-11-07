import 'dart:convert';
import 'package:http/http.dart' as http;
import '../config/app_config.dart';
import '../security/secure_storage.dart';
import '../security/device_binding.dart';

class ApiException implements Exception {
  final int? statusCode;
  final String message;
  ApiException(this.message, {this.statusCode});
  @override
  String toString() => message;
}

class ApiClient {
  ApiClient({http.Client? client}) : _client = client ?? http.Client();
  final http.Client _client;

  Future<Map<String, String>> _headers({bool auth = true}) async {
    final h = <String, String>{
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };
    final deviceId = await DeviceBinding.getOrCreateDeviceId();
    h['X-Device-Id'] = deviceId;
    if (auth) {
      final token = await SecureStore.readToken();
      if (token != null && token.isNotEmpty) {
        h['Authorization'] = 'Bearer $token';
      }
    }
    return h;
  }

  Uri _uri(String path, [Map<String, String>? query]) {
    final p = path.startsWith('/') ? path : '/$path';
    return Uri.parse('${AppConfig.apiRoot}$p').replace(queryParameters: query);
  }

  Future<dynamic> get(String path, {Map<String, String>? query, bool auth = true}) async {
    final res = await _client
        .get(_uri(path, query), headers: await _headers(auth: auth))
        .timeout(AppConfig.connectTimeout);
    return _handle(res);
  }

  Future<dynamic> post(
    String path, {
    Map<String, dynamic>? body,
    bool auth = true,
    Map<String, String>? headers,
  }) async {
    final h = await _headers(auth: auth);
    if (headers != null) h.addAll(headers);
    final res = await _client
        .post(_uri(path), headers: h, body: body == null ? null : jsonEncode(body))
        .timeout(AppConfig.connectTimeout);
    return _handle(res);
  }

  Future<dynamic> patch(String path, {Map<String, dynamic>? body}) async {
    final res = await _client
        .patch(_uri(path), headers: await _headers(), body: body == null ? null : jsonEncode(body))
        .timeout(AppConfig.connectTimeout);
    return _handle(res);
  }

  dynamic _handle(http.Response res) {
    dynamic data;
    try {
      data = res.body.isEmpty ? null : jsonDecode(res.body);
    } catch (_) {
      data = res.body;
    }
    if (res.statusCode >= 200 && res.statusCode < 300) return data;
    final msg = (data is Map && data['message'] != null)
        ? data['message'].toString()
        : 'خطای سرور (${res.statusCode})';
    throw ApiException(msg, statusCode: res.statusCode);
  }
}
