"use client"
import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { supabase } from '@/lib/supabaseClient'

export default function SignupPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  const onSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setMessage('')
    setLoading(true)
    let signUpError = null
    let data = null
    try {
      const result = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: typeof window !== 'undefined' ? window.location.origin : undefined,
          data: { full_name: fullName || null },
        },
      })
      data = result.data
      signUpError = result.error
    } catch (err) {
      console.error('Supabase signUp threw:', err)
      setError('Unexpected error during sign up. Please try again.')
      setLoading(false)
      return
    }
    setLoading(false)
    if (signUpError) {
      console.error('Supabase signUp error:', signUpError)
      setError(signUpError.message || 'Sign up failed')
      return
    }
    // Insert profile only if a session exists (RLS requires auth.uid()) and
    // only with columns that exist in your schema

    setMessage(
      hasSession
        ? 'Signup successful. You are signed in.'
        : 'Signup successful. Check your email to confirm your account.'
    )
  }

  return (
    <div className="min-h-dvh flex items-center justify-center p-4">
      <form onSubmit={onSubmit} className="w-full max-w-sm border rounded-xl p-6 space-y-4">
        <h1 className="text-2xl font-semibold text-center">Create Account</h1>
        <div className="space-y-2">
          <label className="text-sm" htmlFor="fullName">Full name (optional)</label>
          <input
            id="fullName"
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="w-full border rounded-md px-3 h-10 bg-white/80 dark:bg-black/20"
            placeholder="Jane Doe"
          />
        </div>
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
            minLength={6}
          />
        </div>
        {error && (
          <p className="text-sm text-red-600" role="alert">{error}</p>
        )}
        {message && (
          <p className="text-sm text-green-600" role="status">{message}</p>
        )}
        <Button type="submit" disabled={loading} className="w-full">
          {loading ? 'Creating account…' : 'Sign up'}
        </Button>
        <p className="text-xs text-center opacity-70">After signup, confirm your email, then log in.</p>
      </form>
    </div>
  )
}


