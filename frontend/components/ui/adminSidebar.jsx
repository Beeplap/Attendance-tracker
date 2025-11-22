"use client";
import React, { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  Home,
  Users,
  UserPlus,
  GraduationCap,
  LogOut,
  Menu,
  Settings,
} from "lucide-react";
import { supabase } from "../../lib/supabaseClient";

export default function AdminSidebar({
  open,
  onOpenChange,
  collapsed = false,
  onToggleCollapsed,
  onAddTeacher,
  onAddStudent,
}) {
  const pathname = usePathname();
  const router = useRouter();

  const signOut = async () => {
    await supabase.auth.signOut();
    router.replace("/login");
  };

  const navItemClass = (active) =>
    `group w-full flex items-center px-3 py-2 rounded-xl border transition-all duration-200 text-sm ${
      active
        ? "bg-purple-100 border-purple-300 text-gray-900 font-medium"
        : "bg-white border-transparent hover:bg-purple-50 hover:border-purple-200 text-gray-700"
    }`;

  const Content = (
    <div
      className={`rounded-2xl border border-purple-200 bg-white ${
        collapsed ? "p-2" : "p-3 sm:p-4"
      } shadow-sm h-full flex flex-col`}
    >
      {/* Top: Admin title + toggle */}
      <div
        className={`flex items-center gap-3 rounded-xl bg-purple-50 border border-purple-200 ${
          collapsed ? "justify-center p-2" : "p-3"
        }`}
      >
        <div className="flex items-center gap-3">
          {onToggleCollapsed && (
            <button
              onClick={onToggleCollapsed}
              className="inline-flex items-center justify-center w-9 h-9 rounded-md border border-purple-200 hover:bg-purple-100 transition text-gray-700"
              aria-label="Toggle sidebar"
            >
              <Menu className="w-4 h-4" />
            </button>
          )}
        </div>

        {!collapsed && (
          <div className="min-w-0">
            <div className="text-sm font-medium text-gray-900 truncate">Admin Panel</div>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="mt-3 space-y-1 flex-1 overflow-y-auto">
        {/* Dashboard */}
        <button
          onClick={() => router.push("/admin")}
          className={navItemClass(pathname === "/admin")}
        >
          <Home className={"w-4 h-4 text-gray-600 group-hover:text-purple-600"} />
          {!collapsed && <span className="flex-1 text-left">Dashboard</span>}
        </button>

        {/* Add Teacher */}
        <button
          onClick={onAddTeacher}
          className={navItemClass(false)}
        >
          <UserPlus className={"w-4 h-4 text-gray-600 group-hover:text-purple-600"} />
          {!collapsed && <span className="flex-1 text-left">Add Teacher</span>}
        </button>

        {/* Add Student */}
        <button
          onClick={onAddStudent}
          className={navItemClass(false)}
        >
          <GraduationCap className={"w-4 h-4 text-gray-600 group-hover:text-purple-600"} />
          {!collapsed && <span className="flex-1 text-left">Add Student</span>}
        </button>

        {/* View Teachers */}
        <button
          onClick={() => router.push("/teachers")}
          className={navItemClass(pathname === "/teachers")}
        >
          <Users className={"w-4 h-4 text-gray-600 group-hover:text-purple-600"} />
          {!collapsed && <span className="flex-1 text-left">View Teachers</span>}
        </button>

        {/* View Students */}
        <button
          onClick={() => router.push("/students")}
          className={navItemClass(pathname === "/students")}
        >
          <Users className={"w-4 h-4 text-gray-600 group-hover:text-purple-600"} />
          {!collapsed && <span className="flex-1 text-left">View Students</span>}
        </button>
      </nav>

      {/* Sign out at bottom */}
      <div className="mt-4">
        <button
          onClick={signOut}
          className="group w-full flex items-center px-3 py-2 rounded-xl border transition-all duration-200 text-sm bg-white border-transparent hover:bg-purple-50 hover:border-purple-200 text-gray-700"
        >
          <LogOut className="w-4 h-4 text-gray-600 group-hover:text-purple-600" />
          {!collapsed && <span className="flex-1 text-left">Sign Out</span>}
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside
        className={`${collapsed ? "w-16" : "w-full sm:w-64 md:w-72 lg:w-72"} shrink-0 hidden sm:block transition-all duration-200 overflow-hidden`}
      >
        {Content}
      </aside>

      {/* Mobile Sidebar */}
      {open && (
        <div className="fixed inset-0 z-50 sm:hidden">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => onOpenChange && onOpenChange(false)}
          />
          <div className="absolute inset-y-0 left-0 w-72 p-3 animate-[slideIn_.2s_ease-out]">
            {Content}
          </div>
        </div>
      )}
    </>
  );
}

