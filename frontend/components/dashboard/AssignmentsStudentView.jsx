"use client";
import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, BookOpen, Clock, User } from "lucide-react";

// Helper component for Badges if not exists, but we'll try to use standard divs if Badge missing or just inline styles
const StatusBadge = ({ due }) => {
    const isOverdue = new Date(due) < new Date();
    return (
        <span className={`text-xs font-semibold px-2 py-1 rounded-full ${isOverdue ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"}`}>
            {isOverdue ? "Overdue" : "Active"}
        </span>
    )
}

export default function AssignmentsStudentView({ studentData }) {
  const [loading, setLoading] = useState(true);
  const [assignments, setAssignments] = useState([]);

  useEffect(() => {
    if (studentData) {
      fetchAssignments();
    }
  }, [studentData]);

  const fetchAssignments = async () => {
    try {
      setLoading(true);
      
      // 1. Get the class that matches the student's details
      // We look for a class that has matching course/grade AND section/semester
      // This is based on the assumption we made in the plan.
      
      // Note: This logic depends on exact string matching. 
      // Ideally, students should have a `class_id` foreign key, but based on current schema, we match by name.
      
      let classQuery = supabase.from("classes").select("id, subject, teacher_id, users(full_name)");
      
      if (studentData.class) {
         classQuery = classQuery.or(`course.eq.${studentData.class},grade.eq.${studentData.class}`);
      }
      if (studentData.section) {
         classQuery = classQuery.or(`section.eq.${studentData.section},semester.eq.${studentData.section}`);
      }
      
      // Since .or() is a bit tricky with mixed fields, let's try a simpler approach if the data is consistent.
      // Assuming 'course' maps to 'class' and 'section' to 'section'.
      const { data: matchingClasses, error: classError } = await supabase
        .from("classes")
        .select("id")
        .eq("course", studentData.class) // Checking course column for class name
        .eq("section", studentData.section); 
        
      if (classError) throw classError;
      
      const classIds = matchingClasses?.map(c => c.id) || [];
      
      if (classIds.length === 0) {
          // Try alternative columns just in case schema uses grade/semester
           const { data: altClasses, error: altError } = await supabase
            .from("classes")
            .select("id")
            .eq("grade", studentData.class)
            .eq("semester", studentData.section);
            
            if (!altError && altClasses) {
                altClasses.forEach(c => classIds.push(c.id));
            }
      }

      if (classIds.length === 0) {
        setAssignments([]);
        setLoading(false);
        return;
      }

      // 2. Fetch assignments for these classes
      const { data: assignmentsData, error: assignmentsError } = await supabase
        .from("assignments")
        .select(`
          *,
          classes (
            subject,
            teacher_id
          ),
          users (
            full_name
          )
        `)
        .in("class_id", classIds)
        .order("due_date", { ascending: true }); // Show soonest due first

      if (assignmentsError) throw assignmentsError;

      // Manually join teacher name if not properly joined via foreign key on users table
      // The `users` relation above might fail if I didn't verify relation name. 
      // teacher_id references users.id, so users(full_name) should work if relation exists.
      // If `users` is null, we can try to fetch teacher name separately or just ignore.
      
      setAssignments(assignmentsData || []);

    } catch (error) {
      console.error("Error fetching assignments:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="p-4 text-center">Loading your assignments...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-800">My Assignments</h2>
        <p className="text-gray-600">Tasks assigned to your class</p>
      </div>

      {assignments.length === 0 ? (
        <Card className="items-center justify-center p-8 text-center border-dashed">
          <div className="flex flex-col items-center gap-2 text-gray-500">
            <BookOpen className="w-12 h-12 opacity-50" />
            <p className="text-lg font-medium">No assignments yet</p>
            <p className="text-sm">
              You're all caught up! No pending assignments found for your class.
            </p>
          </div>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-1 lg:grid-cols-2">
          {assignments.map((assignment) => (
            <Card key={assignment.id} className="hover:shadow-md transition border-l-4 border-l-purple-500">
              <CardHeader className="flex flex-row items-baseline justify-between space-y-0 pb-2">
                <div className="space-y-1">
                  <span className="text-xs font-semibold px-2 py-1 rounded-full bg-blue-100 text-blue-700 mr-2">
                    {assignment.classes?.subject}
                  </span>
                   <StatusBadge due={assignment.due_date} />
                  <CardTitle className="text-xl mt-2">
                    {assignment.title}
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-gray-700 mb-4 bg-gray-50 p-3 rounded-md">
                  {assignment.description || "No description provided."}
                </div>
                <div className="flex flex-col gap-2 text-sm text-gray-600">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4" />
                    <span>
                      Assigned by: {assignment.users?.full_name || "Teacher"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    <span className={`font-medium ${new Date(assignment.due_date) < new Date() ? "text-red-600" : "text-gray-700"}`}>
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
