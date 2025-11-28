"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "../../components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from "../../components/ui/card";
import { supabase } from "../../lib/supabaseClient";
import { resolveUserRole } from "../../lib/utils";
import {
  Moon,
  Sun,
  MoreHorizontal,
  User,
  Users,
  BookOpen,
  CheckCircle,
  XCircle,
  Calendar,
  UserCheck,
  School,
  LayoutDashboard,
  UserPlus,
  GraduationCap,
  TrendingUp,
  Clock,
  ArrowRight,
  Activity,
  Bell,
} from "lucide-react";
import { Dialog, Menu, Transition } from "@headlessui/react";
import AddClass from "../../components/ui/addClass";
import AdminSidebar from "../../components/ui/adminSidebar";
import AddUser from "../../components/ui/addUser";
import AddSubject from "../../components/ui/addSubject";
import UsersTable from "../../components/ui/usersTable";
import TeacherStats from "../../components/ui/teacherStats";
import TeacherDetails from "../../components/ui/teacherDetails";
import NotificationPanel from "../../components/ui/notificationPanel";
import NotificationBell from "../../components/ui/notificationBell";

export default function AdminPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState("");
  const [profiles, setProfiles] = useState([]);
  const [listLoading, setListLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [filterRole, setFilterRole] = useState("all");
  const [showAddUser, setShowAddUser] = useState(false);
  const [addUserRole, setAddUserRole] = useState("teacher"); // Default role for Add User modal
  const [showAssignClass, setShowAssignClass] = useState(false);
  const [assignClassLoading, setAssignClassLoading] = useState(false);
  const [assignClassError, setAssignClassError] = useState("");
  const [assignClassSuccess, setAssignClassSuccess] = useState("");
  const [newClass, setNewClass] = useState({
    name: "",
    grade: "",
    section: "",
    subject: "",
    teacher_id: "",
  });
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // New state for teacher statistics
  const [teacherStats, setTeacherStats] = useState([]);
  const [statsLoading, setStatsLoading] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState(null);
  const [showTeacherDetails, setShowTeacherDetails] = useState(false);
  const [currentView, setCurrentView] = useState("dashboard"); // 'dashboard', 'teachers', 'students'

  // Teachers view state
  const [teachers, setTeachers] = useState([]);
  const [teachersLoading, setTeachersLoading] = useState(false);

  // Students view state
  const [students, setStudents] = useState([]);
  const [studentsLoading, setStudentsLoading] = useState(false);
  const [studentSearch, setStudentSearch] = useState("");
  const [studentClassFilter, setStudentClassFilter] = useState("");
  const [studentSectionFilter, setStudentSectionFilter] = useState("");
  const [studentCount, setStudentCount] = useState(0);

  // Subjects view state
  const [subjects, setSubjects] = useState([]);
  const [subjectsLoading, setSubjectsLoading] = useState(false);
  const [showAddSubject, setShowAddSubject] = useState(false);
  const [subjectSearch, setSubjectSearch] = useState("");
  const [subjectSemesterFilter, setSubjectSemesterFilter] = useState("all");

  // Notification panel state
  const [showNotificationPanel, setShowNotificationPanel] = useState(false);

  // Leave requests state
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [leaveRequestsLoading, setLeaveRequestsLoading] = useState(false);

  // Class switches state
  const [classSwitches, setClassSwitches] = useState([]);
  const [classSwitchesLoading, setClassSwitchesLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      const user = data?.user;
      if (!user) {
        router.replace("/");
        return;
      }

      // Check role from users table (not profiles)
      const { data: userData, error: userError } = await supabase
        .from("users")
        .select("role, email")
        .eq("id", user.id)
        .single();

      if (userError || !userData) {
        console.error("Error fetching user role:", userError);
        router.replace("/dashboard");
        return;
      }

      if (userData.role !== "admin") {
        console.log("User role is not admin:", userData.role);
        router.replace("/dashboard");
        return;
      }

      setEmail(user.email || "");
      setAdminUserId(user.id || "");
      setLoading(false);
      fetchProfiles();
      fetchTeacherStats();
      fetchStudentCount();
    });
  }, [router]);

  const [adminUserId, setAdminUserId] = useState("");

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data?.user) {
        setAdminUserId(data.user.id);
      }
    });
  }, []);

  const fetchProfiles = async () => {
    setListLoading(true);
    const { data, error } = await supabase
      .from("users")
      .select("id, full_name, email, role, created_at, is_active")
      .order("created_at", { ascending: false });
    if (!error) setProfiles(data || []);
    setListLoading(false);
  };

  const fetchTeachers = async () => {
    setTeachersLoading(true);
    try {
      const { data, error } = await supabase
        .from("users")
        .select("*")
        .eq("role", "teacher")
        .order("created_at", { ascending: false });
      if (error) throw error;
      setTeachers(data || []);
    } catch (error) {
      console.error("Error fetching teachers:", error);
    } finally {
      setTeachersLoading(false);
    }
  };

  const toggleTeacherStatus = async (teacherId, currentStatus) => {
    const newStatus = !currentStatus;
    const action = newStatus ? "activate" : "deactivate";

    if (!confirm(`Are you sure you want to ${action} this teacher account?`)) {
      return;
    }

    try {
      const response = await fetch("/api/toggle-teacher-status", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id: teacherId, is_active: newStatus }),
      });

      const result = await response.json();

      if (!response.ok) {
        // Check if this is a migration error
        if (result.needsMigration && result.sql) {
          const fullMessage = `${result.error}\n\n${
            result.instructions ||
            "Please run this SQL in your Supabase SQL Editor:"
          }\n\n${
            result.sql
          }\n\nWould you like to copy this SQL to your clipboard?`;
          if (confirm(fullMessage)) {
            navigator.clipboard
              .writeText(result.sql)
              .then(() => {
                alert(
                  "SQL copied to clipboard! Please:\n1. Go to Supabase Dashboard > SQL Editor\n2. Paste and run the SQL\n3. Try again."
                );
              })
              .catch(() => {
                alert(
                  `Please run this SQL in your Supabase SQL Editor:\n\n${result.sql}`
                );
              });
          }
        } else {
          alert(`Error: ${result.error || "Failed to update teacher status"}`);
        }
        return;
      }

      // Update local state
      setTeachers((prev) =>
        prev.map((teacher) =>
          teacher.id === teacherId
            ? { ...teacher, is_active: newStatus }
            : teacher
        )
      );

      // Also update profiles if needed
      setProfiles((prev) =>
        prev.map((profile) =>
          profile.id === teacherId
            ? { ...profile, is_active: newStatus }
            : profile
        )
      );

      alert(
        `Teacher account ${
          newStatus ? "activated" : "deactivated"
        } successfully`
      );
    } catch (error) {
      console.error("Error toggling teacher status:", error);
      alert(`Error: ${error.message || "Failed to update teacher status"}`);
    }
  };

  const fetchStudents = async () => {
    setStudentsLoading(true);
    try {
      let query = supabase.from("students").select("*");
      if (studentClassFilter) {
        query = query.eq("class", studentClassFilter);
      }
      if (studentSectionFilter) {
        query = query.eq("section", studentSectionFilter);
      }
      const { data, error } = await query.order("created_at", {
        ascending: false,
      });
      if (error) throw error;
      let filtered = data || [];
      if (studentSearch) {
        const searchLower = studentSearch.toLowerCase();
        filtered = filtered.filter(
          (s) =>
            s.full_name?.toLowerCase().includes(searchLower) ||
            s.roll?.toLowerCase().includes(searchLower) ||
            s.guardian_name?.toLowerCase().includes(searchLower)
        );
      }
      setStudents(filtered);
    } catch (error) {
      console.error("Error fetching students:", error);
    } finally {
      setStudentsLoading(false);
    }
  };

  const fetchStudentCount = async () => {
    try {
      const { count, error } = await supabase
        .from("students")
        .select("*", { count: "exact", head: true });
      if (error) throw error;
      setStudentCount(count || 0);
    } catch (error) {
      console.error("Error fetching student count:", error);
    }
  };

  const fetchSubjects = async () => {
    setSubjectsLoading(true);
    try {
      const res = await fetch("/api/subjects");
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || "Failed to fetch subjects");
      setSubjects(json.subjects || []);
    } catch (error) {
      console.error("Error fetching subjects:", error);
    } finally {
      setSubjectsLoading(false);
    }
  };

  const deleteSubject = async (id) => {
    if (!confirm("Are you sure you want to delete this subject?")) return;
    try {
      const res = await fetch("/api/subjects", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || "Failed to delete subject");
      await fetchSubjects();
    } catch (error) {
      alert(error.message || "Failed to delete subject");
    }
  };

  // Fetch data when view changes
  useEffect(() => {
    if (currentView === "teachers") {
      fetchTeachers();
    } else if (
      currentView === "students" ||
      currentView === "statistics/students"
    ) {
      fetchStudents();
    } else if (currentView === "statistics/teachers") {
      fetchTeacherStats();
    } else if (currentView === "subjects") {
      fetchSubjects();
    } else if (currentView === "leave-requests") {
      fetchLeaveRequests();
    } else if (currentView === "class-switches") {
      fetchClassSwitches();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentView]);

  const fetchLeaveRequests = async () => {
    setLeaveRequestsLoading(true);
    try {
      // Get session token from Supabase
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      const res = await fetch("/api/leave-requests", {
        headers: {
          ...(token && { Authorization: `Bearer ${token}` })
        }
      });
      const data = await res.json();
      if (res.ok && data.leaveRequests) {
        setLeaveRequests(data.leaveRequests);
      }
    } catch (error) {
      console.error("Error fetching leave requests:", error);
    } finally {
      setLeaveRequestsLoading(false);
    }
  };

  const fetchClassSwitches = async () => {
    setClassSwitchesLoading(true);
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const token = session?.access_token;

      const res = await fetch("/api/class-switches", {
        headers: {
          ...(token && { Authorization: `Bearer ${token}` }),
        },
      });
      const data = await res.json();
      if (res.ok && data.classSwitches) {
        setClassSwitches(data.classSwitches);
      }
    } catch (error) {
      console.error("Error fetching class switches:", error);
    } finally {
      setClassSwitchesLoading(false);
    }
  };

  const handleLeaveRequestAction = async (id, status, adminNotes = "") => {
    try {
      // Get session token from Supabase
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      const res = await fetch("/api/leave-requests", {
        method: "PATCH",
        headers: { 
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` })
        },
        body: JSON.stringify({ id, status, admin_notes: adminNotes }),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.error || "Failed to update leave request");
        return;
      }

      alert(`Leave request ${status} successfully`);
      fetchLeaveRequests();
    } catch (error) {
      console.error("Error updating leave request:", error);
      alert("Failed to update leave request");
    }
  };

  // Refetch students when filters change
  useEffect(() => {
    if (currentView === "students") {
      fetchStudents();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [studentClassFilter, studentSectionFilter, studentSearch]);

  const fetchTeacherStats = async () => {
    setStatsLoading(true);

    // Fetch teachers
    const { data: teachers, error: teachersError } = await supabase
      .from("users")
      .select("id, full_name, email")
      .eq("role", "teacher");

    if (teachersError) {
      console.error("Error fetching teachers:", teachersError);
      setStatsLoading(false);
      return;
    }

    const stats = await Promise.all(
      teachers.map(async (teacher) => {
        // Fetch classes/subjects assigned to this teacher
        const { data: classes, error: classesError } = await supabase
          .from("classes")
          .select("id, course, semester, subject, created_at")
          .eq("teacher_id", teacher.id)
          .order("created_at", { ascending: true }); // Order by creation to assign periods

        if (classesError) {
          console.error("Error fetching classes:", classesError);
          return {
            ...teacher,
            periods: [],
            totalTime: 0,
          };
        }

        // Standard period duration in minutes (45 minutes per period)
        const PERIOD_DURATION = 45;

        // Organize classes into periods (1st, 2nd, 3rd, etc.)
        const periods = [];
        let totalTimeMinutes = 0;

        for (let i = 0; i < Math.min(classes.length, 6); i++) {
          const classItem = classes[i];
          const periodNumber = i + 1;

          // Fetch attendance records for this subject/class to calculate time
          // We'll count unique dates where this teacher marked attendance for this subject
          // Since attendance.subject_id references courses(id), we need to find matching courses
          // First, try to find a course that matches this class's subject name
          const { data: matchingCourse } = await supabase
            .from("courses")
            .select("id")
            .ilike("name", `%${classItem.subject}%`)
            .maybeSingle();

          let daysWithAttendance = 0;

          if (matchingCourse) {
            // Count unique dates where attendance was marked for this subject by this teacher
            const { data: attendanceRecords } = await supabase
              .from("attendance")
              .select("date")
              .eq("subject_id", matchingCourse.id)
              .eq("marked_by", teacher.id);

            if (attendanceRecords && attendanceRecords.length > 0) {
              daysWithAttendance = new Set(attendanceRecords.map((r) => r.date))
                .size;
            }
          } else {
            // Fallback: Count days where teacher marked attendance (any subject)
            // We'll estimate by dividing total teacher attendance days by number of periods
            const { data: allAttendanceRecords } = await supabase
              .from("attendance")
              .select("date")
              .eq("marked_by", teacher.id);

            if (allAttendanceRecords && allAttendanceRecords.length > 0) {
              const totalDays = new Set(allAttendanceRecords.map((r) => r.date))
                .size;
              // Distribute evenly across periods (rough estimate)
              daysWithAttendance = Math.ceil(
                totalDays / Math.max(classes.length, 1)
              );
            }
          }

          // Calculate time spent: number of days with attendance * period duration
          const timeSpentMinutes = daysWithAttendance * PERIOD_DURATION;
          totalTimeMinutes += timeSpentMinutes;

          periods.push({
            periodNumber,
            subject: classItem.subject,
            course: classItem.course,
            semester: classItem.semester,
            timeSpentMinutes,
            daysWithAttendance,
          });
        }

        // Convert total time to hours and minutes for display
        const totalHours = Math.floor(totalTimeMinutes / 60);
        const totalMins = totalTimeMinutes % 60;

        return {
          ...teacher,
          periods,
          totalTimeMinutes,
          totalTimeDisplay:
            totalHours > 0 ? `${totalHours}h ${totalMins}m` : `${totalMins}m`,
        };
      })
    );

    setTeacherStats(stats);
    setStatsLoading(false);
  };

  const viewTeacherDetails = (teacher) => {
    setSelectedTeacher(teacher);
    setShowTeacherDetails(true);
  };

  const deleteUser = async (id) => {
    if (!confirm("Are you sure you want to delete this user?")) return;

    try {
      // Get user role before deleting
      const { data: userData } = await supabase
        .from("users")
        .select("role")
        .eq("id", id)
        .single();

      if (!userData) {
        alert("User not found");
        return;
      }

      const role = userData.role;

      // Call API route to delete from all tables
      const response = await fetch("/api/delete-user", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id, role }),
      });

      const result = await response.json();

      if (!response.ok) {
        alert(`Error deleting user: ${result.error || "Unknown error"}`);
        return;
      }

      // Update local state
      setProfiles((prev) => prev.filter((p) => p.id !== id));
      setTeacherStats((prev) => prev.filter((t) => t.id !== id));

      // Refresh data if needed
      if (currentView === "teachers") {
        fetchTeachers();
      } else if (currentView === "students") {
        fetchStudents();
      }
      fetchStudentCount();

      alert("User deleted successfully from all tables");
    } catch (error) {
      console.error("Error deleting user:", error);
      alert(`Error deleting user: ${error.message}`);
    }
  };

  const filteredProfiles = profiles.filter((p) => {
    const matchesSearch =
      p.full_name?.toLowerCase().includes(search.toLowerCase()) ||
      p.email?.toLowerCase().includes(search.toLowerCase());
    const matchesRole = filterRole === "all" || p.role === filterRole;
    return matchesSearch && matchesRole;
  });

  const filteredTeacherStats = teacherStats.filter(
    (t) =>
      t.full_name?.toLowerCase().includes(search.toLowerCase()) ||
      t.email?.toLowerCase().includes(search.toLowerCase())
  );

  if (loading)
    return <div className="p-6 text-center text-gray-600">Loading…</div>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-violet-50 to-purple-100 p-6">
      <div className="w-full mx-auto flex flex-col lg:flex-row gap-6">
        <AdminSidebar
          open={sidebarOpen}
          onOpenChange={setSidebarOpen}
          collapsed={sidebarCollapsed}
          onToggleCollapsed={() => setSidebarCollapsed((v) => !v)}
          onAddTeacher={() => {
            setAddUserRole("teacher");
            setShowAddUser(true);
          }}
          onAddStudent={() => {
            setAddUserRole("student");
            setShowAddUser(true);
          }}
          onAssignClass={() => {
            setShowAssignClass(true);
          }}
          currentView={currentView}
          onViewChange={setCurrentView}
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
                    d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                  />
                </svg>
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-violet-600">
                  {currentView === "dashboard" && "Admin Panel"}
                  {currentView === "teachers" && "Teachers"}
                  {currentView === "students" && "Students"}
                  {currentView === "statistics/teachers" &&
                    "Teacher Statistics"}
                  {currentView === "statistics/users" && "User Statistics"}
                  {currentView === "statistics/students" &&
                    "Student Statistics"}
                  {currentView === "leave-requests" && "Leave Requests"}
                  {currentView === "class-switches" && "Class Switches"}
                </h1>
                <p className="text-sm text-gray-700">
                  {currentView === "dashboard" &&
                    "Manage users and system settings"}
                  {currentView === "teachers" &&
                    "Manage teacher accounts and information"}
                  {currentView === "students" &&
                    "Manage student records and information"}
                  {currentView?.startsWith("statistics") &&
                    "View detailed statistics and analytics"}
                  {currentView === "leave-requests" &&
                    "Review and manage teacher leave requests"}
                  {currentView === "class-switches" &&
                    "View class switch requests and completions"}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <NotificationBell userRole="admin" userId={adminUserId} />
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
              {/* Welcome Section */}
              <Card className="shadow-md border border-gray-200 bg-gradient-to-r from-purple-50 to-violet-50">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900 mb-1">
                        Welcome back, Admin! 👋
                      </h2>
                      <p className="text-gray-600">
                        Here&apos;s what&apos;s happening with your system today
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

              {/* Dashboard Overview Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card className="shadow-md border border-gray-200 hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">
                          Total Users
                        </p>
                        <p className="text-3xl font-bold text-gray-900 mt-2">
                          {profiles.length}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          All registered users
                        </p>
                      </div>
                      <div className="w-14 h-14 bg-blue-100 rounded-xl flex items-center justify-center shadow-sm">
                        <Users className="w-7 h-7 text-blue-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="shadow-md border border-gray-200 hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">
                          Teachers
                        </p>
                        <p className="text-3xl font-bold text-gray-900 mt-2">
                          {profiles.filter((p) => p.role === "teacher").length}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          Active educators
                        </p>
                      </div>
                      <div className="w-14 h-14 bg-purple-100 rounded-xl flex items-center justify-center shadow-sm">
                        <UserCheck className="w-7 h-7 text-purple-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="shadow-md border border-gray-200 hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">
                          Students
                        </p>
                        <p className="text-3xl font-bold text-gray-900 mt-2">
                          {studentCount}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          Enrolled students
                        </p>
                      </div>
                      <div className="w-14 h-14 bg-green-100 rounded-xl flex items-center justify-center shadow-sm">
                        <School className="w-7 h-7 text-green-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="shadow-md border border-gray-200 hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">
                          Admins
                        </p>
                        <p className="text-3xl font-bold text-gray-900 mt-2">
                          {profiles.filter((p) => p.role === "admin").length}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          System administrators
                        </p>
                      </div>
                      <div className="w-14 h-14 bg-red-100 rounded-xl flex items-center justify-center shadow-sm">
                        <LayoutDashboard className="w-7 h-7 text-red-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* System Overview */}
              <Card className="shadow-md border border-gray-200">
                <CardHeader>
                  <CardTitle className="text-lg font-semibold text-gray-800">
                    System Overview
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg">
                      <Users className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                      <p className="text-2xl font-bold text-blue-900">
                        {profiles.length}
                      </p>
                      <p className="text-sm text-blue-700 mt-1">Total Users</p>
                    </div>
                    <div className="text-center p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg">
                      <UserCheck className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                      <p className="text-2xl font-bold text-purple-900">
                        {profiles.filter((p) => p.role === "teacher").length}
                      </p>
                      <p className="text-sm text-purple-700 mt-1">
                        Total Teachers
                      </p>
                    </div>
                    <div className="text-center p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-lg">
                      <School className="w-8 h-8 text-green-600 mx-auto mb-2" />
                      <p className="text-2xl font-bold text-green-900">
                        {studentCount}
                      </p>
                      <p className="text-sm text-green-700 mt-1">
                        Total Students
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          )}

          {/* Teachers View */}
          {currentView === "teachers" && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold text-gray-900">
                  Teacher List ({teachers.length})
                </h2>
              </div>

              {teachersLoading ? (
                <div className="text-center py-12">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  <p className="mt-4 text-gray-600">Loading teachers...</p>
                </div>
              ) : teachers.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-gray-600">No teachers found.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full bg-white border border-gray-200 rounded-lg">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Name
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Email
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Role
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Status
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Joined
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {teachers.map((teacher) => {
                        const isActive = teacher.is_active !== false; // Default to true if not set
                        return (
                          <tr key={teacher.id} className="hover:bg-gray-50">
                            <td className="px-4 py-3 text-sm font-medium text-gray-900">
                              {teacher.full_name || "N/A"}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-600">
                              {teacher.email}
                            </td>
                            <td className="px-4 py-3">
                              <span className="inline-flex items-center px-2 py-0.5 rounded-sm text-xs font-medium text-white bg-blue-500">
                                {teacher.role}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <span
                                className={`inline-flex items-center px-2 py-0.5 rounded-sm text-xs font-medium ${
                                  isActive
                                    ? "bg-green-100 text-green-800"
                                    : "bg-red-100 text-red-800"
                                }`}
                              >
                                {isActive ? "Active" : "Inactive"}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-600">
                              {new Date(
                                teacher.created_at
                              ).toLocaleDateString()}
                            </td>
                            <td className="px-4 py-3">
                              <Button
                                onClick={() =>
                                  toggleTeacherStatus(teacher.id, isActive)
                                }
                                variant={isActive ? "outline" : "default"}
                                size="sm"
                                className={
                                  isActive
                                    ? "border-red-300 text-red-700 hover:bg-red-50"
                                    : "bg-green-600 text-white hover:bg-green-700"
                                }
                              >
                                {isActive ? "Deactivate" : "Activate"}
                              </Button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Statistics Views */}
          {currentView === "statistics/teachers" && (
            <TeacherStats
              filteredTeacherStats={filteredTeacherStats}
              statsLoading={statsLoading}
              fetchTeacherStats={fetchTeacherStats}
              viewTeacherDetails={viewTeacherDetails}
            />
          )}

          {currentView === "statistics/users" && (
            <>
              {/* Search + Filter */}
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex-1">
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search by name/email…"
                    className="w-full border border-gray-300 rounded-md px-3 h-10 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                <div className="w-full sm:w-48">
                  <select
                    value={filterRole}
                    onChange={(e) => setFilterRole(e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-3 h-10 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="all">All Roles</option>
                    <option value="admin">Admins</option>
                    <option value="teacher">Teachers</option>
                    <option value="student">Students</option>
                  </select>
                </div>
              </div>

              {/* Users Table */}
              <UsersTable
                profiles={profiles}
                listLoading={listLoading}
                fetchProfiles={fetchProfiles}
                deleteUser={deleteUser}
                filteredProfiles={filteredProfiles}
              />
            </>
          )}

          {/* Leave Requests View */}
          {currentView === "leave-requests" && (
            <Card className="shadow-md border border-gray-200">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-gray-800">
                  Leave Requests
                </CardTitle>
                <p className="text-sm text-gray-600">
                  Review and manage teacher leave requests
                </p>
              </CardHeader>
              <CardContent>
                {leaveRequestsLoading ? (
                  <div className="text-center py-12">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    <p className="mt-4 text-gray-600">Loading leave requests...</p>
                  </div>
                ) : leaveRequests.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-gray-600">No leave requests found.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {leaveRequests.map((request) => (
                      <div
                        key={request.id}
                        className={`p-4 rounded-lg border ${
                          request.status === "pending"
                            ? "bg-yellow-50 border-yellow-200"
                            : request.status === "approved"
                            ? "bg-green-50 border-green-200"
                            : "bg-red-50 border-red-200"
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <p className="font-semibold text-gray-900">
                                {request.teacher?.full_name || "Unknown Teacher"}
                              </p>
                              <span
                                className={`px-2 py-1 rounded text-xs font-medium ${
                                  request.status === "pending"
                                    ? "bg-yellow-200 text-yellow-800"
                                    : request.status === "approved"
                                    ? "bg-green-200 text-green-800"
                                    : "bg-red-200 text-red-800"
                                }`}
                              >
                                {request.status.toUpperCase()}
                              </span>
                            </div>
                            <p className="text-sm text-gray-600">
                              <span className="font-medium">Period:</span>{" "}
                              {new Date(request.start_date).toLocaleDateString()} -{" "}
                              {new Date(request.end_date).toLocaleDateString()}
                            </p>
                            <p className="text-sm text-gray-600 mt-1">
                              <span className="font-medium">Reason:</span> {request.reason}
                            </p>
                            {request.admin_notes && (
                              <p className="text-sm text-gray-600 mt-1">
                                <span className="font-medium">Admin Notes:</span> {request.admin_notes}
                              </p>
                            )}
                            <p className="text-xs text-gray-500 mt-2">
                              Requested: {new Date(request.created_at).toLocaleString()}
                            </p>
                          </div>
                          {request.status === "pending" && (
                            <div className="flex gap-2 ml-4">
                              <Button
                                size="sm"
                                onClick={() => {
                                  const notes = prompt("Add notes (optional):");
                                  handleLeaveRequestAction(request.id, "approved", notes || "");
                                }}
                                className="bg-green-600 hover:bg-green-700 text-white"
                              >
                                Approve
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  const notes = prompt("Add rejection reason (optional):");
                                  handleLeaveRequestAction(request.id, "rejected", notes || "");
                                }}
                                className="border-red-300 text-red-700 hover:bg-red-50"
                              >
                                Reject
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Class Switches View */}
          {currentView === "class-switches" && (
            <Card className="shadow-md border border-gray-200">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-gray-800">
                  Class Switches
                </CardTitle>
                <p className="text-sm text-gray-600">
                  View all class switch requests and completions
                </p>
              </CardHeader>
              <CardContent>
                {classSwitchesLoading ? (
                  <div className="text-center py-12">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    <p className="mt-4 text-gray-600">Loading class switches...</p>
                  </div>
                ) : classSwitches.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-gray-600">No class switches found.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full bg-white border border-gray-200 rounded-lg">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                            Requester
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                            Requester Class
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                            Target Teacher
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                            Target Class
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                            Switch Date
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                            Status
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {classSwitches.map((switchReq) => (
                          <tr key={switchReq.id} className="hover:bg-gray-50">
                            <td className="px-4 py-3 text-sm text-gray-900">
                              {switchReq.requester_teacher?.full_name || "Unknown"}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-600">
                              {switchReq.requester_class?.subject} ({switchReq.requester_class?.course} - {switchReq.requester_class?.semester})
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-900">
                              {switchReq.target_teacher?.full_name || "Unknown"}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-600">
                              {switchReq.target_class?.subject} ({switchReq.target_class?.course} - {switchReq.target_class?.semester})
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-600">
                              {new Date(switchReq.switch_date).toLocaleDateString()}
                            </td>
                            <td className="px-4 py-3">
                              <span
                                className={`px-2 py-1 rounded text-xs font-medium ${
                                  switchReq.status === "pending"
                                    ? "bg-yellow-200 text-yellow-800"
                                    : switchReq.status === "accepted" || switchReq.status === "completed"
                                    ? "bg-green-200 text-green-800"
                                    : "bg-red-200 text-red-800"
                                }`}
                              >
                                {switchReq.status.toUpperCase()}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {currentView === "statistics/students" && (
            <Card className="shadow-md border border-gray-200">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-gray-800">
                  Student Statistics
                </CardTitle>
                <p className="text-sm text-gray-600">
                  Overview of student enrollment and distribution
                </p>
              </CardHeader>
              <CardContent>
                {studentsLoading ? (
                  <div className="text-center py-12">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    <p className="mt-4 text-gray-600">Loading statistics...</p>
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                      <div className="p-4 bg-green-50 rounded-lg">
                        <p className="text-sm font-medium text-green-700">
                          Total Students
                        </p>
                        <p className="text-3xl font-bold text-green-900 mt-2">
                          {students.length}
                        </p>
                      </div>
                      <div className="p-4 bg-blue-50 rounded-lg">
                        <p className="text-sm font-medium text-blue-700">
                          Unique Classes
                        </p>
                        <p className="text-3xl font-bold text-blue-900 mt-2">
                          {
                            new Set(
                              students.map((s) => s.class).filter(Boolean)
                            ).size
                          }
                        </p>
                      </div>
                      <div className="p-4 bg-purple-50 rounded-lg">
                        <p className="text-sm font-medium text-purple-700">
                          Unique Sections
                        </p>
                        <p className="text-3xl font-bold text-purple-900 mt-2">
                          {
                            new Set(
                              students.map((s) => s.section).filter(Boolean)
                            ).size
                          }
                        </p>
                      </div>
                    </div>
                    <div>
                      <h3 className="text-md font-semibold text-gray-800 mb-4">
                        Students by Class
                      </h3>
                      <div className="space-y-2">
                        {Array.from(
                          new Set(students.map((s) => s.class).filter(Boolean))
                        )
                          .sort()
                          .map((cls) => {
                            const count = students.filter(
                              (s) => s.class === cls
                            ).length;
                            const percentage =
                              students.length > 0
                                ? ((count / students.length) * 100).toFixed(1)
                                : 0;
                            return (
                              <div
                                key={cls}
                                className="flex items-center gap-4"
                              >
                                <div className="w-32 text-sm font-medium text-gray-700">
                                  {cls}
                                </div>
                                <div className="flex-1 bg-gray-200 rounded-full h-6 relative">
                                  <div
                                    className="h-6 rounded-full flex items-center justify-end pr-2 bg-green-500"
                                    style={{ width: `${percentage}%` }}
                                  >
                                    <span className="text-xs font-medium text-white">
                                      {count}
                                    </span>
                                  </div>
                                </div>
                                <div className="w-16 text-sm text-gray-600 text-right">
                                  {percentage}%
                                </div>
                              </div>
                            );
                          })}
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          )}

          {/* Subjects View */}
          {currentView === "subjects" && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    Subjects & Courses
                  </h2>
                  <p className="text-gray-600 mt-1">
                    Manage subjects and courses with semester information
                  </p>
                </div>
                <Button
                  onClick={() => setShowAddSubject(true)}
                  className="bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-700 hover:to-violet-700 text-white shadow-md hover:shadow-lg"
                >
                  <BookOpen className="w-4 h-4 mr-2" />
                  Add Subject
                </Button>
              </div>

              {/* Search + Filter */}
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex-1">
                  <input
                    type="text"
                    value={subjectSearch}
                    onChange={(e) => setSubjectSearch(e.target.value)}
                    placeholder="Search by subject name or course code…"
                    className="w-full border border-gray-300 rounded-md px-3 h-10 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                <div className="w-full sm:w-48">
                  <select
                    value={subjectSemesterFilter}
                    onChange={(e) => setSubjectSemesterFilter(e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-3 h-10 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="all">All Semesters</option>
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((sem) => (
                      <option key={sem} value={sem}>
                        Semester {sem}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Subjects Table */}
              {subjectsLoading ? (
                <div className="text-center py-12">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
                  <p className="mt-4 text-gray-600">Loading subjects...</p>
                </div>
              ) : (
                <Card className="shadow-md border border-gray-200">
                  <CardContent className="p-0">
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="border-b border-gray-200 bg-gray-50">
                          <tr>
                            <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase">
                              Course Code
                            </th>
                            <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase">
                              Subject Name
                            </th>
                            <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase">
                              Semester
                            </th>
                            <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase">
                              Credits
                            </th>
                            <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase">
                              Description
                            </th>
                            <th className="py-3 px-4 text-right text-xs font-medium text-gray-500 uppercase">
                              Actions
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {subjects
                            .filter((subject) => {
                              const matchesSearch =
                                !subjectSearch ||
                                subject.subject_name
                                  ?.toLowerCase()
                                  .includes(subjectSearch.toLowerCase()) ||
                                subject.course_code
                                  ?.toLowerCase()
                                  .includes(subjectSearch.toLowerCase());
                              const matchesSemester =
                                subjectSemesterFilter === "all" ||
                                subject.semester ===
                                  parseInt(subjectSemesterFilter);
                              return matchesSearch && matchesSemester;
                            })
                            .map((subject, idx) => (
                              <tr
                                key={subject.id}
                                className={`border-b border-gray-100 last:border-0 ${
                                  idx % 2 === 0 ? "bg-gray-50" : "bg-white"
                                }`}
                              >
                                <td className="py-3 px-4">
                                  <span className="font-medium text-gray-900">
                                    {subject.course_code}
                                  </span>
                                </td>
                                <td className="py-3 px-4 text-gray-900">
                                  {subject.subject_name}
                                </td>
                                <td className="py-3 px-4">
                                  <span className="inline-flex items-center px-2 py-0.5 rounded-sm text-xs font-medium text-white bg-purple-500">
                                    Semester {subject.semester}
                                  </span>
                                </td>
                                <td className="py-3 px-4 text-gray-700">
                                  {subject.credits} Credit
                                  {subject.credits > 1 ? "s" : ""}
                                </td>
                                <td className="py-3 px-4 text-gray-600 text-sm">
                                  {subject.description || (
                                    <span className="text-gray-400 italic">
                                      No description
                                    </span>
                                  )}
                                </td>
                                <td className="py-3 px-4">
                                  <div className="flex justify-end">
                                    <Menu
                                      as="div"
                                      className="relative inline-block text-left"
                                    >
                                      <Menu.Button
                                        as={Button}
                                        variant="ghost"
                                        size="sm"
                                        className="p-1.5 sm:p-2"
                                      >
                                        <MoreHorizontal className="w-4 h-4" />
                                      </Menu.Button>
                                      <Transition
                                        enter="transition ease-out duration-100"
                                        enterFrom="transform opacity-0 scale-95"
                                        enterTo="transform opacity-100 scale-100"
                                        leave="transition ease-in duration-75"
                                        leaveFrom="transform opacity-100 scale-100"
                                        leaveTo="transform opacity-0 scale-95"
                                      >
                                        <Menu.Items className="absolute right-0 mt-2 w-40 origin-top-right rounded-md border border-gray-200 bg-white shadow-lg focus:outline-none z-50">
                                          <div className="py-1">
                                            <Menu.Item>
                                              {({ active }) => (
                                                <button
                                                  onClick={() =>
                                                    deleteSubject(subject.id)
                                                  }
                                                  className={`${
                                                    active ? "bg-gray-100" : ""
                                                  } flex w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-gray-50`}
                                                >
                                                  Delete
                                                </button>
                                              )}
                                            </Menu.Item>
                                          </div>
                                        </Menu.Items>
                                      </Transition>
                                    </Menu>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          {subjects.filter((subject) => {
                            const matchesSearch =
                              !subjectSearch ||
                              subject.subject_name
                                ?.toLowerCase()
                                .includes(subjectSearch.toLowerCase()) ||
                              subject.course_code
                                ?.toLowerCase()
                                .includes(subjectSearch.toLowerCase());
                            const matchesSemester =
                              subjectSemesterFilter === "all" ||
                              subject.semester ===
                                parseInt(subjectSemesterFilter);
                            return matchesSearch && matchesSemester;
                          }).length === 0 && (
                            <tr>
                              <td
                                className="py-4 text-center text-gray-600"
                                colSpan={6}
                              >
                                No subjects found
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {/* Students View */}
          {currentView === "students" && (
            <>
              {/* Search and Filters */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Search
                    </label>
                    <input
                      type="text"
                      value={studentSearch}
                      onChange={(e) => setStudentSearch(e.target.value)}
                      placeholder="Search by name, roll, or guardian..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Class
                    </label>
                    <select
                      value={studentClassFilter}
                      onChange={(e) => setStudentClassFilter(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">All Classes</option>
                      {Array.from(
                        new Set(students.map((s) => s.class).filter(Boolean))
                      )
                        .sort()
                        .map((cls) => (
                          <option key={cls} value={cls}>
                            {cls}
                          </option>
                        ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Section
                    </label>
                    <select
                      value={studentSectionFilter}
                      onChange={(e) => setStudentSectionFilter(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">All Sections</option>
                      {Array.from(
                        new Set(students.map((s) => s.section).filter(Boolean))
                      )
                        .sort()
                        .map((sec) => (
                          <option key={sec} value={sec}>
                            {sec}
                          </option>
                        ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Students Table */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-semibold text-gray-900">
                    Student List ({students.length})
                  </h2>
                </div>

                {studentsLoading ? (
                  <div className="text-center py-12">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    <p className="mt-4 text-gray-600">Loading students...</p>
                  </div>
                ) : students.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-gray-600">No students found.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full bg-white border border-gray-200 rounded-lg">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                            Profile
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                            Roll
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                            Name
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                            Class
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                            Section
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                            Guardian
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {students.map((student) => (
                          <tr key={student.id} className="hover:bg-gray-50">
                            <td className="px-4 py-3">
                              <div className="w-10 h-10 rounded-full bg-blue-500 text-white flex items-center justify-center font-semibold">
                                {student.full_name
                                  ?.split(" ")
                                  .map((n) => n[0])
                                  .join("")
                                  .toUpperCase()
                                  .slice(0, 2) || "?"}
                              </div>
                            </td>
                            <td className="px-4 py-3 text-sm font-medium text-gray-900">
                              {student.roll}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-900">
                              {student.full_name}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-600">
                              {student.class || "-"}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-600">
                              {student.section || "-"}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-600">
                              {student.guardian_name || "-"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </>
          )}

          {/* Teacher Details Modal */}
          <TeacherDetails
            open={showTeacherDetails}
            onClose={() => setShowTeacherDetails(false)}
            selectedTeacher={selectedTeacher}
          />

          <AddUser
            open={showAddUser}
            onClose={() => {
              setShowAddUser(false);
              setAddUserRole("teacher");
            }}
            onUserAdded={() => {
              fetchProfiles();
              fetchTeacherStats();
              fetchStudentCount();
              if (currentView === "teachers") fetchTeachers();
              if (currentView === "students") fetchStudents();
            }}
            defaultRole={addUserRole}
          />

          <AddClass
            open={showAssignClass}
            onClose={() => setShowAssignClass(false)}
            profiles={profiles}
            onCreated={() => {
              fetchProfiles();
              fetchTeacherStats();
            }}
          />

          <AddSubject
            open={showAddSubject}
            onClose={() => setShowAddSubject(false)}
            onCreated={() => {
              fetchSubjects();
            }}
          />

          <NotificationPanel
            open={showNotificationPanel}
            onClose={() => setShowNotificationPanel(false)}
            onNotificationSent={() => {
              // Optionally refresh data or show success message
            }}
          />
        </main>
      </div>
    </div>
  );
}
