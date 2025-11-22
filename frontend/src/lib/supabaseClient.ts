import { createClient } from '@supabase/supabase-js';

// Read environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables: NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY');
}

// Database type definitions based on the schema
export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          role: 'admin' | 'teacher' | 'staff';
          full_name: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          email: string;
          role: 'admin' | 'teacher' | 'staff';
          full_name?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          role?: 'admin' | 'teacher' | 'staff';
          full_name?: string | null;
          created_at?: string;
        };
      };
      students: {
        Row: {
          id: string;
          roll: string;
          full_name: string;
          dob: string | null;
          gender: string | null;
          class: string | null;
          section: string | null;
          guardian_name: string | null;
          guardian_contact: string | null;
          address: string | null;
          profile_url: string | null;
          admission_date: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          roll: string;
          full_name: string;
          dob?: string | null;
          gender?: string | null;
          class?: string | null;
          section?: string | null;
          guardian_name?: string | null;
          guardian_contact?: string | null;
          address?: string | null;
          profile_url?: string | null;
          admission_date?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          roll?: string;
          full_name?: string;
          dob?: string | null;
          gender?: string | null;
          class?: string | null;
          section?: string | null;
          guardian_name?: string | null;
          guardian_contact?: string | null;
          address?: string | null;
          profile_url?: string | null;
          admission_date?: string | null;
          created_at?: string;
        };
      };
      teachers: {
        Row: {
          id: string;
          full_name: string;
          email: string | null;
          subject: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          full_name: string;
          email?: string | null;
          subject?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          full_name?: string;
          email?: string | null;
          subject?: string | null;
          created_at?: string;
        };
      };
      courses: {
        Row: {
          id: string;
          name: string;
          code: string | null;
          class_level: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          code?: string | null;
          class_level?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          code?: string | null;
          class_level?: string | null;
          created_at?: string;
        };
      };
      attendance: {
        Row: {
          id: string;
          student_id: string;
          date: string;
          status: 'present' | 'absent' | 'late' | 'excused';
          subject_id: string | null;
          marked_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          student_id: string;
          date: string;
          status: 'present' | 'absent' | 'late' | 'excused';
          subject_id?: string | null;
          marked_by?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          student_id?: string;
          date?: string;
          status?: 'present' | 'absent' | 'late' | 'excused';
          subject_id?: string | null;
          marked_by?: string | null;
          created_at?: string;
        };
      };
      marks: {
        Row: {
          id: string;
          student_id: string;
          course_id: string;
          exam_name: string | null;
          marks: number | null;
          total: number | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          student_id: string;
          course_id: string;
          exam_name?: string | null;
          marks?: number | null;
          total?: number | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          student_id?: string;
          course_id?: string;
          exam_name?: string | null;
          marks?: number | null;
          total?: number | null;
          created_at?: string;
        };
      };
      fees: {
        Row: {
          id: string;
          student_id: string;
          amount: number;
          due_date: string | null;
          paid: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          student_id: string;
          amount: number;
          due_date?: string | null;
          paid?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          student_id?: string;
          amount?: number;
          due_date?: string | null;
          paid?: boolean;
          created_at?: string;
        };
      };
    };
  };
};

// Create typed Supabase client
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);

// ============================================================================
// TYPED HELPER FUNCTIONS
// ============================================================================

/**
 * Get a user by ID
 * 
 * @example
 * ```ts
 * const user = await getUserById('123e4567-e89b-12d3-a456-426614174000');
 * if (user) {
 *   console.log(user.email, user.role);
 * }
 * ```
 */
export async function getUserById(id: string) {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    console.error('Error fetching user:', error);
    return null;
  }

  return data;
}

/**
 * Get all students with optional filters
 * 
 * @example
 * ```ts
 * // Get all students
 * const allStudents = await getStudents();
 * 
 * // Get students by class
 * const classStudents = await getStudents({ class: 'Grade 10' });
 * 
 * // Get students by class and section
 * const sectionStudents = await getStudents({ 
 *   class: 'Grade 10', 
 *   section: 'A' 
 * });
 * ```
 */
export async function getStudents(filters?: {
  class?: string;
  section?: string;
}) {
  let query = supabase.from('students').select('*');

  if (filters?.class) {
    query = query.eq('class', filters.class);
  }

  if (filters?.section) {
    query = query.eq('section', filters.section);
  }

  const { data, error } = await query.order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching students:', error);
    return [];
  }

  return data;
}

/**
 * Create a new student
 * 
 * @example
 * ```ts
 * const newStudent = await createStudent({
 *   roll: 'STU001',
 *   full_name: 'John Doe',
 *   dob: '2010-05-15',
 *   class: 'Grade 10',
 *   section: 'A',
 *   guardian_name: 'Jane Doe',
 *   guardian_contact: '+1234567890',
 *   admission_date: '2024-01-15'
 * });
 * 
 * if (newStudent) {
 *   console.log('Student created:', newStudent.id);
 * }
 * ```
 */
export async function createStudent(
  student: Database['public']['Tables']['students']['Insert']
) {
  const { data, error } = await supabase
    .from('students')
    .insert(student)
    .select()
    .single();

  if (error) {
    console.error('Error creating student:', error);
    return null;
  }

  return data;
}

/**
 * Update a student by ID
 * 
 * @example
 * ```ts
 * const updated = await updateStudent('123e4567-e89b-12d3-a456-426614174000', {
 *   full_name: 'John Smith',
 *   class: 'Grade 11'
 * });
 * 
 * if (updated) {
 *   console.log('Student updated:', updated.full_name);
 * }
 * ```
 */
export async function updateStudent(
  id: string,
  updates: Database['public']['Tables']['students']['Update']
) {
  const { data, error } = await supabase
    .from('students')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating student:', error);
    return null;
  }

  return data;
}

/**
 * Delete a student by ID
 * 
 * @example
 * ```ts
 * const success = await deleteStudent('123e4567-e89b-12d3-a456-426614174000');
 * if (success) {
 *   console.log('Student deleted successfully');
 * }
 * ```
 */
export async function deleteStudent(id: string): Promise<boolean> {
  const { error } = await supabase
    .from('students')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting student:', error);
    return false;
  }

  return true;
}

