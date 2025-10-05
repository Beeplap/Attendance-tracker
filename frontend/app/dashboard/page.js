"use client"
import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { supabase } from '@/lib/supabaseClient'
import { Moon, Sun, Bell, Users, Clock, BookOpen } from "lucide-react"

export default function DashboardPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [email, setEmail] = useState('')
  const [theme, setTheme] = useState('light')

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

  useEffect(() => {
    const storedTheme = localStorage.getItem('theme') || 'light'
    setTheme(storedTheme)
    document.documentElement.classList.toggle('dark', storedTheme === 'dark')
  }, [])

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light'
    setTheme(newTheme)
    document.documentElement.classList.toggle('dark', newTheme === 'dark')
    localStorage.setItem('theme', newTheme)
  }

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
        <div className="flex items-center gap-2">
          <Button variant="ghost" className="p-2 rounded-full" onClick={toggleTheme}>
            <Moon className="hidden dark:block w-5 h-5" />
            <Sun className="block dark:hidden w-5 h-5" />
          </Button>
          <Button variant="ghost" className="p-2 rounded-full relative">
            <Bell className="w-5 h-5 text-gray-700 dark:text-gray-300" />
            <span className="absolute top-1 right-1 bg-red-500 text-white text-[10px] px-1 rounded-full">3</span>
          </Button>
          <Button
            onClick={signOut}
            className="bg-gray-700 hover:bg-gray-800 text-white px-4 py-2 rounded-lg shadow-md"
          >
            Sign out
          </Button>
        </div>
      </div>

      <p className="opacity-70 text-gray-600 dark:text-gray-400">
        Signed in as <span className="font-medium">{email}</span>
      </p>

      {/* Main Dashboard Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        {/* Attendance Overview */}
        <Card className="shadow-md border border-gray-200 dark:border-gray-700">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-800 dark:text-gray-100">
              Attendance Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold text-gray-800 dark:text-gray-100">32</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Students</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-green-600">28</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Present</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-red-500">4</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Absent</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Upcoming Events */}
        <Card className="shadow-md border border-gray-200 dark:border-gray-700">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-800 dark:text-gray-100">
              Upcoming Events
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
              <li>📅 Parent Meeting — Oct 8</li>
              <li>🧾 Monthly Report Submission — Oct 12</li>
              <li>🎓 Internal Exam — Oct 20</li>
            </ul>
          </CardContent>
        </Card>

        {/* Assigned Classes */}
        <Card className="shadow-md border border-gray-200 dark:border-gray-700 md:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-800 dark:text-gray-100">
              Assigned Classes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm border-collapse">
                <thead>
                  <tr className="bg-gray-200 dark:bg-gray-800 text-gray-800 dark:text-gray-100">
                    <th className="p-3 text-left">Subject</th>
                    <th className="p-3 text-left">Class</th>
                    <th className="p-3 text-left">Time</th>
                    <th className="p-3 text-left">Students</th>
                    <th className="p-3 text-left">Room</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  <tr className="hover:bg-gray-100 dark:hover:bg-gray-800/50 transition">
                    <td className="p-3 flex items-center gap-2"><BookOpen size={16}/> Mathematics</td>
                    <td className="p-3">Grade 10 - A</td>
                    <td className="p-3 flex items-center gap-2"><Clock size={14}/> 9:00–9:45 AM</td>
                    <td className="p-3 flex items-center gap-2"><Users size={14}/> 32</td>
                    <td className="p-3">Room 203</td>
                  </tr>
                  <tr className="hover:bg-gray-100 dark:hover:bg-gray-800/50 transition">
                    <td className="p-3 flex items-center gap-2"><BookOpen size={16}/> Science</td>
                    <td className="p-3">Grade 9 - B</td>
                    <td className="p-3 flex items-center gap-2"><Clock size={14}/> 10:00–10:45 AM</td>
                    <td className="p-3 flex items-center gap-2"><Users size={14}/> 28</td>
                    <td className="p-3">Lab 1</td>
                  </tr>
                  <tr className="hover:bg-gray-100 dark:hover:bg-gray-800/50 transition">
                    <td className="p-3 flex items-center gap-2"><BookOpen size={16}/> Computer</td>
                    <td className="p-3">Grade 10 - B</td>
                    <td className="p-3 flex items-center gap-2"><Clock size={14}/> 11:00–11:45 AM</td>
                    <td className="p-3 flex items-center gap-2"><Users size={14}/> 30</td>
                    <td className="p-3">Lab 2</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>

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
