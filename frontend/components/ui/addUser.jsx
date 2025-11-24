"use client";
import React, { useState, useEffect } from "react";
import { Button } from "./button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from "./card";
import { Dialog } from "@headlessui/react";
import { X, Plus } from "lucide-react";

export default function AddUser({ open, onClose, onUserAdded, defaultRole = "teacher" }) {
  const [addLoading, setAddLoading] = useState(false);
  const [addError, setAddError] = useState("");
  const [addSuccess, setAddSuccess] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newFullName, setNewFullName] = useState("");
  const [newRole, setNewRole] = useState(defaultRole);
  
  // Student-specific fields
  const [batchYear, setBatchYear] = useState("");
  const [gender, setGender] = useState("");
  const [course, setCourse] = useState("");
  const [semester, setSemester] = useState("");
  const [subjects, setSubjects] = useState([""]);
  const [phoneNumber, setPhoneNumber] = useState("");

  // Update role when defaultRole prop changes
  useEffect(() => {
    if (open) {
      setNewRole(defaultRole);
      // Reset student-specific fields when opening
      setBatchYear("");
      setGender("");
      setCourse("");
      setSemester("");
      setSubjects([""]);
      setPhoneNumber("");
    }
  }, [defaultRole, open]);

  const addSubject = () => {
    setSubjects([...subjects, ""]);
  };

  const removeSubject = (index) => {
    if (subjects.length > 1) {
      setSubjects(subjects.filter((_, i) => i !== index));
    }
  };

  const updateSubject = (index, value) => {
    const newSubjects = [...subjects];
    newSubjects[index] = value;
    setSubjects(newSubjects);
  };

  const handleAddUser = async () => {
    setAddLoading(true);
    setAddError("");
    setAddSuccess("");

    try {
      // Validate student-specific fields if role is student
      if (newRole === "student") {
        if (!batchYear || !gender || !course || !semester || !phoneNumber) {
          throw new Error("Please fill all required student fields");
        }
        const validSubjects = subjects.filter(s => s.trim() !== "");
        if (validSubjects.length === 0) {
          throw new Error("Please add at least one subject");
        }
      }

      const requestBody = {
        email: newEmail,
        password: newPassword,
        full_name: newFullName,
        role: newRole,
      };

      // Add student-specific fields
      if (newRole === "student") {
        requestBody.batch_year = batchYear;
        requestBody.gender = gender;
        requestBody.course = course;
        requestBody.semester = semester;
        requestBody.subjects = subjects.filter(s => s.trim() !== "");
        requestBody.phone_number = phoneNumber;
      }

      const res = await fetch("/api/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to add user");
      }

      setAddSuccess("User added successfully!");
      setNewEmail("");
      setNewPassword("");
      setNewFullName("");
      setNewRole("teacher");
      setBatchYear("");
      setGender("");
      setCourse("");
      setSemester("");
      setSubjects([""]);
      setPhoneNumber("");
      
      onUserAdded();

      setTimeout(() => {
        onClose();
        setAddSuccess("");
      }, 1500);
    } catch (error) {
      setAddError(error.message);
    } finally {
      setAddLoading(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      className="relative z-50"
    >
      <div className="fixed inset-0 bg-black/50" aria-hidden="true" />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="bg-white dark:bg-gray-900 rounded-lg shadow-xl w-full max-w-2xl border border-gray-300 dark:border-gray-700 max-h-[90vh] overflow-y-auto">
          <Card className="shadow-none border-none">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-gray-800 dark:text-gray-100">
                Add New User
              </CardTitle>
              <div className="text-xs opacity-70">
                Create a new user account
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              {addError && (
                <div className="p-3 bg-red-50 dark:bg-red-900/20 text-red-600 rounded-lg text-sm">
                  {addError}
                </div>
              )}
              {addSuccess && (
                <div className="p-3 bg-green-50 dark:bg-green-900/20 text-green-600 rounded-lg text-sm">
                  {addSuccess}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium mb-1">Full Name</label>
                <input
                  type="text"
                  value={newFullName}
                  onChange={(e) => setNewFullName(e.target.value)}
                  className="w-full border rounded-md px-3 py-2 bg-white/80 dark:bg-black/20"
                  placeholder="John Doe"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Email</label>
                <input
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  className="w-full border rounded-md px-3 py-2 bg-white/80 dark:bg-black/20"
                  placeholder="user@example.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Password</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full border rounded-md px-3 py-2 bg-white/80 dark:bg-black/20"
                  placeholder="Min 6 characters"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Role</label>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value)}
                  className="w-full border rounded-md px-3 py-2 bg-white/80 dark:bg-black/20"
                >
                  <option value="student">Student</option>
                  <option value="teacher">Teacher</option>
                  <option value="admin">Admin</option>
                </select>
              </div>

              {/* Student-specific fields */}
              {newRole === "student" && (
                <>
                  <div className="border-t pt-4 mt-4">
                    <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                      Student Information
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">
                        Batch Year <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        value={batchYear}
                        onChange={(e) => setBatchYear(e.target.value)}
                        className="w-full border rounded-md px-3 py-2 bg-white/80 dark:bg-black/20"
                        placeholder="2080"
                        min="2000"
                        max="2100"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-1">
                        Gender <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={gender}
                        onChange={(e) => setGender(e.target.value)}
                        className="w-full border rounded-md px-3 py-2 bg-white/80 dark:bg-black/20"
                      >
                        <option value="">Select Gender</option>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-1">
                        Course <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={course}
                        onChange={(e) => setCourse(e.target.value.toUpperCase())}
                        className="w-full border rounded-md px-3 py-2 bg-white/80 dark:bg-black/20"
                        placeholder="BCA, BSc, etc."
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-1">
                        Semester <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={semester}
                        onChange={(e) => setSemester(e.target.value)}
                        className="w-full border rounded-md px-3 py-2 bg-white/80 dark:bg-black/20"
                        placeholder="1st, 2nd, 3rd, etc."
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-sm font-medium mb-1">
                        Phone Number <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="tel"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        className="w-full border rounded-md px-3 py-2 bg-white/80 dark:bg-black/20"
                        placeholder="+977 98XXXXXXXX"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-sm font-medium mb-1">
                        Subjects <span className="text-red-500">*</span>
                      </label>
                      {subjects.map((subject, index) => (
                        <div key={index} className="flex gap-2 mb-2">
                          <input
                            type="text"
                            value={subject}
                            onChange={(e) => updateSubject(index, e.target.value)}
                            className="flex-1 border rounded-md px-3 py-2 bg-white/80 dark:bg-black/20"
                            placeholder={`Subject ${index + 1}`}
                          />
                          {subjects.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeSubject(index)}
                              className="px-3 py-2 border border-red-300 text-red-600 rounded-md hover:bg-red-50 dark:hover:bg-red-900/20"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={addSubject}
                        className="mt-2 flex items-center gap-2 px-3 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50 dark:hover:bg-gray-800"
                      >
                        <Plus className="w-4 h-4" />
                        Add Subject
                      </button>
                    </div>
                  </div>
                </>
              )}
            </CardContent>

            <CardFooter className="flex gap-2 justify-end">
              <Button
                variant="outline"
                onClick={() => {
                  onClose();
                  setAddError("");
                  setAddSuccess("");
                }}
                disabled={addLoading}
                className="border-gray-400 text-gray-700 dark:text-gray-200"
              >
                Cancel
              </Button>
              <Button
                onClick={handleAddUser}
                disabled={
                  addLoading || 
                  !newEmail || 
                  !newPassword || 
                  !newFullName ||
                  (newRole === "student" && (!batchYear || !gender || !course || !semester || !phoneNumber || subjects.filter(s => s.trim() !== "").length === 0))
                }
                className="bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-700 hover:to-violet-700 text-white"
              >
                {addLoading ? "Adding..." : "Add User"}
              </Button>
            </CardFooter>
          </Card>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
}
