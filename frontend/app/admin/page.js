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
import { Moon, Sun, MoreHorizontal } from "lucide-react";
import { Dialog, Menu, Transition } from "@headlessui/react";

export default function AdminPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState("");
  const [profiles, setProfiles] = useState([]);
  const [listLoading, setListLoading] = useState(false);
  const [addLoading, setAddLoading] = useState(false);
  const [addError, setAddError] = useState("");
  const [addSuccess, setAddSuccess] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newFullName, setNewFullName] = useState("");
  const [newRole, setNewRole] = useState("teacher");
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

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      const user = data?.user;
      if (!user) {
        router.replace("/");
        return;
      }
      // Check role from database instead of hardcoded emails
      const role = await resolveUserRole(supabase, user);
      if (role !== "admin") {
        return router.replace("/dashboard");
      }
      setEmail(user.email || "");
      setLoading(false);
      fetchProfiles();
    });
  }, []);

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

  // Role changes are disabled: admins cannot promote/demote users.

  const deleteUser = async (id) => {
    if (!confirm("Are you sure you want to delete this user?")) return;
    const { error } = await supabase.from("profiles").delete().eq("id", id);
    if (error) {
      alert(error.message);
    } else {
      setProfiles((prev) => prev.filter((p) => p.id !== id));
    }
  };

  const filteredProfiles = profiles.filter((p) => {
    const matchesSearch =
      p.full_name?.toLowerCase().includes(search.toLowerCase()) ||
      p.email?.toLowerCase().includes(search.toLowerCase());
    const matchesRole = filterRole === "all" || p.role === filterRole;
    return matchesSearch && matchesRole;
  });

  if (loading)
    return <div className="p-6 text-center text-gray-600">Loading…</div>;

  return (
    <div className="min-h-dvh bg-gradient-to-br from-purple-50 via-violet-50 to-purple-100 dark:from-gray-900 dark:via-purple-950 dark:to-gray-900 p-6 space-y-8">
      {/* Header */}
      {/* Header with responsive layout */}
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

        {/* Responsive button group */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Dark Mode Toggle */}
          <Button
            variant="ghost"
            size="sm"
            className="p-2 rounded-full"
            onClick={() => document.documentElement.classList.toggle("dark")}
          >
            <Moon className="hidden dark:block w-5 h-5" />
            <Sun className="block dark:hidden w-5 h-5" />
          </Button>

          {/* Add User Button */}
          <Button
            onClick={() => setShowAddUser(true)}
            size="sm"
            className="flex-1 sm:flex-none bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-700 hover:to-violet-700 text-white px-3 py-2 rounded-lg shadow-md transition-all duration-200 text-sm"
          >
            + Add User
          </Button>

          {/* Assign Class Button */}
          <Button
            onClick={() => setShowAssignClass(true)}
            size="sm"
            className="flex-1 sm:flex-none bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-700 hover:to-violet-700 text-white px-3 py-2 rounded-lg shadow-md transition-all duration-200 text-sm"
          >
            + Class
          </Button>

          {/* Sign Out */}
          <Button
            onClick={signOut}
            size="sm"
            className="flex-1 sm:flex-none bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-700 hover:to-violet-700 text-white px-3 py-2 rounded-lg shadow-md transition-all duration-200 text-sm"
          >
            Sign out
          </Button>
        </div>
      </div>

      {/* Search + Filter - Made responsive */}
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

      <Dialog
        open={showAddUser}
        onClose={() => setShowAddUser(false)}
        className="relative z-50"
      >
        <div className="fixed inset-0 bg-black/50" aria-hidden="true" />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="bg-white dark:bg-gray-900 rounded-lg shadow-xl w-full max-w-lg border border-gray-300 dark:border-gray-700">
            <Card className="shadow-none border-none">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-gray-800 dark:text-gray-100">
                  Add New User
                </CardTitle>
                <div className="text-xs opacity-70">
                  Quickly create teachers or students
                </div>
              </CardHeader>

              <CardContent>
                {addError && (
                  <p className="text-sm text-red-600 mb-2">{addError}</p>
                )}
                {addSuccess && (
                  <p className="text-sm text-green-600 mb-2">{addSuccess}</p>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-sm">Full Name</label>
                    <input
                      type="text"
                      value={newFullName}
                      onChange={(e) => setNewFullName(e.target.value)}
                      className="w-full border rounded-md px-3 h-10 bg-white/80 dark:bg-black/20"
                      placeholder="Jane Doe"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-sm">Email</label>
                    <input
                      type="email"
                      value={newEmail}
                      onChange={(e) => setNewEmail(e.target.value)}
                      className="w-full border rounded-md px-3 h-10 bg-white/80 dark:bg-black/20"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-sm">Password</label>
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full border rounded-md px-3 h-10 bg-white/80 dark:bg-black/20"
                      placeholder="••••••••"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-sm">Role</label>
                    <select
                      value={newRole}
                      onChange={(e) => setNewRole(e.target.value)}
                      className="w-full border rounded-md px-3 h-10 bg-white/80 dark:bg-black/20"
                    >
                      <option value="teacher">Teacher</option>
                      <option value="student">Student</option>
                    </select>
                  </div>
                </div>
              </CardContent>

              <CardFooter className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => setShowAddUser(false)}
                  className="border-gray-400 text-gray-700 dark:text-gray-200"
                >
                  Cancel
                </Button>
                <Button
                  onClick={async () => {
                    try {
                      setAddError("");
                      setAddSuccess("");
                      setAddLoading(true);
                      const res = await fetch("/api/add", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                          email: newEmail,
                          password: newPassword,
                          full_name: newFullName,
                          role: newRole,
                        }),
                      });
                      const json = await res.json();
                      if (!res.ok)
                        throw new Error(json?.error || "Failed to add user");
                      setAddSuccess(
                        "User created successfully! Credentials will be provided to them."
                      );
                      setNewEmail("");
                      setNewPassword("");
                      setNewFullName("");
                      setNewRole("teacher");
                      await fetchProfiles();
                      setTimeout(() => setShowAddUser(false), 500);
                    } catch (err) {
                      setAddError(err.message);
                    } finally {
                      setAddLoading(false);
                    }
                  }}
                  disabled={addLoading || !newEmail || !newPassword}
                  className="bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-700 hover:to-violet-700 text-white px-4 py-2 rounded-lg shadow-md transition-all duration-200"
                >
                  {addLoading ? "Creating…" : "Create user"}
                </Button>
              </CardFooter>
            </Card>
          </Dialog.Panel>
        </div>
      </Dialog>

      {/* Assign Class Dialog */}
      <Dialog
        open={showAssignClass}
        onClose={() => setShowAssignClass(false)}
        className="relative z-50"
      >
        <div className="fixed inset-0 bg-black/50" aria-hidden="true" />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="bg-white dark:bg-gray-900 rounded-lg shadow-xl w-full max-w-lg border border-gray-300 dark:border-gray-700">
            <Card className="shadow-none border-none">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-gray-800 dark:text-gray-100">
                  Assign Class
                </CardTitle>
                <div className="text-xs opacity-70">
                  Assign a class to a teacher
                </div>
              </CardHeader>

              <CardContent>
                {assignClassError && (
                  <p className="text-sm text-red-600 mb-2">
                    {assignClassError}
                  </p>
                )}
                {assignClassSuccess && (
                  <p className="text-sm text-green-600 mb-2">
                    {assignClassSuccess}
                  </p>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-sm">Class Name</label>
                    <input
                      type="text"
                      value={newClass.name}
                      onChange={(e) =>
                        setNewClass({ ...newClass, name: e.target.value })
                      }
                      className="w-full border rounded-md px-3 h-10 bg-white/80 dark:bg-black/20"
                      placeholder="Mathematics"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-sm">Grade</label>
                    <input
                      type="text"
                      value={newClass.grade}
                      onChange={(e) =>
                        setNewClass({ ...newClass, grade: e.target.value })
                      }
                      className="w-full border rounded-md px-3 h-10 bg-white/80 dark:bg-black/20"
                      placeholder="Grade 10"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-sm">Section</label>
                    <input
                      type="text"
                      value={newClass.section}
                      onChange={(e) =>
                        setNewClass({ ...newClass, section: e.target.value })
                      }
                      className="w-full border rounded-md px-3 h-10 bg-white/80 dark:bg-black/20"
                      placeholder="A"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-sm">Subject</label>
                    <input
                      type="text"
                      value={newClass.subject}
                      onChange={(e) =>
                        setNewClass({ ...newClass, subject: e.target.value })
                      }
                      className="w-full border rounded-md px-3 h-10 bg-white/80 dark:bg-black/20"
                      placeholder="Mathematics"
                    />
                  </div>

                  <div className="space-y-1 sm:col-span-2">
                    <label className="text-sm">Assign to Teacher</label>
                    <select
                      value={newClass.teacher_id}
                      onChange={(e) =>
                        setNewClass({ ...newClass, teacher_id: e.target.value })
                      }
                      className="w-full border rounded-md px-3 h-10 bg-white/80 dark:bg-black/20"
                    >
                      <option value="">Select a teacher</option>
                      {profiles
                        .filter((p) => p.role === "teacher")
                        .map((teacher) => (
                          <option key={teacher.id} value={teacher.id}>
                            {teacher.full_name} ({teacher.email})
                          </option>
                        ))}
                    </select>
                  </div>
                </div>
              </CardContent>

              <CardFooter className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => setShowAssignClass(false)}
                  className="border-gray-400 text-gray-700 dark:text-gray-200"
                >
                  Cancel
                </Button>
                <Button
                  onClick={async () => {
                    try {
                      setAssignClassError("");
                      setAssignClassSuccess("");
                      setAssignClassLoading(true);

                      const res = await fetch("/api/classes", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify(newClass),
                      });

                      const json = await res.json();
                      if (!res.ok)
                        throw new Error(
                          json?.error || "Failed to assign class"
                        );

                      setAssignClassSuccess("Class assigned successfully!");
                      setNewClass({
                        name: "",
                        grade: "",
                        section: "",
                        subject: "",
                        teacher_id: "",
                      });

                      setTimeout(() => setShowAssignClass(false), 500);
                    } catch (err) {
                      setAssignClassError(err.message);
                    } finally {
                      setAssignClassLoading(false);
                    }
                  }}
                  disabled={
                    assignClassLoading ||
                    !newClass.name ||
                    !newClass.grade ||
                    !newClass.section ||
                    !newClass.subject ||
                    !newClass.teacher_id
                  }
                  className="bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-700 hover:to-violet-700 text-white px-4 py-2 rounded-lg shadow-md transition-all duration-200"
                >
                  {assignClassLoading ? "Assigning…" : "Assign Class"}
                </Button>
              </CardFooter>
            </Card>
          </Dialog.Panel>
        </div>
      </Dialog>

      {/* Users Table - Mobile Friendly */}
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
 `}

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
    </div>
  );
}
