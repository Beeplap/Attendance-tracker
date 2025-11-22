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

  // Redirect to dashboard - the layout will handle role-based routing
  return NextResponse.redirect(new URL('/dashboard', requestUrl.origin));
}

