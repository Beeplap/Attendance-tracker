import { NextResponse } from "next/server";

export const runtime = "nodejs";

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export async function POST(req) {
  try {
    const {
      email,
      password,
      full_name,
      role,
      // Student-specific fields (optional)
      gender,
      class: studentClass,
      section,
      phone_number,
      guardian_name,
      guardian_phone,
      guardian_contact,
      address,
      date_of_birth,
      admission_date,
    } = await req.json();

    if (!email || !password || !full_name || !role) {
      return NextResponse.json(
        { error: "All fields are required" },
        { status: 400 }
      );
    }

    // Validate student-specific fields
    if (role === "student") {
      if (!gender || !studentClass || !phone_number) {
        return NextResponse.json(
          {
            error:
              "Please provide gender, class, and phone number for student accounts.",
          },
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
      const classCode =
        (studentClass || "STD").toUpperCase().replace(/[^A-Z0-9]/g, "") ||
        "STD";
      const yearSuffix = new Date().getFullYear().toString().slice(-2);
      const rollPrefix = `${classCode}${yearSuffix}`;
      const normalizeDate = (value) =>
        value && String(value).trim() !== "" ? value : null;

      // Generate student ID with prefix + sequential number
      const generateStudentId = async () => {
        try {
          const { data: existingStudents, error: fetchError } =
            await adminClient
              .from("students")
              .select("roll")
              .like("roll", `${rollPrefix}%`)
              .order("roll", { ascending: false })
              .limit(1);

          if (fetchError) {
            console.error("Error fetching existing students:", fetchError);
            return `${rollPrefix}00001`;
          }

          if (!existingStudents || existingStudents.length === 0) {
            return `${rollPrefix}00001`;
          }

          const latestRoll = existingStudents[0]?.roll || "";
          const numericPart = latestRoll.replace(rollPrefix, "");
          const lastNumber = parseInt(numericPart, 10);
          const nextNumber = Number.isFinite(lastNumber) ? lastNumber + 1 : 1;

          return `${rollPrefix}${String(nextNumber).padStart(5, "0")}`;
        } catch (error) {
          console.error("Error generating student ID:", error);
          return `${rollPrefix}00001`;
        }
      };

      const guardianContactValue =
        guardian_contact || guardian_phone || phone_number || null;

      const baseStudentPayload = {
        id: user.id,
        full_name,
        class: studentClass,
        section,
        gender,
        phone_number,
        guardian_name,
        guardian_phone,
        guardian_contact: guardianContactValue,
        emergency_contact: guardianContactValue,
        address,
        date_of_birth: normalizeDate(date_of_birth),
        dob: normalizeDate(date_of_birth),
        admission_date: normalizeDate(admission_date),
      };

      const MAX_STUDENT_INSERT_ATTEMPTS = 5;
      let studentInserted = false;

      for (let attempt = 0; attempt < MAX_STUDENT_INSERT_ATTEMPTS; attempt++) {
        const studentId = await generateStudentId();

        const insertPayload = {
          ...baseStudentPayload,
          roll: studentId,
        };

        const { error: studentError } = await adminClient
          .from("students")
          .insert(insertPayload);

        if (!studentError) {
          studentInserted = true;
          break;
        }

        console.error("Error creating student record:", studentError);

        if (
          studentError.message?.includes("column") ||
          studentError.message?.includes("does not exist")
        ) {
          const { error: minimalError } = await adminClient
            .from("students")
            .insert({
              id: user.id,
              full_name,
              roll: studentId,
            });

          if (!minimalError) {
            studentInserted = true;
            break;
          }

          if (minimalError.message?.includes("students_roll_key")) {
            await sleep(100);
            continue;
          }

          console.error(
            "Error creating student record (minimal):",
            minimalError
          );
          throw new Error(
            `Failed to create student record: ${minimalError.message}`
          );
        }

        if (studentError.message?.includes("students_roll_key")) {
          await sleep(100);
          continue;
        }

        throw new Error(
          `Failed to create student record: ${studentError.message}`
        );
      }

      if (!studentInserted) {
        throw new Error(
          "Failed to create student record due to repeated roll number conflicts. Please try again."
        );
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
