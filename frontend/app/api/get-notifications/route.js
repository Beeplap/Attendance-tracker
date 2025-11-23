import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const userRole = searchParams.get("role");

    if (!userRole) {
      return NextResponse.json(
        { error: "User role is required" },
        { status: 400 }
      );
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      return NextResponse.json(
        { error: "Supabase configuration missing" },
        { status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    // Fetch notifications for the user's role
    const { data: notifications, error } = await supabase
      .from("notifications")
      .select("*")
      .or(`recipient_role.eq.${userRole},recipient_role.eq.all`)
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) {
      // Check if table doesn't exist
      if (error.message?.includes("relation") || error.message?.includes("does not exist")) {
        return NextResponse.json(
          {
            error: "Notifications table not found. Please run the migration SQL first.",
            needsMigration: true,
          },
          { status: 500 }
        );
      }
      return NextResponse.json(
        { error: error.message || "Failed to fetch notifications" },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { notifications: notifications || [] },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching notifications:", error);
    return NextResponse.json(
      { error: error.message || "Unexpected error" },
      { status: 500 }
    );
  }
}

