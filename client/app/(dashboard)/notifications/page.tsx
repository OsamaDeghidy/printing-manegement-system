"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  fetchNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  type Notification,
} from "@/lib/api-client";

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    try {
      setLoading(true);
      const data = await fetchNotifications();
      console.log("Fetched notifications:", data);
      console.log("Notifications count:", Array.isArray(data) ? data.length : 0);
      setNotifications(Array.isArray(data) ? data : []);
    } catch (error: any) {
      console.error("Error loading notifications:", error);
      // Show user-friendly error message
      if (error?.status === 401) {
        console.error("Authentication failed. Please login again.");
      } else {
        console.error("Failed to load notifications. Please try again later.");
      }
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (id: string) => {
    try {
      await markNotificationAsRead(id);
      loadNotifications();
      // Dispatch custom event to notify TopBar to refresh
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("notification-read"));
      }
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await markAllNotificationsAsRead();
      loadNotifications();
      // Dispatch custom event to notify TopBar to refresh
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("notification-read"));
      }
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
    }
  };

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const getTone = (type: string): "info" | "success" | "warning" | "danger" => {
    if (type.includes("approval") || type.includes("APPROVED")) return "success";
    if (type.includes("warning") || type.includes("WARNING")) return "warning";
    if (type.includes("error") || type.includes("ERROR")) return "danger";
    return "info";
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "الآن";
    if (diffMins < 60) return `قبل ${diffMins} دقيقة`;
    if (diffHours < 24) return `قبل ${diffHours} ساعة`;
    if (diffDays < 7) return `قبل ${diffDays} يوم`;
    return date.toLocaleDateString("ar-SA");
  };

  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-heading">مركز الإشعارات</h1>
          <p className="mt-1 text-sm text-muted">
            تابع آخر التحديثات المتعلقة بالطلبات والمخزون والاعتمادات.
          </p>
        </div>
        {unreadCount > 0 && (
          <Button variant="secondary" onClick={handleMarkAllAsRead}>
            قراءة الكل ({unreadCount})
          </Button>
        )}
      </header>

      {loading ? (
        <div className="text-center py-8">جاري التحميل...</div>
      ) : notifications.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted">
            لا توجد إشعارات
          </CardContent>
        </Card>
      ) : (
        <Card padding="lg" shadow="soft">
          <CardHeader className="flex items-center justify-between">
            <CardTitle>الإشعارات الأخيرة</CardTitle>
            <Badge tone="info">{notifications.length} إشعارات</Badge>
          </CardHeader>
          <CardContent className="space-y-4">
            {notifications.map((notif) => (
              <div
                key={notif.id}
                className={`rounded-xl border border-border px-5 py-4 transition hover:border-brand-teal hover:bg-brand-teal/10 ${
                  !notif.is_read ? "bg-brand-teal/5" : ""
                }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex-1">
                    <h2 className="text-base font-semibold text-heading">
                      {notif.title}
                    </h2>
                    <p className="mt-2 text-sm text-muted">{notif.message}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge tone={getTone(notif.type)}>
                      {formatDate(notif.created_at)}
                    </Badge>
                    {!notif.is_read && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleMarkAsRead(notif.id)}
                      >
                        قراءة
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
