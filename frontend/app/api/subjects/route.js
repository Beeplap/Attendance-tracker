import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

// Create Supabase SSR client
function createClient() {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        get: (name) => cookies().get(name)?.value ?? null,
        set: (name, value, options) => cookies().set(name, value, options),
        remove: (name, options) => cookies().delete(name, options),
      },
    }
  );
}

// 🟢 POST: Create a subject/course
export async function POST(request) {
  const supabase = createClient();
  try {
    const { subject_name, course_code, semester, description, credits } =
      await request.json();

    // Validate inputs
    if (!subject_name || !course_code) {
      return NextResponse.json(
        { error: "Subject name and course code are required." },
        { status: 400 }
      );
    }

    // Check user authentication and admin role
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data: profile } = await supabase
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profile?.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Insert into courses table (matching user's database schema)
    const { data: courseData, error } = await supabase
      .from("courses")
      .insert([
        {
          course_code,
          course_title: subject_name, // Map subject_name to course_title
          credit_hours: credits || 3, // Map credits to credit_hours
          description: description || null,
          theory_hours: 0,
          practical_hours: 0,
          course_type: "Core", // Default to Core, can be updated later
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

    // Map back to subject format for frontend
    const subjectData = {
      id: courseData.id,
      course_code: courseData.course_code,
      subject_name: courseData.course_title,
      credits: courseData.credit_hours,
      description: courseData.description,
      semester: semester || null,
      course_type: courseData.course_type,
      theory_hours: courseData.theory_hours,
      practical_hours: courseData.practical_hours,
      created_at: courseData.created_at,
    };

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
  const supabase = createClient();
  try {
    const { searchParams } = new URL(request.url);
    const semester = searchParams.get("semester");

    // Query from courses table (matching user's database schema)
    let query = supabase
      .from("courses")
      .select("*")
      .order("course_code", { ascending: true });

    const { data: courses, error } = await query;
    if (error) throw error;

    // Map courses table structure to subjects format expected by frontend
    const subjects = (courses || []).map((course) => ({
      id: course.id,
      course_code: course.course_code,
      subject_name: course.course_title, // Map course_title to subject_name
      credits: course.credit_hours, // Map credit_hours to credits
      description: course.description,
      semester: course.semester || null, // Handle if semester field exists, otherwise null
      course_type: course.course_type,
      theory_hours: course.theory_hours,
      practical_hours: course.practical_hours,
      created_at: course.created_at,
    }));

    // Filter by semester if provided (only if semester field exists in courses)
    let filteredSubjects = subjects;
    if (semester) {
      filteredSubjects = subjects.filter(
        (s) => s.semester === parseInt(semester)
      );
    }

    return NextResponse.json({ subjects: filteredSubjects });
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
  const supabase = createClient();
  try {
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

    if (!user)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data: profile } = await supabase
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profile?.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Delete from courses table
    const { error } = await supabase.from("courses").delete().eq("id", id);

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
