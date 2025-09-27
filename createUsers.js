import { createClient } from '@supabase/supabase-js'

// Supabase service role key (server-side only!)
const supabase = createClient(
  'https://romxghzegwvlxwdygaos.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJvbXhnaHplZ3d2bHh3ZHlnYW9zIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODk4MjE1NSwiZXhwIjoyMDc0NTU4MTU1fQ.VgO9YhD66xzOC_m5x4Z3Q6fibOVF9W4Fg-ARHevZvUs'
)

async function createUsers() {
  const users = [
    { email: 'admin@example.com', password: 'Admin123', full_name: 'Admin User', role: 'admin' },
    { email: 'teacher@example.com', password: 'Teacher123', full_name: 'Teacher User', role: 'teacher' },
  ]

  for (const u of users) {
    // 1️⃣ Create user in Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: u.email,
      password: u.password,
      email_confirm: true,
    })

    if (authError) {
      console.error('Error creating user:', authError)
      continue
    }

    const userId = authData.user.id

    // 2️⃣ Insert into profiles table
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .insert([{ id: userId, email: u.email, full_name: u.full_name, role: u.role }])

    if (profileError) console.error('Error inserting profile:', profileError)
    else console.log('Created user + profile:', u.email)
  }
}

createUsers()
