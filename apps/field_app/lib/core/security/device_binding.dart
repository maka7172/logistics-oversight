import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:uuid/uuid.dart';

/// شناسه پایدار دستگاه در Secure Storage (Android Keystore-backed when available).
/// با هر درخواست به سرور در هدر X-Device-Id ارسال می‌شود تا توکن روی دستگاه قفل نرم شود.
class DeviceBinding {
  static const _storage = FlutterSecureStorage(
    aOptions: AndroidOptions(encryptedSharedPreferences: true),
  );
  static const _key = 'device_binding_id';

  static Future<String> getOrCreateDeviceId() async {
    final existing = await _storage.read(key: _key);
    if (existing != null && existing.isNotEmpty) return existing;
    final id = const Uuid().v4();
    await _storage.write(key: _key, value: id);
    return id;
  }
}
