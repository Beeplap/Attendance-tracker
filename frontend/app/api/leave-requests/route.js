import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

function getSupabaseClientWithToken(token) {
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Supabase configuration missing");
  }

  return createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    },
  });
}

async function sendNotification({
  title,
  message,
  senderId,
  recipientRole = "teacher",
  recipientUserId = null,
}) {
  if (!supabaseUrl || !serviceRoleKey) {
    console.warn("Missing Supabase env vars for notifications");
    return;
  }

  try {
    const adminClient = createClient(supabaseUrl, serviceRoleKey);
    await adminClient.from("notifications").insert({
      title,
      message,
      sender_id: senderId,
      recipient_role: recipientRole,
      recipient_user_id: recipientUserId,
    });
  } catch (error) {
    console.error("Error sending notification:", error);
  }
}
// GET: Fetch leave requests
export async function GET(req) {
  try {
    // Get auth token from Authorization header
    const authHeader = req.headers.get("authorization");
    const token = authHeader?.replace("Bearer ", "");

    const supabase = getSupabaseClientWithToken(token);

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

    // Get user role
    const { data: userData } = await supabase
      .from("users")
      .select("role, full_name")
      .eq("id", user.id)
      .single();

    if (!userData) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    let query = supabase
      .from("leave_requests")
      .select(`
        *,
        teacher:users!leave_requests_teacher_id_fkey(id, full_name, email)
      `)
      .order("created_at", { ascending: false });

    // If teacher, only show their own requests
    if (userData.role === "teacher") {
      query = query.eq("teacher_id", user.id);
    }
    // Admin can see all requests

    const { data, error } = await query;

    if (error) {
      if (error.message?.includes("relation") || error.message?.includes("does not exist")) {
        return NextResponse.json(
          {
            error: "Leave requests table not found. Please run the migration SQL first.",
            needsMigration: true,
          },
          { status: 500 }
        );
      }
      throw error;
    }

    return NextResponse.json({ leaveRequests: data || [] }, { status: 200 });
  } catch (error) {
    console.error("Error fetching leave requests:", error);
    return NextResponse.json(
      { error: error.message || "Unexpected error" },
      { status: 500 }
    );
  }
}

// POST: Create leave request
export async function POST(req) {
  try {
    const { start_date, end_date, reason } = await req.json();

    if (!start_date || !end_date || !reason) {
      return NextResponse.json(
        { error: "Start date, end date, and reason are required" },
        { status: 400 }
      );
    }

    // Get auth token from Authorization header
    const authHeader = req.headers.get("authorization");
    const token = authHeader?.replace("Bearer ", "");

    const supabase = getSupabaseClientWithToken(token);

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

    // Verify user is a teacher
    const { data: userData } = await supabase
      .from("users")
      .select("role, full_name")
      .eq("id", user.id)
      .single();

    if (!userData || userData.role !== "teacher") {
      return NextResponse.json(
        { error: "Only teachers can create leave requests" },
        { status: 403 }
      );
    }

    // Validate dates
    const start = new Date(start_date);
    const end = new Date(end_date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (start < today) {
      return NextResponse.json(
        { error: "Start date cannot be in the past" },
        { status: 400 }
      );
    }

    if (end < start) {
      return NextResponse.json(
        { error: "End date must be after start date" },
        { status: 400 }
      );
    }

    // Create leave request
    const { data, error } = await supabase
      .from("leave_requests")
      .insert({
        teacher_id: user.id,
        start_date,
        end_date,
        reason,
        status: "pending",
      })
      .select()
      .single();

    if (error) {
      if (error.message?.includes("relation") || error.message?.includes("does not exist")) {
        return NextResponse.json(
          {
            error: "Leave requests table not found. Please run the migration SQL first.",
            needsMigration: true,
          },
          { status: 500 }
        );
      }
      throw error;
    }

    await sendNotification({
      title: "New Leave Request",
      message: `${userData.full_name || user.email} requested leave from ${start_date} to ${end_date}.`,
      senderId: user.id,
      recipientRole: "admin",
    });

    return NextResponse.json(
      { message: "Leave request created successfully", leaveRequest: data },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error creating leave request:", error);
    return NextResponse.json(
      { error: error.message || "Unexpected error" },
      { status: 500 }
    );
  }
}

// PATCH: Update leave request (admin approval/rejection)
export async function PATCH(req) {
  try {
    const { id, status, admin_notes } = await req.json();

    if (!id || !status) {
      return NextResponse.json(
        { error: "Request ID and status are required" },
        { status: 400 }
      );
    }

    if (!["approved", "rejected"].includes(status)) {
      return NextResponse.json(
        { error: "Status must be 'approved' or 'rejected'" },
        { status: 400 }
      );
    }

    // Get auth token from Authorization header
    const authHeader = req.headers.get("authorization");
    const token = authHeader?.replace("Bearer ", "");

    const supabase = getSupabaseClientWithToken(token);

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

    // Verify user is admin
    const { data: userData } = await supabase
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single();

    if (!userData || userData.role !== "admin") {
      return NextResponse.json(
        { error: "Only admins can update leave requests" },
        { status: 403 }
      );
    }

    // Update leave request
    const { data, error } = await supabase
      .from("leave_requests")
      .update({
        status,
        admin_id: user.id,
        admin_notes,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    // Notify teacher about the status change
    await sendNotification({
      title: status === "approved" ? "Leave Request Approved" : "Leave Request Rejected",
      message: `Your leave request (${new Date(data.start_date).toLocaleDateString()} - ${new Date(
        data.end_date
      ).toLocaleDateString()}) has been ${status}${
        admin_notes ? `. Notes: ${admin_notes}` : ""
      }.`,
      senderId: user.id,
      recipientRole: "teacher",
      recipientUserId: data.teacher_id,
    });

    return NextResponse.json(
      { message: "Leave request updated successfully", leaveRequest: data },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error updating leave request:", error);
    return NextResponse.json(
      { error: error.message || "Unexpected error" },
      { status: 500 }
    );
  }
}

