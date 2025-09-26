"use client"
import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { supabase } from '@/lib/supabaseClient'

export default function DashboardPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [email, setEmail] = useState('')

  useEffect(() => {
    const supabase = supabase()
    supabase.auth.getUser().then(async ({ data }) => {
      const user = data?.user
      if (!user) {
        router.replace('/')
        return
      }
      const isAdmin = user.email?.toLowerCase() === 'admin@gmail.com'
      if (isAdmin) return router.replace('/admin')
      setEmail(user.email || '')
      setLoading(false)
    })
  }, [])

  const signOut = async () => {
    const supabase = supabase()
    await supabase.auth.signOut()
    router.replace('/')
  }

  if (loading) return <div className="p-6">Loading…</div>

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Teacher Dashboard</h1>
        <Button onClick={signOut}>Sign out</Button>
      </div>
      <p className="opacity-70">Signed in as {email}</p>

      <Card>
        <CardHeader>
          <CardTitle>Quick actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <Button size="sm">Mark attendance</Button>
            <Button size="sm" variant="outline">View today's list</Button>
            <Button size="sm" variant="ghost">Export CSV</Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Announcements</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm opacity-80">No announcements yet.</p>
        </CardContent>
      </Card>
    </div>
  )
}


