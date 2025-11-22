'use client';

import type { Student } from '@/lib/api';

interface StudentRowProps {
  student: Student;
  onEdit: (student: Student) => void;
  onDelete: (student: Student) => void;
}

export default function StudentRow({
  student,
  onEdit,
  onDelete,
}: StudentRowProps) {
  return (
    <tr className="border-b border-gray-200 hover:bg-gray-50 transition-colors">
      {/* Profile Thumbnail */}
      <td className="px-4 py-3">
        {student.profile_url ? (
          <img
            src={student.profile_url}
            alt={`${student.full_name} profile`}
            className="w-10 h-10 rounded-full object-cover"
            onError={(e) => {
              // Fallback to initials if image fails to load
              const target = e.target as HTMLImageElement;
              target.style.display = 'none';
              if (target.nextElementSibling) {
                (target.nextElementSibling as HTMLElement).style.display =
                  'flex';
              }
            }}
          />
        ) : null}
        <div
          className={`w-10 h-10 rounded-full bg-blue-500 text-white flex items-center justify-center font-semibold ${
            student.profile_url ? 'hidden' : 'flex'
          }`}
        >
          {student.full_name
            .split(' ')
            .map((n) => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2)}
        </div>
      </td>

      {/* Roll */}
      <td className="px-4 py-3 text-sm font-medium text-gray-900">
        {student.roll}
      </td>

      {/* Name */}
      <td className="px-4 py-3 text-sm text-gray-900">{student.full_name}</td>

      {/* Class */}
      <td className="px-4 py-3 text-sm text-gray-600">
        {student.class || '-'}
      </td>

      {/* Section */}
      <td className="px-4 py-3 text-sm text-gray-600">
        {student.section || '-'}
      </td>

      {/* Guardian */}
      <td className="px-4 py-3 text-sm text-gray-600">
        {student.guardian_name || '-'}
      </td>

      {/* Actions */}
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => onEdit(student)}
            className="text-blue-600 hover:text-blue-800 transition-colors"
            aria-label={`Edit ${student.full_name}`}
            title="Edit"
          >
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
                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
              />
            </svg>
          </button>
          <button
            onClick={() => onDelete(student)}
            className="text-red-600 hover:text-red-800 transition-colors"
            aria-label={`Delete ${student.full_name}`}
            title="Delete"
          >
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
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              />
            </svg>
          </button>
        </div>
      </td>
    </tr>
  );
}

