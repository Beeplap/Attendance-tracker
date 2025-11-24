import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

// GET: Fetch class switches
export async function GET(req) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      return NextResponse.json(
        { error: "Supabase configuration missing" },
        { status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey);

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
      .select("role")
      .eq("id", user.id)
      .single();

    if (!userData) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    let query = supabase
      .from("class_switches")
      .select(`
        *,
        requester_teacher:users!class_switches_requester_teacher_id_fkey(id, full_name, email),
        target_teacher:users!class_switches_target_teacher_id_fkey(id, full_name, email),
        requester_class:classes!class_switches_requester_class_id_fkey(id, course, semester, subject),
        target_class:classes!class_switches_target_class_id_fkey(id, course, semester, subject)
      `)
      .order("created_at", { ascending: false });

    // If teacher, only show switches they're involved in
    if (userData.role === "teacher") {
      query = query.or(`requester_teacher_id.eq.${user.id},target_teacher_id.eq.${user.id}`);
    }
    // Admin can see all switches

    const { data, error } = await query;

    if (error) {
      if (error.message?.includes("relation") || error.message?.includes("does not exist")) {
        return NextResponse.json(
          {
            error: "Class switches table not found. Please run the migration SQL first.",
            needsMigration: true,
          },
          { status: 500 }
        );
      }
      throw error;
    }

    return NextResponse.json({ classSwitches: data || [] }, { status: 200 });
  } catch (error) {
    console.error("Error fetching class switches:", error);
    return NextResponse.json(
      { error: error.message || "Unexpected error" },
      { status: 500 }
    );
  }
}

