"use client"
import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { supabase } from '@/lib/supabaseClient'
import { Moon, Sun } from "lucide-react"

export default function Page() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const onSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    
    const { data, error: err } = await supabase.auth.signInWithPassword({ email, password })
    setLoading(false)
    
    if (err) {
      setError(err.message)
      return
    }
  
    const user = data.user
    if (!user) return
  
    const adminEmails = ['admin@admin.com', 'admin@gmail.com']
    if (adminEmails.includes(user.email)) {
      router.replace('/admin')
    } else {
      router.replace('/dashboard')
    }
  }

  return (
    <div className="min-h-dvh flex items-center justify-center p-4 relative bg-gradient-to-br from-purple-50 via-violet-50 to-purple-100 dark:from-gray-900 dark:via-purple-950 dark:to-gray-900 font-sans">
      
      {/* Decorative background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-20 w-64 h-64 bg-purple-200/30 dark:bg-purple-900/20 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 right-20 w-64 h-64 bg-violet-200/30 dark:bg-violet-900/20 rounded-full blur-3xl"></div>
      </div>
      
      {/* 🔹 Dark Mode Toggle (top-right) */}
      <div className="absolute top-4 right-4 z-10">
        <Button
          variant="ghost"
          className="p-2 rounded-full"
          onClick={() => document.documentElement.classList.toggle("dark")}
        >
          <Moon className="hidden dark:block w-5 h-5" />
          <Sun className="block dark:hidden w-5 h-5" />
        </Button>
      </div>

      {/* 🔹 Login Form */}
      <form 
        onSubmit={onSubmit} 
        className="w-full max-w-sm bg-white dark:bg-gray-800 rounded-2xl p-8 space-y-5 shadow-xl border border-purple-200 dark:border-purple-800 relative z-10"
      >
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-purple-500 to-violet-600 rounded-2xl mb-2 shadow-lg">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-violet-600 dark:from-purple-400 dark:to-violet-400 tracking-tight">
            Welcome Back! 👋
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400">Sign in to your account to continue</p>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300" htmlFor="email">
            Email Address
          </label>
          <input
            id="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full border border-purple-200 dark:border-purple-700 rounded-lg px-3 h-10 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 focus:outline-none bg-white dark:bg-gray-900/50 text-gray-800 dark:text-gray-100 transition"
            placeholder="you@example.com"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300" htmlFor="password">
            Password
          </label>
          <input
            id="password"
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full border border-purple-200 dark:border-purple-700 rounded-lg px-3 h-10 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 focus:outline-none bg-white dark:bg-gray-900/50 text-gray-800 dark:text-gray-100 transition"
            placeholder="••••••••"
          />
        </div>

        {error && (
          <p className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/40 border border-red-200 dark:border-red-700 rounded-md p-2 text-center" role="alert">
            ⚠️ {error}
          </p>
        )}

        <Button 
          type="submit" 
          disabled={loading} 
          className="w-full bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-700 hover:to-violet-700 text-white font-medium rounded-lg shadow-md transition-all duration-200 hover:shadow-lg"
        >
          {loading ? 'Logging in…' : 'Sign In 🚀'}
        </Button>
      </form>
    </div>
  )
}
