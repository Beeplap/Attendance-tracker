import { createClient } from '@supabase/supabase-js'

// In the App Router, define method exports like POST/GET, not a default handler
export async function POST(request) {
  try {
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY
    )

    const { email, password } = await request.json()

    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    })

    if (error) {
      return Response.json({ error: error.message }, { status: 400 })
    }

    return Response.json({ data }, { status: 200 })
  } catch (err) {
    return Response.json({ error: 'Invalid request body' }, { status: 400 })
  }
}
