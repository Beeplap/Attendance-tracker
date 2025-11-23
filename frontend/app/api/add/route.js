import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(req) {
  try {
    const { email, password, full_name, role } = await req.json();

    if (!email || !password || !full_name || !role) {
      return NextResponse.json(
        { error: "All fields are required" },
        { status: 400 }
      );
    }
    // temp debug

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

    // Create a new user in Supabase Auth
    const { data: userData, error: userError } =
      await adminClient.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
      });

    if (userError) throw userError;
    const user = userData?.user;
    if (!user) throw new Error("User creation failed");

    // Add the new user's profile record to users table
    const { error: profileError } = await adminClient.from("users").insert({
      id: user.id,
      full_name,
      email,
      role,
      is_active: role === "teacher" ? true : undefined, // Set active by default for teachers
    });

    if (profileError) {
      // If role constraint error, provide helpful message
      if (profileError.message?.includes("users_role_check")) {
        throw new Error(
          "Invalid role. Allowed roles: admin, teacher, staff, student. Please update the database constraint to include 'student'."
        );
      }
      throw profileError;
    }

    // If creating a student, also create a record in students table
    if (role === "student") {
      // Generate sequential roll number (STU-001, STU-002, etc.)
      const generateRollNumber = async () => {
        try {
          // Get all existing students to find the highest roll number
          const { data: existingStudents, error: fetchError } =
            await adminClient.from("students").select("roll");

          if (fetchError) {
            console.error("Error fetching existing students:", fetchError);
            // If error, start from STU-001
            return "STU-001";
          }

          if (!existingStudents || existingStudents.length === 0) {
            // No students exist, start with STU-001
            return "STU-001";
          }

          // Find the highest roll number by extracting numbers from all roll numbers
          let maxNumber = 0;
          for (const student of existingStudents) {
            const roll = student?.roll || "";
            // Try to match STU-XXX format
            const match = roll.match(/STU-(\d+)/i);
            if (match) {
              const num = parseInt(match[1], 10);
              if (num > maxNumber) {
                maxNumber = num;
              }
            }
          }

          // Increment and format with leading zeros
          const nextNumber = maxNumber + 1;
          return `STU-${String(nextNumber).padStart(3, "0")}`;
        } catch (error) {
          console.error("Error generating roll number:", error);
          // Default to STU-001 on any error
          return "STU-001";
        }
      };

      const rollNumber = await generateRollNumber();

      const { error: studentError } = await adminClient
        .from("students")
        .insert({
          id: user.id,
          full_name,
          roll: rollNumber,
        });

      if (studentError) {
        console.error("Error creating student record:", studentError);
        // Don't fail the whole operation, just log it
      }
    }

    // If creating a teacher, also create a record in teachers table
    if (role === "teacher") {
      // Generate sequential teacher ID (TCH-001, TCH-002, etc.)
      const generateTeacherId = async () => {
        try {
          // Get all existing teachers to find the highest teacher_id
          const { data: existingTeachers, error: fetchError } =
            await adminClient.from("teachers").select("teacher_id");

          if (fetchError) {
            console.error("Error fetching existing teachers:", fetchError);
            // If error, start from TCH-001
            return "TCH-001";
          }

          if (!existingTeachers || existingTeachers.length === 0) {
            // No teachers exist, start with TCH-001
            return "TCH-001";
          }

          // Find the highest teacher_id by extracting numbers from all teacher_ids
          let maxNumber = 0;
          for (const teacher of existingTeachers) {
            const teacherId = teacher?.teacher_id || "";
            // Try to match TCH-XXX format
            const match = teacherId.match(/TCH-(\d+)/i);
            if (match) {
              const num = parseInt(match[1], 10);
              if (num > maxNumber) {
                maxNumber = num;
              }
            }
          }

          // Increment and format with leading zeros
          const nextNumber = maxNumber + 1;
          return `TCH-${String(nextNumber).padStart(3, "0")}`;
        } catch (error) {
          console.error("Error generating teacher ID:", error);
          // Default to TCH-001 on any error
          return "TCH-001";
        }
      };

      const teacherId = await generateTeacherId();

      const { error: teacherError } = await adminClient
        .from("teachers")
        .insert({
          id: user.id,
          full_name,
          email: email,
          teacher_id: teacherId,
        });

      if (teacherError) {
        console.error("Error creating teacher record:", teacherError);
        // Don't fail the whole operation, just log it
      }
    }

    return NextResponse.json(
      { message: "User created successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error creating user:", error);
    return NextResponse.json(
      { error: error.message || "Unexpected error" },
      { status: 500 }
    );
  }
}
