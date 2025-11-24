"use client";
import React, { useState, Fragment } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { Button } from "./button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from "./card";

export default function AddSubject({ open, onClose, onCreated }) {
  const [newSubject, setNewSubject] = useState({
    subject_name: "",
    course_code: "",
    semester: "",
    description: "",
    credits: 3,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleSubmit = async () => {
    setError("");
    setSuccess("");
    setLoading(true);
    try {
      const res = await fetch("/api/subjects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...newSubject,
          semester: parseInt(newSubject.semester),
          credits: parseInt(newSubject.credits) || 3,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || "Failed to add subject");
      setSuccess("Subject added successfully");
      setNewSubject({
        subject_name: "",
        course_code: "",
        semester: "",
        description: "",
        credits: 3,
      });
      if (typeof onCreated === "function") onCreated(json.subject || null);
      // close after short delay
      setTimeout(() => onClose && onClose(), 500);
    } catch (err) {
      setError(err.message || String(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Transition appear show={open} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <div className="fixed inset-0 bg-black/50" aria-hidden="true" />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="bg-white dark:bg-gray-900 rounded-lg shadow-xl w-full max-w-lg border border-gray-300 dark:border-gray-700">
            <Card className="shadow-none border-none">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-gray-800 dark:text-gray-100">
                  Add Subject/Course
                </CardTitle>
                <div className="text-xs opacity-70">
                  Add a new subject with semester information
                </div>
              </CardHeader>

              <CardContent>
                {error && <p className="text-sm text-red-600 mb-2">{error}</p>}
                {success && (
                  <p className="text-sm text-green-600 mb-2">{success}</p>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1 sm:col-span-2">
                    <label className="text-sm font-medium">Subject Name *</label>
                    <input
                      type="text"
                      value={newSubject.subject_name}
                      onChange={(e) =>
                        setNewSubject({ ...newSubject, subject_name: e.target.value })
                      }
                      className="w-full border border-gray-300 rounded-md px-3 h-10 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-purple-500"
                      placeholder="Data Structures and Algorithms"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-sm font-medium">Course Code *</label>
                    <input
                      type="text"
                      value={newSubject.course_code}
                      onChange={(e) =>
                        setNewSubject({ ...newSubject, course_code: e.target.value.toUpperCase() })
                      }
                      className="w-full border border-gray-300 rounded-md px-3 h-10 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-purple-500"
                      placeholder="CS201"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-sm font-medium">Semester *</label>
                    <select
                      value={newSubject.semester}
                      onChange={(e) =>
                        setNewSubject({ ...newSubject, semester: e.target.value })
                      }
                      className="w-full border border-gray-300 rounded-md px-3 h-10 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    >
                      <option value="">Select Semester</option>
                      {[1, 2, 3, 4, 5, 6, 7, 8].map((sem) => (
                        <option key={sem} value={sem}>
                          Semester {sem}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-sm font-medium">Credits</label>
                    <select
                      value={newSubject.credits}
                      onChange={(e) =>
                        setNewSubject({ ...newSubject, credits: parseInt(e.target.value) })
                      }
                      className="w-full border border-gray-300 rounded-md px-3 h-10 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    >
                      {[1, 2, 3, 4, 5, 6].map((credit) => (
                        <option key={credit} value={credit}>
                          {credit} Credit{credit > 1 ? "s" : ""}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1 sm:col-span-2">
                    <label className="text-sm font-medium">Description (Optional)</label>
                    <textarea
                      value={newSubject.description}
                      onChange={(e) =>
                        setNewSubject({ ...newSubject, description: e.target.value })
                      }
                      className="w-full border border-gray-300 rounded-md px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-purple-500"
                      placeholder="Brief description of the subject..."
                      rows={3}
                    />
                  </div>
                </div>
              </CardContent>

              <CardFooter className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={onClose}
                  className="border-gray-400 text-gray-700 dark:text-gray-200"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={
                    loading ||
                    !newSubject.subject_name ||
                    !newSubject.course_code ||
                    !newSubject.semester
                  }
                  className="bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-700 hover:to-violet-700 text-white px-4 py-2 rounded-lg shadow-md transition-all duration-200"
                >
                  {loading ? "Adding…" : "Add Subject"}
                </Button>
              </CardFooter>
            </Card>
          </Dialog.Panel>
        </div>
      </Dialog>
    </Transition>
  );
}





