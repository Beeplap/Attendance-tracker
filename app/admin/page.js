"use client"
import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabaseBrowser } from '@/lib/supabaseClient'
import { ensureProfileExists } from '@/lib/utils'
import { Button } from '@/components/ui/button'

export default function AdminPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [email, setEmail] = useState('')

  useEffect(() => {
    const supabase = supabaseBrowser()
    supabase.auth.getUser().then(async ({ data }) => {
      const user = data?.user
      if (!user) {
        router.replace('/')
        return
      }
      await ensureProfileExists(supabase, user)
      const { data: profile } = await supabase
        .from('profiles')
        .select('role, email')
        .eq('id', user.id)
        .single()
      const role = profile?.role || 'user'
      if (role !== 'admin') return router.replace('/dashboard')
      setEmail(profile?.email || user.email || '')
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


