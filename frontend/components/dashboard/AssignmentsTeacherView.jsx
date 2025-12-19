"use client";
import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Calendar, BookOpen, Clock, Trash2, Edit } from "lucide-react";

export default function AssignmentsTeacherView({ teacherId }) {
  const [loading, setLoading] = useState(true);
  const [assignments, setAssignments] = useState([]);
  const [classes, setClasses] = useState([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [submissionLoading, setSubmissionLoading] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    class_id: "",
    due_date: "",
  });

  useEffect(() => {
    fetchData();
  }, [teacherId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      await Promise.all([fetchAssignments(), fetchClasses()]);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAssignments = async () => {
    const { data, error } = await supabase
      .from("assignments")
      .select(`
        *,
        classes (
          subject,
          course,
          section
        )
      `)
      .eq("teacher_id", teacherId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching assignments:", error);
    } else {
      setAssignments(data || []);
    }
  };

  const fetchClasses = async () => {
    const { data, error } = await supabase
      .from("classes")
      .select("*")
      .eq("teacher_id", teacherId);

    if (error) {
      console.error("Error fetching classes:", error);
    } else {
      setClasses(data || []);
    }
  };

  const handleCreateAssignment = async (e) => {
    e.preventDefault();
    setSubmissionLoading(true);

    try {
      const { error } = await supabase.from("assignments").insert({
        teacher_id: teacherId,
        title: formData.title,
        description: formData.description,
        class_id: formData.class_id,
        due_date: formData.due_date,
      });

      if (error) throw error;

      // Reset form and refresh list
      setFormData({
        title: "",
        description: "",
        class_id: "",
        due_date: "",
      });
      setShowCreateForm(false);
      await fetchAssignments();
    } catch (error) {
      console.error("Error creating assignment:", error);
      alert("Failed to create assignment. Please try again.");
    } finally {
      setSubmissionLoading(false);
    }
  };

  const handleDeleteAssignment = async (id) => {
    if (!confirm("Are you sure you want to delete this assignment?")) return;

    try {
      const { error } = await supabase.from("assignments").delete().eq("id", id);
      if (error) throw error;
      await fetchAssignments();
    } catch (error) {
      console.error("Error deleting assignment:", error);
      alert("Failed to delete assignment.");
    }
  };

  if (loading) {
    return <div className="p-4 text-center">Loading assignments...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Assignments</h2>
          <p className="text-gray-600">Manage assignments for your classes</p>
        </div>
        {!showCreateForm && (
          <Button
            onClick={() => setShowCreateForm(true)}
            className="bg-purple-600 hover:bg-purple-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Assignment
          </Button>
        )}
      </div>

      {showCreateForm && (
        <Card className="border-purple-200 shadow-md">
          <CardHeader>
            <CardTitle>Create New Assignment</CardTitle>
            <CardDescription>
               unexpected issues? contact admin.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateAssignment} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Title</label>
                  <input
                    type="text"
                    required
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    placeholder="Assignment Title"
                    value={formData.title}
                    onChange={(e) =>
                      setFormData({ ...formData, title: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Class</label>
                  <select
                    required
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    value={formData.class_id}
                    onChange={(e) =>
                      setFormData({ ...formData, class_id: e.target.value })
                    }
                  >
                    <option value="">Select a class</option>
                    {classes.map((cls) => (
                      <option key={cls.id} value={cls.id}>
                        {cls.subject} ({cls.course || cls.grade} -{" "}
                        {cls.section || cls.semester})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Description</label>
                <textarea
                  className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  rows={3}
                  placeholder="Assignment instructions..."
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Due Date</label>
                <input
                  type="datetime-local"
                  required
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  value={formData.due_date}
                  onChange={(e) =>
                    setFormData({ ...formData, due_date: e.target.value })
                  }
                />
              </div>

              <div className="flex gap-2 justify-end">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setShowCreateForm(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={submissionLoading}
                  className="bg-purple-600 hover:bg-purple-700"
                >
                  {submissionLoading ? "Creating..." : "Create Assignment"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {assignments.length === 0 ? (
        <Card className="items-center justify-center p-8 text-center border-dashed">
          <div className="flex flex-col items-center gap-2 text-gray-500">
            <BookOpen className="w-12 h-12 opacity-50" />
            <p className="text-lg font-medium">No assignments yet</p>
            <p className="text-sm">
              Create your first assignment to get started.
            </p>
          </div>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-1 lg:grid-cols-2">
          {assignments.map((assignment) => (
            <Card key={assignment.id} className="hover:shadow-md transition">
              <CardHeader className="flex flex-row items-baseline justify-between space-y-0 pb-2">
                <div className="space-y-1">
                  <span className="text-xs font-semibold px-2 py-1 rounded-full bg-blue-100 text-blue-700">
                    {assignment.classes?.subject}
                  </span>
                  <CardTitle className="text-xl line-clamp-1">
                    {assignment.title}
                  </CardTitle>
                </div>
                <div className="flex gap-2">
                    <Button 
                        size="icon" 
                        variant="ghost" 
                        className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
                        onClick={() => handleDeleteAssignment(assignment.id)}
                    >
                        <Trash2 className="h-4 w-4" />
                    </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-gray-500 mb-4 line-clamp-2">
                  {assignment.description || "No description provided."}
                </div>
                <div className="flex flex-col gap-2 text-sm text-gray-600">
                  <div className="flex items-center gap-2">
                    <BookOpen className="w-4 h-4" />
                    <span>
                      {assignment.classes?.course || assignment.classes?.grade} -{" "}
                      {assignment.classes?.section ||
                        assignment.classes?.semester}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    <span>
                      Due: {new Date(assignment.due_date).toLocaleString()}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
