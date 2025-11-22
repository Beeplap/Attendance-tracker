import type { Metadata } from 'next';
import '../styles/globals.css';
import AuthGuard from '@/components/AuthGuard';

export const metadata: Metadata = {
  title: 'Student Management System',
  description: 'A modern student management system built with Next.js and Supabase',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <AuthGuard>{children}</AuthGuard>
      </body>
    </html>
  );
}

