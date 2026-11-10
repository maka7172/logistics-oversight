import 'package:flutter/material.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:provider/provider.dart';
import 'core/api/api_client.dart';
import 'core/auth/auth_state.dart';
import 'core/theme/app_theme.dart';
import 'features/auth/login_page.dart';
import 'features/home/home_page.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  runApp(const FieldApp());
}

class FieldApp extends StatelessWidget {
  const FieldApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MultiProvider(
      providers: [
        Provider(create: (_) => ApiClient()),
        ChangeNotifierProvider(create: (ctx) => AuthState(ctx.read<ApiClient>())..hydrate()),
      ],
      child: MaterialApp(
        title: 'ROOK',
        debugShowCheckedModeBanner: false,
        theme: AppTheme.light(),
        locale: const Locale('fa'),
        supportedLocales: const [Locale('fa'), Locale('en')],
        localizationsDelegates: const [
          GlobalMaterialLocalizations.delegate,
          GlobalWidgetsLocalizations.delegate,
          GlobalCupertinoLocalizations.delegate,
        ],
        builder: (context, child) => Directionality(textDirection: TextDirection.rtl, child: child!),
        home: const _Root(),
      ),
    );
  }
}

class _Root extends StatelessWidget {
  const _Root();
  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthState>();
    if (auth.user == null) return const LoginPage();
    return const HomePage();
  }
}
