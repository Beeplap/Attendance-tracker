"use client";
import React from "react";
import { Moon, Sun } from "lucide-react";
import { Button } from "./button";
import { useTheme } from "../../hooks/useTheme";

export default function ThemeToggle() {
  const { theme, toggleTheme, mounted } = useTheme();

  if (!mounted) {
    return (
      <Button variant="ghost" size="sm" className="p-2 rounded-full">
        <Sun className="w-5 h-5 text-gray-600" />
      </Button>
    );
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      className="p-2 rounded-full"
      onClick={toggleTheme}
      aria-label="Toggle theme"
    >
      {theme === "dark" ? (
        <Sun className="w-5 h-5 text-gray-300 dark:text-gray-300" />
      ) : (
        <Moon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
      )}
    </Button>
  );
}

