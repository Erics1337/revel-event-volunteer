import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from '@/contexts/auth-context';

export const metadata: Metadata = {
  title: "Revel Event Platform - Boulder Startup Week 2026",
  description: "Open-source community event management platform for Boulder Startup Week and beyond.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
