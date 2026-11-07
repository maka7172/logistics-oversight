import 'package:flutter_secure_storage/flutter_secure_storage.dart';

class SecureStore {
  static const _storage = FlutterSecureStorage(
    aOptions: AndroidOptions(encryptedSharedPreferences: true),
  );

  static const _kToken = 'access_token';
  static const _kUser = 'user_json';

  static Future<void> saveToken(String token) => _storage.write(key: _kToken, value: token);
  static Future<String?> readToken() => _storage.read(key: _kToken);
  static Future<void> saveUserJson(String json) => _storage.write(key: _kUser, value: json);
  static Future<String?> readUserJson() => _storage.read(key: _kUser);
  static Future<void> clear() async {
    await _storage.delete(key: _kToken);
    await _storage.delete(key: _kUser);
  }
}
