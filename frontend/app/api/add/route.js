import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabaseClient"

export async function POST(req) {
  try {
    const { email, password, full_name, role } = await req.json()

    if (!email || !password || !full_name || !role) {
      return NextResponse.json(
        { error: "All fields are required" },
        { status: 400 }
      )
    }

    // ✅ Use Supabase Admin API (service role key required)
    const adminClient = require("@supabase/supabase-js").createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    )

    // Create a new user in Supabase Auth
    const { data: userData, error: userError } = await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    })

    if (userError) throw userError
    const user = userData?.user
    if (!user) throw new Error("User creation failed")

    // Add the new user's profile record
    const { error: profileError } = await adminClient
      .from("profiles")
      .insert({
        id: user.id,
        full_name,
        email,
        role,
      })

    if (profileError) throw profileError

    return NextResponse.json(
      { message: "User created successfully" },
      { status: 200 }
    )
  } catch (error) {
    console.error("Error creating user:", error)
    return NextResponse.json(
      { error: error.message || "Unexpected error" },
      { status: 500 }
    )
  }
}
