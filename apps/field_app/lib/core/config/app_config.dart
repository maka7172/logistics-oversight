class AppConfig {
  AppConfig._();

  static const String apiBaseUrl = String.fromEnvironment(
    'API_BASE_URL',
    defaultValue: 'http://192.168.1.177:3000',
  );

  static const String apiPrefix = '/api/v1';
  static String get apiRoot => '$apiBaseUrl$apiPrefix';

  static const Duration connectTimeout = Duration(seconds: 20);
  static const Duration locationInterval = Duration(seconds: 20);
  static const bool showMockOtp = true;

  /// بررسی SIM حذف شد؛ امنیت با OTP + Device Binding
  static const bool requireSimMatch = false;
}
