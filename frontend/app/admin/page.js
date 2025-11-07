"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { supabase } from "@/lib/supabaseClient";
import { resolveUserRole } from "@/lib/utils";
import {
  Moon,
  Sun,
  MoreHorizontal,
  User,
  BookOpen,
  CheckCircle,
  XCircle,
  Calendar,
} from "lucide-react";
import { Dialog, Menu, Transition } from "@headlessui/react";
import AddClass from "@/components/ui/addClass";
import Sidebar from "@/components/ui/sidebar";
import AddUser from "@/components/ui/addUser";
import UsersTable from "@/components/ui/usersTable";
import TeacherStats from "@/components/ui/teacherStats";
import TeacherDetails from "@/components/ui/teacherDetails";

export default function AdminPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState("");
  const [profiles, setProfiles] = useState([]);
  const [listLoading, setListLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [filterRole, setFilterRole] = useState("all");
  const [showAddUser, setShowAddUser] = useState(false);
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

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      const user = data?.user;
      if (!user) {
        router.replace("/");
        return;
      }
      const role = await resolveUserRole(supabase, user);
      if (role !== "admin") {
        return router.replace("/dashboard");
      }
      setEmail(user.email || "");
      setLoading(false);
      fetchProfiles();
      fetchTeacherStats();
    });
  }, [router]);

  const signOut = async () => {
    await supabase.auth.signOut();
    router.replace("/");
  };

  const fetchProfiles = async () => {
    setListLoading(true);
    const { data, error } = await supabase
      .from("profiles")
      .select("id, full_name, email, role, created_at")
      .order("created_at", { ascending: false });
    if (!error) setProfiles(data || []);
    setListLoading(false);
  };

  const fetchTeacherStats = async () => {
    setStatsLoading(true);

    // Fetch teachers
    const { data: teachers, error: teachersError } = await supabase
      .from("profiles")
      .select("id, full_name, email")
      .eq("role", "teacher");

    if (teachersError) {
      console.error("Error fetching teachers:", teachersError);
      setStatsLoading(false);
      return;
    }

    const stats = await Promise.all(
      teachers.map(async (teacher) => {
        // Fetch classes assigned to this teacher
        const { data: classes, error: classesError } = await supabase
          .from("classes")
          .select("id, course, semester, subject, created_at")
          .eq("teacher_id", teacher.id);

        if (classesError) {
          console.error("Error fetching classes:", classesError);
          return {
            ...teacher,
            totalClasses: 0,
            completedClasses: 0,
            pendingClasses: 0,
            missedClasses: [],
          };
        }

        const totalClasses = classes.length;

        // Fetch attendance records to determine completed classes
        let completedClasses = 0;
        const missedClasses = [];
        const today = new Date().toISOString().split("T")[0];

        await Promise.all(
          classes.map(async (classItem) => {
            const { data: attendance, error: attendanceError } = await supabase
              .from("attendance")
              .select("date, present_count, total_students")
              .eq("class_id", classItem.id)
              .eq("date", today);

            if (!attendanceError && attendance && attendance.length > 0) {
              completedClasses++;
            } else {
              // Check if this class should have had attendance taken today
              const classDate = new Date(classItem.created_at);
              const shouldHaveAttendance = classDate <= new Date();

              if (
                shouldHaveAttendance &&
                !attendanceError &&
                (!attendance || attendance.length === 0)
              ) {
                missedClasses.push({
                  classId: classItem.id,
                  className: `${classItem.course}${
                    classItem.semester ? " - " + classItem.semester : ""
                  }`,
                  subject: classItem.subject,
                  date: today,
                });
              }
            }
          })
        );

        const pendingClasses = totalClasses - completedClasses;

        return {
          ...teacher,
          totalClasses,
          completedClasses,
          pendingClasses,
          missedClasses,
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
    const { error } = await supabase.from("profiles").delete().eq("id", id);
    if (error) {
      alert(error.message);
    } else {
      setProfiles((prev) => prev.filter((p) => p.id !== id));
      setTeacherStats((prev) => prev.filter((t) => t.id !== id));
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
    <div className="min-h-dvh bg-gradient-to-br from-purple-50 via-violet-50 to-purple-100 dark:from-gray-900 dark:via-purple-950 dark:to-gray-900 p-6">
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
                    d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                  />
                </svg>
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-violet-600 dark:from-purple-400 dark:to-violet-400">
                  Admin Panel
                </h1>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Manage users and system settings
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
              <Button
                variant="ghost"
                size="sm"
                className="p-2 rounded-full"
                onClick={() =>
                  document.documentElement.classList.toggle("dark")
                }
              >
                <Moon className="hidden dark:block w-5 h-5" />
                <Sun className="block dark:hidden w-5 h-5" />
              </Button>

              <Button
                onClick={() => setShowAddUser(true)}
                size="sm"
                className="flex-1 sm:flex-none bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-700 hover:to-violet-700 text-white px-3 py-2 rounded-lg shadow-md transition-all duration-200 text-sm"
              >
                + Add User
              </Button>

              <Button
                onClick={() => setShowAssignClass(true)}
                size="sm"
                className="flex-1 sm:flex-none bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-700 hover:to-violet-700 text-white px-3 py-2 rounded-lg shadow-md transition-all duration-200 text-sm"
              >
                + Class
              </Button>

              <Button
                onClick={signOut}
                size="sm"
                className="flex-1 sm:flex-none bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-700 hover:to-violet-700 text-white px-3 py-2 rounded-lg shadow-md transition-all duration-200 text-sm"
              >
                Sign out
              </Button>
            </div>
          </div>

          {/* Search + Filter */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name/email…"
                className="w-full border rounded-md px-3 h-10 bg-white/80 dark:bg-black/20"
              />
            </div>
            <div className="w-full sm:w-48">
              <select
                value={filterRole}
                onChange={(e) => setFilterRole(e.target.value)}
                className="w-full border rounded-md px-3 h-10 bg-white/80 dark:bg-black/20"
              >
                <option value="all">All Roles</option>
                <option value="admin">Admins</option>
                <option value="teacher">Teachers</option>
                <option value="student">Students</option>
              </select>
            </div>
          </div>

          {/* Teacher Statistics Section */}
          {filterRole === "all" || filterRole === "teacher" ? (
            <TeacherStats
              filteredTeacherStats={filteredTeacherStats}
              statsLoading={statsLoading}
              fetchTeacherStats={fetchTeacherStats}
              viewTeacherDetails={viewTeacherDetails}
            />
          ) : null}

          {/* Teacher Details Modal */}
          <TeacherDetails
            open={showTeacherDetails}
            onClose={() => setShowTeacherDetails(false)}
            selectedTeacher={selectedTeacher}
          />

          <AddUser
            open={showAddUser}
            onClose={() => setShowAddUser(false)}
            onUserAdded={() => {
              fetchProfiles();
              fetchTeacherStats();
            }}
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

          {/* Users Table */}
          <UsersTable
            profiles={profiles}
            listLoading={listLoading}
            fetchProfiles={fetchProfiles}
            deleteUser={deleteUser}
            filteredProfiles={filteredProfiles}
          />
        </main>
      </div>
    </div>
  );
}
