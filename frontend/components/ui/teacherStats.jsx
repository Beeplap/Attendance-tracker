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
                <th className="py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">
                  Teacher Name
                </th>
                <th className="py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">
                  1st Period
                </th>
                <th className="py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">
                  2nd Period
                </th>
                <th className="py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">
                  3rd Period
                </th>
                <th className="py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">
                  4th Period
                </th>
                <th className="py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">
                  5th Period
                </th>
                <th className="py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">
                  6th Period
                </th>
                <th className="py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">
                  Total Time
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredTeacherStats.map((teacher, idx) => {
                const formatTime = (minutes) => {
                  if (!minutes || minutes === 0) return "-";
                  const hours = Math.floor(minutes / 60);
                  const mins = minutes % 60;
                  return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
                };

                const getPeriodData = (periodNum) => {
                  const period = teacher.periods?.find((p) => p.periodNumber === periodNum);
                  return period
                    ? {
                        subject: period.subject,
                        time: formatTime(period.timeSpentMinutes),
                      }
                    : { subject: "-", time: "-" };
                };

                return (
                  <tr
                    key={teacher.id}
                    className={`border-b last:border-0 ${
                      idx % 2 === 0 ? "bg-white/50 dark:bg-gray-900/40" : ""
                    }`}
                  >
                    <td className="py-3 px-4">
                      <div className="font-medium text-gray-900 dark:text-gray-100">
                        {teacher.full_name || teacher.id}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {teacher.email}
                      </div>
                    </td>
                    {[1, 2, 3, 4, 5, 6].map((periodNum) => {
                      const periodData = getPeriodData(periodNum);
                      return (
                        <td key={periodNum} className="py-3 px-4">
                          <div className="text-gray-900 dark:text-gray-100 font-medium">
                            {periodData.subject}
                          </div>
                          <div className="text-xs text-gray-600 dark:text-gray-400">
                            {periodData.time}
                          </div>
                        </td>
                      );
                    })}
                    <td className="py-3 px-4">
                      <div className="font-semibold text-blue-600 dark:text-blue-400">
                        {teacher.totalTimeDisplay || "0m"}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filteredTeacherStats.length === 0 && (
                <tr>
                  <td
                    className="py-4 text-center opacity-70"
                    colSpan={8}
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
