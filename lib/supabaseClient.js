import { createClient } from '@supabase/supabase-js'

// Paste your Supabase keys in .env.local as:
// NEXT_PUBLIC_SUPABASE_URL=... 
// NEXT_PUBLIC_SUPABASE_ANON_KEY=...

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  // Keep runtime-friendly error for dev; avoids crashing in prod builds
  // eslint-disable-next-line no-console
  console.warn('Supabase env vars missing. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY')
}

let browserClient

export const supabaseBrowser = () => {
  if (!browserClient) {
    browserClient = createClient(supabaseUrl || '', supabaseAnonKey || '', {
      auth: {
        persistSession: true,
        storageKey: 'attendance-auth',
      },
    })
  }
  return browserClient
}


