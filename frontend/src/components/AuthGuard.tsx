'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useUser } from '@/hooks/useUser';

interface AuthGuardProps {
  children: React.ReactNode;
  requiredRole?: 'admin' | 'teacher' | 'student';
}

export default function AuthGuard({ children, requiredRole }: AuthGuardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, profile, loading } = useUser();

  useEffect(() => {
    // Don't redirect on login page or auth callback
    if (
      pathname === '/login' ||
      pathname.startsWith('/auth/') ||
      pathname === '/'
    ) {
      return;
    }

    if (!loading) {
      if (!user) {
        // Not authenticated, redirect to login
        router.replace('/login');
        return;
      }

      if (requiredRole && profile) {
        // Check role-based access
        const roleHierarchy: Record<string, number> = {
          student: 1,
          teacher: 2,
          admin: 3,
        };

        const userRoleLevel = roleHierarchy[profile.role] || 0;
        const requiredRoleLevel = roleHierarchy[requiredRole] || 0;

        if (userRoleLevel < requiredRoleLevel) {
          // Insufficient permissions, redirect to appropriate page
          switch (profile.role) {
            case 'admin':
              router.replace('/admin');
              break;
            case 'teacher':
              router.replace('/teacher');
              break;
            case 'student':
              router.replace('/students');
              break;
            default:
              router.replace('/students');
          }
        }
      }
    }
  }, [user, profile, loading, pathname, router, requiredRole]);

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Don't render children if not authenticated (will redirect)
  if (!user) {
    return null;
  }

  // Check role if required
  if (requiredRole && profile) {
    const roleHierarchy: Record<string, number> = {
      student: 1,
      teacher: 2,
      admin: 3,
    };

    const userRoleLevel = roleHierarchy[profile.role] || 0;
    const requiredRoleLevel = roleHierarchy[requiredRole] || 0;

    if (userRoleLevel < requiredRoleLevel) {
      return null; // Will redirect
    }
  }

  return <>{children}</>;
}

