'use client';

import { useState, useEffect, useCallback } from 'react';
import type { Student, CreateStudentInput } from '@/lib/api';
import {
  getStudents,
  createStudent,
  updateStudent,
  deleteStudent,
} from '@/lib/api';
import StudentList from '@/components/StudentList';
import StudentModal from '@/components/StudentModal';

export default function StudentsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [classFilter, setClassFilter] = useState('');
  const [sectionFilter, setSectionFilter] = useState('');

  // Fetch students
  const fetchStudents = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await getStudents({
        class: classFilter || undefined,
        section: sectionFilter || undefined,
        search: searchQuery || undefined,
      });
      setStudents(data);
    } catch (error) {
      console.error('Failed to fetch students:', error);
      // You might want to show a toast/notification here
    } finally {
      setIsLoading(false);
    }
  }, [classFilter, sectionFilter, searchQuery]);

  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  // Handle add student
  const handleAddStudent = () => {
    setEditingStudent(null);
    setIsModalOpen(true);
  };

  // Handle edit student
  const handleEditStudent = (student: Student) => {
    setEditingStudent(student);
    setIsModalOpen(true);
  };

  // Handle delete student
  const handleDeleteStudent = async (student: Student) => {
    if (
      !confirm(
        `Are you sure you want to delete ${student.full_name}? This action cannot be undone.`
      )
    ) {
      return;
    }

    try {
      // Optimistic update
      const previousStudents = [...students];
      setStudents(students.filter((s) => s.id !== student.id));

      await deleteStudent(student.id);
      // Refresh to ensure consistency
      await fetchStudents();
    } catch (error) {
      console.error('Failed to delete student:', error);
      // Revert optimistic update on error
      fetchStudents();
      alert('Failed to delete student. Please try again.');
    }
  };

  // Handle form submit
  const handleSubmit = async (data: CreateStudentInput) => {
    try {
      setIsSubmitting(true);

      if (editingStudent) {
        // Update existing student
        const updated = await updateStudent(editingStudent.id, data);

        // Optimistic update
        setStudents(
          students.map((s) => (s.id === editingStudent.id ? updated : s))
        );
      } else {
        // Create new student
        const newStudent = await createStudent(data);

        // Optimistic update - add to beginning of list
        setStudents([newStudent, ...students]);
      }

      setIsModalOpen(false);
      setEditingStudent(null);
    } catch (error) {
      console.error('Failed to save student:', error);
      alert(
        error instanceof Error
          ? error.message
          : 'Failed to save student. Please try again.'
      );
      throw error; // Re-throw to prevent modal from closing
    } finally {
      setIsSubmitting(false);
    }
  };

  // Get unique classes and sections for filters
  const uniqueClasses = Array.from(
    new Set(students.map((s) => s.class).filter(Boolean))
  ).sort();
  const uniqueSections = Array.from(
    new Set(students.map((s) => s.section).filter(Boolean))
  ).sort();

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Students</h1>
          <p className="text-gray-600">
            Manage student records and information
          </p>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search */}
            <div className="md:col-span-2">
              <label
                htmlFor="search"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Search
              </label>
              <input
                id="search"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name, roll, or guardian..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Class Filter */}
            <div>
              <label
                htmlFor="class-filter"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Class
              </label>
              <select
                id="class-filter"
                value={classFilter}
                onChange={(e) => setClassFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">All Classes</option>
                {uniqueClasses.map((cls) => (
                  <option key={cls} value={cls}>
                    {cls}
                  </option>
                ))}
              </select>
            </div>

            {/* Section Filter */}
            <div>
              <label
                htmlFor="section-filter"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Section
              </label>
              <select
                id="section-filter"
                value={sectionFilter}
                onChange={(e) => setSectionFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">All Sections</option>
                {uniqueSections.map((sec) => (
                  <option key={sec} value={sec}>
                    {sec}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Add Student Button and Table */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-900">
              Student List ({students.length})
            </h2>
            <button
              onClick={handleAddStudent}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              aria-label="Add new student"
            >
              <span className="flex items-center gap-2">
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4v16m8-8H4"
                  />
                </svg>
                Add Student
              </span>
            </button>
          </div>

          <StudentList
            students={students}
            onEdit={handleEditStudent}
            onDelete={handleDeleteStudent}
            isLoading={isLoading}
          />
        </div>
      </div>

      {/* Modal */}
      <StudentModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingStudent(null);
        }}
        onSubmit={handleSubmit}
        student={editingStudent}
        isLoading={isSubmitting}
      />
    </div>
  );
}

