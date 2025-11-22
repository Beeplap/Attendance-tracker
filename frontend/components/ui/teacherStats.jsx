"use client";
import React from "react";
import { Button } from "./button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "./card";
import { BookOpen, CheckCircle, XCircle, Calendar } from "lucide-react";

export default function TeacherStats({
  filteredTeacherStats,
  statsLoading,
  fetchTeacherStats,
  viewTeacherDetails,
}) {
  return (
    <Card className="shadow-md border border-gray-200 dark:border-gray-700">
      <CardHeader className="flex flex-col sm:flex-row gap-2 sm:items-center justify-between">
        <div>
          <CardTitle className="text-lg font-semibold text-gray-800 dark:text-gray-100">
            Teacher Statistics
          </CardTitle>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Overview of teacher performance and class management
          </p>
        </div>
        <Button
          variant="outline"
          onClick={fetchTeacherStats}
          disabled={statsLoading}
          className="border-gray-400 text-gray-700 dark:text-gray-200"
        >
          {statsLoading ? "Refreshing…" : "Refresh Stats"}
        </Button>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="sr-only sm:not-sr-only">
              <tr className="text-left border-b bg-gray-100 dark:bg-gray-800">
                <th className="py-2 px-2 sm:px-4">Teacher</th>
                <th className="py-2 px-2 sm:px-4 hidden sm:table-cell">
                  Email
                </th>
                <th className="py-2 px-2 sm:px-4">Total Classes</th>
                <th className="py-2 px-2 sm:px-4">Completed</th>
                <th className="py-2 px-2 sm:px-4">Pending</th>
                <th className="py-2 px-2 sm:px-4">Missed Today</th>
                <th className="py-2 px-2 sm:px-4 w-12 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredTeacherStats.map((teacher, idx) => (
                <tr
                  key={teacher.id}
                  className={`border-b last:border-0 ${
                    idx % 2 === 0 ? "bg-white/50 dark:bg-gray-900/40" : ""
                  }`}
                >
                  <td className="py-2 px-2 sm:px-4">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-0.5 sm:gap-2">
                      <span className="font-medium">
                        {teacher.full_name || teacher.id}
                      </span>
                      <span className="text-xs text-gray-500 sm:hidden">
                        {teacher.email}
                      </span>
                    </div>
                  </td>
                  <td className="py-2 px-2 sm:px-4 hidden sm:table-cell">
                    {teacher.email}
                  </td>
                  <td className="py-2 px-2 sm:px-4">
                    <div className="flex items-center gap-1">
                      <BookOpen className="w-4 h-4 text-blue-500" />
                      <span className="font-medium">
                        {teacher.totalClasses}
                      </span>
                    </div>
                  </td>
                  <td className="py-2 px-2 sm:px-4">
                    <div className="flex items-center gap-1 text-green-600">
                      <CheckCircle className="w-4 h-4" />
                      <span>{teacher.completedClasses}</span>
                    </div>
                  </td>
                  <td className="py-2 px-2 sm:px-4">
                    <div className="flex items-center gap-1 text-yellow-600">
                      <Calendar className="w-4 h-4" />
                      <span>{teacher.pendingClasses}</span>
                    </div>
                  </td>
                  <td className="py-2 px-2 sm:px-4">
                    <div className="flex items-center gap-1 text-red-600">
                      <XCircle className="w-4 h-4" />
                      <span>{teacher.missedClasses?.length || 0}</span>
                    </div>
                  </td>
                  <td className="py-2 px-2 sm:px-4">
                    <div className="flex justify-end">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => viewTeacherDetails(teacher)}
                        className="text-xs"
                      >
                        View Details
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredTeacherStats.length === 0 && (
                <tr>
                  <td
                    className="py-4 text-center opacity-70"
                    colSpan={7}
                  >
                    {statsLoading
                      ? "Loading teacher statistics..."
                      : "No teachers found"}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
