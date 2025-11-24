"use client";
import React, { useState, useEffect, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabaseClient";
import { Button } from "../../components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../components/ui/card";
import ConfirmDialog from "../../components/ui/ConfirmDialog";
import NotificationBell from "../../components/ui/notificationBell";
import StudentSidebar from "../../components/ui/studentSidebar";
import {
  ArrowUpRight,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  FileText,
  GraduationCap,
  TrendingUp,
  Clock,
  Bell,
} from "lucide-react";

export default function StudentDashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [showSignOutConfirm, setShowSignOutConfirm] = useState(false);
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [studentData, setStudentData] = useState(null);
  const [attendanceOverview, setAttendanceOverview] = useState({
    percentage: 0,
    present: 0,
    total: 0,
    recent: [],
  });
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [leaveForm, setLeaveForm] = useState({
    startDate: "",
    endDate: "",
    type: "personal",
    reason: "",
  });
  const [leaveSubmitting, setLeaveSubmitting] = useState(false);
  const [schedule, setSchedule] = useState([]);
  const [calendarEvents, setCalendarEvents] = useState([]);
  const [academicProgress, setAcademicProgress] = useState([]);
  const [studentNotifications, setStudentNotifications] = useState([]);
  const [kycForm, setKycForm] = useState({
    gender: "",
    phone: "",
    dob: "",
    address: "",
    guardianName: "",
    guardianPhone: "",
    emergencyContact: "",
  });
  const [kycSubmitting, setKycSubmitting] = useState(false);
  const leaveFormRef = useRef(null);

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

        const { data: userProfile } = await supabase
          .from("users")
          .select("*")
          .eq("id", authUser.id)
          .maybeSingle();

        if (!userProfile) {
          router.replace("/login");
          return;
        }

        setProfile(userProfile);

        if (userProfile.role !== "student") {
          if (userProfile.role === "admin") {
            router.replace("/admin");
          } else if (userProfile.role === "teacher") {
            router.replace("/teacher");
          } else {
            router.replace("/dashboard");
          }
          return;
        }

        const { data: student } = await supabase
          .from("students")
          .select("*")
          .eq("id", authUser.id)
          .maybeSingle();

        setStudentData(student);
        setKycForm((prev) => ({
          ...prev,
          gender: student?.gender || "",
          phone: student?.phone_number || "",
          dob: student?.date_of_birth || "",
          address: student?.address || "",
          guardianName: student?.guardian_name || "",
          guardianPhone: student?.guardian_phone || "",
          emergencyContact: student?.emergency_contact || "",
        }));

        await Promise.all([
          fetchAttendanceOverview(authUser.id),
          fetchLeaveRequests(),
          fetchSchedule(student),
          fetchAcademicProgress(student),
          fetchStudentNotifications(authUser.id),
        ]);
      } catch (error) {
        console.error("Error fetching student data:", error);
        router.replace("/login");
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [router]);

  const fetchAttendanceOverview = async (studentId) => {
    try {
      const { data, error } = await supabase
        .from("attendance")
        .select("status, date")
        .eq("student_id", studentId)
        .order("date", { ascending: false })
        .limit(60);

      if (error) throw error;

      const total = data?.length || 0;
      const present = data?.filter((record) => record.status === "present")
        .length;
      const percentage = total ? Math.round((present / total) * 100) : 0;

      setAttendanceOverview({
        percentage,
        present,
        total,
        recent: data?.slice(0, 5) || [],
      });
    } catch (error) {
      console.error("Error fetching attendance:", error);
      setAttendanceOverview({
        percentage: 0,
        present: 0,
        total: 0,
        recent: [],
      });
    }
  };

  const fetchLeaveRequests = async () => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const token = session?.access_token;

      const res = await fetch("/api/leave-requests", {
        headers: {
          ...(token && { Authorization: `Bearer ${token}` }),
        },
      });
      const data = await res.json();
      if (res.ok) {
        setLeaveRequests(data.leaveRequests || []);
      }
    } catch (error) {
      console.error("Error fetching leave requests:", error);
    }
  };

  const fetchSchedule = async (student) => {
    try {
      const { data, error } = await supabase
        .from("classes")
        .select("*")
        .order("created_at", { ascending: true })
        .limit(20);

      if (error) throw error;

      const filtered =
        data?.filter((cls) => {
          const matchesCourse = student?.course
            ? cls.course?.toLowerCase() === student.course.toLowerCase()
            : true;
          const matchesSemester = student?.semester
            ? cls.semester?.toLowerCase() === student.semester?.toLowerCase()
            : true;
          return matchesCourse || matchesSemester;
        }) || data;

      setSchedule(filtered || []);

      const events = (filtered || []).slice(0, 5).map((cls, index) => ({
        id: cls.id || index,
        title: cls.subject,
        date: new Date(Date.now() + index * 86400000).toISOString(),
        detail: `${cls.course || ""} • ${
          cls.room_number || "Room TBD"
        } • ${cls.semester || cls.section || ""}`,
      }));

      setCalendarEvents(events);
    } catch (error) {
      console.error("Error fetching schedule:", error);
      setSchedule([]);
      setCalendarEvents([]);
    }
  };

  const fetchAcademicProgress = async (student) => {
    const mockGrades = ["A", "B+", "A-", "B", "A"];
    const mockScores = [92, 88, 90, 85, 94];

    const subjects = student?.subjects || [];
    if (!subjects.length) {
      setAcademicProgress([
        { subject: "Mathematics", grade: "A", score: 92 },
        { subject: "Computer Science", grade: "A-", score: 89 },
        { subject: "English", grade: "B+", score: 87 },
      ]);
      return;
    }

    setAcademicProgress(
      subjects.map((subject, index) => ({
        subject,
        grade: mockGrades[index % mockGrades.length],
        score: mockScores[index % mockScores.length],
      }))
    );
  };

  const fetchStudentNotifications = async (studentId) => {
    try {
      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .or(
          `recipient_role.eq.student,recipient_role.eq.all${
            studentId ? `,recipient_user_id.eq.${studentId}` : ""
          }`
        )
        .order("created_at", { ascending: false })
        .limit(5);

      if (error) throw error;
      setStudentNotifications(data || []);
    } catch (error) {
      console.error("Error fetching notifications:", error);
      setStudentNotifications([]);
    }
  };

  const handleKycSubmit = async (e) => {
    e.preventDefault();
    if (!studentData) return;
    setKycSubmitting(true);
    try {
      const updates = {
        gender: kycForm.gender || null,
        phone_number: kycForm.phone || null,
        date_of_birth: kycForm.dob || null,
        address: kycForm.address || null,
        guardian_name: kycForm.guardianName || null,
        guardian_phone: kycForm.guardianPhone || null,
        emergency_contact: kycForm.emergencyContact || null,
        kyc_completed: true,
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from("students")
        .update(updates)
        .eq("id", studentData.id || user?.id);

      if (error) throw error;

      setStudentData((prev) => ({ ...prev, ...updates }));
      alert("Profile updated successfully!");
    } catch (error) {
      console.error("Error updating KYC:", error);
      alert(error.message || "Failed to update profile");
    } finally {
      setKycSubmitting(false);
    }
  };

  const handleSubmitLeaveRequest = async (e) => {
    e.preventDefault();
    if (!leaveForm.startDate || !leaveForm.endDate || !leaveForm.reason) {
      alert("Please complete all fields.");
      return;
    }

    setLeaveSubmitting(true);
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const token = session?.access_token;

      const res = await fetch("/api/leave-requests", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: JSON.stringify({
          start_date: leaveForm.startDate,
          end_date: leaveForm.endDate,
          reason: leaveForm.reason.trim(),
          leave_type: leaveForm.type,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to submit leave request");
      }

      setLeaveForm({
        startDate: "",
        endDate: "",
        type: "personal",
        reason: "",
      });
      await fetchLeaveRequests();
      alert("Leave request submitted successfully!");
    } catch (error) {
      console.error("Error submitting leave request:", error);
      alert(error.message || "Failed to submit leave request");
    } finally {
      setLeaveSubmitting(false);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.replace("/login");
  };

  const overviewCards = useMemo(
    () => [
      {
        title: "Attendance",
        value: `${attendanceOverview.percentage}%`,
        subtitle: `${attendanceOverview.present}/${attendanceOverview.total} days present`,
        icon: <CheckCircle2 className="w-5 h-5 text-green-600" />,
        gradient: "from-green-50 to-emerald-50",
      },
      {
        title: "Upcoming Classes",
        value: schedule.length ? schedule.slice(0, 3).length : 0,
        subtitle: "Today",
        icon: <BookOpen className="w-5 h-5 text-blue-600" />,
        gradient: "from-blue-50 to-sky-50",
      },
      {
        title: "Leave Requests",
        value: leaveRequests.length,
        subtitle: `${
          leaveRequests.filter((req) => req.status === "pending").length
        } pending`,
        icon: <FileText className="w-5 h-5 text-purple-600" />,
        gradient: "from-purple-50 to-violet-50",
      },
    ],
    [attendanceOverview, schedule, leaveRequests]
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-violet-50 to-purple-100 p-6">
      <div className="w-full mx-auto flex flex-col lg:flex-row gap-6">
        <StudentSidebar
          open={sidebarOpen}
          onOpenChange={setSidebarOpen}
          collapsed={sidebarCollapsed}
          onToggleCollapsed={() => setSidebarCollapsed((prev) => !prev)}
          onRequestLeave={() =>
            leaveFormRef.current?.scrollIntoView({ behavior: "smooth" })
          }
        />
        <main className="flex-1 space-y-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-violet-600 rounded-xl flex items-center justify-center shadow-lg">
                <GraduationCap className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-violet-600">
                  Student Dashboard
                </h1>
                <p className="text-sm text-gray-700">
                  Welcome,{" "}
                  {studentData?.full_name ||
                    profile?.full_name ||
                    user?.email ||
                    "Student"}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <NotificationBell userRole="student" userId={user?.id} />
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
                onConfirm={handleSignOut}
                title="Sign Out"
                message="Are you sure you want to sign out?"
                confirmText="Sign Out"
                cancelText="Cancel"
                variant="danger"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {overviewCards.map((card) => (
              <Card
                key={card.title}
                className={`border border-gray-200 shadow-sm bg-gradient-to-br ${card.gradient}`}
              >
                <CardContent className="flex items-center justify-between p-5">
                  <div>
                    <p className="text-sm text-gray-600">{card.title}</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">
                      {card.value}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">{card.subtitle}</p>
                  </div>
                  <div className="p-3 bg-white rounded-xl shadow">
                    {card.icon}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <Card className="shadow-md border border-gray-200">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                  Attendance Overview
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Current Semester</p>
                    <p className="text-3xl font-bold text-gray-900">
                      {attendanceOverview.percentage}%
                    </p>
                    <p className="text-sm text-gray-500">
                      {attendanceOverview.present}/{attendanceOverview.total} days
                      present
                    </p>
                  </div>
                  <div className="flex-1">
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div
                        className="bg-gradient-to-r from-green-500 to-emerald-500 h-3 rounded-full"
                        style={{
                          width: `${attendanceOverview.percentage}%`,
                        }}
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Keep attendance above 75% for eligibility
                    </p>
                  </div>
                </div>
                <div className="mt-6">
                  <h4 className="text-sm font-semibold text-gray-700 mb-3">
                    Recent Attendance
                  </h4>
                  <div className="space-y-2">
                    {attendanceOverview.recent.map((record, idx) => (
                      <div
                        key={`${record.date}-${idx}`}
                        className="flex items-center justify-between text-sm"
                      >
                        <span className="text-gray-600">
                          {new Date(record.date).toLocaleDateString()}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                            record.status === "present"
                              ? "bg-green-100 text-green-700"
                              : "bg-red-100 text-red-700"
                          }`}
                        >
                          {record.status}
                        </span>
                      </div>
                    ))}
                    {!attendanceOverview.recent.length && (
                      <p className="text-sm text-gray-500">
                        No attendance records available.
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-md border border-gray-200">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                  <CalendarDays className="w-5 h-5 text-purple-600" />
                  Upcoming Schedule
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {calendarEvents.length ? (
                    calendarEvents.map((event) => (
                      <div
                        key={event.id}
                        className="flex items-center justify-between p-3 border border-gray-100 rounded-lg hover:border-purple-200 transition-colors"
                      >
                        <div>
                          <p className="font-medium text-gray-900">
                            {event.title}
                          </p>
                          <p className="text-sm text-gray-500">{event.detail}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-semibold text-purple-600">
                            {new Date(event.date).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                            })}
                          </p>
                          <p className="text-xs text-gray-500">
                            {new Date(event.date).toLocaleTimeString("en-US", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-gray-500">
                      No upcoming events scheduled.
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6" ref={leaveFormRef}>
            <Card className="shadow-md border border-gray-200">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-indigo-600" />
                  Submit Leave Request
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmitLeaveRequest} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Start Date
                      </label>
                      <input
                        type="date"
                        value={leaveForm.startDate}
                        onChange={(e) =>
                          setLeaveForm((prev) => ({
                            ...prev,
                            startDate: e.target.value,
                          }))
                        }
                        className="w-full border border-gray-300 rounded-md px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        End Date
                      </label>
                      <input
                        type="date"
                        value={leaveForm.endDate}
                        onChange={(e) =>
                          setLeaveForm((prev) => ({
                            ...prev,
                            endDate: e.target.value,
                          }))
                        }
                        className="w-full border border-gray-300 rounded-md px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Leave Type
                    </label>
                    <select
                      value={leaveForm.type}
                      onChange={(e) =>
                        setLeaveForm((prev) => ({
                          ...prev,
                          type: e.target.value,
                        }))
                      }
                      className="w-full border border-gray-300 rounded-md px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                    >
                      <option value="personal">Personal</option>
                      <option value="medical">Medical</option>
                      <option value="academic">Academic</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Reason
                    </label>
                    <textarea
                      value={leaveForm.reason}
                      onChange={(e) =>
                        setLeaveForm((prev) => ({
                          ...prev,
                          reason: e.target.value,
                        }))
                      }
                      rows={4}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                      placeholder="Provide details for your leave request"
                    />
                  </div>
                  <Button
                    type="submit"
                    disabled={leaveSubmitting}
                    className="w-full bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-700 hover:to-violet-700"
                  >
                    {leaveSubmitting ? "Submitting..." : "Submit Request"}
                  </Button>
                </form>
              </CardContent>
            </Card>

            <Card className="shadow-md border border-gray-200">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                  <Bell className="w-5 h-5 text-orange-500" />
                  Leave History
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {leaveRequests.length ? (
                    leaveRequests.map((request) => (
                      <div
                        key={request.id}
                        className="border border-gray-100 rounded-lg p-3"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-gray-900">
                              {new Date(
                                request.start_date
                              ).toLocaleDateString()}{" "}
                              -{" "}
                              {new Date(request.end_date).toLocaleDateString()}
                            </p>
                            <p className="text-sm text-gray-500 capitalize">
                              {request.leave_type || "General"} leave
                            </p>
                          </div>
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-semibold ${
                              request.status === "approved"
                                ? "bg-green-100 text-green-700"
                                : request.status === "rejected"
                                ? "bg-red-100 text-red-700"
                                : "bg-yellow-100 text-yellow-700"
                            }`}
                          >
                            {request.status}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mt-2">
                          {request.reason}
                        </p>
                        {request.admin_notes && (
                          <p className="text-xs text-gray-500 mt-1">
                            Admin notes: {request.admin_notes}
                          </p>
                        )}
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-gray-500">
                      No leave requests submitted.
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="shadow-md border border-gray-200">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-blue-600" />
                  Weekly Timetable
                </CardTitle>
              </CardHeader>
              <CardContent className="overflow-x-auto">
                {schedule.length ? (
                  <table className="min-w-full text-sm">
                    <thead>
                      <tr className="text-left text-gray-500">
                        <th className="py-2">Subject</th>
                        <th className="py-2">Course</th>
                        <th className="py-2">Semester</th>
                        <th className="py-2">Room</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {schedule.slice(0, 6).map((cls) => (
                        <tr key={cls.id || `${cls.subject}-${cls.room_number}`}>
                          <td className="py-3 font-medium text-gray-900">
                            {cls.subject || "Subject"}
                          </td>
                          <td className="py-3 text-gray-600">
                            {cls.course || "—"}
                          </td>
                          <td className="py-3 text-gray-600">
                            {cls.semester || cls.section || "—"}
                          </td>
                          <td className="py-3 text-gray-600">
                            {cls.room_number || "TBD"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <p className="text-sm text-gray-500">
                    Your timetable will appear here once classes are assigned.
                  </p>
                )}
              </CardContent>
            </Card>

            <Card className="shadow-md border border-gray-200">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-indigo-600" />
                  Academic Progress
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {academicProgress.map((item) => (
                  <div key={item.subject}>
                    <div className="flex items-center justify-between text-sm">
                      <p className="font-medium text-gray-900">
                        {item.subject}
                      </p>
                      <div className="flex items-center gap-2">
                        <span className="text-indigo-600 font-semibold">
                          {item.score}%
                        </span>
                        <span className="px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-600 text-xs font-semibold">
                          {item.grade}
                        </span>
                      </div>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                      <div
                        className="bg-gradient-to-r from-indigo-500 to-purple-600 h-2 rounded-full"
                        style={{ width: `${item.score}%` }}
                      />
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="shadow-md border border-gray-200">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                  <Bell className="w-5 h-5 text-purple-600" />
                  Latest Announcements
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {studentNotifications.length ? (
                  studentNotifications.map((notification) => (
                    <div
                      key={notification.id}
                      className="p-3 border border-gray-100 rounded-lg"
                    >
                      <div className="flex items-center justify-between">
                        <p className="font-semibold text-gray-900 text-sm">
                          {notification.title}
                        </p>
                        <span className="text-xs text-gray-500">
                          {new Date(notification.created_at).toLocaleDateString(
                            "en-US",
                            {
                              month: "short",
                              day: "numeric",
                            }
                          )}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">
                        {notification.message}
                      </p>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-gray-500">
                    You're all caught up! No new notifications.
                  </p>
                )}
              </CardContent>
            </Card>

            <Card className="shadow-md border border-gray-200">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                  <Clock className="w-5 h-5 text-amber-600" />
                  Quick Info
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Current Course</p>
                    <p className="text-lg font-semibold text-gray-900">
                      {studentData?.course || studentData?.class || "N/A"}
                    </p>
                  </div>
                  <ArrowUpRight className="w-5 h-5 text-amber-600" />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Semester</p>
                    <p className="text-lg font-semibold text-gray-900">
                      {studentData?.semester || studentData?.section || "N/A"}
                    </p>
                  </div>
                  <ArrowUpRight className="w-5 h-5 text-amber-600" />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Advisor</p>
                    <p className="text-lg font-semibold text-gray-900">
                      {studentData?.advisor || "Not assigned"}
                    </p>
                  </div>
                  <ArrowUpRight className="w-5 h-5 text-amber-600" />
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="shadow-md border border-gray-200">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-indigo-600" />
                  Academic Progress
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {academicProgress.map((item) => (
                  <div key={item.subject}>
                    <div className="flex items-center justify-between text-sm">
                      <p className="font-medium text-gray-900">
                        {item.subject}
                      </p>
                      <div className="flex items-center gap-2">
                        <span className="text-indigo-600 font-semibold">
                          {item.score}%
                        </span>
                        <span className="px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-600 text-xs font-semibold">
                          {item.grade}
                        </span>
                      </div>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                      <div
                        className="bg-gradient-to-r from-indigo-500 to-purple-600 h-2 rounded-full"
                        style={{ width: `${item.score}%` }}
                      />
                    </div>
                  </div>
                ))}
                {!academicProgress.length && (
                  <p className="text-sm text-gray-500">
                    Your academic progress will appear here.
                  </p>
                )}
              </CardContent>
            </Card>

            <Card className="shadow-md border border-gray-200">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                  <Bell className="w-5 h-5 text-purple-600" />
                  Latest Announcements
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {studentNotifications.length ? (
                  studentNotifications.map((notification) => (
                    <div
                      key={notification.id}
                      className="p-3 border border-gray-100 rounded-lg"
                    >
                      <div className="flex items-center justify-between">
                        <p className="font-semibold text-gray-900 text-sm">
                          {notification.title}
                        </p>
                        <span className="text-xs text-gray-500">
                          {new Date(notification.created_at).toLocaleDateString(
                            "en-US",
                            {
                              month: "short",
                              day: "numeric",
                            }
                          )}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">
                        {notification.message}
                      </p>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-gray-500">
                    You're all caught up! No new notifications.
                  </p>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="shadow-md border border-gray-200">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                  <Clock className="w-5 h-5 text-amber-600" />
                  Quick Info
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Current Course</p>
                    <p className="text-lg font-semibold text-gray-900">
                      {studentData?.course || studentData?.class || "N/A"}
                    </p>
                  </div>
                  <ArrowUpRight className="w-5 h-5 text-amber-600" />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Semester</p>
                    <p className="text-lg font-semibold text-gray-900">
                      {studentData?.semester || studentData?.section || "N/A"}
                    </p>
                  </div>
                  <ArrowUpRight className="w-5 h-5 text-amber-600" />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Advisor</p>
                    <p className="text-lg font-semibold text-gray-900">
                      {studentData?.advisor || "Not assigned"}
                    </p>
                  </div>
                  <ArrowUpRight className="w-5 h-5 text-amber-600" />
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-md border border-gray-200">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-slate-600" />
                  KYC / Profile Completion
                </CardTitle>
                <p className="text-sm text-gray-500">
                  Keep your personal details up to date for seamless support.
                </p>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleKycSubmit} className="space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-semibold text-gray-600">
                        Gender
                      </label>
                      <select
                        value={kycForm.gender}
                        onChange={(e) =>
                          setKycForm((prev) => ({
                            ...prev,
                            gender: e.target.value,
                          }))
                        }
                        className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                      >
                        <option value="">Select</option>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-gray-600">
                        Phone Number
                      </label>
                      <input
                        type="tel"
                        value={kycForm.phone}
                        onChange={(e) =>
                          setKycForm((prev) => ({
                            ...prev,
                            phone: e.target.value,
                          }))
                        }
                        className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-gray-600">
                        Date of Birth
                      </label>
                      <input
                        type="date"
                        value={kycForm.dob}
                        onChange={(e) =>
                          setKycForm((prev) => ({
                            ...prev,
                            dob: e.target.value,
                          }))
                        }
                        className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-gray-600">
                        Guardian Name
                      </label>
                      <input
                        type="text"
                        value={kycForm.guardianName}
                        onChange={(e) =>
                          setKycForm((prev) => ({
                            ...prev,
                            guardianName: e.target.value,
                          }))
                        }
                        className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-semibold text-gray-600">
                        Guardian Phone
                      </label>
                      <input
                        type="tel"
                        value={kycForm.guardianPhone}
                        onChange={(e) =>
                          setKycForm((prev) => ({
                            ...prev,
                            guardianPhone: e.target.value,
                          }))
                        }
                        className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-gray-600">
                        Emergency Contact
                      </label>
                      <input
                        type="text"
                        value={kycForm.emergencyContact}
                        onChange={(e) =>
                          setKycForm((prev) => ({
                            ...prev,
                            emergencyContact: e.target.value,
                          }))
                        }
                        className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-gray-600">
                      Address
                    </label>
                    <textarea
                      value={kycForm.address}
                      onChange={(e) =>
                        setKycForm((prev) => ({
                          ...prev,
                          address: e.target.value,
                        }))
                      }
                      rows={3}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                      placeholder="Street, City, State"
                    />
                  </div>

                  <Button
                    type="submit"
                    disabled={kycSubmitting}
                    className="w-full bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-700 hover:to-violet-700"
                  >
                    {kycSubmitting
                      ? "Saving..."
                      : studentData?.kyc_completed
                      ? "Update Profile"
                      : "Complete Profile"}
                  </Button>
                  {studentData?.kyc_completed ? (
                    <p className="text-xs text-green-600 text-center">
                      ✅ KYC completed on file
                    </p>
                  ) : (
                    <p className="text-xs text-amber-600 text-center">
                      Complete your KYC to avoid interruptions.
                    </p>
                  )}
                </form>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
}

