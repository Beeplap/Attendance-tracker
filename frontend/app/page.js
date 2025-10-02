"use client"
import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { supabase } from '@/lib/supabaseClient'

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
    <div className="min-h-dvh flex items-center justify-center p-4 bg-gradient-to-br from-gray-100 via-gray-200 to-gray-300 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <form 
        onSubmit={onSubmit} 
        className="w-full max-w-sm bg-white dark:bg-gray-800 rounded-xl p-6 space-y-5 shadow-lg border border-gray-200 dark:border-gray-700"
      >
        <h1 className="text-2xl font-semibold text-center text-gray-800 dark:text-gray-100">
          Login
        </h1>

        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300" htmlFor="email">
            Email
          </label>
          <input
            id="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 h-10 focus:ring-2 focus:ring-gray-500 focus:outline-none bg-white dark:bg-gray-900/50 text-gray-800 dark:text-gray-100"
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
            className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 h-10 focus:ring-2 focus:ring-gray-500 focus:outline-none bg-white dark:bg-gray-900/50 text-gray-800 dark:text-gray-100"
            placeholder="••••••••"
          />
        </div>

        {error && (
          <p className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/40 border border-red-200 dark:border-red-700 rounded-md p-2 text-center" role="alert">
            {error}
          </p>
        )}

        <Button 
          type="submit" 
          disabled={loading} 
          className="w-full bg-gray-700 hover:bg-gray-800 text-white font-medium rounded-lg"
        >
          {loading ? 'Signing in…' : 'Sign in'}
        </Button>

        <p className="text-xs text-center opacity-70 text-gray-600 dark:text-gray-400">
          Only <code className="bg-gray-200 dark:bg-gray-700 px-1 rounded">admin@admin.com</code> 
          &nbsp;and&nbsp; 
          <code className="bg-gray-200 dark:bg-gray-700 px-1 rounded">admin@gmail.com</code> 
          can access the Admin Panel
        </p>
      </form>
    </div>
  )
}
