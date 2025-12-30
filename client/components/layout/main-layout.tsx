"use client";

import { useState } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { TopBar } from "@/components/layout/top-bar";
import { Button } from "@/components/ui/button";
import { NavItem, getNavigationForRole } from "@/data/navigation";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth-context";

interface MainLayoutProps {
  children: React.ReactNode;
  sidebarTitle?: string;
  customNavigation?: NavItem[];
}

export default function MainLayout({
  children,
  sidebarTitle = "لوحة التحكم",
  customNavigation,
}: MainLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, loading, logout } = useAuth();

  // Get navigation based on user role
  const navigation = customNavigation ?? (user ? getNavigationForRole(user.role) : []);

  return (
    <div className="min-h-screen bg-page text-body">
      <TopBar onToggleSidebar={() => setSidebarOpen(true)} />
      <div className="relative flex">
        <div
          className={cn(
            "fixed inset-y-0 right-0 z-40 w-64 translate-x-full bg-surface transition-transform duration-300 md:static md:translate-x-0",
            sidebarOpen && "translate-x-0"
          )}
        >
          <Sidebar
            title={sidebarTitle}
            navigation={navigation}
            onNavigate={() => setSidebarOpen(false)}
            footer={
              !loading && user ? (
                <Button variant="secondary" fullWidth onClick={logout}>
                  تسجيل الخروج
                </Button>
              ) : undefined
            }
          />
        </div>

        {sidebarOpen ? (
          <button
            type="button"
            aria-label="Close sidebar"
            onClick={() => setSidebarOpen(false)}
            className="fixed inset-0 z-30 bg-black/30 md:hidden"
          />
        ) : null}

        <main className="flex-1 px-4 pb-10 pt-6 md:px-10 md:pb-16 md:pt-8">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <p className="text-muted">جاري التحميل...</p>
            </div>
          ) : (
            <div className="mx-auto max-w-[1440px] space-y-8">{children}</div>
          )}
        </main>
      </div>
    </div>
  );
}


