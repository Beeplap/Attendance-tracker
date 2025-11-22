/**
 * API client functions for frontend components
 */

const API_BASE = '/api';

/**
 * Get auth headers for API requests
 */
async function getAuthHeaders(): Promise<HeadersInit> {
  const { supabase } = await import('@/lib/supabaseClient');
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };

  if (session?.access_token) {
    headers['Authorization'] = `Bearer ${session.access_token}`;
  }

  return headers;
}

export interface Student {
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
}

export interface ApiResponse<T> {
  ok: boolean;
  data?: T;
  error?: string;
  details?: Array<{ path: string[]; message: string }>;
}

export interface CreateStudentInput {
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
}

export interface UpdateStudentInput extends Partial<CreateStudentInput> {}

/**
 * Get all students with optional filters
 */
export async function getStudents(filters?: {
  class?: string;
  section?: string;
  search?: string;
}): Promise<Student[]> {
  const params = new URLSearchParams();
  if (filters?.class) params.append('class', filters.class);
  if (filters?.section) params.append('section', filters.section);
  if (filters?.search) params.append('search', filters.search);

  const url = `${API_BASE}/students${params.toString() ? `?${params.toString()}` : ''}`;
  const headers = await getAuthHeaders();
  const response = await fetch(url, { headers });
  const data: ApiResponse<Student[]> = await response.json();

  if (!data.ok || !data.data) {
    throw new Error(data.error || 'Failed to fetch students');
  }

  return data.data;
}

/**
 * Get a single student by ID
 */
export async function getStudentById(id: string): Promise<Student> {
  const headers = await getAuthHeaders();
  const response = await fetch(`${API_BASE}/students/${id}`, { headers });
  const data: ApiResponse<Student> = await response.json();

  if (!data.ok || !data.data) {
    throw new Error(data.error || 'Failed to fetch student');
  }

  return data.data;
}

/**
 * Create a new student
 */
export async function createStudent(
  student: CreateStudentInput
): Promise<Student> {
  const headers = await getAuthHeaders();
  const response = await fetch(`${API_BASE}/students`, {
    method: 'POST',
    headers,
    body: JSON.stringify(student),
  });

  const data: ApiResponse<Student> = await response.json();

  if (!data.ok || !data.data) {
    if (data.details) {
      throw new Error(
        data.details.map((d) => d.message).join(', ') || data.error
      );
    }
    throw new Error(data.error || 'Failed to create student');
  }

  return data.data;
}

/**
 * Update a student
 */
export async function updateStudent(
  id: string,
  student: UpdateStudentInput
): Promise<Student> {
  const headers = await getAuthHeaders();
  const response = await fetch(`${API_BASE}/students/${id}`, {
    method: 'PUT',
    headers,
    body: JSON.stringify(student),
  });

  const data: ApiResponse<Student> = await response.json();

  if (!data.ok || !data.data) {
    if (data.details) {
      throw new Error(
        data.details.map((d) => d.message).join(', ') || data.error
      );
    }
    throw new Error(data.error || 'Failed to update student');
  }

  return data.data;
}

/**
 * Delete a student
 */
export async function deleteStudent(id: string): Promise<void> {
  const headers = await getAuthHeaders();
  const response = await fetch(`${API_BASE}/students/${id}`, {
    method: 'DELETE',
    headers,
  });

  const data: ApiResponse<{ message: string }> = await response.json();

  if (!data.ok) {
    throw new Error(data.error || 'Failed to delete student');
  }
}

// Attendance types and functions
export interface AttendanceRecord {
  id: string;
  student_id: string;
  date: string;
  status: 'present' | 'absent' | 'late' | 'excused';
  subject_id: string | null;
  marked_by: string | null;
  created_at: string;
}

export interface AttendanceInput {
  student_id: string;
  date: string;
  status: 'present' | 'absent' | 'late' | 'excused';
  subject_id?: string | null;
  marked_by?: string | null;
}

/**
 * Save attendance records (upsert)
 */
export async function saveAttendance(
  records: AttendanceInput[]
): Promise<{ saved: number; records: AttendanceRecord[] }> {
  const headers = await getAuthHeaders();
  const response = await fetch(`${API_BASE}/attendance`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ records }),
  });

  const data: ApiResponse<{ saved: number; records: AttendanceRecord[] }> =
    await response.json();

  if (!data.ok || !data.data) {
    throw new Error(data.error || 'Failed to save attendance');
  }

  return data.data;
}

/**
 * Get attendance records with filters
 */
export async function getAttendance(filters?: {
  student_id?: string;
  date?: string;
  class?: string;
  start_date?: string;
  end_date?: string;
}): Promise<AttendanceRecord[]> {
  const params = new URLSearchParams();
  if (filters?.student_id) params.append('student_id', filters.student_id);
  if (filters?.date) params.append('date', filters.date);
  if (filters?.class) params.append('class', filters.class);
  if (filters?.start_date) params.append('start_date', filters.start_date);
  if (filters?.end_date) params.append('end_date', filters.end_date);

  const url = `${API_BASE}/attendance${params.toString() ? `?${params.toString()}` : ''}`;
  const headers = await getAuthHeaders();
  const response = await fetch(url, { headers });
  const data: ApiResponse<AttendanceRecord[]> = await response.json();

  if (!data.ok || !data.data) {
    throw new Error(data.error || 'Failed to fetch attendance');
  }

  return data.data;
}

