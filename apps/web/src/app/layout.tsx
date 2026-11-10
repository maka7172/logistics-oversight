import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'ROOK',
  description: 'ROOK Admin Panel',
  icons: {
    icon: '/brand/combination.png',
    apple: '/brand/combination.png',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fa" dir="rtl" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
