"use client";
import React, { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  Home,
  Users,
  UserPlus,
  GraduationCap,
  LogOut,
  Menu,
  BookOpen,
  LayoutDashboard,
  UserCheck,
  School,
  X,
  BarChart3,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { supabase } from "../../lib/supabaseClient";
import ConfirmDialog from "./ConfirmDialog";

export default function AdminSidebar({
  open,
  onOpenChange,
  collapsed = false,
  onToggleCollapsed,
  onAddTeacher,
  onAddStudent,
  onAssignClass,
  currentView = "dashboard",
  onViewChange,
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [statsExpanded, setStatsExpanded] = useState(
    currentView?.startsWith("statistics") || false
  );
  const [showSignOutConfirm, setShowSignOutConfirm] = useState(false);

  // Auto-expand statistics when navigating to a statistics view
  useEffect(() => {
    if (currentView?.startsWith("statistics")) {
      setStatsExpanded(true);
    }
  }, [currentView]);

  const signOut = async () => {
    await supabase.auth.signOut();
    router.replace("/login");
  };

  const navItemClass = (active, isAction = false) =>
    `group w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 text-sm font-medium ${
      active
        ? "bg-gradient-to-r from-purple-600 to-violet-600 text-white shadow-md"
        : isAction
        ? "bg-white border border-purple-200 text-purple-700 hover:bg-purple-50 hover:border-purple-300 hover:shadow-sm"
        : "text-gray-700 hover:bg-gray-50 hover:text-purple-600"
    }`;

  const Content = (
    <div
      className={`bg-white border-r border-gray-200 ${
        collapsed ? "p-2" : "p-4"
      } h-full flex flex-col shadow-sm`}
    >
      {/* Top: Admin title + toggle */}
      <div className="flex items-center justify-between mb-6">
        {!collapsed && (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-purple-600 to-violet-600 rounded-lg flex items-center justify-center shadow-md">
              <LayoutDashboard className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">Admin</h2>
              <p className="text-xs text-gray-500">Control Panel</p>
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

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto space-y-1">
        {/* Main Navigation Section */}
        {!collapsed && (
          <div className="mb-4">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-3 mb-2">
              Main
            </p>
          </div>
        )}

        {/* Dashboard */}
        <button
          onClick={() => onViewChange && onViewChange("dashboard")}
          className={navItemClass(currentView === "dashboard")}
        >
          <Home className="w-5 h-5 shrink-0" />
          {!collapsed && <span className="flex-1 text-left">Dashboard</span>}
        </button>

        {/* View Teachers */}
        <button
          onClick={() => onViewChange && onViewChange("teachers")}
          className={navItemClass(currentView === "teachers")}
        >
          <UserCheck className="w-5 h-5 shrink-0" />
          {!collapsed && <span className="flex-1 text-left">Teachers</span>}
        </button>

        {/* View Students */}
        <button
          onClick={() => onViewChange && onViewChange("students")}
          className={navItemClass(currentView === "students")}
        >
          <School className="w-5 h-5 shrink-0" />
          {!collapsed && <span className="flex-1 text-left">Students</span>}
        </button>

        {/* View Subjects */}
        <button
          onClick={() => onViewChange && onViewChange("subjects")}
          className={navItemClass(currentView === "subjects")}
        >
          <BookOpen className="w-5 h-5 shrink-0" />
          {!collapsed && <span className="flex-1 text-left">Subjects</span>}
        </button>

        {/* Statistics with submenu */}
        {!collapsed && (
          <>
            <button
              onClick={() => setStatsExpanded(!statsExpanded)}
              className={navItemClass(
                currentView?.startsWith("statistics") || false
              )}
            >
              <BarChart3 className="w-5 h-5 shrink-0" />
              <span className="flex-1 text-left">Statistics</span>
              {statsExpanded ? (
                <ChevronDown className="w-4 h-4" />
              ) : (
                <ChevronRight className="w-4 h-4" />
              )}
            </button>
            {statsExpanded && (
              <div className="ml-8 space-y-1">
                <button
                  onClick={() =>
                    onViewChange && onViewChange("statistics/teachers")
                  }
                  className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                    currentView === "statistics/teachers"
                      ? "bg-purple-100 text-purple-700 font-medium"
                      : "text-gray-600 hover:bg-gray-50 hover:text-purple-600"
                  }`}
                >
                  <UserCheck className="w-4 h-4" />
                  <span>Teacher Stats</span>
                </button>
                <button
                  onClick={() =>
                    onViewChange && onViewChange("statistics/users")
                  }
                  className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                    currentView === "statistics/users"
                      ? "bg-purple-100 text-purple-700 font-medium"
                      : "text-gray-600 hover:bg-gray-50 hover:text-purple-600"
                  }`}
                >
                  <Users className="w-4 h-4" />
                  <span>User Stats</span>
                </button>
                <button
                  onClick={() =>
                    onViewChange && onViewChange("statistics/students")
                  }
                  className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                    currentView === "statistics/students"
                      ? "bg-purple-100 text-purple-700 font-medium"
                      : "text-gray-600 hover:bg-gray-50 hover:text-purple-600"
                  }`}
                >
                  <School className="w-4 h-4" />
                  <span>Student Stats</span>
                </button>
              </div>
            )}
          </>
        )}

        {/* Statistics (collapsed view) */}
        {collapsed && (
          <button
            onClick={() => onViewChange && onViewChange("statistics/teachers")}
            className={navItemClass(currentView?.startsWith("statistics"))}
          >
            <BarChart3 className="w-5 h-5 shrink-0" />
          </button>
        )}

        {/* Divider */}
        {!collapsed && (
          <div className="my-4">
            <div className="h-px bg-gray-200"></div>
          </div>
        )}

        {/* Actions Section */}
        {!collapsed && (
          <div className="mb-4">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-3 mb-2">
              Actions
            </p>
          </div>
        )}

        {/* Add Teacher */}
        <button onClick={onAddTeacher} className={navItemClass(false, true)}>
          <UserPlus className="w-5 h-5 shrink-0" />
          {!collapsed && <span className="flex-1 text-left">Add Teacher</span>}
        </button>

        {/* Add Student */}
        <button onClick={onAddStudent} className={navItemClass(false, true)}>
          <GraduationCap className="w-5 h-5 shrink-0" />
          {!collapsed && <span className="flex-1 text-left">Add Student</span>}
        </button>

        {/* Assign Class */}
        <button onClick={onAssignClass} className={navItemClass(false, true)}>
          <BookOpen className="w-5 h-5 shrink-0" />
          {!collapsed && <span className="flex-1 text-left">Assign Class</span>}
        </button>
      </nav>

      {/* Sign out at bottom */}
      <div className="mt-auto pt-4 border-t border-gray-200">
        <button
          onClick={() => setShowSignOutConfirm(true)}
          className="group w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 text-sm font-medium text-red-600 hover:bg-red-50 hover:text-red-700"
        >
          <LogOut className="w-5 h-5 shrink-0" />
          {!collapsed && <span className="flex-1 text-left">Sign Out</span>}
        </button>
      </div>

      {/* Sign Out Confirmation Dialog */}
      <ConfirmDialog
        open={showSignOutConfirm}
        onClose={() => setShowSignOutConfirm(false)}
        onConfirm={signOut}
        title="Sign Out"
        message="Are you sure you want to sign out? You will need to log in again to access your account."
        confirmText="Sign Out"
        cancelText="Cancel"
        variant="danger"
      />
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside
        className={`${
          collapsed ? "w-16" : "w-64"
        } shrink-0 hidden sm:block transition-all duration-300 overflow-hidden bg-white border-r border-gray-200`}
      >
        {Content}
      </aside>

      {/* Mobile Sidebar */}
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

