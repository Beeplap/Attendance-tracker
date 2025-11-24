import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export async function DELETE(req, { params }) {
  try {
    const notificationId = params?.id;

    if (!notificationId) {
      return NextResponse.json(
        { error: "Notification ID is required" },
        { status: 400 }
      );
    }

    if (!supabaseUrl || !supabaseAnonKey || !serviceRoleKey) {
      return NextResponse.json(
        { error: "Supabase configuration missing" },
        { status: 500 }
      );
    }

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
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    });

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

    const { data: userData } = await supabase
      .from("users")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();

    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    const { data: notification, error: fetchError } = await adminClient
      .from("notifications")
      .select("id, sender_id, recipient_user_id")
      .eq("id", notificationId)
      .maybeSingle();

    if (fetchError || !notification) {
      return NextResponse.json(
        { error: "Notification not found" },
        { status: 404 }
      );
    }

    const isAdmin = userData?.role === "admin";
    const isSender = notification.sender_id === user.id;
    const isDirectRecipient =
      notification.recipient_user_id &&
      notification.recipient_user_id === user.id;

    if (!isAdmin && !isSender && !isDirectRecipient) {
      return NextResponse.json(
        { error: "You do not have permission to delete this notification" },
        { status: 403 }
      );
    }

    const { error: deleteError } = await adminClient
      .from("notifications")
      .delete()
      .eq("id", notificationId);

    if (deleteError) {
      throw deleteError;
    }

    return NextResponse.json(
      { message: "Notification deleted" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting notification:", error);
    return NextResponse.json(
      { error: error.message || "Unexpected error" },
      { status: 500 }
    );
  }
}

