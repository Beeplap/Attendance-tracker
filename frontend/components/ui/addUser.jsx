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

export default function AddUser({ open, onClose, onUserAdded, defaultRole = "teacher" }) {
  const [addLoading, setAddLoading] = useState(false);
  const [addError, setAddError] = useState("");
  const [addSuccess, setAddSuccess] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newFullName, setNewFullName] = useState("");
  const [newRole, setNewRole] = useState(defaultRole);

  // Update role when defaultRole prop changes
  useEffect(() => {
    if (open) {
      setNewRole(defaultRole);
    }
  }, [defaultRole, open]);

  const handleAddUser = async () => {
    setAddLoading(true);
    setAddError("");
    setAddSuccess("");

    try {
      const res = await fetch("/api/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: newEmail,
          password: newPassword,
          full_name: newFullName,
          role: newRole,
        }),
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
        <Dialog.Panel className="bg-white dark:bg-gray-900 rounded-lg shadow-xl w-full max-w-md border border-gray-300 dark:border-gray-700">
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
                disabled={addLoading || !newEmail || !newPassword || !newFullName}
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
