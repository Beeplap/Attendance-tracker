import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

function getSupabaseClient(token) {
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Supabase configuration missing");
  }

  return createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    },
  });
}

// 🟢 POST: Create a subject/course
export async function POST(request) {
  try {
    const authHeader = request.headers.get("authorization");
    const token = authHeader?.replace("Bearer ", "");

    if (!token) {
      return NextResponse.json(
        { error: "Missing auth token. Please sign in again." },
        { status: 401 }
      );
    }

    const supabase = getSupabaseClient(token);

    const { subject_name, course_code, semester, description, credits } =
      await request.json();

    // Validate inputs
    if (!subject_name || !course_code || !semester) {
      return NextResponse.json(
        { error: "Subject name, course code, and semester are required." },
        { status: 400 }
      );
    }

    // Validate semester range
    if (semester < 1 || semester > 8) {
      return NextResponse.json(
        { error: "Semester must be between 1 and 8." },
        { status: 400 }
      );
    }

    // Check user authentication and admin role
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data: profile } = await supabase
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profile?.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Insert subject
    const { data: subjectData, error } = await supabase
      .from("subjects")
      .insert([
        {
          subject_name,
          course_code,
          semester,
          description: description || null,
          credits: credits || 3,
        },
      ])
      .select()
      .single();

    if (error) {
      // Handle unique constraint violation
      if (error.code === "23505") {
        return NextResponse.json(
          { error: "Course code already exists. Please use a different code." },
          { status: 400 }
        );
      }
      throw error;
    }

    return NextResponse.json({
      message: "Subject added successfully",
      subject: subjectData,
    });
  } catch (error) {
    console.error("API Error [POST /subjects]:", error);
    return NextResponse.json(
      { error: error.message || "Failed to add subject" },
      { status: 400 }
    );
  }
}

// 🔵 GET: Fetch subjects
export async function GET(request) {
  try {
    const supabase = getSupabaseClient(null);
    const { searchParams } = new URL(request.url);
    const semester = searchParams.get("semester");

    let query = supabase
      .from("subjects")
      .select("*")
      .order("semester", { ascending: true })
      .order("subject_name", { ascending: true });

    if (semester) {
      query = query.eq("semester", parseInt(semester));
    }

    const { data: subjects, error } = await query;
    if (error) throw error;

    return NextResponse.json({ subjects: subjects || [] });
  } catch (error) {
    console.error("API Error [GET /subjects]:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch subjects" },
      { status: 400 }
    );
  }
}

// 🔴 DELETE: Remove a subject
export async function DELETE(request) {
  try {
    const authHeader = request.headers.get("authorization");
    const token = authHeader?.replace("Bearer ", "");

    if (!token) {
      return NextResponse.json(
        { error: "Missing auth token. Please sign in again." },
        { status: 401 }
      );
    }

    const supabase = getSupabaseClient(token);

    const { id } = await request.json();

    if (!id) {
      return NextResponse.json(
        { error: "Subject ID is required" },
        { status: 400 }
      );
    }

    // Check user authentication and admin role
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data: profile } = await supabase
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profile?.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { error } = await supabase.from("subjects").delete().eq("id", id);

    if (error) throw error;

    return NextResponse.json({ message: "Subject deleted successfully" });
  } catch (error) {
    console.error("API Error [DELETE /subjects]:", error);
    return NextResponse.json(
      { error: error.message || "Failed to delete subject" },
      { status: 400 }
    );
  }
}

