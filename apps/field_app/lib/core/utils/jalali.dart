/// Minimal Gregorian → Jalali formatter (no external package).
class Jalali {
  final int year;
  final int month;
  final int day;

  const Jalali(this.year, this.month, this.day);

  static const _monthNames = [
    'فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور',
    'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند',
  ];

  static Jalali fromDateTime(DateTime dt) {
    final g = DateTime(dt.year, dt.month, dt.day);
    return _gregorianToJalali(g.year, g.month, g.day);
  }

  static Jalali? tryParse(dynamic value) {
    if (value == null) return null;
    final dt = DateTime.tryParse(value.toString());
    if (dt == null) return null;
    return fromDateTime(dt.toLocal());
  }

  /// e.g. ۱۴۰۴/۰۸/۱۹
  String format({bool persianDigits = true}) {
    final s = '${year.toString().padLeft(4, '0')}/'
        '${month.toString().padLeft(2, '0')}/'
        '${day.toString().padLeft(2, '0')}';
    return persianDigits ? toPersianDigits(s) : s;
  }

  /// e.g. ۱۹ آبان ۱۴۰۴
  String formatLong({bool persianDigits = true}) {
    final s = '$day ${_monthNames[month - 1]} $year';
    return persianDigits ? toPersianDigits(s) : s;
  }

  static String toPersianDigits(String input) {
    const en = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];
    const fa = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
    var out = input;
    for (var i = 0; i < 10; i++) {
      out = out.replaceAll(en[i], fa[i]);
    }
    return out;
  }

  static Jalali _gregorianToJalali(int gy, int gm, int gd) {
    final gdm = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334];
    var gy2 = (gm > 2) ? (gy + 1) : gy;
    var days = 355666 +
        (365 * gy) +
        ((gy2 + 3) ~/ 4) -
        ((gy2 + 99) ~/ 100) +
        ((gy2 + 399) ~/ 400) +
        gd +
        gdm[gm - 1];
    var jy = -1595 + (33 * (days ~/ 12053));
    days %= 12053;
    jy += 4 * (days ~/ 1461);
    days %= 1461;
    if (days > 365) {
      jy += (days - 1) ~/ 365;
      days = (days - 1) % 365;
    }
    int jm;
    int jd;
    if (days < 186) {
      jm = 1 + (days ~/ 31);
      jd = 1 + (days % 31);
    } else {
      jm = 7 + ((days - 186) ~/ 30);
      jd = 1 + ((days - 186) % 30);
    }
    return Jalali(jy, jm, jd);
  }
}
