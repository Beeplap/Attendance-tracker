"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Sidebar from "@/components/ui/Sidebar";
import { Calendar, BookOpen, User as UserIcon } from "lucide-react";

export default function StudentDashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [studentData, setStudentData] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [currentView, setCurrentView] = useState("dashboard");

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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const displayName =
    studentData?.full_name ||
    profile?.full_name ||
    user?.email?.split("@")[0] ||
    "Student";

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-violet-50 to-purple-100 p-6">
      <div className="w-full mx-auto flex flex-col lg:flex-row gap-6">
        <Sidebar
          role="student"
          open={sidebarOpen}
          onOpenChange={setSidebarOpen}
          collapsed={sidebarCollapsed}
          onToggleCollapsed={() => setSidebarCollapsed((v) => !v)}
          currentView={currentView}
          onViewChange={setCurrentView}
        />
        <main className="flex-1 space-y-8">
          {/* Header */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-violet-600 rounded-xl flex items-center justify-center shadow-lg">
                <UserIcon className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-violet-600">
                  Student Dashboard
                </h1>
                <p className="text-sm text-gray-700">
                  Welcome, {displayName}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                className="p-2 rounded-full sm:hidden"
                onClick={() => setSidebarOpen(true)}
                aria-label="Open sidebar"
              >
                <svg
                  className="w-5 h-5"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    d="M3 6h14M3 10h14M3 14h14"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
              </Button>
            </div>
          </div>

          {/* Dashboard View */}
          {currentView === "dashboard" && (
            <>
              {/* Overview cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="shadow-md border border-gray-200 hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">
                          Roll Number
                        </p>
                        <p className="text-2xl font-bold text-gray-900 mt-2">
                          {studentData?.roll || "—"}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          Your unique ID
                        </p>
                      </div>
                      <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center shadow-sm">
                        <UserIcon className="w-6 h-6 text-blue-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="shadow-md border border-gray-200 hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">
                          Class & Section
                        </p>
                        <p className="text-2xl font-bold text-gray-900 mt-2">
                          {studentData?.class || "—"}{" "}
                          {studentData?.section
                            ? `• ${studentData.section}`
                            : ""}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          Current enrollment
                        </p>
                      </div>
                      <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center shadow-sm">
                        <BookOpen className="w-6 h-6 text-green-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="shadow-md border border-gray-200 hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">
                          Guardian
                        </p>
                        <p className="text-2xl font-bold text-gray-900 mt-2 truncate">
                          {studentData?.guardian_name || "Not provided"}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          Emergency contact
                        </p>
                      </div>
                      <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center shadow-sm">
                        <UserIcon className="w-6 h-6 text-purple-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Quick actions */}
              <Card className="shadow-md border border-gray-200">
                <CardHeader>
                  <CardTitle className="text-lg font-semibold text-gray-800">
                    Quick Actions
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Button
                      variant="outline"
                      className="justify-start"
                      onClick={() => setCurrentView("attendance")}
                    >
                      <Calendar className="w-4 h-4 mr-2 text-purple-600" />
                      View my attendance
                    </Button>
                    <Button
                      variant="outline"
                      className="justify-start"
                      onClick={() => setCurrentView("profile")}
                    >
                      <UserIcon className="w-4 h-4 mr-2 text-purple-600" />
                      View my profile
                    </Button>
                    <Button
                      variant="outline"
                      className="justify-start"
                      onClick={() => setCurrentView("support")}
                    >
                      <BookOpen className="w-4 h-4 mr-2 text-purple-600" />
                      Help & guidelines
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </>
          )}

          {/* Attendance View */}
          {currentView === "attendance" && (
            <Card className="shadow-md border border-gray-200">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-purple-600" />
                  My Attendance
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-gray-700">
                  View your detailed attendance records, including dates and
                  status for each class.
                </p>
                <Button asChild className="bg-purple-600 hover:bg-purple-700">
                  <Link href="/attendance">Open attendance page</Link>
                </Button>
                <p className="text-xs text-gray-500">
                  If you notice any discrepancies, please contact your class
                  teacher or the administration office.
                </p>
              </CardContent>
            </Card>
          )}

          {/* Profile View */}
          {currentView === "profile" && (
            <Card className="shadow-md border border-gray-200">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                  <UserIcon className="w-5 h-5 text-purple-600" />
                  My Profile
                </CardTitle>
              </CardHeader>
              <CardContent>
                {studentData ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Full Name</p>
                      <p className="text-lg font-medium text-gray-900">
                        {studentData.full_name || displayName}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Email</p>
                      <p className="text-lg font-medium text-gray-900">
                        {profile?.email || user?.email || "N/A"}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Roll Number</p>
                      <p className="text-lg font-medium text-gray-900">
                        {studentData.roll}
                      </p>
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
                    <div>
                      <p className="text-sm text-gray-600">Phone Number</p>
                      <p className="text-lg font-medium text-gray-900">
                        {studentData.phone_number || "N/A"}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Guardian Contact</p>
                      <p className="text-lg font-medium text-gray-900">
                        {studentData.guardian_phone ||
                          studentData.guardian_contact ||
                          studentData.emergency_contact ||
                          "N/A"}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Address</p>
                      <p className="text-lg font-medium text-gray-900">
                        {studentData.address || "N/A"}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Date of Birth</p>
                      <p className="text-lg font-medium text-gray-900">
                        {studentData.date_of_birth || studentData.dob
                          ? new Date(
                              studentData.date_of_birth || studentData.dob
                            ).toLocaleDateString()
                          : "N/A"}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Admission Date</p>
                      <p className="text-lg font-medium text-gray-900">
                        {studentData.admission_date
                          ? new Date(
                              studentData.admission_date
                            ).toLocaleDateString()
                          : "N/A"}
                      </p>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-gray-600">
                    Student information is not available.
                  </p>
                )}
              </CardContent>
            </Card>
          )}

          {/* Support View */}
          {currentView === "support" && (
            <Card className="shadow-md border border-gray-200">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-gray-800">
                  Help & Support
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-gray-700">
                <p>
                  For any issues related to your account, attendance, or
                  academic records, please contact:
                </p>
                <ul className="list-disc list-inside space-y-1">
                  <li>
                    <span className="font-medium">Class Teacher:</span>{" "}
                    reach out during school hours.
                  </li>
                  <li>
                    <span className="font-medium">Administration Office:</span>{" "}
                    visit the office or use the official contact channels.
                  </li>
                  <li>
                    <span className="font-medium">Technical Support:</span>{" "}
                    report any application issues to the system administrator.
                  </li>
                </ul>
              </CardContent>
            </Card>
          )}
        </main>
      </div>
    </div>
  );
}

