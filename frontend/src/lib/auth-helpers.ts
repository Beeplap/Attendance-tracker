import { createClient } from '@supabase/supabase-js';
import { NextRequest } from 'next/server';
import type { Database } from './supabaseClient';

/**
 * Create a server-side Supabase client with the user's session
 */
export function createServerClient(request: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  // Get access token from cookies or headers
  const cookies = request.cookies;
  const accessToken = cookies.get('sb-access-token')?.value;
  const refreshToken = cookies.get('sb-refresh-token')?.value;

  // Try to get from Authorization header as fallback
  const authHeader = request.headers.get('authorization');
  const token = authHeader?.replace('Bearer ', '') || accessToken;

  const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
    global: {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    },
  });

  return supabase;
}

/**
 * Get authenticated user from request
 */
export async function getAuthenticatedUser(request: NextRequest) {
  try {
    // Get token from Authorization header
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');

    if (!token) {
      return null;
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    });

    // Verify token and get user
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error || !user) {
      return null;
    }

    return user;
  } catch (error) {
    console.error('Error getting authenticated user:', error);
    return null;
  }
}

/**
 * Get user profile with role from database
 */
export async function getUserProfile(userId: string) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);

  const { data, error } = await supabase
    .from('users')
    .select('id, email, role, full_name')
    .eq('id', userId)
    .single();

  if (error || !data) {
    return null;
  }

  return {
    id: data.id,
    email: data.email,
    role: data.role,
    full_name: data.full_name,
  };
}

/**
 * Check if user has required role
 */
export function hasRequiredRole(
  userRole: string | null,
  requiredRole: 'admin' | 'teacher' | 'staff'
): boolean {
  if (!userRole) return false;

  const roleHierarchy: Record<string, number> = {
    staff: 1,
    teacher: 2,
    admin: 3,
  };

  const userRoleLevel = roleHierarchy[userRole] || 0;
  const requiredRoleLevel = roleHierarchy[requiredRole] || 0;

  return userRoleLevel >= requiredRoleLevel;
}

/**
 * Middleware to protect API routes
 */
export async function requireAuth(
  request: NextRequest,
  requiredRole?: 'admin' | 'teacher' | 'staff'
) {
  const user = await getAuthenticatedUser(request);

  if (!user) {
    return {
      error: 'Unauthorized',
      status: 401,
    };
  }

  if (requiredRole) {
    const profile = await getUserProfile(user.id);
    if (!profile || !hasRequiredRole(profile.role, requiredRole)) {
      return {
        error: 'Forbidden - Insufficient permissions',
        status: 403,
      };
    }

    return {
      user,
      profile,
    };
  }

  const profile = await getUserProfile(user.id);
  return {
    user,
    profile,
  };
}

