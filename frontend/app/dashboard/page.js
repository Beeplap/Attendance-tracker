"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "../../components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "../../components/ui/card";
import { supabase } from "../../lib/supabaseClient";
import { resolveUserRole } from "../../lib/utils";
import {
  Bell,
  Users,
  Clock,
  BookOpen,
  CheckCircle,
  XCircle,
  Calendar,
  TrendingUp,
  Activity,
} from "lucide-react";
import Sidebar from "../../components/ui/sidebar";
import ConfirmDialog from "../../components/ui/ConfirmDialog";
import NotificationBell from "../../components/ui/notificationBell";

export default function DashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [assignedClasses, setAssignedClasses] = useState([]);
  const [classesLoading, setClassesLoading] = useState(true);
  const [userId, setUserId] = useState("");
  const [teacherCode, setTeacherCode] = useState("");
  const [department, setDepartment] = useState("Mathematics");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [userRole, setUserRole] = useState("teacher");
  const [nepalTime, setNepalTime] = useState("");
  const [attendanceStats, setAttendanceStats] = useState({
    todayTotal: 0,
    todaySuccessful: 0,
    todayMissed: 0,
    timePercentages: {
      day: 0,
      week: 0,
      month: 0,
      threeMonths: 0,
      sixMonths: 0,
      year: 0,
    },
  });

  // Nepal time with seconds (UTC+5:45)
  useEffect(() => {
    const updateNepalTime = () => {
      const now = new Date();
      // Nepal is UTC+5:45 = 5 hours 45 minutes = 345 minutes
      const nepalOffsetMinutes = 5 * 60 + 45; // 345 minutes
      const utc = now.getTime() + now.getTimezoneOffset() * 60 * 1000;
      const nepalTime = new Date(utc + nepalOffsetMinutes * 60 * 1000);
      
      const hours = String(nepalTime.getHours()).padStart(2, "0");
      const minutes = String(nepalTime.getMinutes()).padStart(2, "0");
      const seconds = String(nepalTime.getSeconds()).padStart(2, "0");
      
      setNepalTime(`${hours}:${minutes}:${seconds}`);
    };
    
    updateNepalTime();
    const interval = setInterval(updateNepalTime, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      const user = data?.user;
      if (!user) {
        router.replace("/login");
        return;
      }
      const role = await resolveUserRole(supabase, user);
      if (role === "admin") {
        router.replace("/admin");
        return;
      }
      setUserRole(role || "teacher");
      setEmail(user.email || "");
      setUserId(user.id || "");

      try {
        // Fetch user profile from users table
        const { data: userProfile } = await supabase
          .from("users")
          .select("full_name, email")
          .eq("id", user.id)
          .maybeSingle();

        if (userProfile?.full_name) setFullName(userProfile.full_name);

        // Fetch assigned classes
        const { data: classes } = await supabase
          .from("classes")
          .select("*")
          .eq("teacher_id", user.id)
          .order("created_at", { ascending: true });

        setAssignedClasses(classes || []);
        await fetchAttendanceStats(user.id, classes || []);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
        setClassesLoading(false);
      }
    });
  }, [router]);

  const fetchAttendanceStats = async (teacherId, classes) => {
    try {
      const today = new Date().toISOString().split("T")[0];
      const now = new Date();

      // Calculate date ranges
      const ranges = {
        day: new Date(now.getTime() - 24 * 60 * 60 * 1000),
        week: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
        month: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
        threeMonths: new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000),
        sixMonths: new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000),
        year: new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000),
      };

      // Fetch today's attendance records
      const { data: todayAttendance } = await supabase
        .from("attendance")
        .select("date, subject_id")
        .eq("marked_by", teacherId)
        .eq("date", today);

      // Calculate today's stats
      const todayTotal = classes.length;
      // Count unique subjects/classes for today
      const todayUniqueSubjects = new Set(
        todayAttendance?.map((a) => a.subject_id).filter(Boolean) || []
      ).size;
      const todaySuccessful = todayUniqueSubjects || 0;
      const todayMissed = Math.max(0, todayTotal - todaySuccessful);

      // Calculate time percentages for each range
      const timePercentages = {};
      const PERIOD_DURATION = 45; // minutes per period

      for (const [period, startDate] of Object.entries(ranges)) {
        const startDateStr = startDate.toISOString().split("T")[0];
        
        // Fetch attendance records for this period
        const { data: attendanceRecords } = await supabase
          .from("attendance")
          .select("date, subject_id")
          .eq("marked_by", teacherId)
          .gte("date", startDateStr);

        if (attendanceRecords && attendanceRecords.length > 0) {
          // Count unique days with attendance
          const uniqueDays = new Set(attendanceRecords.map((r) => r.date)).size;
          
          // Calculate total time spent (unique days * period duration * number of classes)
          const totalTimeSpent = uniqueDays * PERIOD_DURATION * classes.length;
          
          // Calculate expected time (assuming 5 working days per week)
          const daysInRange = Math.ceil((now - startDate) / (24 * 60 * 60 * 1000));
          const workingDays = Math.ceil((daysInRange / 7) * 5);
          const expectedTime = workingDays * PERIOD_DURATION * classes.length;
          
          timePercentages[period] =
            expectedTime > 0
              ? Math.min(100, Math.round((totalTimeSpent / expectedTime) * 100))
              : 0;
        } else {
          timePercentages[period] = 0;
        }
      }

      setAttendanceStats({
        todayTotal,
        todaySuccessful,
        todayMissed,
        timePercentages,
      });
    } catch (error) {
      console.error("Error fetching attendance stats:", error);
    }
  };

  // Create a deterministic teacher code
  useEffect(() => {
    if (!userId) return;
    const year = new Date().getFullYear();
    let hash = 0;
    for (let i = 0; i < userId.length; i++) {
      hash = (hash * 31 + userId.charCodeAt(i)) >>> 0;
    }
    const suffix = ((hash % 900) + 100).toString();
    setTeacherCode(`TEA-${year}-${suffix}`);
  }, [userId]);

  const [showSignOutConfirm, setShowSignOutConfirm] = useState(false);

  const signOut = async () => {
    await supabase.auth.signOut();
    router.replace("/login");
  };

  if (loading)
    return <div className="p-6 text-center text-gray-600">Loading…</div>;

  const displayName = fullName?.trim()
    ? fullName.trim().charAt(0).toUpperCase() + fullName.trim().slice(1)
    : "Teacher";

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-violet-50 to-purple-100 p-6">
      <div className="w-full mx-auto flex flex-col lg:flex-row gap-6">
        <Sidebar
          open={sidebarOpen}
          onOpenChange={setSidebarOpen}
          collapsed={sidebarCollapsed}
          onToggleCollapsed={() => setSidebarCollapsed((v) => !v)}
        />
        <main className="flex-1 space-y-8">
          {/* Header */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-violet-600 rounded-xl flex items-center justify-center shadow-lg">
                <svg
                  className="w-6 h-6 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                  />
                </svg>
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-violet-600">
                  Teacher Dashboard
                </h1>
                <p className="text-sm text-gray-700">
                  Welcome, {displayName} • Nepal Time: {nepalTime}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <NotificationBell userRole={userRole} userId={userId} />
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
              <Button
                onClick={() => setShowSignOutConfirm(true)}
                className="bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-700 hover:to-violet-700 text-white px-4 py-2 rounded-lg shadow-md transition-all"
              >
                Sign out
              </Button>

              <ConfirmDialog
                open={showSignOutConfirm}
                onClose={() => setShowSignOutConfirm(false)}
                onConfirm={signOut}
                title="Sign Out"
                message="Are you sure you want to sign out?"
                confirmText="Sign Out"
                cancelText="Cancel"
                variant="danger"
              />
            </div>
          </div>

          {/* Welcome Section */}
          <Card className="shadow-md border border-gray-200 bg-gradient-to-r from-purple-50 to-violet-50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-1">
                    Welcome back, {displayName}! 👋
                  </h2>
                  <p className="text-gray-600">
                    Here's your teaching overview for today
                  </p>
                </div>
                <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-white rounded-lg shadow-sm">
                  <Clock className="w-5 h-5 text-purple-600" />
                  <span className="text-sm font-medium text-gray-700">
                    {new Date().toLocaleDateString("en-US", {
                      weekday: "long",
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Today's Classes Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="shadow-md border border-gray-200 hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">
                      Total Classes Today
                    </p>
                    <p className="text-3xl font-bold text-gray-900 mt-2">
                      {attendanceStats.todayTotal}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Classes scheduled
                    </p>
                  </div>
                  <div className="w-14 h-14 bg-blue-100 rounded-xl flex items-center justify-center shadow-sm">
                    <Calendar className="w-7 h-7 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-md border border-gray-200 hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">
                      Successful Classes
                    </p>
                    <p className="text-3xl font-bold text-green-600 mt-2">
                      {attendanceStats.todaySuccessful}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Completed today
                    </p>
                  </div>
                  <div className="w-14 h-14 bg-green-100 rounded-xl flex items-center justify-center shadow-sm">
                    <CheckCircle className="w-7 h-7 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-md border border-gray-200 hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">
                      Missed Classes
                    </p>
                    <p className="text-3xl font-bold text-red-600 mt-2">
                      {attendanceStats.todayMissed}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Not completed
                    </p>
                  </div>
                  <div className="w-14 h-14 bg-red-100 rounded-xl flex items-center justify-center shadow-sm">
                    <XCircle className="w-7 h-7 text-red-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Time Percentage Cards */}
          <Card className="shadow-md border border-gray-200">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-purple-600" />
                Average Time Spent on Classes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                <div className="p-4 bg-blue-50 rounded-lg">
                  <p className="text-xs font-medium text-blue-700">Day</p>
                  <p className="text-2xl font-bold text-blue-900 mt-2">
                    {attendanceStats.timePercentages.day}%
                  </p>
                </div>
                <div className="p-4 bg-purple-50 rounded-lg">
                  <p className="text-xs font-medium text-purple-700">Week</p>
                  <p className="text-2xl font-bold text-purple-900 mt-2">
                    {attendanceStats.timePercentages.week}%
                  </p>
                </div>
                <div className="p-4 bg-violet-50 rounded-lg">
                  <p className="text-xs font-medium text-violet-700">Month</p>
                  <p className="text-2xl font-bold text-violet-900 mt-2">
                    {attendanceStats.timePercentages.month}%
                  </p>
                </div>
                <div className="p-4 bg-indigo-50 rounded-lg">
                  <p className="text-xs font-medium text-indigo-700">3 Months</p>
                  <p className="text-2xl font-bold text-indigo-900 mt-2">
                    {attendanceStats.timePercentages.threeMonths}%
                  </p>
                </div>
                <div className="p-4 bg-pink-50 rounded-lg">
                  <p className="text-xs font-medium text-pink-700">6 Months</p>
                  <p className="text-2xl font-bold text-pink-900 mt-2">
                    {attendanceStats.timePercentages.sixMonths}%
                  </p>
                </div>
                <div className="p-4 bg-orange-50 rounded-lg">
                  <p className="text-xs font-medium text-orange-700">1 Year</p>
                  <p className="text-2xl font-bold text-orange-900 mt-2">
                    {attendanceStats.timePercentages.year}%
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Assigned Classes */}
          <Card className="shadow-md border border-gray-200">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-purple-600" />
                Assigned Classes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="min-w-full bg-white border border-gray-200 rounded-lg">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Subject
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Class
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Time
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Students
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Room
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {classesLoading ? (
                      <tr>
                        <td
                          colSpan="5"
                          className="text-center py-4 text-gray-500"
                        >
                          Loading classes...
                        </td>
                      </tr>
                    ) : assignedClasses.length === 0 ? (
                      <tr>
                        <td
                          colSpan="5"
                          className="text-center py-4 text-gray-500"
                        >
                          No classes assigned yet
                        </td>
                      </tr>
                    ) : (
                      assignedClasses.map((cls) => (
                        <tr
                          key={cls.id}
                          className="hover:bg-gray-50 transition"
                        >
                          <td className="px-4 py-3 text-sm font-medium text-gray-900">
                            {cls.subject}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600">
                            {cls.course || cls.grade} - {cls.section || cls.semester}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600">
                            {cls.time || "Schedule TBD"}
                          </td>
                          <td className="px-4 py-3">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-purple-600"
                            >
                              <Users size={14} className="mr-1" /> Manage
                            </Button>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600">
                            {cls.room_number || "Room TBD"}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  );
}
