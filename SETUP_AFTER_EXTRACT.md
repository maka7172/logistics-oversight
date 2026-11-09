# بعد از استخراج پروژه

## 1) فایل‌های تنظیمات (حتماً)

از ریشه پروژه:

```bash
cp .env.example .env
cp config/secrets.example.env config/secrets.env
```

در `.env` حداقل این‌ها را پر کنید:

```env
POSTGRES_HOST=localhost
POSTGRES_PASSWORD=...رمز قوی...
JWT_ACCESS_SECRET=حداقل_۳۲_کاراکتر_تصادفی
JWT_REFRESH_SECRET=حداقل_۳۲_کاراکتر_تصادفی_دیگر

# پیامک
OTP_PROVIDER=smsir
SMSIR_API_KEY=کلید_واقعی
SMSIR_TEMPLATE_ID=شماره_قالب
SMSIR_LINE_NUMBER=

# یا برای تست بدون پیامک:
# OTP_PROVIDER=mock
```

## 2) IP اپ موبایل

فایل:
`apps/field_app/lib/core/config/app_config.dart`

آدرس API را روی IP سیستم خودتان بگذارید (مثلاً `http://192.168.1.10:3000/api/v1`).

## 3) اجرا

```bash
docker compose up -d postgres redis minio centrifugo
cd apps/api && npm install && npm run seed && npm run start:dev
cd apps/web && npm install && npm run dev
cd apps/field_app && flutter pub get && flutter run
```

## 4) اندروید

مجوز موقعیت در:
`apps/field_app/android/app/src/main/AndroidManifest.xml`
باید ACCESS_FINE_LOCATION و ACCESS_COARSE_LOCATION باشد.

## 5) کاربران seed نمونه

- سوپرادمین: معمولاً 09120000000 (mock OTP در حالت mock)
- راننده نمونه: 09121111111

## 6) نکات امنیتی اعمال‌شده در این نسخه

- PermissionsGuard = OR
- جلوگیری از ارتقای isSuperAdmin و نقش *
- مالکیت شیفت/مأموریت برای راننده
- قفل مأموریت completed
- اصلاح بدهی مشتری
- location-ping وابسته به هویت توکن
- refresh token
- audit روی login و عملیات حساس
- OTP: اولویت env؛ در production بدون mock بی‌صدا
