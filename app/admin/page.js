"use client"
import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

import { Button } from '@/components/ui/button'
import { supabase } from '@/lib/supabaseClient'

export default function AdminPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [email, setEmail] = useState('')
  const [profiles, setProfiles] = useState([])
  const [listLoading, setListLoading] = useState(false)

  useEffect(() => {
    const supabase = supabase()
    supabase.auth.getUser().then(async ({ data }) => {
      const user = data?.user
      if (!user) {
        router.replace('/')
        return
      }
      const isAdmin = user.email?.toLowerCase() === 'admin@gmail.com'
      if (!isAdmin) return router.replace('/dashboard')
      setEmail(user.email || '')
      setLoading(false)
      fetchProfiles()
    })
  }, [])

  const signOut = async () => {
    const supabase = supabase()
    await supabase.auth.signOut()
    router.replace('/')
  }

  const fetchProfiles = async () => {
    const supabase = supabase()
    setListLoading(true)
    const { data } = await supabase
      .from('profiles')
      .select('id, email, role, created_at')
      .order('created_at', { ascending: false })
    setProfiles(data || [])
    setListLoading(false)
  }

  const toggleRole = async (id, currentRole) => {
    const nextRole = currentRole === 'admin' ? 'user' : 'admin'
    const supabase = supabase()
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
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Admin Panel</h1>
        <Button onClick={signOut}>Sign out</Button>
      </div>
      <p className="opacity-70">Signed in as {email}</p>
      <div className="rounded-xl border p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-medium">Users</h2>
          <Button variant="outline" onClick={fetchProfiles} disabled={listLoading}>
            {listLoading ? 'Refreshing…' : 'Refresh'}
          </Button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left border-b">
                <th className="py-2 pr-4">Email</th>
                <th className="py-2 pr-4">Role</th>
                <th className="py-2 pr-4">Action</th>
              </tr>
            </thead>
            <tbody>
              {profiles.map((p) => (
                <tr key={p.id} className="border-b last:border-0">
                  <td className="py-2 pr-4">{p.email || p.id}</td>
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
      </div>
    </div>
  )
}


