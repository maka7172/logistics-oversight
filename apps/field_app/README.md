# Field App — Logistics Oversight v2

اپ یکپارچه **راننده + ناظر** (موبایل و تبلت).

## اتصال به سرور
- Base URL در `lib/core/config/app_config.dart`
- REST: `http(s)://HOST:3000/api/v1/...`
- هدر: `Authorization: Bearer <JWT>`
- موقعیت: `POST /reports/location-ping`

## اجرا
```bash
cd apps/field_app
flutter pub get
flutter run
# یا برای تبلت emulator
flutter run -d <device_id>
```

روی ویندوز/اندروید امولاتور، API را روی `10.0.2.2:3000` بگذار (معادل localhost هاست).
برای گوشی واقعی IP سیستم خودت را بگذار.
