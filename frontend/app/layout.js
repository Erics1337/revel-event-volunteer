import './globals.css';

export const metadata = {
  title: 'BSW 2026 — Volunteer Portal',
  description: 'Volunteer management for Boulder Startup Week 2026',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
