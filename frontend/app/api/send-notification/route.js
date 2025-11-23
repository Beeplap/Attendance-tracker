import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(req) {
  try {
    // Parse request body once
    const requestBody = await req.json();
    const { title, message, recipient_role = "teacher", sender_id } = requestBody;

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

    // Get the sender (admin) from the request body
    const senderId = sender_id;

    if (!senderId) {
      return NextResponse.json(
        { error: "Sender ID is required. Please ensure you are authenticated as an admin." },
        { status: 401 }
      );
    }

    // Verify sender is admin
    const { data: userData, error: userError } = await adminClient
      .from("users")
      .select("role")
      .eq("id", senderId)
      .single();

    if (userError || !userData) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    if (userData.role !== "admin") {
      return NextResponse.json(
        { error: "Only admins can send notifications" },
        { status: 403 }
      );
    }

    // Insert notification
    const { data: notification, error: insertError } = await adminClient
      .from("notifications")
      .insert({
        title,
        message,
        sender_id: senderId,
        recipient_role,
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

