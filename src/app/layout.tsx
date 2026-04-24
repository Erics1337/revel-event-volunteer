import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";
import { AuthProvider } from '@/contexts/auth-context';
import { PhoneRequiredModal } from '@/components/PhoneRequiredModal';

export const metadata: Metadata = {
  title: "Revel Event Platform - Boulder Startup Week 2026",
  description: "Open-source community event management platform for Boulder Startup Week and beyond.",
  icons: {
    icon: '/icon.png?v=3',
    apple: '/icon.png?v=3',
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col" suppressHydrationWarning>
        <AuthProvider>
          {children}
          <PhoneRequiredModal />
        </AuthProvider>
        <Analytics />
      </body>
    </html>
  );
}
