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
  BookOpen,
  CheckCircle,
  XCircle,
  Calendar,
} from "lucide-react";
import { Dialog, Menu, Transition } from "@headlessui/react";
import AddClass from "../../components/ui/addClass";
import AdminSidebar from "../../components/ui/adminSidebar";
import AddUser from "../../components/ui/addUser";
import UsersTable from "../../components/ui/usersTable";
import TeacherStats from "../../components/ui/teacherStats";
import TeacherDetails from "../../components/ui/teacherDetails";

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
      setLoading(false);
      fetchProfiles();
      fetchTeacherStats();
    });
  }, [router]);

  const fetchProfiles = async () => {
    setListLoading(true);
    const { data, error } = await supabase
      .from("users")
      .select("id, full_name, email, role, created_at")
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

  // Fetch data when view changes
  useEffect(() => {
    if (currentView === "teachers") {
      fetchTeachers();
    } else if (currentView === "students") {
      fetchStudents();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentView]);

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
    const { error } = await supabase.from("users").delete().eq("id", id);
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
                </h1>
                <p className="text-sm text-gray-700">
                  {currentView === "dashboard" &&
                    "Manage users and system settings"}
                  {currentView === "teachers" &&
                    "Manage teacher accounts and information"}
                  {currentView === "students" &&
                    "Manage student records and information"}
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

              {/* Teacher Statistics Section */}
              {filterRole === "all" || filterRole === "teacher" ? (
                <TeacherStats
                  filteredTeacherStats={filteredTeacherStats}
                  statsLoading={statsLoading}
                  fetchTeacherStats={fetchTeacherStats}
                  viewTeacherDetails={viewTeacherDetails}
                />
              ) : null}

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
                          Joined
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {teachers.map((teacher) => (
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
                          <td className="px-4 py-3 text-sm text-gray-600">
                            {new Date(teacher.created_at).toLocaleDateString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
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
        </main>
      </div>
    </div>
  );
}
