"use client";
import React, { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  Home,
  Users,
  User,
  BarChart2,
  ChevronDown,
  LogOut,
  Menu,
} from "lucide-react";
import { supabase } from "../../lib/supabaseClient";


export default function Sidebar({
  open,
  onOpenChange,
  collapsed = false,
  onToggleCollapsed,
  onSignOut,
}) {
  const pathname = usePathname();
  const router = useRouter();

  // local state for dropdowns (teachers, students)
  const [teachersOpen, setTeachersOpen] = useState(false);
  const [studentsOpen, setStudentsOpen] = useState(false);

  // Helper to handle dropdown click with Option A behaviour:
  // If sidebar is collapsed, DO NOT open dropdowns. Instead, expand sidebar first (user must click again to open dropdown).
  const handleDropdownToggle = (which) => {
    if (collapsed) {
      // If an onToggleCollapsed prop exists, expand the sidebar on first click. Do not open dropdown.
      if (onToggleCollapsed) onToggleCollapsed();
      return;
    }

    if (which === "teachers") setTeachersOpen((s) => !s);
    if (which === "students") setStudentsOpen((s) => !s);
  };
    const signOut = async () => {
      await supabase.auth.signOut();
      router.replace("/");
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
      {/* Top: teacher name + single toggle */}
      <div
        className={`flex items-center gap-3 rounded-xl bg-purple-50 border border-purple-200 ${
          collapsed ? "justify-center p-2" : "p-3"
        }`}
      >
        <div className="flex items-center gap-3">
          {/* Avatar removed as requested */}
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
            <div className="text-sm font-medium text-gray-900 truncate">
              Mr. Rajesh Sharma
            </div>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="mt-3 space-y-1 flex-1 overflow-y-auto">
        {/* Dashboard */}
        <button
          onClick={() => router.push("/dashboard")}
          className={navItemClass(pathname === "/dashboard")}
        >
          <Home className={"w-4 h-4 text-gray-600 group-hover:text-purple-600"} />
          {!collapsed && <span className="flex-1 text-left">Dashboard</span>}
        </button>

        {/* Teachers dropdown */}
        <div>
          <button
            onClick={() => handleDropdownToggle("teachers")}
            className={navItemClass(pathname?.startsWith("/teachers")) + (collapsed ? " justify-center" : " gap-3")}
          >
            <User className={"w-4 h-4 text-gray-600 group-hover:text-purple-600"} />
            {!collapsed && <span className="flex-1 text-left">Teachers</span>}
            {!collapsed && (
              <ChevronDown
                className={`w-4 h-4 transition-transform ${teachersOpen ? "rotate-180" : ""} opacity-70`}
              />
            )}
          </button>

          {/* Dropdown items (hidden when collapsed due to behaviour A) */}
          {!collapsed && teachersOpen && (
            <div className="mt-2 space-y-1 pl-8">
              <button
                onClick={() => router.push("/teachers/info")}
                className="w-full text-sm text-left px-2 py-1 rounded-md hover:bg-purple-50/50"
              >
                Info
              </button>
              <button
                onClick={() => router.push("/teachers/stats")}
                className="w-full text-sm text-left px-2 py-1 rounded-md hover:bg-purple-50/50 flex items-center gap-2"
              >
                <BarChart2 className="w-4 h-4 opacity-80" />
                <span>Stats</span>
              </button>
            </div>
          )}
        </div>

        {/* Students dropdown */}
        <div>
          <button
            onClick={() => handleDropdownToggle("students")}
            className={navItemClass(pathname?.startsWith("/students")) + (collapsed ? " justify-center" : " gap-3")}
          >
            <Users className={"w-4 h-4 text-gray-600 group-hover:text-purple-600"} />
            {!collapsed && <span className="flex-1 text-left">Students</span>}
            {!collapsed && (
              <ChevronDown
                className={`w-4 h-4 transition-transform ${studentsOpen ? "rotate-180" : ""} opacity-70`}
              />
            )}
          </button>

          {!collapsed && studentsOpen && (
            <div className="mt-2 space-y-1 pl-8">
              <button
                onClick={() => router.push("/students/info")}
                className="w-full text-sm text-left px-2 py-1 rounded-md hover:bg-purple-50/50"
              >
                Info
              </button>
              <button
                onClick={() => router.push("/students/stats")}
                className="w-full text-sm text-left px-2 py-1 rounded-md hover:bg-purple-50/50 flex items-center gap-2"
              >
                <BarChart2 className="w-4 h-4 opacity-80" />
                <span>Stats</span>
              </button>
            </div>
          )}
        </div>
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
