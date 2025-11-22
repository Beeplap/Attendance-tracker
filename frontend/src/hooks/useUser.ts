'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import type { User } from '@supabase/supabase-js';

export interface UserProfile {
  id: string;
  email: string;
  role: 'admin' | 'teacher' | 'staff';
  full_name: string | null;
}

export interface UseUserReturn {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  error: Error | null;
}

/**
 * Custom hook to get current user and their profile/role
 */
export function useUser(): UseUserReturn {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let mounted = true;

    // Get initial session
    supabase.auth.getSession().then(({ data: { session }, error: sessionError }) => {
      if (!mounted) return;

      if (sessionError) {
        setError(sessionError);
        setLoading(false);
        return;
      }

      setUser(session?.user ?? null);

      // Fetch user profile if user exists
      if (session?.user) {
        fetchUserProfile(session.user.id).then((profileData) => {
          if (mounted) {
            setProfile(profileData);
            setLoading(false);
          }
        });
      } else {
        setLoading(false);
      }
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;

      setUser(session?.user ?? null);

      if (session?.user) {
        const profileData = await fetchUserProfile(session.user.id);
        if (mounted) {
          setProfile(profileData);
        }
      } else {
        setProfile(null);
      }

      setLoading(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  return { user, profile, loading, error };
}

/**
 * Fetch user profile from users table
 */
async function fetchUserProfile(userId: string): Promise<UserProfile | null> {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('id, email, role, full_name')
      .eq('id', userId)
      .single();

    if (error) {
      // If user doesn't exist in users table, try to create one from auth user
      const { data: authUser } = await supabase.auth.getUser();
      if (authUser?.user) {
        // Try to create user record with default role
        const { data: newUser, error: createError } = await supabase
          .from('users')
          .insert({
            id: authUser.user.id,
            email: authUser.user.email!,
            role: 'staff', // Default role
            full_name: authUser.user.user_metadata?.full_name || null,
          })
          .select()
          .single();

        if (!createError && newUser) {
          return {
            id: newUser.id,
            email: newUser.email,
            role: newUser.role,
            full_name: newUser.full_name,
          };
        }
      }
      console.error('Error fetching user profile:', error);
      return null;
    }

    return {
      id: data.id,
      email: data.email,
      role: data.role,
      full_name: data.full_name,
    };
  } catch (err) {
    console.error('Error in fetchUserProfile:', err);
    return null;
  }
}

