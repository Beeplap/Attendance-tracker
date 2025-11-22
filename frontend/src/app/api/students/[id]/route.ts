import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { supabase } from '@/lib/supabaseClient';
import { updateStudent, deleteStudent } from '@/lib/supabaseClient';
import type { Database } from '@/lib/supabaseClient';
import { requireAuth } from '@/lib/auth-helpers';

// Zod schema for updating a student (all fields optional except id)
const updateStudentSchema = z.object({
  roll: z.string().min(1).max(32).optional(),
  full_name: z.string().min(1).optional(),
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

// GET /api/students/[id] - Get student by ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  // Require authentication
  const authResult = await requireAuth(request);
  if ('error' in authResult) {
    return NextResponse.json(
      { ok: false, error: authResult.error },
      { status: authResult.status }
    );
  }

  try {
    const { id } = params;

    if (!id) {
      return NextResponse.json(
        {
          ok: false,
          error: 'Student ID is required',
        },
        { status: 400 }
      );
    }

    const { data: student, error } = await supabase
      .from('students')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No rows returned
        return NextResponse.json(
          {
            ok: false,
            error: 'Student not found',
          },
          { status: 404 }
        );
      }

      console.error('Error fetching student:', error);
      return NextResponse.json(
        {
          ok: false,
          error: 'Failed to fetch student',
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        ok: true,
        data: student,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error in GET /api/students/[id]:', error);
    return NextResponse.json(
      {
        ok: false,
        error: 'Internal server error',
      },
      { status: 500 }
    );
  }
}

// PUT /api/students/[id] - Update student by ID
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  // Require teacher or admin role
  const authResult = await requireAuth(request, 'teacher');
  if ('error' in authResult) {
    return NextResponse.json(
      { ok: false, error: authResult.error },
      { status: authResult.status }
    );
  }

  try {
    const { id } = params;

    if (!id) {
      return NextResponse.json(
        {
          ok: false,
          error: 'Student ID is required',
        },
        { status: 400 }
      );
    }

    const body = await request.json();

    // Validate input with Zod
    const validationResult = updateStudentSchema.safeParse(body);

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

    const updateData = validationResult.data;

    // Check if student exists
    const { data: existingStudent, error: fetchError } = await supabase
      .from('students')
      .select('id')
      .eq('id', id)
      .single();

    if (fetchError || !existingStudent) {
      return NextResponse.json(
        {
          ok: false,
          error: 'Student not found',
        },
        { status: 404 }
      );
    }

    // Update student using helper function
    const updatedStudent = await updateStudent(
      id,
      updateData as Database['public']['Tables']['students']['Update']
    );

    if (!updatedStudent) {
      return NextResponse.json(
        {
          ok: false,
          error: 'Failed to update student',
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        ok: true,
        data: updatedStudent,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error updating student:', error);

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
        error: 'Failed to update student',
      },
      { status: 500 }
    );
  }
}

// DELETE /api/students/[id] - Delete student by ID
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  // Require admin role only
  const authResult = await requireAuth(request, 'admin');
  if ('error' in authResult) {
    return NextResponse.json(
      { ok: false, error: authResult.error },
      { status: authResult.status }
    );
  }

  try {
    const { id } = params;

    if (!id) {
      return NextResponse.json(
        {
          ok: false,
          error: 'Student ID is required',
        },
        { status: 400 }
      );
    }

    // Check if student exists before deleting
    const { data: existingStudent, error: fetchError } = await supabase
      .from('students')
      .select('id')
      .eq('id', id)
      .single();

    if (fetchError || !existingStudent) {
      return NextResponse.json(
        {
          ok: false,
          error: 'Student not found',
        },
        { status: 404 }
      );
    }

    // Delete student using helper function
    const success = await deleteStudent(id);

    if (!success) {
      return NextResponse.json(
        {
          ok: false,
          error: 'Failed to delete student',
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        ok: true,
        data: { message: 'Student deleted successfully' },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error deleting student:', error);
    return NextResponse.json(
      {
        ok: false,
        error: 'Failed to delete student',
      },
      { status: 500 }
    );
  }
}

