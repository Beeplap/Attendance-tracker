import { useState, useEffect } from "react";

/**
 * Custom hook to get Nepal time (UTC+5:45) with seconds
 * Updates every second
 */
export function useNepalTime() {
  const [nepalTime, setNepalTime] = useState("");

  useEffect(() => {
    const updateNepalTime = () => {
      const now = new Date();
      // Nepal is UTC+5:45 = 5 hours 45 minutes = 345 minutes
      const nepalOffsetMinutes = 5 * 60 + 45; // 345 minutes
      const utc = now.getTime() + now.getTimezoneOffset() * 60 * 1000;
      const nepalTime = new Date(utc + nepalOffsetMinutes * 60 * 1000);

      const hours = String(nepalTime.getHours()).padStart(2, "0");
      const minutes = String(nepalTime.getMinutes()).padStart(2, "0");
      const seconds = String(nepalTime.getSeconds()).padStart(2, "0");

      setNepalTime(`${hours}:${minutes}:${seconds}`);
    };

    updateNepalTime();
    const interval = setInterval(updateNepalTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return nepalTime;
}
