/**
 * API client functions for frontend components
 */

const API_BASE = '/api';

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
  const response = await fetch(url);
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
  const response = await fetch(`${API_BASE}/students/${id}`);
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
  const response = await fetch(`${API_BASE}/students`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
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
  const response = await fetch(`${API_BASE}/students/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
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
  const response = await fetch(`${API_BASE}/students/${id}`, {
    method: 'DELETE',
  });

  const data: ApiResponse<{ message: string }> = await response.json();

  if (!data.ok) {
    throw new Error(data.error || 'Failed to delete student');
  }
}

