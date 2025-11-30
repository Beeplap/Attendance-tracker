"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { resolveUserRole } from "@/lib/utils";

/**
 * Generic dashboard page that redirects to role-specific dashboards
 */
export default function DashboardPage() {
  const router = useRouter();

  useEffect(() => {
    const redirectUser = async () => {
      const { data } = await supabase.auth.getUser();
      const user = data?.user;
      
      if (!user) {
        router.replace("/login");
        return;
      }

      const role = await resolveUserRole(supabase, user);
      
      // Redirect to role-specific dashboard
      if (role === "admin") {
        router.replace("/admin");
      } else if (role === "student") {
        router.replace("/student-dashboard");
      } else {
        router.replace("/teacher-dashboard");
      }
    };

    redirectUser();
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
    </div>
  );
}
