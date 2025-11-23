import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function DELETE(req) {
  try {
    const { id, role } = await req.json();

    if (!id) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    // ✅ Use Supabase Admin API (service role key required)
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
      const missing = [
        !supabaseUrl ? "NEXT_PUBLIC_SUPABASE_URL" : null,
        !serviceRoleKey ? "SUPABASE_SERVICE_ROLE_KEY" : null,
      ].filter(Boolean);
      return NextResponse.json(
        { error: `Server missing env: ${missing.join(", ")}` },
        { status: 500 }
      );
    }

    const adminClient = require("@supabase/supabase-js").createClient(
      supabaseUrl,
      serviceRoleKey
    );

    const errors = [];

    // Delete from users table
    const { error: usersError } = await adminClient
      .from("users")
      .delete()
      .eq("id", id);

    if (usersError) {
      errors.push(`Users table: ${usersError.message}`);
    }

    // Delete from students table if role is student
    if (role === "student") {
      const { error: studentsError } = await adminClient
        .from("students")
        .delete()
        .eq("id", id);

      if (studentsError) {
        errors.push(`Students table: ${studentsError.message}`);
      }
    }

    // Delete from teachers table if role is teacher
    if (role === "teacher") {
      const { error: teachersError } = await adminClient
        .from("teachers")
        .delete()
        .eq("id", id);

      if (teachersError) {
        errors.push(`Teachers table: ${teachersError.message}`);
      }
    }

    // Delete from Supabase Auth
    const { error: authError } = await adminClient.auth.admin.deleteUser(id);
    if (authError) {
      errors.push(`Auth: ${authError.message}`);
    }

    if (errors.length > 0) {
      return NextResponse.json(
        {
          error: "Some deletions failed",
          details: errors,
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { message: "User deleted successfully from all tables" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting user:", error);
    return NextResponse.json(
      { error: error.message || "Unexpected error" },
      { status: 500 }
    );
  }
}
