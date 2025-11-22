'use client';

import { useState } from 'react';
import type { AttendanceRecord } from '@/lib/api';

interface AttendanceCalendarProps {
  attendanceRecords: AttendanceRecord[];
  selectedDate: string;
  onDateSelect: (date: string) => void;
  onClose: () => void;
}

export default function AttendanceCalendar({
  attendanceRecords,
  selectedDate,
  onDateSelect,
  onClose,
}: AttendanceCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(() => {
    const date = new Date(selectedDate);
    return new Date(date.getFullYear(), date.getMonth(), 1);
  });

  // Create a map of date -> status for quick lookup
  const attendanceMap = new Map<string, string>();
  attendanceRecords.forEach((record) => {
    attendanceMap.set(record.date, record.status);
  });

  const monthNames = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ];

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();

  // Get first day of month and number of days
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  // Generate calendar days
  const days: (number | null)[] = [];
  // Empty cells for days before month starts
  for (let i = 0; i < firstDay; i++) {
    days.push(null);
  }
  // Days of the month
  for (let i = 1; i <= daysInMonth; i++) {
    days.push(i);
  }

  const getStatusColor = (date: string): string => {
    const status = attendanceMap.get(date);
    if (!status) return 'bg-gray-100';
    switch (status) {
      case 'present':
        return 'bg-green-500';
      case 'absent':
        return 'bg-red-500';
      case 'late':
        return 'bg-yellow-500';
      case 'excused':
        return 'bg-blue-500';
      default:
        return 'bg-gray-100';
    }
  };

  const formatDate = (day: number): string => {
    const date = new Date(year, month, day);
    return date.toISOString().split('T')[0];
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentMonth(
      new Date(year, month + (direction === 'next' ? 1 : -1), 1)
    );
  };

  const isSelectedDate = (day: number): boolean => {
    const dateStr = formatDate(day);
    return dateStr === selectedDate;
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
      role="dialog"
      aria-modal="true"
      aria-labelledby="calendar-title"
    >
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl m-4">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 id="calendar-title" className="text-2xl font-bold text-gray-900">
              Attendance Calendar
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
              aria-label="Close calendar"
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

          {/* Month Navigation */}
          <div className="flex justify-between items-center mb-4">
            <button
              onClick={() => navigateMonth('prev')}
              className="px-3 py-1 text-gray-700 hover:bg-gray-100 rounded transition-colors"
              aria-label="Previous month"
            >
              ← Prev
            </button>
            <h3 className="text-lg font-semibold">
              {monthNames[month]} {year}
            </h3>
            <button
              onClick={() => navigateMonth('next')}
              className="px-3 py-1 text-gray-700 hover:bg-gray-100 rounded transition-colors"
              aria-label="Next month"
            >
              Next →
            </button>
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-1 mb-4">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
              <div
                key={day}
                className="text-center text-sm font-medium text-gray-600 py-2"
              >
                {day}
              </div>
            ))}
            {days.map((day, index) => {
              if (day === null) {
                return <div key={index} className="h-10" />;
              }

              const dateStr = formatDate(day);
              const status = attendanceMap.get(dateStr);
              const selected = isSelectedDate(day);

              return (
                <button
                  key={index}
                  onClick={() => onDateSelect(dateStr)}
                  className={`h-10 rounded transition-all ${
                    selected
                      ? 'ring-2 ring-blue-500 ring-offset-2'
                      : 'hover:ring-1 hover:ring-gray-300'
                  } ${getStatusColor(dateStr)} ${
                    status ? 'text-white font-semibold' : 'text-gray-700'
                  }`}
                  aria-label={`${day} ${monthNames[month]} - ${status || 'No attendance'}`}
                >
                  {day}
                </button>
              );
            })}
          </div>

          {/* Legend */}
          <div className="flex gap-4 justify-center text-sm">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-green-500"></div>
              <span>Present</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-red-500"></div>
              <span>Absent</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-yellow-500"></div>
              <span>Late</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-blue-500"></div>
              <span>Excused</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-gray-100"></div>
              <span>No Record</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

