"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { supabase } from "@/lib/supabaseClient";
import { resolveUserRole } from "@/lib/utils";
import { Moon, Sun, Bell, Users, Clock, BookOpen } from "lucide-react";

export default function DashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      const user = data?.user;
      if (!user) {
        router.replace("/");
        return;
      }
      // Check role from database instead of hardcoded emails
      const role = await resolveUserRole(supabase, user);
      if (role === "admin") {
        router.replace("/admin");
        return;
      }
      setEmail(user.email || "");
      // Load teacher display name from profiles
      try {
        const { data: profile } = await supabase
          .from("profiles")
          .select("full_name")
          .eq("id", user.id)
          .maybeSingle();
        if (profile?.full_name) setFullName(profile.full_name);
      } catch (_) {
        // ignore display name load failure
      }
      setLoading(false);
    });
  }, []);

  const toggleTheme = () => {
    document.documentElement.classList.toggle("dark");
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    router.replace("/");
  };

  if (loading)
    return <div className="p-6 text-center text-gray-600">Loading…</div>;

  // Capitalize first letter of the display name (keep rest as-is). Falls back to 'Teacher'.
  const displayName = fullName?.trim()
    ? fullName.trim().charAt(0).toUpperCase() + fullName.trim().slice(1)
    : "Teacher";

  return (
    <div className="min-h-dvh bg-gradient-to-br from-purple-50 via-violet-50 to-purple-100 dark:from-gray-900 dark:via-purple-950 dark:to-gray-900 p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
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
                d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
              />
            </svg>
          </div>
          <div>
            <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-violet-400 dark:from-purple-200 dark:to-violet-200">
              Teacher Dashboard
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Manage your classes and track attendance
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            className="p-2 rounded-full"
            onClick={toggleTheme}
          >
            <Moon className="hidden dark:block w-5 h-5" />
            <Sun className="block dark:hidden w-5 h-5" />
          </Button>
          <Button variant="ghost" className="p-2 rounded-full relative">
            <Bell className="w-5 h-5 text-gray-700 dark:text-gray-300" />
            <span className="absolute top-1 right-1 bg-red-500 text-white text-[10px] px-1 rounded-full">
              3
            </span>
          </Button>
          <Button
            onClick={signOut}
            className="bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-700 hover:to-violet-700 text-white px-4 py-2 rounded-lg shadow-md transition-all duration-200"
          >
            Sign out
          </Button>
        </div>
      </div>

      {/* Welcome Banner */}
      <Card className="shadow-md border border-gray-200 dark:border-gray-700 bg-white/60 dark:bg-black/20 backdrop-blur supports-[backdrop-filter]:backdrop-blur-md">
        <div className="p-5 sm:p-6 grid gap-2 sm:gap-3">
          <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 dark:text-gray-100">
            Welcome back,{" "}
            <span className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-violet-600 dark:from-purple-400 dark:to-violet-400">
              {displayName}
            </span>
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Here’s a quick snapshot of your day. Have a great session!
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            <span className="text-xs px-2.5 py-1 rounded-full bg-white/70 text-gray-800 border border-gray-200 dark:bg-white/10 dark:text-gray-200 dark:border-white/10">
              Today: {new Date().toLocaleDateString()}
            </span>
            <span className="text-xs px-2.5 py-1 rounded-full bg-white/70 text-gray-800 border border-gray-200 dark:bg-white/10 dark:text-gray-200 dark:border-white/10">
              Classes: 3
            </span>
            <span className="text-xs px-2.5 py-1 rounded-full bg-white/70 text-gray-800 border border-gray-200 dark:bg-white/10 dark:text-gray-200 dark:border-white/10">
              Pending Tasks: 2
            </span>
          </div>
        </div>
      </Card>

      {/* Main Dashboard Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Attendance Overview */}
        <Card className="shadow-md border border-purple-200 dark:border-purple-800 hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-800 dark:text-gray-100 flex items-center gap-2">
              <svg
                className="w-5 h-5 text-purple-600 dark:text-purple-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                />
              </svg>
              Attendance Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="p-3 rounded-lg bg-purple-50 dark:bg-purple-900/30">
                <p className="text-3xl font-bold text-purple-600 dark:text-purple-400">
                  32
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Total Students
                </p>
              </div>
              <div className="p-3 rounded-lg bg-green-50 dark:bg-green-900/30">
                <p className="text-3xl font-bold text-green-600 dark:text-green-400">
                  28
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Present
                </p>
              </div>
              <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/30">
                <p className="text-3xl font-bold text-red-500 dark:text-red-400">
                  4
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Absent
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Upcoming Events */}
        <Card className="shadow-md border border-purple-200 dark:border-purple-800 hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-800 dark:text-gray-100 flex items-center gap-2">
              <svg
                className="w-5 h-5 text-violet-600 dark:text-violet-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
              Upcoming Events
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3 text-sm">
              <li className="flex items-center gap-2 p-2 rounded-lg bg-purple-50 dark:bg-purple-900/30 text-gray-700 dark:text-gray-300">
                <span className="text-purple-600 dark:text-purple-400">📅</span>
                <span>Parent Meeting — Oct 8</span>
              </li>
              <li className="flex items-center gap-2 p-2 rounded-lg bg-violet-50 dark:bg-violet-900/30 text-gray-700 dark:text-gray-300">
                <span className="text-violet-600 dark:text-violet-400">🧾</span>
                <span>Monthly Report Submission — Oct 12</span>
              </li>
              <li className="flex items-center gap-2 p-2 rounded-lg bg-purple-50 dark:bg-purple-900/30 text-gray-700 dark:text-gray-300">
                <span className="text-purple-600 dark:text-purple-400">🎓</span>
                <span>Internal Exam — Oct 20</span>
              </li>
            </ul>
          </CardContent>
        </Card>

        {/* Assigned Classes */}
        <Card className="shadow-md border border-purple-200 dark:border-purple-800 hover:shadow-lg transition-shadow md:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-800 dark:text-gray-100 flex items-center gap-2">
              <svg
                className="w-5 h-5 text-purple-600 dark:text-purple-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                />
              </svg>
              Assigned Classes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm border-collapse">
                <thead>
                  <tr className="bg-gradient-to-r from-purple-100 to-violet-100 dark:from-purple-900/50 dark:to-violet-900/50 text-gray-800 dark:text-gray-100">
                    <th className="p-3 text-left">Subject</th>
                    <th className="p-3 text-left">Class</th>
                    <th className="p-3 text-left">Time</th>
                    <th className="p-3 text-left">Students</th>
                    <th className="p-3 text-left">Room</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-purple-100 dark:divide-purple-800">
                  <tr className="hover:bg-purple-50 dark:hover:bg-purple-900/30 transition">
                    <td className="p-3 flex items-center gap-2 text-purple-700 dark:text-purple-300">
                      <BookOpen size={16} /> Mathematics
                    </td>
                    <td className="p-3">Grade 10 - A</td>
                    <td className="p-3 flex items-center gap-2">
                      <Clock size={14} /> 9:00–9:45 AM
                    </td>
                    <td className="p-3 flex items-center gap-2">
                      <Users size={14} /> 32
                    </td>
                    <td className="p-3">Room 203</td>
                  </tr>
                  <tr className="hover:bg-purple-50 dark:hover:bg-purple-900/30 transition">
                    <td className="p-3 flex items-center gap-2 text-violet-700 dark:text-violet-300">
                      <BookOpen size={16} /> Science
                    </td>
                    <td className="p-3">Grade 9 - B</td>
                    <td className="p-3 flex items-center gap-2">
                      <Clock size={14} /> 10:00–10:45 AM
                    </td>
                    <td className="p-3 flex items-center gap-2">
                      <Users size={14} /> 28
                    </td>
                    <td className="p-3">Lab 1</td>
                  </tr>
                  <tr className="hover:bg-purple-50 dark:hover:bg-purple-900/30 transition">
                    <td className="p-3 flex items-center gap-2 text-purple-700 dark:text-purple-300">
                      <BookOpen size={16} /> Computer
                    </td>
                    <td className="p-3">Grade 10 - B</td>
                    <td className="p-3 flex items-center gap-2">
                      <Clock size={14} /> 11:00–11:45 AM
                    </td>
                    <td className="p-3 flex items-center gap-2">
                      <Users size={14} /> 30
                    </td>
                    <td className="p-3">Lab 2</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Announcements */}
      <Card className="shadow-md border border-purple-200 dark:border-purple-800 hover:shadow-lg transition-shadow">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-gray-800 dark:text-gray-100 flex items-center gap-2">
            <svg
              className="w-5 h-5 text-purple-600 dark:text-purple-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z"
              />
            </svg>
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
  );
}
