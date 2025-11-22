'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/hooks/useUser';

export default function Home() {
  const router = useRouter();
  const { user, profile, loading } = useUser();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.replace('/login');
      } else if (profile) {
        // Redirect based on role
        switch (profile.role) {
          case 'admin':
            router.replace('/admin');
            break;
          case 'teacher':
            router.replace('/teacher');
            break;
          default:
            router.replace('/dashboard');
        }
      }
    }
  }, [user, profile, loading, router]);

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Redirecting...</p>
      </div>
    </main>
  );
}

