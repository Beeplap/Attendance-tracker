'use client';

import { useUser } from '@/hooks/useUser';
import Link from 'next/link';

export default function DashboardPage() {
  const { profile, loading } = useUser();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard</h1>
        <p className="text-gray-600 mb-6">
          Welcome, {profile?.full_name || profile?.email || 'User'}!
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Link
            href="/students"
            className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow"
          >
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Students</h2>
            <p className="text-gray-600">Manage student records</p>
          </Link>

          {profile?.role === 'teacher' || profile?.role === 'admin' ? (
            <Link
              href="/attendance"
              className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow"
            >
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                Attendance
              </h2>
              <p className="text-gray-600">Mark and view attendance</p>
            </Link>
          ) : null}

          {profile?.role === 'admin' ? (
            <>
              <Link
                href="/admin"
                className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow"
              >
                <h2 className="text-xl font-semibold text-gray-900 mb-2">
                  Admin Panel
                </h2>
                <p className="text-gray-600">Administrative functions</p>
              </Link>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}

