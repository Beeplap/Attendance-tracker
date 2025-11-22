"use client";

import { useState, useEffect } from "react";

export function useTheme() {
  const [theme, setTheme] = useState("light");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Always default to light mode
    const root = document.documentElement;
    root.classList.remove("dark");
    setTheme("light");
    localStorage.setItem("theme", "light");
  }, []);

  const applyTheme = (newTheme) => {
    const root = document.documentElement;
    if (newTheme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
  };

  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);
    applyTheme(newTheme);
  };

  const setThemeMode = (newTheme) => {
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);
    applyTheme(newTheme);
  };

  return {
    theme,
    toggleTheme,
    setTheme: setThemeMode,
    mounted,
  };
}

