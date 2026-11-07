import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../core/auth/auth_state.dart';
import '../../core/theme/app_theme.dart';
import '../driver/shifts/driver_shifts_page.dart';
import '../driver/missions/driver_missions_page.dart';
import '../driver/location/location_service.dart';
import '../driver/location/live_map_page.dart';
import '../supervisor/load/supervisor_load_page.dart';
import '../supervisor/missions/supervisor_missions_page.dart';
import '../supervisor/shifts/supervisor_shifts_page.dart';

class _MenuItem {
  final String title;
  final String subtitle;
  final IconData icon;
  final Color color;
  final Widget page;
  _MenuItem(this.title, this.subtitle, this.icon, this.color, this.page);
}

class HomePage extends StatefulWidget {
  const HomePage({super.key});
  @override
  State<HomePage> createState() => _HomePageState();
}

class _HomePageState extends State<HomePage> {
  Widget? openPage;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final user = context.read<AuthState>().user;
      if (user == null) return;
      // پینگ موقعیت برای راننده و سوپرادمین
      if (user.roleCodes.contains('driver') || user.isSuperAdmin) {
        LocationService.instance.start(context);
      }
    });
  }

  List<_MenuItem> _menus(AppUser user) {
    final list = <_MenuItem>[];
    final driverLike = user.roleCodes.contains('driver') || user.isSuperAdmin;
    final supervisorLike = user.isSupervisor; // includes admin + super_admin

    if (driverLike) {
      list.add(_MenuItem('شیفت‌های من', 'شروع و بستن شیفت راننده', Icons.schedule_rounded, const Color(0xFF0EA5E9), const DriverShiftsPage()));
      list.add(_MenuItem('مأموریت‌ها', 'رسیدن و تحویل کالا', Icons.local_shipping_rounded, const Color(0xFF8B5CF6), const DriverMissionsPage()));
      list.add(_MenuItem('موقعیت من', 'ارسال زنده مختصات', Icons.my_location_rounded, const Color(0xFF10B981), const LiveMapPage()));
    }

    if (supervisorLike) {
      list.add(_MenuItem('مدیریت شیفت', 'ایجاد شیفت برای راننده', Icons.event_available_rounded, const Color(0xFF6366F1), const SupervisorShiftsPage()));
      list.add(_MenuItem('بار انبار', 'ثبت و تأیید بار', Icons.inventory_2_rounded, const Color(0xFFF59E0B), const SupervisorLoadPage()));
      list.add(_MenuItem('تعریف مأموریت', 'انتخاب مشتری مقصد', Icons.add_road_rounded, const Color(0xFFEF4444), const SupervisorMissionsPage()));
      list.add(_MenuItem('نقشه راننده‌ها', 'آخرین موقعیت‌ها', Icons.map_rounded, const Color(0xFF14B8A6), const LiveMapPage(supervisorMode: true)));
    }
    return list;
  }

  @override
  Widget build(BuildContext context) {
    final user = context.watch<AuthState>().user!;
    final menus = _menus(user);

    if (openPage != null) {
      return Scaffold(
        appBar: AppBar(
          leading: IconButton(icon: const Icon(Icons.arrow_forward), onPressed: () => setState(() => openPage = null)),
          title: const Text('واحد لجستیک'),
          actions: [
            IconButton(
              icon: const Icon(Icons.logout_rounded),
              onPressed: () async {
                LocationService.instance.stop();
                await context.read<AuthState>().logout();
              },
            ),
          ],
        ),
        body: openPage,
      );
    }

    return Scaffold(
      appBar: AppBar(
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text('واحد لجستیک'),
            Text('${user.fullName} · ${user.phone}', style: const TextStyle(fontSize: 11, color: AppTheme.muted, fontWeight: FontWeight.w500)),
          ],
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.logout_rounded),
            onPressed: () async {
              LocationService.instance.stop();
              await context.read<AuthState>().logout();
            },
          ),
        ],
      ),
      body: menus.isEmpty
          ? const Center(child: Text('نقشی برای عملیات میدانی تعریف نشده است'))
          : Center(
              child: ConstrainedBox(
                constraints: const BoxConstraints(maxWidth: 720),
                child: GridView.count(
                  shrinkWrap: true,
                  padding: const EdgeInsets.fromLTRB(20, 28, 20, 28),
                  crossAxisCount: MediaQuery.sizeOf(context).width > 600 ? 3 : 2,
                  mainAxisSpacing: 16,
                  crossAxisSpacing: 16,
                  childAspectRatio: 0.95,
                  children: menus.map((m) {
                    return GestureDetector(
                      onTap: () => setState(() => openPage = m.page),
                      child: Container(
                        decoration: BoxDecoration(
                          borderRadius: BorderRadius.circular(22),
                          gradient: LinearGradient(
                            colors: [m.color.withOpacity(0.95), m.color.withOpacity(0.72)],
                            begin: Alignment.topLeft,
                            end: Alignment.bottomRight,
                          ),
                          boxShadow: [BoxShadow(color: m.color.withOpacity(0.35), blurRadius: 18, offset: const Offset(0, 10))],
                        ),
                        padding: const EdgeInsets.all(16),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Container(
                              width: 46,
                              height: 46,
                              decoration: BoxDecoration(color: Colors.white.withOpacity(0.22), borderRadius: BorderRadius.circular(14)),
                              child: Icon(m.icon, color: Colors.white, size: 26),
                            ),
                            const Spacer(),
                            Text(m.title, style: const TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.w800)),
                            const SizedBox(height: 4),
                            Text(m.subtitle, style: TextStyle(color: Colors.white.withOpacity(0.9), fontSize: 12, height: 1.3)),
                          ],
                        ),
                      ),
                    );
                  }).toList(),
                ),
              ),
            ),
    );
  }
}
