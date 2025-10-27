"use client"
import React, { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card"
import { supabase } from "@/lib/supabaseClient"
import { resolveUserRole } from "@/lib/utils"
import { Moon, Sun } from "lucide-react"
import { Dialog } from "@headlessui/react"

export default function AdminPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [email, setEmail] = useState("")
  const [profiles, setProfiles] = useState([])
  const [listLoading, setListLoading] = useState(false)
  const [addLoading, setAddLoading] = useState(false)
  const [addError, setAddError] = useState("")
  const [addSuccess, setAddSuccess] = useState("")
  const [newEmail, setNewEmail] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [newFullName, setNewFullName] = useState("")
  const [newRole, setNewRole] = useState("teacher")
  const [search, setSearch] = useState("")
  const [filterRole, setFilterRole] = useState("all")
  const [showAddUser, setShowAddUser] = useState(false)

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      const user = data?.user
      if (!user) {
        router.replace("/")
        return
      }
      // Check role from database instead of hardcoded emails
      const role = await resolveUserRole(supabase, user)
      console.log('User ID:', user.id)
      console.log('User email:', user.email)
      console.log('Resolved role:', role)
      if (role !== "admin") {
        console.log('Access denied - not an admin')
        return router.replace("/dashboard")
      }
      setEmail(user.email || "")
      setLoading(false)
      fetchProfiles()
    })
  }, [])

  const signOut = async () => {
    await supabase.auth.signOut()
    router.replace("/")
  }

  const fetchProfiles = async () => {
    setListLoading(true)
    const { data, error } = await supabase
      .from("profiles")
      .select("id, full_name, email, role, created_at")
      .order("created_at", { ascending: false })
    if (!error) setProfiles(data || [])
    setListLoading(false)
  }

  const toggleRole = async (id, currentRole) => {
    const nextRole = currentRole === "admin" ? "student" : "admin"
    setProfiles((prev) =>
      prev.map((p) => (p.id === id ? { ...p, role: nextRole } : p))
    )
    const { error } = await supabase
      .from("profiles")
      .update({ role: nextRole })
      .eq("id", id)
    if (error) {
      setProfiles((prev) =>
        prev.map((p) => (p.id === id ? { ...p, role: currentRole } : p))
      )
      alert(error.message)
    }
  }

  const deleteUser = async (id) => {
    if (!confirm("Are you sure you want to delete this user?")) return
    const { error } = await supabase.from("profiles").delete().eq("id", id)
    if (error) {
      alert(error.message)
    } else {
      setProfiles((prev) => prev.filter((p) => p.id !== id))
    }
  }

  const filteredProfiles = profiles.filter((p) => {
    const matchesSearch =
      p.full_name?.toLowerCase().includes(search.toLowerCase()) ||
      p.email?.toLowerCase().includes(search.toLowerCase())
    const matchesRole = filterRole === "all" || p.role === filterRole
    return matchesSearch && matchesRole
  })

  // stats
  const countAdmins = profiles.filter((p) => p.role === "admin").length
  const countTeachers = profiles.filter((p) => p.role === "teacher").length
  const countStudents = profiles.filter((p) => p.role === "student").length

  if (loading)
    return <div className="p-6 text-center text-gray-600">Loading…</div>

  return (
    <div className="min-h-dvh bg-gradient-to-br from-purple-50 via-violet-50 to-purple-100 dark:from-gray-900 dark:via-purple-950 dark:to-gray-900 p-6 space-y-8">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-violet-600 rounded-xl flex items-center justify-center shadow-lg">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <div>
            <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-violet-600 dark:from-purple-400 dark:to-violet-400">
              Admin Panel
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400">Manage users and system settings</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Dark Mode Toggle */}
          <Button 
            variant="ghost"
            className="p-2 rounded-full"
            onClick={() => document.documentElement.classList.toggle("dark")}
          >
            <Moon className="hidden dark:block w-5 h-5" />
            <Sun className="block dark:hidden w-5 h-5" />
          </Button>

          {/* Add User Button */}
          <Button
            onClick={() => setShowAddUser(true)}
            className="bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-700 hover:to-violet-700 text-white px-4 py-2 rounded-lg shadow-md transition-all duration-200"
          >
            + Add Student/Teacher
          </Button>

          {/* Sign Out */}
          <Button
            onClick={signOut}
            className="bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-700 hover:to-violet-700 text-white px-4 py-2 rounded-lg shadow-md transition-all duration-200"
          >
            Sign out
          </Button>
        </div>
      </div>
      

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-purple-200 dark:border-purple-800 hover:shadow-lg transition-shadow">
          <CardContent className="p-4 text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-purple-100 dark:bg-purple-900/50 rounded-full mb-2">
              <svg className="w-6 h-6 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <h2 className="text-lg font-semibold text-gray-700 dark:text-gray-300">Admins</h2>
            <p className="text-3xl font-bold text-purple-600 dark:text-purple-400">{countAdmins}</p>
          </CardContent>
        </Card>
        <Card className="border-purple-200 dark:border-purple-800 hover:shadow-lg transition-shadow">
          <CardContent className="p-4 text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-violet-100 dark:bg-violet-900/50 rounded-full mb-2">
              <svg className="w-6 h-6 text-violet-600 dark:text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </div>
            <h2 className="text-lg font-semibold text-gray-700 dark:text-gray-300">Teachers</h2>
            <p className="text-3xl font-bold text-violet-600 dark:text-violet-400">{countTeachers}</p>
          </CardContent>
        </Card>
        <Card className="border-purple-200 dark:border-purple-800 hover:shadow-lg transition-shadow">
          <CardContent className="p-4 text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-purple-100 dark:bg-purple-900/50 rounded-full mb-2">
              <svg className="w-6 h-6 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
              </svg>
            </div>
            <h2 className="text-lg font-semibold text-gray-700 dark:text-gray-300">Students</h2>
            <p className="text-3xl font-bold text-purple-600 dark:text-purple-400">{countStudents}</p>
          </CardContent>
        </Card>
      </div>

      {/* Search + Filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name/email…"
          className="flex-1 border rounded-md px-3 h-10 bg-white/80 dark:bg-black/20"
        />
        <select
          value={filterRole}
          onChange={(e) => setFilterRole(e.target.value)}
          className="border rounded-md px-3 h-10 bg-white/80 dark:bg-black/20"
        >
          <option value="all">All</option>
          <option value="admin">Admins</option>
          <option value="teacher">Teachers</option>
          <option value="student">Students</option>
        </select>
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
          <div className="text-xs opacity-70">Quickly create teachers or students</div>
        </CardHeader>

        <CardContent>
          {addError && <p className="text-sm text-red-600 mb-2">{addError}</p>}
          {addSuccess && <p className="text-sm text-green-600 mb-2">{addSuccess}</p>}

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
                setAddError("")
                setAddSuccess("")
                setAddLoading(true)
                const res = await fetch("/api/add", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    email: newEmail,
                    password: newPassword,
                    full_name: newFullName,
                    role: newRole,
                  }),
                })
                const json = await res.json()
                if (!res.ok) throw new Error(json?.error || "Failed to add user")
                setAddSuccess("User created successfully! Credentials will be provided to them.")
                setNewEmail("")
                setNewPassword("")
                setNewFullName("")
                setNewRole("teacher")
                await fetchProfiles()
                setTimeout(() => setShowAddUser(false), 500)
              } catch (err) {
                setAddError(err.message)
              } finally {
                setAddLoading(false)
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


      {/* Users Table */}
      <Card className="shadow-md border border-gray-200 dark:border-gray-700">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg font-semibold text-gray-800 dark:text-gray-100">
            Users
          </CardTitle>
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
              <thead>
                <tr className="text-left border-b bg-gray-100 dark:bg-gray-800">
                  <th className="py-2 px-4">Name</th>
                  <th className="py-2 px-4">Email</th>
                  <th className="py-2 px-4">Role</th>
                  <th className="py-2 px-4">Joined</th>
                  <th className="py-2 px-4">Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredProfiles.map((p, idx) => (
                  <tr
                    key={p.id}
                    className={`border-b last:border-0 ${
                      idx % 2 === 0
                        ? "bg-white/50 dark:bg-gray-900/40"
                        : ""
                    }`}
                  >
                    <td className="py-2 px-4">{p.full_name || p.id}</td>
                    <td className="py-2 px-4">{p.email}</td>
                    <td className="py-2 px-4 capitalize">{p.role || "student"}</td>
                    <td className="py-2 px-4 text-xs opacity-70">
                      {new Date(p.created_at).toLocaleDateString()}
                    </td>
                    <td className="py-2 px-4 flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => toggleRole(p.id, p.role || "student")}
                        className="border-gray-400 text-gray-700 dark:text-gray-200"
                      >
                        {p.role === "admin" ? "Make student" : "Make admin"}
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => deleteUser(p.id)}
                      >
                        Delete
                      </Button>
                    </td>
                  </tr>
                ))}
                {filteredProfiles.length === 0 && (
                  <tr>
                    <td
                      className="py-4 text-center opacity-70"
                      colSpan={5}
                    >
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
  )
}
