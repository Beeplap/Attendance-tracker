"use client"
import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card'
import { supabase } from '@/lib/supabaseClient'

export default function AdminPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [email, setEmail] = useState('')
  const [profiles, setProfiles] = useState([])
  const [listLoading, setListLoading] = useState(false)
  const [addLoading, setAddLoading] = useState(false)
  const [addError, setAddError] = useState('')
  const [addSuccess, setAddSuccess] = useState('')
  const [newEmail, setNewEmail] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [newFullName, setNewFullName] = useState('')
  const [newRole, setNewRole] = useState('teacher')

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      const user = data?.user
      if (!user) {
        router.replace('/')
        return
      }
      const isAdmin = user.email?.toLowerCase() === 'admin@gmail.com' || user.email?.toLowerCase() === 'admin@admin.com'
      if (!isAdmin) return router.replace('/dashboard')
      setEmail(user.email || '')
      setLoading(false)
      fetchProfiles()
    })
  }, [])

  const signOut = async () => {
    await supabase.auth.signOut()
    router.replace('/')
  }

  const fetchProfiles = async () => {
    setListLoading(true)
    const { data, error } = await supabase
      .from('profiles')
      .select('id, full_name, role, created_at')
      .order('created_at', { ascending: false })
    if (!error) setProfiles(data || [])
    setListLoading(false)
  }

  const toggleRole = async (id, currentRole) => {
    const nextRole = currentRole === 'admin' ? 'user' : 'admin'
    setProfiles((prev) => prev.map((p) => (p.id === id ? { ...p, role: nextRole } : p)))
    const { error } = await supabase
      .from('profiles')
      .update({ role: nextRole })
      .eq('id', id)
    if (error) {
      setProfiles((prev) => prev.map((p) => (p.id === id ? { ...p, role: currentRole } : p)))
      // eslint-disable-next-line no-alert
      alert(error.message)
    }
  }

  if (loading) return <div className="p-6">Loading…</div>

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Admin Panel</h1>
        <Button onClick={signOut}>Sign out</Button>
      </div>
      <p className="opacity-70">Signed in as {email}</p>

      <Card>
        <CardHeader>
          <CardTitle>Add User</CardTitle>
          <div className="text-xs opacity-70">Quickly create teachers and admins</div>
        </CardHeader>
        <CardContent>
          {addError && <p className="text-sm text-red-600" role="alert">{addError}</p>}
          {addSuccess && <p className="text-sm text-green-600" role="status">{addSuccess}</p>}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-sm" htmlFor="newFullName">Full name</label>
              <input id="newFullName" type="text" value={newFullName} onChange={(e) => setNewFullName(e.target.value)} className="w-full border rounded-md px-3 h-10 bg-white/80 dark:bg-black/20" placeholder="Jane Doe" />
            </div>
            <div className="space-y-1">
              <label className="text-sm" htmlFor="newEmail">Email</label>
              <input id="newEmail" type="email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} className="w-full border rounded-md px-3 h-10 bg-white/80 dark:bg-black/20" placeholder="user@example.com" />
            </div>
            <div className="space-y-1">
              <label className="text-sm" htmlFor="newPassword">Password</label>
              <input id="newPassword" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="w-full border rounded-md px-3 h-10 bg-white/80 dark:bg-black/20" placeholder="••••••••" />
            </div>
            <div className="space-y-1">
              <label className="text-sm" htmlFor="newRole">Role</label>
              <select id="newRole" value={newRole} onChange={(e) => setNewRole(e.target.value)} className="w-full border rounded-md px-3 h-10 bg-white/80 dark:bg-black/20">
                <option value="teacher">Teacher</option>
                <option value="admin">Admin</option>
                <option value="user">User</option>
              </select>
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <Button
            onClick={async () => {
              try {
                setAddError('')
                setAddSuccess('')
                setAddLoading(true)
                const res = await fetch('/api/add', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ email: newEmail, password: newPassword, full_name: newFullName, role: newRole }),
                })
                const json = await res.json()
                if (!res.ok) throw new Error(json?.error || 'Failed to add user')
                setAddSuccess('User created successfully')
                setNewEmail('')
                setNewPassword('')
                setNewFullName('')
                setNewRole('teacher')
                await fetchProfiles()
              } catch (err) {
                setAddError(err.message)
              } finally {
                setAddLoading(false)
              }
            }}
            disabled={addLoading || !newEmail || !newPassword}
          >
            {addLoading ? 'Creating…' : 'Create user'}
          </Button>
        </CardFooter>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Users</CardTitle>
          <Button variant="outline" onClick={fetchProfiles} disabled={listLoading}>
            {listLoading ? 'Refreshing…' : 'Refresh'}
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left border-b">
                  <th className="py-2 pr-4">User</th>
                  <th className="py-2 pr-4">Role</th>
                  <th className="py-2 pr-4">Action</th>
                </tr>
              </thead>
              <tbody>
                {profiles.map((p) => (
                  <tr key={p.id} className="border-b last:border-0">
                    <td className="py-2 pr-4">{p.full_name || p.id}</td>
                    <td className="py-2 pr-4 capitalize">{p.role || 'user'}</td>
                    <td className="py-2 pr-4">
                      <Button size="sm" variant="outline" onClick={() => toggleRole(p.id, p.role || 'user')}>
                        {p.role === 'admin' ? 'Make user' : 'Make admin'}
                      </Button>
                    </td>
                  </tr>
                ))}
                {profiles.length === 0 && (
                  <tr>
                    <td className="py-4 text-center opacity-70" colSpan={3}>No users yet</td>
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


