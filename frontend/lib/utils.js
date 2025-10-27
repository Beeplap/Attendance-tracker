import { clsx } from "clsx";
import { twMerge } from "tailwind-merge"

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

// Resolves the user's role by id first, then falls back to email.
// If only the email row exists, syncs its role onto the id row.
export async function resolveUserRole(supabase, user) {
  if (!user?.id) return 'student'
  
  try {
    // First, try to find by user ID
    const { data: byId, error: errorById } = await supabase
      .from('profiles')
      .select('role, email')
      .eq('id', user.id)
      .maybeSingle()

    if (byId?.role) return byId.role

    // Fallback: try by email
    if (user.email) {
      const { data: byEmail, error: errorByEmail } = await supabase
        .from('profiles')
        .select('role')
        .eq('email', user.email)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      const fallbackRole = byEmail?.role
      if (fallbackRole) {
        // Try to sync onto id row if it doesn't exist
        await supabase
          .from('profiles')
          .update({ role: fallbackRole, email: user.email })
          .eq('id', user.id)
        return fallbackRole
      }
    }
  } catch (error) {
    console.error('Error resolving user role:', error)
  }
  
  return 'student'
}