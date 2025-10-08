"use client"
import React, { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card"
import { supabase } from "@/lib/supabaseClient"
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
      const isAdmin =
        user.email?.toLowerCase() === "admin@gmail.com" ||
        user.email?.toLowerCase() === "admin@admin.com"
      if (!isAdmin) return router.replace("/dashboard")
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
    const nextRole = currentRole === "admin" ? "user" : "admin"
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
  const countUsers = profiles.filter((p) => p.role === "user").length

  if (loading)
    return <div className="p-6 text-center text-gray-600">Loading…</div>

  return (
    <div className="min-h-dvh bg-gradient-to-br from-gray-100 via-gray-200 to-gray-300 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-6 space-y-8">

      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">
          Admin Panel
        </h1>

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
            className="bg-gray-700 hover:bg-gray-800 text-white px-4 py-2 rounded-lg shadow-md"
          >
            + Add User
          </Button>

          {/* Sign Out */}
          <Button
            onClick={signOut}
            className="bg-gray-700 hover:bg-gray-800 text-white px-4 py-2 rounded-lg shadow-md"
          >
            Sign out
          </Button>
        </div>
      </div>
      <p className="opacity-70 text-gray-600 dark:text-gray-400">
        Signed in as {email}
      </p>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <h2 className="text-lg font-semibold">Admins</h2>
            <p className="text-2xl font-bold">{countAdmins}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <h2 className="text-lg font-semibold">Teachers</h2>
            <p className="text-2xl font-bold">{countTeachers}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <h2 className="text-lg font-semibold">Students</h2>
            <p className="text-2xl font-bold">{countUsers}</p>
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
          <option value="user">Students</option>
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
          <div className="text-xs opacity-70">Quickly create teachers or admins</div>
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
                placeholder="user@example.com"
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
                <option value="admin">Admin</option>
                <option value="user">User</option>
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
                setAddSuccess("User created successfully")
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
            className="bg-gray-700 hover:bg-gray-800 text-white px-4 py-2 rounded-lg shadow-md"
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
                  <th className="py-2 px-4">User</th>
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
                    <td className="py-2 px-4 capitalize">{p.role || "user"}</td>
                    <td className="py-2 px-4 text-xs opacity-70">
                      {new Date(p.created_at).toLocaleDateString()}
                    </td>
                    <td className="py-2 px-4 flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => toggleRole(p.id, p.role || "user")}
                        className="border-gray-400 text-gray-700 dark:text-gray-200"
                      >
                        {p.role === "admin" ? "Make user" : "Make admin"}
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
