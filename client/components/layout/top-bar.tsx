"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth-context";
import { fetchNotifications, type Notification } from "@/lib/api-client";
import Link from "next/link";

interface TopBarProps {
  className?: string;
  onToggleSidebar?: () => void;
}

export function TopBar({ className, onToggleSidebar }: TopBarProps) {
  const { user, loading } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [notificationsLoading, setNotificationsLoading] = useState(false);

  // Load notifications
  useEffect(() => {
    if (user) {
      loadNotifications();
      // Refresh notifications every 30 seconds
      const interval = setInterval(loadNotifications, 30000);
      
      // Listen for custom event when notification is read
      const handleNotificationRead = () => {
        loadNotifications();
      };
      window.addEventListener("notification-read", handleNotificationRead);
      
      return () => {
        clearInterval(interval);
        window.removeEventListener("notification-read", handleNotificationRead);
      };
    }
  }, [user]);

  const loadNotifications = async () => {
    try {
      setNotificationsLoading(true);
      const data = await fetchNotifications();
      console.log("TopBar - Fetched notifications:", data);
      console.log("TopBar - Notifications count:", Array.isArray(data) ? data.length : 0);
      setNotifications(Array.isArray(data) ? data : []);
    } catch (error: any) {
      console.error("Error loading notifications:", error);
      // Silently fail for top bar to avoid disrupting user experience
      setNotifications([]);
    } finally {
      setNotificationsLoading(false);
    }
  };

  // Get user initials for avatar
  const getInitials = (name: string) => {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  const displayName = user?.full_name || "مستخدم";
  const displayEntity = user?.entity?.name || user?.department || "غير محدد";
  const initials = getInitials(displayName);
  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return (
    <header
      className={cn(
        "sticky top-0 z-30 flex items-center justify-between border-b border-border bg-surface px-6 py-4 shadow-sm",
        className
      )}
    >
      <div className="flex items-center gap-3">
        <button
          type="button"
          aria-label="Toggle sidebar"
          onClick={onToggleSidebar}
          className="flex h-11 w-11 items-center justify-center rounded-lg border border-border text-xl text-brand-teal transition hover:border-brand-teal hover:bg-brand-teal/10 md:hidden"
        >
          ☰
        </button>
        <div>
          <p className="text-base font-semibold text-heading">
            إدارة مطابع جامعة طيبة
          </p>
          {loading ? (
            <p className="text-sm text-muted">جاري التحميل...</p>
          ) : (
            <p className="text-sm text-muted">
              مرحباً {displayName} 👋
            </p>
          )}
        </div>
      </div>
      <div className="flex items-center gap-3">
        <Button variant="ghost" className="hidden md:inline-flex relative" asChild>
          <Link href="/notifications" className="flex items-center gap-2">
            <span>🔔</span>
            <span>الإشعارات</span>
            {unreadCount > 0 && (
              <Badge 
                tone="danger" 
                className="absolute -top-1 -right-1 h-5 min-w-5 flex items-center justify-center px-1 text-xs"
              >
                {unreadCount > 99 ? "99+" : unreadCount}
              </Badge>
            )}
          </Link>
        </Button>
        {!loading && user && (
          <div className="flex items-center gap-3 rounded-full border border-border bg-surface-muted px-3 py-2">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-teal/15 text-brand-teal text-base font-semibold">
              {initials}
            </span>
            <div>
              <p className="text-sm font-semibold text-heading">{displayName}</p>
              <p className="text-xs text-muted">{displayEntity}</p>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}


