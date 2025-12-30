"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRoles?: string[];
  redirectTo?: string;
}

/**
 * Protected Route Component
 * Checks if user is authenticated and has required role
 */
export function ProtectedRoute({
  children,
  requiredRoles,
  redirectTo = "/dashboard",
}: ProtectedRouteProps) {
  const { user, loading, isAuthenticated, canAccess } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    // Check authentication
    if (!isAuthenticated || !user) {
      router.push("/login");
      return;
    }

    // Check role permissions if required
    if (requiredRoles && requiredRoles.length > 0) {
      if (!canAccess(requiredRoles)) {
        router.push(redirectTo);
        return;
      }
    }
  }, [user, loading, isAuthenticated, requiredRoles, canAccess, router, redirectTo]);

  // Show loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-muted">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  // Show nothing if not authenticated or doesn't have permission
  if (!isAuthenticated || !user) {
    return null;
  }

  if (requiredRoles && requiredRoles.length > 0 && !canAccess(requiredRoles)) {
    return null;
  }

  return <>{children}</>;
}

