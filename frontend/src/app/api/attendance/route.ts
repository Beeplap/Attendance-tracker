import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { supabase } from '@/lib/supabaseClient';
import type { Database } from '@/lib/supabaseClient';

// Zod schema for attendance record
const attendanceRecordSchema = z.object({
  student_id: z.string().uuid(),
  date: z.string().date(),
  status: z.enum(['present', 'absent', 'late', 'excused']),
  subject_id: z.string().uuid().optional().nullable(),
  marked_by: z.string().uuid().optional().nullable(),
});

const attendanceBatchSchema = z.object({
  records: z.array(attendanceRecordSchema),
});

// POST /api/attendance - Create or update attendance records
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate input with Zod
    const validationResult = attendanceBatchSchema.safeParse(body);

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

    const { records } = validationResult.data;

    if (records.length === 0) {
      return NextResponse.json(
        {
          ok: false,
          error: 'No attendance records provided',
        },
        { status: 400 }
      );
    }

    // Upsert records (insert or update on conflict)
    // Using Supabase's upsert with onConflict
    const attendanceData = records.map((record) => ({
      student_id: record.student_id,
      date: record.date,
      status: record.status,
      subject_id: record.subject_id || null,
      marked_by: record.marked_by || null,
    }));

    // For upsert, we need to handle the unique constraint (student_id, date, subject_id)
    // We'll use Supabase's upsert with onConflict
    const { data, error } = await supabase
      .from('attendance')
      .upsert(attendanceData, {
        onConflict: 'student_id,date,subject_id',
        ignoreDuplicates: false,
      })
      .select();

    if (error) {
      console.error('Error upserting attendance:', error);
      return NextResponse.json(
        {
          ok: false,
          error: 'Failed to save attendance records',
          details: error.message,
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        ok: true,
        data: {
          saved: data?.length || 0,
          records: data,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error in POST /api/attendance:', error);

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
        error: 'Failed to save attendance',
      },
      { status: 500 }
    );
  }
}

// GET /api/attendance - Get attendance records with filters
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const studentId = searchParams.get('student_id');
    const date = searchParams.get('date');
    const classFilter = searchParams.get('class');
    const startDate = searchParams.get('start_date');
    const endDate = searchParams.get('end_date');

    let query = supabase.from('attendance').select('*');

    if (studentId) {
      query = query.eq('student_id', studentId);
    }

    if (date) {
      query = query.eq('date', date);
    }

    if (startDate && endDate) {
      query = query.gte('date', startDate).lte('date', endDate);
    }

    // If class filter is provided, we need to join with students table
    if (classFilter) {
      // First get student IDs for the class
      const { data: classStudents, error: studentsError } = await supabase
        .from('students')
        .select('id')
        .eq('class', classFilter);

      if (studentsError) {
        return NextResponse.json(
          {
            ok: false,
            error: 'Failed to fetch students for class',
          },
          { status: 500 }
        );
      }

      if (!classStudents || classStudents.length === 0) {
        return NextResponse.json(
          {
            ok: true,
            data: [],
          },
          { status: 200 }
        );
      }

      const studentIds = classStudents.map((s) => s.id);
      query = query.in('student_id', studentIds);
    }

    const { data, error } = await query.order('date', { ascending: false });

    if (error) {
      console.error('Error fetching attendance:', error);
      return NextResponse.json(
        {
          ok: false,
          error: 'Failed to fetch attendance records',
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        ok: true,
        data: data || [],
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error in GET /api/attendance:', error);
    return NextResponse.json(
      {
        ok: false,
        error: 'Failed to fetch attendance',
      },
      { status: 500 }
    );
  }
}

