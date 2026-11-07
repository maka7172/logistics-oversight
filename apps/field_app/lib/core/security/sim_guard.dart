import '../config/app_config.dart';

/// امنیت ورود بر پایه OTP به شماره ثبت‌شده است (نه خواندن SIM).
/// ریسک باقی‌مانده: SIM swap — با rate-limit و قفل سمت سرور کاهش می‌یابد.
class SimGuard {
  static String normalize(String phone) {
    var p = phone.replaceAll(RegExp(r'[\s\-]'), '');
    if (p.startsWith('+98')) p = '0${p.substring(3)}';
    if (p.startsWith('98') && p.length >= 12) p = '0${p.substring(2)}';
    return p;
  }

  static Future<({bool ok, bool simReadable, String? simPhone, String message})> checkMatches(
    String registeredPhone,
  ) async {
    return (
      ok: true,
      simReadable: false,
      simPhone: null,
      message: 'تأیید مالکیت خط فقط با OTP پیامکی به شماره ثبت‌شده انجام می‌شود',
    );
  }
}
