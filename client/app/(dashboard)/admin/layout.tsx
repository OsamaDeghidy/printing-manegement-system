"use client";

import { ProtectedRoute } from "@/components/auth/protected-route";

interface AdminLayoutProps {
  children: React.ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  return (
    <ProtectedRoute requiredRoles={["print_manager", "admin", "dept_manager"]}>
      {children}
    </ProtectedRoute>
  );
}

