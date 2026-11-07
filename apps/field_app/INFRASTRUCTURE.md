# Field App — اتصال و امنیت

## تبادل داده
Flutter → REST JSON → `API_BASE_URL/api/v1` + هدر:
- `Authorization: Bearer <JWT>`
- `X-Device-Id: <uuid پایدار در Secure Storage / Keystore-backed>`

## امنیت ورود (بدون خواندن SIM)
1. OTP پیامکی فقط به شماره ثبت‌شده در سرور
2. Device Binding: شناسه یکتای دستگاه در secure storage
3. سمت سرور (API موجود/قابل تقویت): rate limit، انقضای کوتاه OTP، یک‌بارمصرف، قفل پس از تلاش ناموفق
4. ریسک باقی‌مانده: **SIM swap**

## امضای APK
- `flutter run` و debug APK با **debug keystore** امضا می‌شوند (فقط تست).
- برای نصب گسترده/فروشگاه باید **release keystore** بسازی و با آن `flutter build apk --release` بگیری.
- debug signing را در نسخه نهایی نگه ندار؛ برای انتشار همیشه release signing جدا.

## آدرس سرور روی گوشی واقعی
```bash
flutter run --dart-define=API_BASE_URL=http://192.168.x.x:3000
# یا در app_config.dart
```
