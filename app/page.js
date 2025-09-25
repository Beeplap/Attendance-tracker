"use client"
import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { supabase } from '@/lib/supabaseClient'


// Configuration

export default function AdminPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState(null)
  const [profiles, setProfiles] = useState([])
  const [listLoading, setListLoading] = useState(false)
  const [toggleLoading, setToggleLoading] = useState(null)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)

  // Clear messages after a delay
  useEffect(() => {
    if (error || success) {
      const timer = setTimeout(() => {
        setError(null)
        setSuccess(null)
      }, 5000)
      return () => clearTimeout(timer)
    }
  }, [error, success])

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      
      if (authError) {
        console.error('Auth error:', authError)
        router.replace('/')
        return
      }

      if (!user) {
        router.replace('/')
        return
      }

      const isAdmin = user.email && ADMIN_EMAILS.includes(user.email.toLowerCase())
      
      if (!isAdmin) {
        router.replace('/dashboard')
        return
      }

      setUser(user)
      setLoading(false)
      await fetchProfiles()
    } catch (err) {
      console.error('Auth check failed:', err)
      setError('Authentication check failed')
      router.replace('/')
    }
  }

  const signOut = async () => {
    try {
      setLoading(true)
      const { error } = await supabase.auth.signOut()
      if (error) throw error
      router.replace('/')
    } catch (err) {
      console.error('Sign out error:', err)
      setError('Failed to sign out')
      setLoading(false)
    }
  }

  const fetchProfiles = async () => {
    try {
      setListLoading(true)
      setError(null)
      
      const { data, error } = await supabase
        .from('profiles')
        .select('id, email, role, created_at')
        .order('created_at', { ascending: false })

      if (error) throw error

      setProfiles(data || [])
      setSuccess('Users list refreshed successfully')
    } catch (err) {
      console.error('Failed to fetch profiles:', err)
      setError('Failed to load users')
    } finally {
      setListLoading(false)
    }
  }

  const toggleRole = async (id, currentRole) => {
    const nextRole = currentRole === 'admin' ? 'user' : 'admin'
    
    try {
      setToggleLoading(id)
      setError(null)

      // Optimistic update
      setProfiles((prev) => 
        prev.map((p) => (p.id === id ? { ...p, role: nextRole } : p))
      )

      const { error } = await supabase
        .from('profiles')
        .update({ role: nextRole })
        .eq('id', id)

      if (error) throw error

      setSuccess(`User role updated to ${nextRole}`)
    } catch (err) {
      console.error('Failed to update role:', err)
      // Revert optimistic update
      setProfiles((prev) => 
        prev.map((p) => (p.id === id ? { ...p, role: currentRole } : p))
      )
      setError('Failed to update user role')
    } finally {
      setToggleLoading(null)
    }
  }

  const formatDate = (dateString ) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p>Loading admin panel...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Admin Panel</h1>
          <p className="text-gray-600 mt-1">Manage user roles and permissions</p>
        </div>
        <Button onClick={signOut} variant="outline">
          Sign out
        </Button>
      </div>

      {/* Current User Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-800">
          <span className="font-medium">Signed in as:</span> {user?.email}
        </p>
      </div>

      {/* Messages */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800 text-sm">{error}</p>
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <p className="text-green-800 text-sm">{success}</p>
        </div>
      )}

      {/* Users Management */}
      <div className="bg-white rounded-xl border shadow-sm">
        <div className="p-6 border-b">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold">User Management</h2>
              <p className="text-gray-600 text-sm mt-1">
                {profiles.length} user{profiles.length !== 1 ? 's' : ''} total
              </p>
            </div>
            <Button 
              variant="outline" 
              onClick={fetchProfiles} 
              disabled={listLoading}
              className="w-full sm:w-auto"
            >
              {listLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600 mr-2"></div>
                  Refreshing...
                </>
              ) : (
                'Refresh'
              )}
            </Button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left py-3 px-6 font-medium text-gray-700">Email</th>
                <th className="text-left py-3 px-6 font-medium text-gray-700">Role</th>
                <th className="text-left py-3 px-6 font-medium text-gray-700">Joined</th>
                <th className="text-left py-3 px-6 font-medium text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {profiles.length === 0 ? (
                <tr>
                  <td className="py-8 px-6 text-center text-gray-500" colSpan={4}>
                    {listLoading ? 'Loading users...' : 'No users found'}
                  </td>
                </tr>
              ) : (
                profiles.map((profile) => (
                  <tr key={profile.id} className="hover:bg-gray-50">
                    <td className="py-4 px-6">
                      <div className="font-medium text-gray-900">
                        {profile.email || 'No email'}
                      </div>
                      <div className="text-xs text-gray-500 font-mono">
                        ID: {profile.id.slice(0, 8)}...
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        profile.role === 'admin' 
                          ? 'bg-red-100 text-red-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {profile.role || 'user'}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-sm text-gray-600">
                      {formatDate(profile.created_at)}
                    </td>
                    <td className="py-4 px-6">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => toggleRole(profile.id, profile.role || 'user')}
                        disabled={toggleLoading === profile.id}
                        className="w-24"
                      >
                        {toggleLoading === profile.id ? (
                          <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-gray-600"></div>
                        ) : (
                          profile.role === 'admin' ? 'Make User' : 'Make Admin'
                        )}
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-lg border">
          <div className="text-2xl font-bold text-blue-600">
            {profiles.length}
          </div>
          <div className="text-sm text-gray-600">Total Users</div>
        </div>
        <div className="bg-white p-4 rounded-lg border">
          <div className="text-2xl font-bold text-red-600">
            {profiles.filter(p => p.role === 'admin').length}
          </div>
          <div className="text-sm text-gray-600">Admins</div>
        </div>
        <div className="bg-white p-4 rounded-lg border">
          <div className="text-2xl font-bold text-green-600">
            {profiles.filter(p => p.role !== 'admin').length}
          </div>
          <div className="text-sm text-gray-600">Regular Users</div>
        </div>
      </div>
    </div>
  )
}