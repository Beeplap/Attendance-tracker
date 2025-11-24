import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

export async function POST(req) {
  try {
    const { title, message, recipient_role = "teacher", recipient_user_id = null } =
      await req.json();

    if (!title || !message) {
      return NextResponse.json(
        { error: "Title and message are required" },
        { status: 400 }
      );
    }

    // Validate recipient_role
    if (!["teacher", "student", "all"].includes(recipient_role)) {
      return NextResponse.json(
        { error: "Invalid recipient_role. Must be 'teacher', 'student', or 'all'" },
        { status: 400 }
      );
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseAnonKey || !serviceRoleKey) {
      const missing = [
        !supabaseUrl ? "NEXT_PUBLIC_SUPABASE_URL" : null,
        !supabaseAnonKey ? "NEXT_PUBLIC_SUPABASE_ANON_KEY" : null,
        !serviceRoleKey ? "SUPABASE_SERVICE_ROLE_KEY" : null,
      ].filter(Boolean);
      return NextResponse.json(
        { error: `Server missing env: ${missing.join(", ")}` },
        { status: 500 }
      );
    }

    // Get auth token from Authorization header
    const authHeader = req.headers.get("authorization");
    const token = authHeader?.replace("Bearer ", "");

    if (!token) {
      return NextResponse.json(
        { error: "Missing auth token. Please sign in again." },
        { status: 401 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: { Authorization: `Bearer ${token}` },
      },
    });

    // Get current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        { error: "User not authenticated" },
        { status: 401 }
      );
    }

    // Verify sender is admin
    const { data: userData, error: userFetchError } = await supabase
      .from("users")
      .select("role, full_name")
      .eq("id", user.id)
      .single();

    if (userFetchError || !userData) {
      return NextResponse.json(
        { error: "Unable to verify user" },
        { status: 403 }
      );
    }

    if (userData.role !== "admin") {
      return NextResponse.json(
        { error: "Only admins can send notifications" },
        { status: 403 }
      );
    }

    const adminClient = require("@supabase/supabase-js").createClient(
      supabaseUrl,
      serviceRoleKey
    );

    // Insert notification
    const { data: notification, error: insertError } = await adminClient
      .from("notifications")
      .insert({
        title,
        message,
        sender_id: user.id,
        recipient_role,
        recipient_user_id,
      })
      .select()
      .single();

    if (insertError) {
      // Check if table doesn't exist
      if (insertError.message?.includes("relation") || insertError.message?.includes("does not exist")) {
        return NextResponse.json(
          {
            error: "Notifications table not found. Please run the migration SQL first.",
            needsMigration: true,
            sql: "See frontend/migrations/create_notifications_table.sql"
          },
          { status: 500 }
        );
      }
      return NextResponse.json(
        { error: insertError.message || "Failed to create notification" },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        message: "Notification sent successfully",
        notification,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error sending notification:", error);
    return NextResponse.json(
      { error: error.message || "Unexpected error" },
      { status: 500 }
    );
  }
}

