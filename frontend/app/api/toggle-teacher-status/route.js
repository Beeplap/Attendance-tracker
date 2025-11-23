import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function PATCH(req) {
  try {
    const { id, is_active } = await req.json();

    if (!id || typeof is_active !== "boolean") {
      return NextResponse.json(
        { error: "User ID and is_active status are required" },
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

    // First, verify the user is a teacher
    const { data: userData, error: userError } = await adminClient
      .from("users")
      .select("role")
      .eq("id", id)
      .single();

    if (userError || !userData) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    if (userData.role !== "teacher") {
      return NextResponse.json(
        { error: "Only teacher accounts can be activated/deactivated" },
        { status: 400 }
      );
    }

    // Update the is_active status in users table
    const { error: updateError } = await adminClient
      .from("users")
      .update({ is_active })
      .eq("id", id);

    if (updateError) {
      // Check if the error is about missing column
      const isColumnError = 
        updateError.message?.includes("column") || 
        updateError.message?.includes("is_active") || 
        updateError.message?.includes("schema cache") ||
        updateError.code === "42703"; // PostgreSQL error code for undefined column

      if (isColumnError) {
        return NextResponse.json(
          { 
            error: "The 'is_active' column is missing from the 'users' table. Please add it first.",
            needsMigration: true,
            sql: "ALTER TABLE users ADD COLUMN is_active BOOLEAN DEFAULT true;",
            instructions: "Go to your Supabase Dashboard > SQL Editor and run the SQL command provided."
          },
          { status: 500 }
        );
      }
      return NextResponse.json(
        { error: updateError.message || "Failed to update teacher status" },
        { status: 500 }
      );
    }

    // Also update Supabase Auth user metadata if needed
    // Optionally ban/unban the user in auth
    if (!is_active) {
      // Ban the user (they can't sign in)
      const { error: banError } = await adminClient.auth.admin.updateUserById(
        id,
        { ban_duration: "876000h" } // ~100 years (effectively permanent until reactivated)
      );
      if (banError) {
        console.error("Error banning user in auth:", banError);
        // Don't fail the request, just log it
      }
    } else {
      // Unban the user
      const { error: unbanError } = await adminClient.auth.admin.updateUserById(
        id,
        { ban_duration: "0" } // Remove ban
      );
      if (unbanError) {
        console.error("Error unbanning user in auth:", unbanError);
        // Don't fail the request, just log it
      }
    }

    return NextResponse.json(
      { 
        message: `Teacher account ${is_active ? "activated" : "deactivated"} successfully`,
        is_active 
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error toggling teacher status:", error);
    return NextResponse.json(
      { error: error.message || "Unexpected error" },
      { status: 500 }
    );
  }
}

