import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getStudents, createStudent } from '@/lib/supabaseClient';
import type { Database } from '@/lib/supabaseClient';

// Zod schema for creating a student
const createStudentSchema = z.object({
  roll: z.string().min(1, 'Roll number is required').max(32),
  full_name: z.string().min(1, 'Full name is required'),
  dob: z.string().date().optional().nullable(),
  gender: z.string().optional().nullable(),
  class: z.string().max(64).optional().nullable(),
  section: z.string().max(8).optional().nullable(),
  guardian_name: z.string().optional().nullable(),
  guardian_contact: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  profile_url: z.string().url().optional().nullable(),
  admission_date: z.string().date().optional().nullable(),
});

// GET /api/students - List students with optional filters
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const classFilter = searchParams.get('class') || undefined;
    const sectionFilter = searchParams.get('section') || undefined;
    const searchQuery = searchParams.get('search') || undefined;

    // Get students with filters
    let students = await getStudents({
      class: classFilter,
      section: sectionFilter,
    });

    // Apply search filter if provided (searches in full_name, roll, guardian_name)
    if (searchQuery) {
      const searchLower = searchQuery.toLowerCase();
      students = students.filter(
        (student) =>
          student.full_name.toLowerCase().includes(searchLower) ||
          student.roll.toLowerCase().includes(searchLower) ||
          (student.guardian_name?.toLowerCase().includes(searchLower) ?? false)
      );
    }

    return NextResponse.json(
      {
        ok: true,
        data: students,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error fetching students:', error);
    return NextResponse.json(
      {
        ok: false,
        error: 'Failed to fetch students',
      },
      { status: 500 }
    );
  }
}

// POST /api/students - Create a new student
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate input with Zod
    const validationResult = createStudentSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          ok: false,
          error: 'Validation failed',
          details: validationResult.error.errors,
        },
        { status: 400 }
      );
    }

    const studentData = validationResult.data;

    // Create student using helper function
    const newStudent = await createStudent(
      studentData as Database['public']['Tables']['students']['Insert']
    );

    if (!newStudent) {
      return NextResponse.json(
        {
          ok: false,
          error: 'Failed to create student',
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        ok: true,
        data: newStudent,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating student:', error);

    // Handle JSON parse errors
    if (error instanceof SyntaxError) {
      return NextResponse.json(
        {
          ok: false,
          error: 'Invalid JSON in request body',
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        ok: false,
        error: 'Failed to create student',
      },
      { status: 500 }
    );
  }
}

