import { useState } from "react";

/**
 * Custom hook to manage sidebar state (open/collapsed)
 */
export function useSidebar() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return {
    sidebarOpen,
    setSidebarOpen,
    sidebarCollapsed,
    setSidebarCollapsed,
    toggleSidebar: () => setSidebarOpen((prev) => !prev),
    toggleCollapsed: () => setSidebarCollapsed((prev) => !prev),
  };
}

