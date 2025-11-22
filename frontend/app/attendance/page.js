"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "../../components/ui/button";
import { supabase } from "../../lib/supabaseClient";

export default function AttendancePage() {
  const router = useRouter();
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedClass, setSelectedClass] = useState("");
  const [selectedDate, setSelectedDate] = useState(() => {
    return new Date().toISOString().split("T")[0];
  });
  const [attendance, setAttendance] = useState({});

  useEffect(() => {
    if (selectedClass) {
      fetchStudents();
      fetchAttendance();
    }
  }, [selectedClass, selectedDate]);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("students")
        .select("*")
        .eq("class", selectedClass)
        .order("roll", { ascending: true });

      if (error) throw error;
      setStudents(data || []);
    } catch (error) {
      console.error("Error fetching students:", error);
      alert("Failed to load students");
    } finally {
      setLoading(false);
    }
  };

  const fetchAttendance = async () => {
    if (!selectedClass || !selectedDate) return;

    try {
      const studentIds = students.map((s) => s.id);
      if (studentIds.length === 0) return;

      const { data, error } = await supabase
        .from("attendance")
        .select("*")
        .in("student_id", studentIds)
        .eq("date", selectedDate);

      if (error) throw error;

      const attendanceMap = {};
      (data || []).forEach((record) => {
        attendanceMap[record.student_id] = record.status;
      });
      setAttendance(attendanceMap);
    } catch (error) {
      console.error("Error fetching attendance:", error);
    }
  };

  const handleStatusChange = (studentId, status) => {
    setAttendance((prev) => ({
      ...prev,
      [studentId]: status,
    }));
  };

  const handleSave = async () => {
    try {
      const records = students.map((student) => ({
        student_id: student.id,
        date: selectedDate,
        status: attendance[student.id] || "absent",
      }));

      const { error } = await supabase.from("attendance").upsert(records, {
        onConflict: "student_id,date",
      });

      if (error) throw error;
      alert("Attendance saved successfully!");
    } catch (error) {
      console.error("Error saving attendance:", error);
      alert("Failed to save attendance");
    }
  };

  const [uniqueClasses, setUniqueClasses] = useState([]);

  useEffect(() => {
    const fetchClasses = async () => {
      const { data } = await supabase.from("students").select("class");
      const classes = Array.from(
        new Set((data || []).map((s) => s.class).filter(Boolean))
      ).sort();
      setUniqueClasses(classes);
    };
    fetchClasses();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">Attendance</h1>
          <p className="text-gray-600 dark:text-gray-400">Mark and manage student attendance</p>
        </div>

        {/* Filters */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Class</label>
              <select
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select Class</option>
                {uniqueClasses.map((cls) => (
                  <option key={cls} value={cls}>
                    {cls}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Date</label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex items-end">
              <Button
                onClick={handleSave}
                disabled={!selectedClass || students.length === 0}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
              >
                Save Attendance
              </Button>
            </div>
          </div>
        </div>

        {/* Students List */}
        {selectedClass && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
              Students ({students.length})
            </h2>

            {loading ? (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <p className="mt-4 text-gray-600 dark:text-gray-400">Loading students...</p>
              </div>
            ) : students.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-600 dark:text-gray-400">No students found for this class.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {students.map((student) => (
                  <div
                    key={student.id}
                    className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-blue-500 text-white flex items-center justify-center font-semibold">
                        {student.full_name
                          ?.split(" ")
                          .map((n) => n[0])
                          .join("")
                          .toUpperCase()
                          .slice(0, 2) || "?"}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-gray-100">{student.full_name}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Roll: {student.roll}</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {["present", "absent", "late", "excused"].map((status) => (
                        <button
                          key={status}
                          onClick={() => handleStatusChange(student.id, status)}
                          className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                            attendance[student.id] === status
                              ? status === "present"
                                ? "bg-green-500 text-white"
                                : status === "absent"
                                ? "bg-red-500 text-white"
                                : status === "late"
                                ? "bg-yellow-500 text-white"
                                : "bg-blue-500 text-white"
                              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                          }`}
                        >
                          {status.charAt(0).toUpperCase() + status.slice(1)}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {!selectedClass && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-12 text-center">
            <p className="text-gray-600 dark:text-gray-400">Please select a class to mark attendance</p>
          </div>
        )}
      </div>
    </div>
  );
}

