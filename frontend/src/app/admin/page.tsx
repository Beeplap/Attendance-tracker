'use client';

import { useUser } from '@/hooks/useUser';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';

export default function AdminDashboardPage() {
  const { profile, loading } = useUser();
  const router = useRouter();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.replace('/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 h-full w-64 bg-gray-900 text-white p-6">
        <h2 className="text-2xl font-bold mb-8">Admin Portal</h2>
        <nav className="space-y-2">
          <Link
            href="/admin"
            className="block px-4 py-2 bg-gray-800 rounded-md hover:bg-gray-700 transition-colors"
          >
            Dashboard
          </Link>
          <Link
            href="/students"
            className="block px-4 py-2 rounded-md hover:bg-gray-800 transition-colors"
          >
            Students
          </Link>
          <Link
            href="/attendance"
            className="block px-4 py-2 rounded-md hover:bg-gray-800 transition-colors"
          >
            Attendance
          </Link>
          <Link
            href="/teachers"
            className="block px-4 py-2 rounded-md hover:bg-gray-800 transition-colors"
          >
            Teachers
          </Link>
          <Link
            href="/courses"
            className="block px-4 py-2 rounded-md hover:bg-gray-800 transition-colors"
          >
            Courses
          </Link>
          <Link
            href="/fees"
            className="block px-4 py-2 rounded-md hover:bg-gray-800 transition-colors"
          >
            Fees
          </Link>
          <Link
            href="/reports"
            className="block px-4 py-2 rounded-md hover:bg-gray-800 transition-colors"
          >
            Reports
          </Link>
        </nav>
        <div className="absolute bottom-6 left-6 right-6">
          <button
            onClick={handleSignOut}
            className="w-full px-4 py-2 bg-red-600 rounded-md hover:bg-red-700 transition-colors"
          >
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="ml-64 p-6">
        <div className="max-w-7xl">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Admin Dashboard</h1>
          <p className="text-gray-600 mb-6">
            Welcome, {profile?.full_name || profile?.email || 'Admin'}!
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Link
              href="/students"
              className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow"
            >
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Students</h2>
              <p className="text-gray-600">Manage student records</p>
            </Link>

            <Link
              href="/attendance"
              className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow"
            >
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Attendance</h2>
              <p className="text-gray-600">View and manage attendance</p>
            </Link>

            <Link
              href="/teachers"
              className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow"
            >
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Teachers</h2>
              <p className="text-gray-600">Manage teacher accounts</p>
            </Link>

            <Link
              href="/courses"
              className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow"
            >
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Courses</h2>
              <p className="text-gray-600">Manage courses and subjects</p>
            </Link>

            <Link
              href="/fees"
              className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow"
            >
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Fees</h2>
              <p className="text-gray-600">Manage fee payments</p>
            </Link>

            <Link
              href="/reports"
              className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow"
            >
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Reports</h2>
              <p className="text-gray-600">View system reports</p>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

