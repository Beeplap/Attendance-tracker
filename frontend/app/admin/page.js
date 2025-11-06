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
import { Moon, Sun, MoreHorizontal, User, BookOpen, CheckCircle, XCircle, Calendar } from "lucide-react";
import { Dialog, Menu, Transition } from "@headlessui/react";
import AddClass from "@/components/ui/addClass";
import Sidebar from "@/components/ui/sidebar";
import AddUser from "@/components/ui/addUser";

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
          return { ...teacher, totalClasses: 0, completedClasses: 0, pendingClasses: 0, missedClasses: [] };
        }

        const totalClasses = classes.length;
        
        // Fetch attendance records to determine completed classes
        let completedClasses = 0;
        const missedClasses = [];
        const today = new Date().toISOString().split('T')[0];

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
              
              if (shouldHaveAttendance && !attendanceError && (!attendance || attendance.length === 0)) {
                missedClasses.push({
                  classId: classItem.id,
                  className: `${classItem.course}${classItem.semester ? ' - ' + classItem.semester : ''}`,
                  subject: classItem.subject,
                  date: today
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
          missedClasses
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

  const filteredTeacherStats = teacherStats.filter((t) =>
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
                <svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor"><path d="M3 6h14M3 10h14M3 14h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="p-2 rounded-full"
                onClick={() => document.documentElement.classList.toggle("dark")}
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
            <Card className="shadow-md border border-gray-200 dark:border-gray-700">
              <CardHeader className="flex flex-col sm:flex-row gap-2 sm:items-center justify-between">
                <div>
                  <CardTitle className="text-lg font-semibold text-gray-800 dark:text-gray-100">
                    Teacher Statistics
                  </CardTitle>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Overview of teacher performance and class management
                  </p>
                </div>
                <Button
                  variant="outline"
                  onClick={fetchTeacherStats}
                  disabled={statsLoading}
                  className="border-gray-400 text-gray-700 dark:text-gray-200"
                >
                  {statsLoading ? "Refreshing…" : "Refresh Stats"}
                </Button>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="sr-only sm:not-sr-only">
                      <tr className="text-left border-b bg-gray-100 dark:bg-gray-800">
                        <th className="py-2 px-2 sm:px-4">Teacher</th>
                        <th className="py-2 px-2 sm:px-4 hidden sm:table-cell">Email</th>
                        <th className="py-2 px-2 sm:px-4">Total Classes</th>
                        <th className="py-2 px-2 sm:px-4">Completed</th>
                        <th className="py-2 px-2 sm:px-4">Pending</th>
                        <th className="py-2 px-2 sm:px-4">Missed Today</th>
                        <th className="py-2 px-2 sm:px-4 w-12 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredTeacherStats.map((teacher, idx) => (
                        <tr
                          key={teacher.id}
                          className={`border-b last:border-0 ${
                            idx % 2 === 0 ? "bg-white/50 dark:bg-gray-900/40" : ""
                          }`}
                        >
                          <td className="py-2 px-2 sm:px-4">
                            <div className="flex flex-col sm:flex-row sm:items-center gap-0.5 sm:gap-2">
                              <span className="font-medium">
                                {teacher.full_name || teacher.id}
                              </span>
                              <span className="text-xs text-gray-500 sm:hidden">
                                {teacher.email}
                              </span>
                            </div>
                          </td>
                          <td className="py-2 px-2 sm:px-4 hidden sm:table-cell">
                            {teacher.email}
                          </td>
                          <td className="py-2 px-2 sm:px-4">
                            <div className="flex items-center gap-1">
                              <BookOpen className="w-4 h-4 text-blue-500" />
                              <span className="font-medium">{teacher.totalClasses}</span>
                            </div>
                          </td>
                          <td className="py-2 px-2 sm:px-4">
                            <div className="flex items-center gap-1 text-green-600">
                              <CheckCircle className="w-4 h-4" />
                              <span>{teacher.completedClasses}</span>
                            </div>
                          </td>
                          <td className="py-2 px-2 sm:px-4">
                            <div className="flex items-center gap-1 text-yellow-600">
                              <Calendar className="w-4 h-4" />
                              <span>{teacher.pendingClasses}</span>
                            </div>
                          </td>
                          <td className="py-2 px-2 sm:px-4">
                            <div className="flex items-center gap-1 text-red-600">
                              <XCircle className="w-4 h-4" />
                              <span>{teacher.missedClasses?.length || 0}</span>
                            </div>
                          </td>
                          <td className="py-2 px-2 sm:px-4">
                            <div className="flex justify-end">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => viewTeacherDetails(teacher)}
                                className="text-xs"
                              >
                                View Details
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                      {filteredTeacherStats.length === 0 && (
                        <tr>
                          <td className="py-4 text-center opacity-70" colSpan={7}>
                            {statsLoading ? "Loading teacher statistics..." : "No teachers found"}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          ) : null}

          {/* Teacher Details Modal */}
          <Dialog
            open={showTeacherDetails}
            onClose={() => setShowTeacherDetails(false)}
            className="relative z-50"
          >
            <div className="fixed inset-0 bg-black/50" aria-hidden="true" />
            <div className="fixed inset-0 flex items-center justify-center p-4">
              <Dialog.Panel className="bg-white dark:bg-gray-900 rounded-lg shadow-xl w-full max-w-2xl border border-gray-300 dark:border-gray-700">
                <Card className="shadow-none border-none">
                  <CardHeader>
                    <CardTitle className="text-lg font-semibold text-gray-800 dark:text-gray-100">
                      Teacher Details - {selectedTeacher?.full_name}
                    </CardTitle>
                    <div className="text-xs opacity-70">
                      Complete overview of classes and attendance
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    {selectedTeacher && (
                      <>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 p-4 rounded-lg text-center">
                            <BookOpen className="w-8 h-8 text-blue-500 mx-auto mb-2" />
                            <div className="text-2xl font-bold text-blue-600">{selectedTeacher.totalClasses}</div>
                            <div className="text-xs text-blue-600">Total Classes</div>
                          </div>
                          
                          <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 p-4 rounded-lg text-center">
                            <CheckCircle className="w-8 h-8 text-green-500 mx-auto mb-2" />
                            <div className="text-2xl font-bold text-green-600">{selectedTeacher.completedClasses}</div>
                            <div className="text-xs text-green-600">Completed</div>
                          </div>
                          
                          <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-900/20 dark:to-yellow-800/20 p-4 rounded-lg text-center">
                            <Calendar className="w-8 h-8 text-yellow-500 mx-auto mb-2" />
                            <div className="text-2xl font-bold text-yellow-600">{selectedTeacher.pendingClasses}</div>
                            <div className="text-xs text-yellow-600">Pending</div>
                          </div>
                          
                          <div className="bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 p-4 rounded-lg text-center">
                            <XCircle className="w-8 h-8 text-red-500 mx-auto mb-2" />
                            <div className="text-2xl font-bold text-red-600">{selectedTeacher.missedClasses?.length || 0}</div>
                            <div className="text-xs text-red-600">Missed Today</div>
                          </div>
                        </div>

                        {selectedTeacher.missedClasses && selectedTeacher.missedClasses.length > 0 && (
                          <div>
                            <h4 className="font-semibold text-red-600 mb-2">Missed Attendance Today:</h4>
                            <div className="space-y-2">
                              {selectedTeacher.missedClasses.map((missedClass, index) => (
                                <div key={index} className="flex items-center justify-between p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                                  <div>
                                    <div className="font-medium">{missedClass.className}</div>
                                    <div className="text-sm text-gray-600 dark:text-gray-400">{missedClass.subject}</div>
                                  </div>
                                  <div className="text-sm text-red-600">{missedClass.date}</div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </CardContent>

                  <CardFooter className="flex justify-end">
                    <Button
                      variant="outline"
                      onClick={() => setShowTeacherDetails(false)}
                      className="border-gray-400 text-gray-700 dark:text-gray-200"
                    >
                      Close
                    </Button>
                  </CardFooter>
                </Card>
              </Dialog.Panel>
            </div>
          </Dialog>

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
          <Card className="shadow-md border border-gray-200 dark:border-gray-700">
            <CardHeader className="flex flex-col sm:flex-row gap-2 sm:items-center justify-between">
              <div>
                <CardTitle className="text-lg font-semibold text-gray-800 dark:text-gray-100">
                  Users 
                </CardTitle>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {profiles.filter((p) => p.role === "admin").length} admins,{" "}
                  {profiles.filter((p) => p.role === "teacher").length} teachers,{" "}
                  {profiles.filter((p) => p.role === "student").length} students
                </p>
              </div>
              <Button
                variant="outline"
                onClick={fetchProfiles}
                disabled={listLoading}
                className="border-gray-400 text-gray-700 dark:text-gray-200"
              >
                {listLoading ? "Refreshing…" : "Refresh"}
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="sr-only sm:not-sr-only">
                    <tr className="text-left border-b bg-gray-100 dark:bg-gray-800">
                      <th className="py-2 px-2 sm:px-4">User</th>
                      <th className="py-2 px-2 sm:px-4 hidden sm:table-cell">
                        Email
                      </th>
                      <th className="py-2 px-2 sm:px-4">Role</th>
                      <th className="py-2 px-2 sm:px-4 hidden sm:table-cell">
                        Joined
                      </th>
                      <th className="py-2 px-2 sm:px-4 w-12 text-right"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredProfiles.map((p, idx) => (
                      <tr
                        key={p.id}
                        className={`border-b last:border-0 ${
                          idx % 2 === 0 ? "bg-white/50 dark:bg-gray-900/40" : ""
                        }`}
                      >
                        <td className="py-2 px-2 sm:px-4">
                          <div className="flex flex-col sm:flex-row sm:items-center gap-0.5 sm:gap-2">
                            <span className="font-medium">
                              {p.full_name || p.id}
                            </span>
                            <span className="text-xs text-gray-500 sm:hidden">
                              {p.email}
                            </span>
                          </div>
                        </td>
                        <td className="py-2 px-2 sm:px-4 hidden sm:table-cell">
                          {p.email}
                        </td>
                        <td className="py-2 px-2 sm:px-4">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-sm text-xs font-medium text-white
                            ${p.role === 'admin' ? 'bg-red-500' : 
                              p.role === 'teacher' ? 'bg-blue-500' : 
                              'bg-green-500'}`}
                          >
                            {p.role || "student"}
                          </span>
                        </td>
                        <td className="py-2 px-2 sm:px-4 text-xs opacity-70 hidden sm:table-cell">
                          {new Date(p.created_at).toLocaleDateString()}
                        </td>
                        <td className="py-2 px-2 sm:px-4">
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
                                <Menu.Items className="absolute right-0 mt-2 w-40 origin-top-right rounded-md border bg-white dark:bg-gray-900 shadow-lg focus:outline-none">
                                  <div className="py-1">
                                    <Menu.Item>
                                      {({ active }) => (
                                        <button
                                          onClick={() => deleteUser(p.id)}
                                          className={`${
                                            active
                                              ? "bg-gray-100 dark:bg-gray-800"
                                              : ""
                                          } flex w-full px-3 py-2 text-left text-sm text-red-600`}
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
                    {filteredProfiles.length === 0 && (
                      <tr>
                        <td className="py-4 text-center opacity-70" colSpan={5}>
                          No users found
                        </td>
                      </tr>
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
