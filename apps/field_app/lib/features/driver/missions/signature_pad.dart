import 'dart:typed_data';
import 'dart:ui' as ui;
import 'package:flutter/material.dart';
import 'package:flutter/rendering.dart';

class SignaturePad extends StatefulWidget {
  const SignaturePad({super.key});
  @override
  SignaturePadState createState() => SignaturePadState();
}

class SignaturePadState extends State<SignaturePad> {
  final _points = <Offset?>[];
  final _repaint = GlobalKey();

  void clear() {
    setState(() => _points.clear());
  }

  bool get hasStroke => _points.any((p) => p != null);

  Future<Uint8List?> toPngBytes() async {
    if (!hasStroke) return null;
    final boundary = _repaint.currentContext?.findRenderObject() as RenderRepaintBoundary?;
    if (boundary == null) return null;
    final image = await boundary.toImage(pixelRatio: 2);
    final bd = await image.toByteData(format: ui.ImageByteFormat.png);
    return bd?.buffer.asUint8List();
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        SizedBox(
          height: 160,
          width: double.infinity,
          child: DecoratedBox(
            decoration: BoxDecoration(
              color: Colors.white,
              border: Border.all(color: Colors.black26),
              borderRadius: BorderRadius.circular(8),
            ),
            child: RepaintBoundary(
              key: _repaint,
              child: GestureDetector(
                behavior: HitTestBehavior.opaque,
                onPanStart: (d) => setState(() => _points.add(d.localPosition)),
                onPanUpdate: (d) => setState(() => _points.add(d.localPosition)),
                onPanEnd: (_) => setState(() => _points.add(null)),
                child: CustomPaint(
                  size: const Size(double.infinity, 160),
                  painter: _SigPainter(_points),
                ),
              ),
            ),
          ),
        ),
        Align(
          alignment: Alignment.centerLeft,
          child: TextButton.icon(
            onPressed: clear,
            icon: const Icon(Icons.clear, size: 18),
            label: const Text('پاک کردن امضا'),
          ),
        ),
      ],
    );
  }
}

class _SigPainter extends CustomPainter {
  _SigPainter(this.points);
  final List<Offset?> points;

  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = Colors.black
      ..strokeWidth = 2.4
      ..strokeCap = StrokeCap.round
      ..style = PaintingStyle.stroke;
    for (var i = 0; i < points.length - 1; i++) {
      final a = points[i];
      final b = points[i + 1];
      if (a != null && b != null) canvas.drawLine(a, b, paint);
    }
  }

  @override
  bool shouldRepaint(covariant _SigPainter old) => true;
}
