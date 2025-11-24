"use client";
import React, { useState, useEffect } from "react";
import { Dialog } from "@headlessui/react";
import { Button } from "./button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from "./card";
import { supabase } from "../../lib/supabaseClient";
import { ArrowRightLeft } from "lucide-react";

export default function ClassSwitch({ open, onClose, onSwitchCreated }) {
  const [myClasses, setMyClasses] = useState([]);
  const [allTeachers, setAllTeachers] = useState([]);
  const [targetTeacherClasses, setTargetTeacherClasses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [requesterClassId, setRequesterClassId] = useState("");
  const [targetTeacherId, setTargetTeacherId] = useState("");
  const [targetClassId, setTargetClassId] = useState("");
  const [switchDate, setSwitchDate] = useState("");
  const [reason, setReason] = useState("");

  useEffect(() => {
    if (open) {
      fetchMyClasses();
      fetchAllTeachers();
      const today = new Date().toISOString().split("T")[0];
      setSwitchDate(today);
      setRequesterClassId("");
      setTargetTeacherId("");
      setTargetClassId("");
      setReason("");
      setError("");
      setSuccess("");
    }
  }, [open]);

  useEffect(() => {
    if (targetTeacherId) {
      fetchTargetTeacherClasses(targetTeacherId);
    } else {
      setTargetTeacherClasses([]);
      setTargetClassId("");
    }
  }, [targetTeacherId]);

  const fetchMyClasses = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      const { data: classes } = await supabase
        .from("classes")
        .select("*")
        .eq("teacher_id", user.id)
        .order("created_at", { ascending: true });

      setMyClasses(classes || []);
    } catch (error) {
      console.error("Error fetching classes:", error);
    }
  };

  const fetchAllTeachers = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      const { data: teachers } = await supabase
        .from("users")
        .select("id, full_name, email")
        .eq("role", "teacher")
        .neq("id", user.id);

      setAllTeachers(teachers || []);
    } catch (error) {
      console.error("Error fetching teachers:", error);
    }
  };

  const fetchTargetTeacherClasses = async (teacherId) => {
    setFetching(true);
    try {
      const { data: classes } = await supabase
        .from("classes")
        .select("*")
        .eq("teacher_id", teacherId)
        .order("created_at", { ascending: true });

      setTargetTeacherClasses(classes || []);
    } catch (error) {
      console.error("Error fetching target teacher classes:", error);
    } finally {
      setFetching(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!requesterClassId || !targetTeacherId || !targetClassId || !switchDate) {
      setError("All fields are required");
      return;
    }

    const switchDateObj = new Date(switchDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (switchDateObj < today) {
      setError("Switch date cannot be in the past");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/class-switches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requester_class_id: requesterClassId,
          target_teacher_id: targetTeacherId,
          target_class_id: targetClassId,
          switch_date: switchDate,
          reason: reason.trim() || null,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to create switch request");
      }

      setSuccess("Switch request sent successfully! Waiting for teacher approval...");
      setRequesterClassId("");
      setTargetTeacherId("");
      setTargetClassId("");
      setSwitchDate(new Date().toISOString().split("T")[0]);
      setReason("");

      if (onSwitchCreated) {
        onSwitchCreated();
      }

      setTimeout(() => {
        onClose();
        setSuccess("");
      }, 2000);
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setRequesterClassId("");
    setTargetTeacherId("");
    setTargetClassId("");
    setSwitchDate("");
    setReason("");
    setError("");
    setSuccess("");
    onClose();
  };

  const selectedMyClass = myClasses.find((c) => c.id === requesterClassId);
  const selectedTargetClass = targetTeacherClasses.find((c) => c.id === targetClassId);

  return (
    <Dialog open={open} onClose={handleClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/50" aria-hidden="true" />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="bg-white dark:bg-gray-900 rounded-lg shadow-xl w-full max-w-2xl border border-gray-300 dark:border-gray-700 max-h-[90vh] overflow-y-auto">
          <Card className="shadow-none border-none">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-gray-800 dark:text-gray-100 flex items-center gap-2">
                <ArrowRightLeft className="w-5 h-5" />
                Request Class Switch
              </CardTitle>
              <div className="text-xs opacity-70">
                Request to switch classes with another teacher
              </div>
            </CardHeader>

            <form onSubmit={handleSubmit}>
              <CardContent className="space-y-4">
                {error && (
                  <div className="p-3 bg-red-50 dark:bg-red-900/20 text-red-600 rounded-lg text-sm">
                    {error}
                  </div>
                )}
                {success && (
                  <div className="p-3 bg-green-50 dark:bg-green-900/20 text-green-600 rounded-lg text-sm">
                    {success}
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      My Class <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={requesterClassId}
                      onChange={(e) => setRequesterClassId(e.target.value)}
                      className="w-full border rounded-md px-3 py-2 bg-white/80 dark:bg-black/20"
                      required
                    >
                      <option value="">Select your class</option>
                      {myClasses.map((cls) => (
                        <option key={cls.id} value={cls.id}>
                          {cls.subject} - {cls.course} {cls.semester}
                        </option>
                      ))}
                    </select>
                    {selectedMyClass && (
                      <p className="text-xs text-gray-500 mt-1">
                        {selectedMyClass.subject} ({selectedMyClass.course} - {selectedMyClass.semester})
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Switch With Teacher <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={targetTeacherId}
                      onChange={(e) => setTargetTeacherId(e.target.value)}
                      className="w-full border rounded-md px-3 py-2 bg-white/80 dark:bg-black/20"
                      required
                    >
                      <option value="">Select teacher</option>
                      {allTeachers.map((teacher) => (
                        <option key={teacher.id} value={teacher.id}>
                          {teacher.full_name} ({teacher.email})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Their Class <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={targetClassId}
                      onChange={(e) => setTargetClassId(e.target.value)}
                      disabled={!targetTeacherId || fetching}
                      className="w-full border rounded-md px-3 py-2 bg-white/80 dark:bg-black/20 disabled:opacity-50"
                      required
                    >
                      <option value="">
                        {fetching
                          ? "Loading classes..."
                          : !targetTeacherId
                          ? "Select teacher first"
                          : "Select their class"}
                      </option>
                      {targetTeacherClasses.map((cls) => (
                        <option key={cls.id} value={cls.id}>
                          {cls.subject} - {cls.course} {cls.semester}
                        </option>
                      ))}
                    </select>
                    {selectedTargetClass && (
                      <p className="text-xs text-gray-500 mt-1">
                        {selectedTargetClass.subject} ({selectedTargetClass.course} - {selectedTargetClass.semester})
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Switch Date <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      value={switchDate}
                      onChange={(e) => setSwitchDate(e.target.value)}
                      min={new Date().toISOString().split("T")[0]}
                      className="w-full border rounded-md px-3 py-2 bg-white/80 dark:bg-black/20"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    Reason (Optional)
                  </label>
                  <textarea
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    rows={3}
                    className="w-full border rounded-md px-3 py-2 bg-white/80 dark:bg-black/20"
                    placeholder="Optional: Provide a reason for the switch..."
                  />
                </div>
              </CardContent>

              <CardFooter className="flex gap-2 justify-end">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleClose}
                  disabled={loading}
                  className="border-gray-400 text-gray-700 dark:text-gray-200"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={loading || !requesterClassId || !targetTeacherId || !targetClassId || !switchDate}
                  className="bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-700 hover:to-violet-700 text-white"
                >
                  {loading ? "Sending..." : "Send Request"}
                </Button>
              </CardFooter>
            </form>
          </Card>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
}

