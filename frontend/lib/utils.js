import { clsx } from "clsx";
import { twMerge } from "tailwind-merge"

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

// Ensures a profiles row exists for the given user id.
// Inserts a default role of 'student' on first insert and leaves existing rows untouched.
export async function ensureProfileExists(supabase, user) {
  try {
    if (!user?.id) return
    await supabase
      .from('profiles')
      .insert({ id: user.id, email: user.email || null, role: 'student' })
      .onConflict('id')
      .ignore()
  } catch (_) {
    // best-effort; ignore errors to avoid blocking auth flow
  }
}

// Resolves the user's role by id first, then falls back to email.
// If only the email row exists, syncs its role onto the id row.
export async function resolveUserRole(supabase, user) {
  if (!user?.id) return 'student'
  const { data: byId } = await supabase
    .from('profiles')
    .select('role, email')
    .eq('id', user.id)
    .single()

  const roleById = byId?.role
  if (roleById) return roleById

  // Fallback: try by email
  if (user.email) {
    const { data: byEmail } = await supabase
      .from('profiles')
      .select('role')
      .eq('email', user.email)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle?.() ?? await supabase
        .from('profiles')
        .select('role')
        .eq('email', user.email)
        .limit(1)
        .single()

    const fallbackRole = byEmail?.role
    if (fallbackRole) {
      // Try to sync onto id row
      await supabase.from('profiles').update({ role: fallbackRole, email: user.email }).eq('id', user.id)
      return fallbackRole
    }
  }
  return 'student'
}