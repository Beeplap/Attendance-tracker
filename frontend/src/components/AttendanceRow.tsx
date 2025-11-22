'use client';

import type { Student } from '@/lib/api';

interface AttendanceRowProps {
  student: Student;
  status: 'present' | 'absent' | 'late' | 'excused' | null;
  attendancePercentage: number;
  onStatusChange: (studentId: string, status: 'present' | 'absent' | 'late' | 'excused') => void;
}

export default function AttendanceRow({
  student,
  status,
  attendancePercentage,
  onStatusChange,
}: AttendanceRowProps) {
  const statusOptions: Array<{
    value: 'present' | 'absent' | 'late' | 'excused';
    label: string;
    color: string;
  }> = [
    { value: 'present', label: 'Present', color: 'bg-green-500' },
    { value: 'absent', label: 'Absent', color: 'bg-red-500' },
    { value: 'late', label: 'Late', color: 'bg-yellow-500' },
    { value: 'excused', label: 'Excused', color: 'bg-blue-500' },
  ];

  const getPercentageColor = (percentage: number): string => {
    if (percentage >= 90) return 'bg-green-100 text-green-800';
    if (percentage >= 75) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  return (
    <div className="flex items-center gap-4 p-3 border-b border-gray-200 hover:bg-gray-50 transition-colors">
      {/* Profile */}
      <div className="flex-shrink-0">
        {student.profile_url ? (
          <img
            src={student.profile_url}
            alt={`${student.full_name} profile`}
            className="w-10 h-10 rounded-full object-cover"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.style.display = 'none';
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
      </div>

      {/* Student Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-3">
          <div className="flex-1">
            <p className="font-medium text-gray-900">{student.full_name}</p>
            <p className="text-sm text-gray-500">Roll: {student.roll}</p>
          </div>
          {/* Attendance Percentage Badge */}
          <div
            className={`px-2 py-1 rounded text-xs font-semibold ${getPercentageColor(
              attendancePercentage
            )}`}
          >
            {attendancePercentage.toFixed(1)}%
          </div>
        </div>
      </div>

      {/* Status Toggles */}
      <div className="flex gap-2 flex-shrink-0">
        {statusOptions.map((option) => (
          <button
            key={option.value}
            onClick={() => onStatusChange(student.id, option.value)}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
              status === option.value
                ? `${option.color} text-white shadow-md`
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
            aria-label={`Mark ${student.full_name} as ${option.label}`}
            aria-pressed={status === option.value}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}

