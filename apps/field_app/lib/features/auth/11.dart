import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../core/auth/auth_state.dart';
import '../../core/config/app_config.dart';
import '../../core/security/sim_guard.dart';
import '../../core/api/api_client.dart';
import '../../core/theme/app_theme.dart';

class LoginPage extends StatefulWidget {
  const LoginPage({super.key});
  @override
  State<LoginPage> createState() => _LoginPageState();
}

class _LoginPageState extends State<LoginPage> {
  final phoneCtrl = TextEditingController();
  final codeCtrl = TextEditingController();
  bool otpStep = false;
  String? error;

  @override
  void dispose() {
    phoneCtrl.dispose();
    codeCtrl.dispose();
    super.dispose();
  }

  Future<void> _request() async {
    setState(() => error = null);
    final phone = SimGuard.normalize(phoneCtrl.text.trim());
    phoneCtrl.text = phone;
    if (phone.length < 10) {
      setState(() => error = 'شماره موبایل معتبر وارد کنید');
      return;
    }
    try {
      await context.read<AuthState>().requestOtp(phone);
      setState(() => otpStep = true);
      final mock = context.read<AuthState>().lastMockOtp;
      if (AppConfig.showMockOtp && mock != null) codeCtrl.text = mock;
    } on ApiException catch (e) {
      setState(() => error = e.message);
    } catch (e) {
      setState(() => error = 'عدم ارتباط با سرور');
    }
  }

  Future<void> _verify() async {
    setState(() => error = null);
    try {
      await context.read<AuthState>().verifyOtp(phoneCtrl.text.trim(), codeCtrl.text.trim());
    } on ApiException catch (e) {
      setState(() => error = e.message);
    } catch (e) {
      setState(() => error = e.toString());
    }
  }

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthState>();
    return Scaffold(
      body: Container(
        width: double.infinity,
        decoration: const BoxDecoration(
          gradient: LinearGradient(
            colors: [Color(0xFF0B4F4A), AppTheme.brandDark, AppTheme.brand],
            begin: Alignment.topRight,
            end: Alignment.bottomLeft,
          ),
        ),
        child: SafeArea(
          child: Center(
            child: SingleChildScrollView(
              padding: const EdgeInsets.all(24),
              child: ConstrainedBox(
                constraints: const BoxConstraints(maxWidth: 420),
                child: Column(
                  children: [
                    Container(
                      width: 76,
                      height: 76,
                      decoration: BoxDecoration(
                        color: Colors.white.withOpacity(0.16),
                        borderRadius: BorderRadius.circular(22),
                        boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.2), blurRadius: 16, offset: const Offset(0, 8))],
                      ),
                      alignment: Alignment.center,
                      child: const Text('LO', style: TextStyle(color: Colors.white, fontSize: 28, fontWeight: FontWeight.w800)),
                    ),
                    const SizedBox(height: 14),
                    const Text('واحد لجستیک', style: TextStyle(color: Colors.white, fontSize: 26, fontWeight: FontWeight.w800)),
                    const SizedBox(height: 6),
                    Text('سامانه عملیات میدانی', style: TextStyle(color: Colors.white.withOpacity(0.85), fontSize: 13)),
                    const SizedBox(height: 28),
                    Container(
                      padding: const EdgeInsets.all(22),
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(24),
                        boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.14), blurRadius: 28, offset: const Offset(0, 12))],
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.stretch,
                        children: [
                          if (error != null)
                            Container(
                              margin: const EdgeInsets.only(bottom: 12),
                              padding: const EdgeInsets.all(12),
                              decoration: BoxDecoration(color: Colors.red.shade50, borderRadius: BorderRadius.circular(12)),
                              child: Text(error!, style: TextStyle(color: Colors.red.shade800, fontSize: 13)),
                            ),
                          if (!otpStep) ...[
                            const Text('شماره موبایل', style: TextStyle(fontWeight: FontWeight.w600)),
                            const SizedBox(height: 8),
                            TextField(
                              controller: phoneCtrl,
                              keyboardType: TextInputType.phone,
                              textDirection: TextDirection.ltr,
                              decoration: const InputDecoration(hintText: '09xxxxxxxxx', prefixIcon: Icon(Icons.phone_android)),
                            ),
                            const SizedBox(height: 16),
                            FilledButton(
                              onPressed: auth.loading ? null : _request,
                              child: Text(auth.loading ? '...' : 'دریافت کد'),
                            ),
                          ] else ...[
                            if (auth.lastMockOtp != null)
                              Container(
                                margin: const EdgeInsets.only(bottom: 12),
                                padding: const EdgeInsets.all(10),
                                decoration: BoxDecoration(color: Colors.amber.shade50, borderRadius: BorderRadius.circular(12)),
                                child: Text('کد آزمایشی: ${auth.lastMockOtp}', textAlign: TextAlign.center),
                              ),
                            const Text('کد تأیید', style: TextStyle(fontWeight: FontWeight.w600)),
                            const SizedBox(height: 8),
                            TextField(
                              controller: codeCtrl,
                              keyboardType: TextInputType.number,
                              textAlign: TextAlign.center,
                              style: const TextStyle(letterSpacing: 8, fontSize: 22, fontWeight: FontWeight.w700),
                              decoration: const InputDecoration(hintText: '------'),
                            ),
                            const SizedBox(height: 16),
                            FilledButton(
                              onPressed: auth.loading ? null : _verify,
                              child: Text(auth.loading ? '...' : 'ورود'),
                            ),
                            TextButton(
                              onPressed: () => setState(() { otpStep = false; codeCtrl.clear(); }),
                              child: const Text('تغییر شماره'),
                            ),
                          ],
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}
