import { NextResponse } from "next/server"

export const runtime = "nodejs"

export async function POST(req) {
  try {
    const { email, password, full_name, role } = await req.json()

    if (!email || !password || !full_name || !role) {
      return NextResponse.json(
        { error: "All fields are required" },
        { status: 400 }
      )
    }
    // temp debug


  // ✅ Use Supabase Admin API (service role key required)
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceRoleKey) {
    const missing = [
      !supabaseUrl ? "NEXT_PUBLIC_SUPABASE_URL" : null,
      !serviceRoleKey ? "SUPABASE_SERVICE_ROLE_KEY" : null,
    ].filter(Boolean)
    return NextResponse.json(
      { error: `Server missing env: ${missing.join(", ")}` },
      { status: 500 }
    )
  }

  const adminClient = require("@supabase/supabase-js").createClient(
    supabaseUrl,
    serviceRoleKey
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

    // Add the new user's profile record to users table
    const { error: profileError } = await adminClient
      .from("users")
      .insert({
        id: user.id,
        full_name,
        email,
        role,
      })

    if (profileError) {
      // If role constraint error, provide helpful message
      if (profileError.message?.includes("users_role_check")) {
        throw new Error("Invalid role. Allowed roles: admin, teacher, staff, student. Please update the database constraint to include 'student'.")
      }
      throw profileError
    }

    // If creating a student, also create a record in students table
    if (role === "student") {
      const { error: studentError } = await adminClient
        .from("students")
        .insert({
          id: user.id,
          full_name,
          roll: `STU-${Date.now()}`, // Generate a temporary roll number
        })

      if (studentError) {
        console.error("Error creating student record:", studentError)
        // Don't fail the whole operation, just log it
      }
    }

    // If creating a teacher, also create a record in teachers table
    if (role === "teacher") {
      const { error: teacherError } = await adminClient
        .from("teachers")
        .insert({
          id: user.id,
          full_name,
          email: email,
        })

      if (teacherError) {
        console.error("Error creating teacher record:", teacherError)
        // Don't fail the whole operation, just log it
      }
    }

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
