"use client"
import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabaseBrowser } from '@/lib/supabaseClient'
import { Button } from '@/components/ui/button'

export default function AdminPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [email, setEmail] = useState('')

  const adminEmails = (process.env.NEXT_PUBLIC_ADMIN_EMAILS || '')
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean)

  useEffect(() => {
    const supabase = supabaseBrowser()
    supabase.auth.getUser().then(({ data }) => {
      const userEmail = data?.user?.email?.toLowerCase()
      if (!userEmail) {
        router.replace('/')
        return
      }
      if (!adminEmails.includes(userEmail)) {
        router.replace('/dashboard')
        return
      }
      setEmail(userEmail)
      setLoading(false)
    })
  }, [])

  const signOut = async () => {
    const supabase = supabaseBrowser()
    await supabase.auth.signOut()
    router.replace('/')
  }

  if (loading) return <div className="p-6">Loading…</div>

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Admin Panel</h1>
        <Button onClick={signOut}>Sign out</Button>
      </div>
      <p className="opacity-70">Signed in as {email}</p>
      {/* Your admin content goes here */}
      <div className="rounded-xl border p-4">Welcome, admin!</div>
    </div>
  )
}


