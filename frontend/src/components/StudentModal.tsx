'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { Student, CreateStudentInput } from '@/lib/api';

// Zod schema for student form
const studentSchema = z.object({
  roll: z.string().min(1, 'Roll number is required').max(32),
  full_name: z.string().min(1, 'Full name is required'),
  dob: z.string().date().optional().nullable(),
  gender: z.string().optional().nullable(),
  class: z.string().max(64).optional().nullable(),
  section: z.string().max(8).optional().nullable(),
  guardian_name: z.string().optional().nullable(),
  guardian_contact: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  profile_url: z.string().url().optional().nullable().or(z.literal('')),
  admission_date: z.string().date().optional().nullable(),
});

type StudentFormData = z.infer<typeof studentSchema>;

interface StudentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateStudentInput) => Promise<void>;
  student?: Student | null;
  isLoading?: boolean;
}

export default function StudentModal({
  isOpen,
  onClose,
  onSubmit,
  student,
  isLoading = false,
}: StudentModalProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
  } = useForm<StudentFormData>({
    resolver: zodResolver(studentSchema),
    defaultValues: {
      roll: '',
      full_name: '',
      dob: null,
      gender: null,
      class: null,
      section: null,
      guardian_name: null,
      guardian_contact: null,
      address: null,
      profile_url: null,
      admission_date: null,
    },
  });

  // Reset form when modal opens/closes or student changes
  useEffect(() => {
    if (isOpen) {
      if (student) {
        // Prefill form with student data
        setValue('roll', student.roll);
        setValue('full_name', student.full_name);
        setValue('dob', student.dob || null);
        setValue('gender', student.gender || null);
        setValue('class', student.class || null);
        setValue('section', student.section || null);
        setValue('guardian_name', student.guardian_name || null);
        setValue('guardian_contact', student.guardian_contact || null);
        setValue('address', student.address || null);
        setValue('profile_url', student.profile_url || null);
        setValue('admission_date', student.admission_date || null);
      } else {
        reset();
      }
    }
  }, [isOpen, student, setValue, reset]);

  const onFormSubmit = async (data: StudentFormData) => {
    // Convert empty strings to null for optional fields
    const submitData: CreateStudentInput = {
      ...data,
      dob: data.dob || null,
      gender: data.gender || null,
      class: data.class || null,
      section: data.section || null,
      guardian_name: data.guardian_name || null,
      guardian_contact: data.guardian_contact || null,
      address: data.address || null,
      profile_url: data.profile_url || null,
      admission_date: data.admission_date || null,
    };

    await onSubmit(submitData);
    reset();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto m-4">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
          <h2 id="modal-title" className="text-2xl font-bold text-gray-900">
            {student ? 'Edit Student' : 'Add New Student'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Close modal"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit(onFormSubmit)} className="p-6">
          <div className="grid grid-cols-2 gap-4">
            {/* Roll Number */}
            <div className="col-span-2">
              <label
                htmlFor="roll"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Roll Number <span className="text-red-500">*</span>
              </label>
              <input
                id="roll"
                type="text"
                {...register('roll')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                aria-invalid={errors.roll ? 'true' : 'false'}
                aria-describedby={errors.roll ? 'roll-error' : undefined}
              />
              {errors.roll && (
                <p id="roll-error" className="mt-1 text-sm text-red-600" role="alert">
                  {errors.roll.message}
                </p>
              )}
            </div>

            {/* Full Name */}
            <div className="col-span-2">
              <label
                htmlFor="full_name"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Full Name <span className="text-red-500">*</span>
              </label>
              <input
                id="full_name"
                type="text"
                {...register('full_name')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                aria-invalid={errors.full_name ? 'true' : 'false'}
                aria-describedby={errors.full_name ? 'full_name-error' : undefined}
              />
              {errors.full_name && (
                <p
                  id="full_name-error"
                  className="mt-1 text-sm text-red-600"
                  role="alert"
                >
                  {errors.full_name.message}
                </p>
              )}
            </div>

            {/* Date of Birth */}
            <div>
              <label
                htmlFor="dob"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Date of Birth
              </label>
              <input
                id="dob"
                type="date"
                {...register('dob')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Gender */}
            <div>
              <label
                htmlFor="gender"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Gender
              </label>
              <select
                id="gender"
                {...register('gender')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Select gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>

            {/* Class */}
            <div>
              <label
                htmlFor="class"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Class
              </label>
              <input
                id="class"
                type="text"
                {...register('class')}
                placeholder="e.g., Grade 10"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Section */}
            <div>
              <label
                htmlFor="section"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Section
              </label>
              <input
                id="section"
                type="text"
                {...register('section')}
                placeholder="e.g., A"
                maxLength={8}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Guardian Name */}
            <div>
              <label
                htmlFor="guardian_name"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Guardian Name
              </label>
              <input
                id="guardian_name"
                type="text"
                {...register('guardian_name')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Guardian Contact */}
            <div>
              <label
                htmlFor="guardian_contact"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Guardian Contact
              </label>
              <input
                id="guardian_contact"
                type="text"
                {...register('guardian_contact')}
                placeholder="Phone number"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Address */}
            <div className="col-span-2">
              <label
                htmlFor="address"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Address
              </label>
              <textarea
                id="address"
                {...register('address')}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Profile URL */}
            <div className="col-span-2">
              <label
                htmlFor="profile_url"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Profile Photo URL
              </label>
              <input
                id="profile_url"
                type="url"
                {...register('profile_url')}
                placeholder="https://example.com/photo.jpg"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              {errors.profile_url && (
                <p className="mt-1 text-sm text-red-600" role="alert">
                  {errors.profile_url.message}
                </p>
              )}
            </div>

            {/* Admission Date */}
            <div>
              <label
                htmlFor="admission_date"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Admission Date
              </label>
              <input
                id="admission_date"
                type="date"
                {...register('admission_date')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <div className="mt-6 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isLoading}
            >
              {isLoading ? 'Saving...' : student ? 'Update Student' : 'Add Student'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

