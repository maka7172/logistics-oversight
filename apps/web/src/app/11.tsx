import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Logistics Oversight',
  description: 'Logistics Oversight Admin Panel',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fa" dir="rtl" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