// POST: Create class switch request
export async function POST(req) {
  try {
    const { requester_class_id, target_teacher_id, target_class_id, switch_date, reason } = await req.json();

    if (!requester_class_id || !target_teacher_id || !target_class_id || !switch_date) {
      return NextResponse.json(
        { error: "All fields are required" },
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
      .select("role")
      .eq("id", user.id)
      .single();

    if (!userData || userData.role !== "teacher") {
      return NextResponse.json(
        { error: "Only teachers can create switch requests" },
        { status: 403 }
      );
    }

    // Verify requester owns the class
    const { data: requesterClass } = await supabase
      .from("classes")
      .select("teacher_id")
      .eq("id", requester_class_id)
      .single();

    if (!requesterClass || requesterClass.teacher_id !== user.id) {
      return NextResponse.json(
        { error: "You can only switch classes assigned to you" },
        { status: 403 }
      );
    }

    // Verify target teacher owns the target class
    const { data: targetClass } = await supabase
      .from("classes")
      .select("teacher_id")
      .eq("id", target_class_id)
      .single();

    if (!targetClass || targetClass.teacher_id !== target_teacher_id) {
      return NextResponse.json(
        { error: "Target class must belong to target teacher" },
        { status: 400 }
      );
    }

    // Validate switch date
    const switchDate = new Date(switch_date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (switchDate < today) {
      return NextResponse.json(
        { error: "Switch date cannot be in the past" },
        { status: 400 }
      );
    }

    // Check if switch already exists
    const { data: existingSwitch } = await supabase
      .from("class_switches")
      .select("id")
      .eq("requester_class_id", requester_class_id)
      .eq("target_class_id", target_class_id)
      .eq("switch_date", switch_date)
      .in("status", ["pending", "accepted"])
      .maybeSingle();

    if (existingSwitch) {
      return NextResponse.json(
        { error: "A switch request already exists for these classes on this date" },
        { status: 400 }
      );
    }

    // Create switch request
    const { data, error } = await supabase
      .from("class_switches")
      .insert({
        requester_teacher_id: user.id,
        requester_class_id,
        target_teacher_id,
        target_class_id,
        switch_date,
        reason: reason || null,
        status: "pending",
        target_teacher_accepted: false,
        admin_notified: false,
      })
      .select()
      .single();

    if (error) {
      if (error.message?.includes("relation") || error.message?.includes("does not exist")) {
        return NextResponse.json(
          {
            error: "Class switches table not found. Please run the migration SQL first.",
            needsMigration: true,
          },
          { status: 500 }
        );
      }
      throw error;
    }

    return NextResponse.json(
      { message: "Switch request created successfully", classSwitch: data },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error creating class switch:", error);
    return NextResponse.json(
      { error: error.message || "Unexpected error" },
      { status: 500 }
    );
  }
}

// PATCH: Update class switch (accept/reject)
export async function PATCH(req) {
  try {
    const { id, action } = await req.json(); // action: 'accept' or 'reject'

    if (!id || !action) {
      return NextResponse.json(
        { error: "Switch ID and action are required" },
        { status: 400 }
      );
    }

    if (!["accept", "reject"].includes(action)) {
      return NextResponse.json(
        { error: "Action must be 'accept' or 'reject'" },
        { status: 400 }
      );
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
      return NextResponse.json(
        { error: "Server configuration missing" },
        { status: 500 }
      );
    }

    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    // Get current user
    const supabaseAnon = createClient(
      supabaseUrl,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );

    const {
      data: { user },
      error: userError,
    } = await supabaseAnon.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        { error: "User not authenticated" },
        { status: 401 }
      );
    }

    // Get the switch request
    const { data: switchRequest, error: fetchError } = await adminClient
      .from("class_switches")
      .select("*")
      .eq("id", id)
      .single();

    if (fetchError || !switchRequest) {
      return NextResponse.json(
        { error: "Switch request not found" },
        { status: 404 }
      );
    }

    // Verify user is the target teacher
    if (switchRequest.target_teacher_id !== user.id) {
      return NextResponse.json(
        { error: "Only the target teacher can accept or reject this switch" },
        { status: 403 }
      );
    }

    if (action === "accept") {
      // Update switch to accepted
      const { data: updatedSwitch, error: updateError } = await adminClient
        .from("class_switches")
        .update({
          status: "accepted",
          target_teacher_accepted: true,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id)
        .select()
        .single();

      if (updateError) {
        throw updateError;
      }

      // Swap the classes temporarily for the switch date
      // This is a simplified approach - you might want to create a separate table for temporary assignments
      // For now, we'll just mark it as completed and notify admin

      // Notify admin (create notification)
      const { data: adminUsers } = await adminClient
        .from("users")
        .select("id")
        .eq("role", "admin")
        .limit(1);

      if (adminUsers && adminUsers.length > 0) {
        const adminId = adminUsers[0].id;
        
        // Get teacher names
        const { data: requesterTeacher } = await adminClient
          .from("users")
          .select("full_name")
          .eq("id", switchRequest.requester_teacher_id)
          .single();

        const { data: targetTeacher } = await adminClient
          .from("users")
          .select("full_name")
          .eq("id", switchRequest.target_teacher_id)
          .single();

        // Create notification for admin
        await adminClient.from("notifications").insert({
          title: "Class Switch Completed",
          message: `${requesterTeacher?.full_name || "Teacher"} and ${targetTeacher?.full_name || "Teacher"} have switched their classes on ${updatedSwitch.switch_date}.`,
          sender_id: adminId,
          recipient_role: "admin",
        }).catch(err => console.error("Error creating notification:", err));
      }

      // Mark as completed and notify admin
      await adminClient
        .from("class_switches")
        .update({
          status: "completed",
          admin_notified: true,
        })
        .eq("id", id);

      return NextResponse.json(
        { message: "Switch accepted successfully. Admin has been notified.", classSwitch: updatedSwitch },
        { status: 200 }
      );
    } else {
      // Reject switch
      const { data: updatedSwitch, error: updateError } = await adminClient
        .from("class_switches")
        .update({
          status: "rejected",
          updated_at: new Date().toISOString(),
        })
        .eq("id", id)
        .select()
        .single();

      if (updateError) {
        throw updateError;
      }

      return NextResponse.json(
        { message: "Switch rejected", classSwitch: updatedSwitch },
        { status: 200 }
      );
    }
  } catch (error) {
    console.error("Error updating class switch:", error);
    return NextResponse.json(
      { error: error.message || "Unexpected error" },
      { status: 500 }
    );
  }
}

