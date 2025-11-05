"use client";
import React from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  Home,
  Users,
  Package,
  CheckSquare,
  History as HistoryIcon,
  Truck,
  FileText,
  FolderClosed,
  ChevronDown,
} from "lucide-react";

const navItems = [
  { label: "Dashboard", icon: Home, href: "/dashboard" },
  { label: "Reports", icon: Users, href: "#" },
  { label: "Schedule", icon: Package, href: "#" },
  { label: "Settings", icon: CheckSquare, href: "#" },
  { label: "History", icon: HistoryIcon, href: "#" },
  { divider: true },
  { label: "Shipments", icon: Truck, href: "#" },
  { label: "Documents", icon: FolderClosed, href: "#", caret: true },
  { label: "Application", icon: Package, href: "#" },
  { divider: true },
];

export default function Sidebar({
  open,
  onOpenChange,
  collapsed = false,
  onToggleCollapsed,
}) {
  const pathname = usePathname();
  const router = useRouter();

  const Content = (
    <div
      className={`rounded-2xl border border-purple-200 dark:border-purple-800 bg-white/70 dark:bg-gray-900/80 ${
        collapsed ? "p-2" : "p-3 sm:p-4"
      } shadow-sm h-full flex flex-col`}
    >
      {/* Teacher Info Section */}
      <div
        className={`flex items-center gap-3 rounded-xl bg-purple-50/70 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 ${
          collapsed ? "justify-center p-2" : "p-3"
        }`}
      >
        <img
          src="https://images.unsplash.com/photo-1607746882042-944635dfe10e?q=80&w=96&auto=format&fit=crop"
          alt="teacher-avatar"
          className="w-9 h-9 rounded-full object-cover"
        />
        {!collapsed && (
          <div className="min-w-0">
            <div className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
              Mr. Rajesh Sharma
            </div>
            <div className="text-[11px] text-gray-600 dark:text-gray-400 truncate">
              Computer Science Teacher
            </div>
          </div>
        )}
      </div>

      {/* Top bar with hamburger/collapse */}
      <div
        className={`flex items-center mt-3 ${
          collapsed ? "justify-center" : "justify-between"
        }`}
      >
        {onToggleCollapsed && (
          <button
            onClick={onToggleCollapsed}
            className="inline-flex items-center justify-center w-9 h-9 rounded-md border border-purple-200 dark:border-purple-700 hover:bg-purple-50/70 dark:hover:bg-purple-900/20 transition"
            aria-label="Toggle sidebar"
          >
            <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
              <path
                d="M3 6h14M3 10h14M3 14h14"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav className="mt-3 space-y-1 flex-1 overflow-y-auto">
        {navItems.map((item, idx) => {
          if (item.divider) {
            return (
              <div
                key={`div-${idx}`}
                className="my-2 h-px bg-purple-200/60 dark:bg-purple-800/60"
              />
            );
          }

          const Icon = item.icon;
          const active = pathname?.startsWith(item.href || "_");
          const baseItem =
            "group w-full flex items-center px-3 py-2 rounded-xl border transition-all duration-200 text-sm";
          const collapsedClass = collapsed ? "justify-center" : "gap-3";
          const stateClass = active
            ? "bg-purple-100 dark:bg-purple-900/30 border-purple-300 dark:border-purple-700 text-gray-900 dark:text-gray-100"
            : "bg-white/50 dark:bg-transparent border-transparent hover:bg-purple-50/70 dark:hover:bg-purple-900/20 hover:border-purple-200 dark:hover:border-purple-800 text-gray-700 dark:text-gray-300";
          const iconClass = active
            ? "w-4 h-4 text-purple-600 dark:text-purple-400"
            : "w-4 h-4 text-gray-600 dark:text-gray-400 group-hover:text-purple-600 dark:group-hover:text-purple-400";

          return (
            <button
              key={item.label}
              onClick={() => item.href !== "#" && router.push(item.href)}
              className={[baseItem, collapsedClass, stateClass].join(" ")}
            >
              <Icon className={iconClass} />
              {!collapsed && (
                <span className="flex-1 text-left">{item.label}</span>
              )}
              {item.caret && <ChevronDown className="w-4 h-4 opacity-70" />}
            </button>
          );
        })}
      </nav>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside
        className={`${
          collapsed ? "w-16" : "w-full sm:w-64 md:w-72 lg:w-72"
        } shrink-0 hidden sm:block transition-all duration-200 overflow-hidden`}
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
