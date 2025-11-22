'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import type { Student, AttendanceRecord, AttendanceInput } from '@/lib/api';
import { getStudents, getAttendance, saveAttendance } from '@/lib/api';
import AttendanceRow from '@/components/AttendanceRow';
import AttendanceCalendar from '@/components/AttendanceCalendar';

type AttendanceStatus = 'present' | 'absent' | 'late' | 'excused';

export default function AttendancePage() {
  // State
  const [students, setStudents] = useState<Student[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);

  // Filters
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    // Default to today
    return new Date().toISOString().split('T')[0];
  });

  // Attendance status for each student (student_id -> status)
  const [attendanceStatus, setAttendanceStatus] = useState<
    Map<string, AttendanceStatus>
  >(new Map());

  // Fetch students for selected class
  const fetchStudents = useCallback(async () => {
    if (!selectedClass) {
      setStudents([]);
      return;
    }

    try {
      setIsLoading(true);
      const data = await getStudents({ class: selectedClass });
      setStudents(data);
    } catch (error) {
      console.error('Failed to fetch students:', error);
      alert('Failed to load students');
    } finally {
      setIsLoading(false);
    }
  }, [selectedClass]);

  // Fetch existing attendance for selected date
  const fetchAttendance = useCallback(async () => {
    if (!selectedClass || !selectedDate) {
      setAttendanceRecords([]);
      return;
    }

    try {
      // Get all students in class to calculate their attendance
      const classStudents = await getStudents({ class: selectedClass });
      const studentIds = classStudents.map((s) => s.id);

      // Fetch attendance records for the selected date
      const records = await getAttendance({
        date: selectedDate,
        class: selectedClass,
      });

      setAttendanceRecords(records);

      // Initialize attendance status map
      const statusMap = new Map<string, AttendanceStatus>();
      records.forEach((record) => {
        statusMap.set(record.student_id, record.status);
      });
      setAttendanceStatus(statusMap);
    } catch (error) {
      console.error('Failed to fetch attendance:', error);
    }
  }, [selectedClass, selectedDate]);

  // Calculate attendance percentage for a student
  const calculateAttendancePercentage = useCallback(
    async (studentId: string): Promise<number> => {
      try {
        // Get current month start and end
        const now = new Date();
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
          .toISOString()
          .split('T')[0];
        const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0)
          .toISOString()
          .split('T')[0];

        const records = await getAttendance({
          student_id: studentId,
          start_date: monthStart,
          end_date: monthEnd,
        });

        if (records.length === 0) return 0; // No records = 0%

        const presentCount = records.filter(
          (r) => r.status === 'present' || r.status === 'excused'
        ).length;
        return (presentCount / records.length) * 100;
      } catch (error) {
        console.error('Failed to calculate attendance:', error);
        return 0;
      }
    },
    []
  );

  // Attendance percentages state
  const [attendancePercentages, setAttendancePercentages] = useState<
    Map<string, number>
  >(new Map());

  // Load attendance percentages
  useEffect(() => {
    if (students.length === 0) {
      setAttendancePercentages(new Map());
      return;
    }

    const loadPercentages = async () => {
      const percentages = new Map<string, number>();
      await Promise.all(
        students.map(async (student) => {
          const percentage = await calculateAttendancePercentage(student.id);
          percentages.set(student.id, percentage);
        })
      );
      setAttendancePercentages(percentages);
    };

    loadPercentages();
  }, [students, calculateAttendancePercentage]);

  // Fetch data when filters change
  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  useEffect(() => {
    fetchAttendance();
  }, [fetchAttendance]);

  // Unique classes state
  const [uniqueClasses, setUniqueClasses] = useState<string[]>([]);

  // Fetch unique classes on mount
  useEffect(() => {
    getStudents()
      .then((allStudents) => {
        const classes = Array.from(
          new Set(allStudents.map((s) => s.class).filter(Boolean))
        ).sort() as string[];
        setUniqueClasses(classes);
        if (classes.length > 0 && !selectedClass) {
          setSelectedClass(classes[0]);
        }
      })
      .catch(console.error);
  }, [selectedClass]);

  // Handle status change
  const handleStatusChange = (studentId: string, status: AttendanceStatus) => {
    setAttendanceStatus((prev) => {
      const next = new Map(prev);
      next.set(studentId, status);
      return next;
    });
  };

  // Handle save
  const handleSave = async () => {
    if (!selectedClass || !selectedDate) {
      alert('Please select a class and date');
      return;
    }

    if (students.length === 0) {
      alert('No students to mark attendance for');
      return;
    }

    try {
      setIsSaving(true);

      // Prepare attendance records
      const records: AttendanceInput[] = students.map((student) => ({
        student_id: student.id,
        date: selectedDate,
        status: attendanceStatus.get(student.id) || 'absent',
      }));

      await saveAttendance(records);
      alert('Attendance saved successfully!');
      
      // Refresh attendance records
      await fetchAttendance();
    } catch (error) {
      console.error('Failed to save attendance:', error);
      alert(
        error instanceof Error
          ? error.message
          : 'Failed to save attendance. Please try again.'
      );
    } finally {
      setIsSaving(false);
    }
  };

  // Handle CSV export
  const handleExportCSV = () => {
    if (students.length === 0) {
      alert('No students to export');
      return;
    }

    const headers = [
      'Roll',
      'Name',
      'Class',
      'Section',
      'Date',
      'Status',
      'Attendance %',
    ];

    const rows = students.map((student) => {
      const status = attendanceStatus.get(student.id) || 'absent';
      const percentage = attendancePercentages.get(student.id) || 0;

      return [
        student.roll,
        student.full_name,
        student.class || '',
        student.section || '',
        selectedDate,
        status,
        percentage.toFixed(1) + '%',
      ];
    });

    const csvContent = [
      headers.join(','),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(',')),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute(
      'download',
      `attendance_${selectedClass}_${selectedDate}.csv`
    );
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Get attendance records for calendar (current month)
  const calendarAttendanceRecords = useMemo(() => {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
      .toISOString()
      .split('T')[0];
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0)
      .toISOString()
      .split('T')[0];

    return attendanceRecords.filter(
      (r) => r.date >= monthStart && r.date <= monthEnd
    );
  }, [attendanceRecords]);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Attendance</h1>
          <p className="text-gray-600">Mark and manage student attendance</p>
        </div>

        {/* Filters and Actions */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
            {/* Class Select */}
            <div>
              <label
                htmlFor="class-select"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Class
              </label>
              <select
                id="class-select"
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Select Class</option>
                {uniqueClasses.map((cls) => (
                  <option key={cls} value={cls}>
                    {cls}
                  </option>
                ))}
              </select>
            </div>

            {/* Date Select */}
            <div>
              <label
                htmlFor="date-select"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Date
              </label>
              <input
                id="date-select"
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* View Calendar Button */}
            <div>
              <button
                onClick={() => setShowCalendar(true)}
                className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
                aria-label="View attendance calendar"
              >
                View Calendar
              </button>
            </div>

            {/* Export CSV Button */}
            <div>
              <button
                onClick={handleExportCSV}
                className="w-full px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                aria-label="Export attendance to CSV"
                disabled={students.length === 0}
              >
                Export CSV
              </button>
            </div>
          </div>
        </div>

        {/* Students List */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-4 border-b border-gray-200 flex justify-between items-center">
            <h2 className="text-lg font-semibold text-gray-900">
              {selectedClass
                ? `Students - ${selectedClass} (${students.length})`
                : 'Select a class to view students'}
            </h2>
            <button
              onClick={handleSave}
              disabled={isSaving || students.length === 0 || !selectedClass}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Save attendance"
            >
              {isSaving ? 'Saving...' : 'Save Attendance'}
            </button>
          </div>

          {isLoading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <p className="mt-4 text-gray-600">Loading students...</p>
            </div>
          ) : students.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-600">
                {selectedClass
                  ? 'No students found in this class'
                  : 'Please select a class'}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {students.map((student) => (
                <AttendanceRow
                  key={student.id}
                  student={student}
                  status={attendanceStatus.get(student.id) || null}
                  attendancePercentage={
                    attendancePercentages.get(student.id) || 0
                  }
                  onStatusChange={handleStatusChange}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Calendar Modal */}
      {showCalendar && (
        <AttendanceCalendar
          attendanceRecords={calendarAttendanceRecords}
          selectedDate={selectedDate}
          onDateSelect={(date) => {
            setSelectedDate(date);
            setShowCalendar(false);
          }}
          onClose={() => setShowCalendar(false)}
        />
      )}
    </div>
  );
}

