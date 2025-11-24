import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(req) {
  try {
    const { 
      email, 
      password, 
      full_name, 
      role,
      // Student-specific fields
      batch_year,
      gender,
      course,
      semester,
      subjects,
      phone_number
    } = await req.json();

    if (!email || !password || !full_name || !role) {
      return NextResponse.json(
        { error: "All fields are required" },
        { status: 400 }
      );
    }

    // Validate student-specific fields
    if (role === "student") {
      if (!batch_year || !gender || !course || !semester || !phone_number) {
        return NextResponse.json(
          { error: "All student fields are required (batch year, gender, course, semester, phone number)" },
          { status: 400 }
        );
      }
      if (!subjects || !Array.isArray(subjects) || subjects.length === 0) {
        return NextResponse.json(
          { error: "At least one subject is required" },
          { status: 400 }
        );
      }
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
      // Generate student ID in format: COURSEBATCHYEAR + sequential number
      // Example: BCA20800001, BCA20800002
      const generateStudentId = async () => {
        try {
          const courseCode = course.toUpperCase().trim();
          const batchYearStr = String(batch_year).trim();
          
          // Create prefix: COURSE + BATCHYEAR (e.g., BCA2080)
          const prefix = `${courseCode}${batchYearStr}`;
          
          // Get all existing students with the same course and batch year
          const { data: existingStudents, error: fetchError } =
            await adminClient
              .from("students")
              .select("roll, course, batch_year")
              .eq("course", courseCode)
              .eq("batch_year", batchYearStr);

          if (fetchError) {
            console.error("Error fetching existing students:", fetchError);
            // If error, start from 00001
            return `${prefix}00001`;
          }

          if (!existingStudents || existingStudents.length === 0) {
            // No students exist with this course and batch, start with 00001
            return `${prefix}00001`;
          }

          // Find the highest student ID number for this course and batch
          let maxNumber = 0;
          for (const student of existingStudents) {
            const roll = student?.roll || "";
            // Try to match the format: COURSEBATCHYEAR + number
            // Extract the number part (last 5 digits)
            const match = roll.match(new RegExp(`^${prefix}(\\d{5})$`));
            if (match) {
              const num = parseInt(match[1], 10);
              if (num > maxNumber) {
                maxNumber = num;
              }
            }
          }

          // Increment and format with leading zeros (5 digits)
          const nextNumber = maxNumber + 1;
          return `${prefix}${String(nextNumber).padStart(5, "0")}`;
        } catch (error) {
          console.error("Error generating student ID:", error);
          // Default format on any error
          const courseCode = course.toUpperCase().trim();
          const batchYearStr = String(batch_year).trim();
          return `${courseCode}${batchYearStr}00001`;
        }
      };

      const studentId = await generateStudentId();

      // Store subjects as JSON array or comma-separated string
      const subjectsData = Array.isArray(subjects) 
        ? subjects.filter(s => s && s.trim() !== "")
        : [];

      const { error: studentError } = await adminClient
        .from("students")
        .insert({
          id: user.id,
          full_name,
          roll: studentId, // Using roll field to store student ID
          email: email,
          phone_number: phone_number,
          gender: gender,
          course: course.toUpperCase().trim(),
          batch_year: String(batch_year).trim(),
          semester: semester,
          subjects: subjectsData, // Store as array or JSON
          class: course.toUpperCase().trim(), // For backward compatibility
        });

      if (studentError) {
        console.error("Error creating student record:", studentError);
        // If it's a column error, try without the problematic columns
        if (studentError.message?.includes("column") || studentError.message?.includes("does not exist")) {
          // Try with minimal fields
          const { error: minimalError } = await adminClient
            .from("students")
            .insert({
              id: user.id,
              full_name,
              roll: studentId,
            });
          
          if (minimalError) {
            console.error("Error creating student record (minimal):", minimalError);
            throw new Error(`Failed to create student record: ${minimalError.message}`);
          }
        } else {
          throw new Error(`Failed to create student record: ${studentError.message}`);
        }
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
