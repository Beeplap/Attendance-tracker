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
    <div className="min-h-dvh flex items-center justify-center p-4">
      <form onSubmit={onSubmit} className="w-full max-w-sm border rounded-xl p-6 space-y-4">
        <h1 className="text-2xl font-semibold text-center">Login</h1>
        <div className="space-y-2">
          <label className="text-sm" htmlFor="email">Email</label>
          <input
            id="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full border rounded-md px-3 h-10 bg-white/80 dark:bg-black/20"
            placeholder="you@example.com"
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm" htmlFor="password">Password</label>
          <input
            id="password"
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full border rounded-md px-3 h-10 bg-white/80 dark:bg-black/20"
            placeholder="••••••••"
          />
        </div>
        {error && (
          <p className="text-sm text-red-600" role="alert">{error}</p>
        )}
        <Button type="submit" disabled={loading} className="w-full">
          {loading ? 'Signing in…' : 'Sign in'}
        </Button>
        <p className="text-xs text-center opacity-70">
          Only <code>admin@admin.com</code> and <code>admin@gmail.com</code> can access the Admin Panel
        </p>
      </form>
    </div>
  )
}
