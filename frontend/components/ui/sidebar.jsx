"use client";
import React, { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  Home,
  BookOpen,
  Users,
  LogOut,
  Menu,
  X,
  Calendar,
} from "lucide-react";
import { supabase } from "../../lib/supabaseClient";
import ConfirmDialog from "./ConfirmDialog";

export default function Sidebar({
  open,
  onOpenChange,
  collapsed = false,
  onToggleCollapsed,
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [showSignOutConfirm, setShowSignOutConfirm] = useState(false);

  const signOut = async () => {
    await supabase.auth.signOut();
    router.replace("/login");
  };

  const navItemClass = (active) =>
    `group w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 text-sm font-medium ${
      active
        ? "bg-gradient-to-r from-purple-600 to-violet-600 text-white shadow-md"
        : "text-gray-700 hover:bg-gray-50 hover:text-purple-600"
    }`;

  const Content = (
    <div className="bg-white border-r border-gray-200 h-full flex flex-col shadow-sm">
      {/* Top: Teacher title + toggle */}
      <div className="flex items-center justify-between mb-6">
        {!collapsed && (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-purple-600 to-violet-600 rounded-lg flex items-center justify-center shadow-md">
              <BookOpen className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">Teacher</h2>
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
        <a
          href="/teacher"
          className={navItemClass(pathname === "/teacher")}
        >
          <Home className="w-5 h-5 shrink-0" />
          {!collapsed && <span className="flex-1 text-left">Dashboard</span>}
        </a>

        {/* Attendance */}
        <a
          href="/attendance"
          className={navItemClass(pathname === "/attendance")}
        >
          <Calendar className="w-5 h-5 shrink-0" />
          {!collapsed && <span className="flex-1 text-left">Attendance</span>}
        </a>

        {/* Students */}
        <a
          href="/students"
          className={navItemClass(pathname === "/students")}
        >
          <Users className="w-5 h-5 shrink-0" />
          {!collapsed && <span className="flex-1 text-left">Students</span>}
        </a>
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
            className="fixed inset-0 bg-black/30"
            onClick={() => onOpenChange && onOpenChange(false)}
            aria-hidden="true"
          />
          <aside className="fixed left-0 top-0 bottom-0 w-64 bg-white border-r border-gray-200 shadow-xl z-50">
            {Content}
          </aside>
        </div>
      )}
    </>
  );
}

