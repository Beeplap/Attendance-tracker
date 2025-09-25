import { clsx } from "clsx";
import { twMerge } from "tailwind-merge"

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

// Ensures a profiles row exists for the given user id.
// Inserts a default role of 'user' on first insert and leaves existing rows untouched.
export async function ensureProfileExists(supabase, user) {
  try {
    if (!user?.id) return
    await supabase
      .from('profiles')
      .insert({ id: user.id, email: user.email || null, role: 'user' })
      .onConflict('id')
      .ignore()
  } catch (_) {
    // best-effort; ignore errors to avoid blocking auth flow
  }
}