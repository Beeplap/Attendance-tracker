import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      return NextResponse.redirect(
        new URL('/login?error=auth_failed', requestUrl.origin)
      );
    }
  }

  // Fetch user profile to determine redirect
  const { data: { user } } = await supabase.auth.getUser();
  
  if (user) {
    const { data: profileData } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();
    
    if (profileData) {
      switch (profileData.role) {
        case 'admin':
          return NextResponse.redirect(new URL('/admin', requestUrl.origin));
        case 'teacher':
          return NextResponse.redirect(new URL('/teacher', requestUrl.origin));
        case 'student':
          return NextResponse.redirect(new URL('/students', requestUrl.origin));
        default:
          return NextResponse.redirect(new URL('/students', requestUrl.origin));
      }
    }
  }
  
  // Default redirect to students page
  return NextResponse.redirect(new URL('/students', requestUrl.origin));
}

