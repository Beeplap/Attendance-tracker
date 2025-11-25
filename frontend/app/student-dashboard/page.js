"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "../../lib/supabaseClient";

export default function StudentDashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [showSignOutConfirm, setShowSignOutConfirm] = useState(false);
  const [studentData, setStudentData] = useState(null);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const {
          data: { user: authUser },
        } = await supabase.auth.getUser();

        if (!authUser) {
          router.replace("/login");
          return;
        }

        setUser(authUser);

        // Fetch user profile from users table
        const { data: userProfile, error: profileError } = await supabase
          .from("users")
          .select("*")
          .eq("id", authUser.id)
          .maybeSingle();

        if (profileError) {
          console.error("Error fetching profile:", profileError);
        } else {
          setProfile(userProfile);

          // Check if user is a student
          if (userProfile?.role !== "student") {
            // Redirect based on role
            if (userProfile?.role === "admin") {
              router.replace("/admin");
            } else if (userProfile?.role === "teacher") {
              router.replace("/teacher-dashboard");
            } else {
              router.replace("/dashboard");
            }
            return;
          }

          // Fetch student data from students table
          const { data: student, error: studentError } = await supabase
            .from("students")
            .select("*")
            .eq("id", authUser.id)
            .maybeSingle();

          if (studentError) {
            console.error("Error fetching student data:", studentError);
          } else {
            setStudentData(student);
          }
        }
      } catch (error) {
        console.error("Error fetching user:", error);
        router.replace("/login");
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [router]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.replace("/login");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 h-full w-64 bg-gray-900 text-white p-6">
        <h2 className="text-2xl font-bold mb-8">Student Portal</h2>
        <nav className="space-y-2">
          <Link
            href="/student-dashboard"
            className="block px-4 py-2 bg-gray-800 rounded-md hover:bg-gray-700 transition-colors"
          >
            Dashboard
          </Link>
          <Link
            href="/attendance"
            className="block px-4 py-2 rounded-md hover:bg-gray-800 transition-colors"
          >
            My Attendance
          </Link>
        </nav>
        <div className="absolute bottom-6 left-6 right-6">
          <button
            onClick={() => setShowSignOutConfirm(true)}
            className="w-full px-4 py-2 bg-red-600 rounded-md hover:bg-red-700 transition-colors"
          >
            Sign Out
          </button>
        </div>

        {/* Sign Out Confirmation Dialog */}
        <ConfirmDialog
          open={showSignOutConfirm}
          onClose={() => setShowSignOutConfirm(false)}
          onConfirm={handleSignOut}
          title="Sign Out"
          message="Are you sure you want to sign out? You will need to log in again to access your account."
          confirmText="Sign Out"
          cancelText="Cancel"
          variant="danger"
        />
      </aside>

      {/* Main Content */}
      <div className="ml-64 p-6">
        <div className="max-w-7xl">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Student Dashboard</h1>
          <p className="text-gray-600 mb-6">
            Welcome, {studentData?.full_name || profile?.full_name || user?.email || "Student"}!
          </p>

          {/* Student Info Card */}
          {studentData && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Student Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Roll Number</p>
                  <p className="text-lg font-medium text-gray-900">{studentData.roll}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Class</p>
                  <p className="text-lg font-medium text-gray-900">
                    {studentData.class || "N/A"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Section</p>
                  <p className="text-lg font-medium text-gray-900">
                    {studentData.section || "N/A"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Guardian</p>
                  <p className="text-lg font-medium text-gray-900">
                    {studentData.guardian_name || "N/A"}
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Link
              href="/attendance"
              className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow"
            >
              <h2 className="text-xl font-semibold text-gray-900 mb-2">View Attendance</h2>
              <p className="text-gray-600">Check your attendance records</p>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

