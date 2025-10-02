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
    supabase.auth.getUser().then(({ data }) => {
      const user = data?.user
      if (!user) {
        router.replace('/')
        return
      }
      const isAdmin = user.email?.toLowerCase() === 'admin@gmail.com'
      if (isAdmin) {
        router.replace('/admin')
        return
      }
      setEmail(user.email || '')
      setLoading(false)
    })
  }, [])

  const signOut = async () => {
    await supabase.auth.signOut()
    router.replace('/')
  }

  if (loading) return <div className="p-6 text-center text-gray-600">Loading…</div>

  return (
    <div className="min-h-dvh bg-gradient-to-br from-gray-100 via-gray-200 to-gray-300 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">Teacher Dashboard</h1>
        <Button 
          onClick={signOut} 
          className="bg-gray-700 hover:bg-gray-800 text-white px-4 py-2 rounded-lg shadow-md"
        >
          Sign out
        </Button>
      </div>
      <p className="opacity-70 text-gray-600 dark:text-gray-400">
        Signed in as <span className="font-medium">{email}</span>
      </p>

      {/* Quick Actions */}
      <Card className="shadow-md border border-gray-200 dark:border-gray-700">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-gray-800 dark:text-gray-100">
            Quick Actions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <Button size="sm" className="bg-gray-700 hover:bg-gray-800 text-white shadow-sm">
              Mark attendance
            </Button>
            <Button size="sm" variant="outline" className="border-gray-400 text-gray-700 dark:text-gray-200">
              View today's list
            </Button>
            <Button size="sm" variant="ghost" className="text-gray-600 hover:text-gray-800 dark:hover:text-gray-300">
              Export CSV
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Announcements */}
      <Card className="shadow-md border border-gray-200 dark:border-gray-700">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-gray-800 dark:text-gray-100">
            Announcements
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm opacity-80 text-gray-600 dark:text-gray-400">
            No announcements yet.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
