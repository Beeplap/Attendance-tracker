"use client";
import React from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Dialog } from "@headlessui/react";
import { BookOpen, CheckCircle, XCircle, Calendar } from "lucide-react";

export default function TeacherDetails({
  open,
  onClose,
  selectedTeacher,
}) {
  return (
    <Dialog open={open} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/50" aria-hidden="true" />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="bg-white dark:bg-gray-900 rounded-lg shadow-xl w-full max-w-2xl border border-gray-300 dark:border-gray-700">
          <Card className="shadow-none border-none">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-gray-800 dark:text-gray-100">
                Teacher Details - {selectedTeacher?.full_name}
              </CardTitle>
              <div className="text-xs opacity-70">
                Complete overview of classes and attendance
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              {selectedTeacher && (
                <>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 p-4 rounded-lg text-center">
                      <BookOpen className="w-8 h-8 text-blue-500 mx-auto mb-2" />
                      <div className="text-2xl font-bold text-blue-600">
                        {selectedTeacher.totalClasses}
                      </div>
                      <div className="text-xs text-blue-600">
                        Total Classes
                      </div>
                    </div>

                    <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 p-4 rounded-lg text-center">
                      <CheckCircle className="w-8 h-8 text-green-500 mx-auto mb-2" />
                      <div className="text-2xl font-bold text-green-600">
                        {selectedTeacher.completedClasses}
                      </div>
                      <div className="text-xs text-green-600">Completed</div>
                    </div>

                    <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-900/20 dark:to-yellow-800/20 p-4 rounded-lg text-center">
                      <Calendar className="w-8 h-8 text-yellow-500 mx-auto mb-2" />
                      <div className="text-2xl font-bold text-yellow-600">
                        {selectedTeacher.pendingClasses}
                      </div>
                      <div className="text-xs text-yellow-600">Pending</div>
                    </div>

                    <div className="bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 p-4 rounded-lg text-center">
                      <XCircle className="w-8 h-8 text-red-500 mx-auto mb-2" />
                      <div className="text-2xl font-bold text-red-600">
                        {selectedTeacher.missedClasses?.length || 0}
                      </div>
                      <div className="text-xs text-red-600">Missed Today</div>
                    </div>
                  </div>

                  {selectedTeacher.missedClasses &&
                    selectedTeacher.missedClasses.length > 0 && (
                      <div>
                        <h4 className="font-semibold text-red-600 mb-2">
                          Missed Attendance Today:
                        </h4>
                        <div className="space-y-2">
                          {selectedTeacher.missedClasses.map(
                            (missedClass, index) => (
                              <div
                                key={index}
                                className="flex items-center justify-between p-3 bg-red-50 dark:bg-red-900/20 rounded-lg"
                              >
                                <div>
                                  <div className="font-medium">
                                    {missedClass.className}
                                  </div>
                                  <div className="text-sm text-gray-600 dark:text-gray-400">
                                    {missedClass.subject}
                                  </div>
                                </div>
                                <div className="text-sm text-red-600">
                                  {missedClass.date}
                                </div>
                              </div>
                            )
                          )}
                        </div>
                      </div>
                    )}
                </>
              )}
            </CardContent>

            <CardFooter className="flex justify-end">
              <Button
                variant="outline"
                onClick={onClose}
                className="border-gray-400 text-gray-700 dark:text-gray-200"
              >
                Close
              </Button>
            </CardFooter>
          </Card>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
}
