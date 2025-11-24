"use client";
import React from "react";
import {
  BookOpen,
  CalendarDays,
  GraduationCap,
  Home,
  Menu,
  School,
  X,
  Bell,
  ClipboardList,
} from "lucide-react";

export default function StudentSidebar({
  open,
  onOpenChange,
  collapsed = false,
  onToggleCollapsed,
  onRequestLeave,
}) {
  const navItemClass = (active) =>
    `group w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 text-sm font-medium ${
      active
        ? "bg-gradient-to-r from-purple-600 to-violet-600 text-white shadow-md"
        : "text-gray-700 hover:bg-gray-50 hover:text-purple-600"
    }`;

  const Content = (
    <div
      className={`bg-white border-r border-gray-200 ${
        collapsed ? "p-2" : "p-4"
      } h-full flex flex-col shadow-sm`}
    >
      <div className="flex items-center justify-between mb-6">
        {!collapsed && (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-purple-600 to-violet-600 rounded-lg flex items-center justify-center shadow-md">
              <GraduationCap className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">Student</h2>
              <p className="text-xs text-gray-500">Dashboard</p>
            </div>
          </div>
        )}
        {onToggleCollapsed && (
          <button
            onClick={onToggleCollapsed}
            className="inline-flex items-center justify-center w-8 h-8 rounded-lg hover:bg-gray-100 transition text-gray-600 hover:text-gray-900"
            aria-label="Toggle sidebar"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}
        {open && (
          <button
            onClick={() => onOpenChange && onOpenChange(false)}
            className="inline-flex items-center justify-center w-8 h-8 rounded-lg hover:bg-gray-100 transition text-gray-600 hover:text-gray-900 sm:hidden"
            aria-label="Close sidebar"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      <nav className="flex-1 overflow-y-auto space-y-1">
        {!collapsed && (
          <div className="mb-4">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-3 mb-2">
              Main
            </p>
          </div>
        )}

        <button className={navItemClass(true)}>
          <Home className="w-5 h-5 shrink-0" />
          {!collapsed && <span className="flex-1 text-left">Overview</span>}
        </button>

        <button className={navItemClass(false)}>
          <CalendarDays className="w-5 h-5 shrink-0" />
          {!collapsed && <span className="flex-1 text-left">Schedule</span>}
        </button>

        <button className={navItemClass(false)}>
          <BookOpen className="w-5 h-5 shrink-0" />
          {!collapsed && <span className="flex-1 text-left">Classes</span>}
        </button>

        <button className={navItemClass(false)}>
          <School className="w-5 h-5 shrink-0" />
          {!collapsed && <span className="flex-1 text-left">Subjects</span>}
        </button>

        <button className={navItemClass(false)}>
          <ClipboardList className="w-5 h-5 shrink-0" />
          {!collapsed && <span className="flex-1 text-left">Assignments</span>}
        </button>

        {!collapsed && (
          <div className="my-4">
            <div className="h-px bg-gray-200"></div>
          </div>
        )}

        {!collapsed && (
          <div className="mb-4">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-3 mb-2">
              Actions
            </p>
          </div>
        )}

        <button
          onClick={onRequestLeave}
          className="group w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 text-sm font-medium bg-white border border-purple-200 text-purple-700 hover:bg-purple-50 hover:border-purple-300 hover:shadow-sm"
        >
          <Bell className="w-5 h-5 shrink-0" />
          {!collapsed && <span className="flex-1 text-left">Request Leave</span>}
        </button>
      </nav>
    </div>
  );

  return (
    <>
      <aside
        className={`${
          collapsed ? "w-16" : "w-64"
        } shrink-0 hidden sm:block transition-all duration-300 overflow-hidden bg-white border-r border-gray-200`}
      >
        {Content}
      </aside>

      {open && (
        <div className="fixed inset-0 z-50 sm:hidden">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => onOpenChange && onOpenChange(false)}
          />
          <div className="absolute inset-y-0 left-0 w-72 bg-white shadow-xl animate-[slideIn_.3s_ease-out]">
            {Content}
          </div>
        </div>
      )}
    </>
  );
}

