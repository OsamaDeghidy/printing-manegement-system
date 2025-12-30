"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { fetchNotifications, type Notification } from "@/lib/api-client";

function AdminNotificationsPageContent() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    try {
      setLoading(true);
      const data = await fetchNotifications();
      setNotifications(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error loading notifications:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString("ar-SA", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const typeLabel = (type: string) => {
    const typeMap: Record<string, string> = {
      order_status: "تحديث حالة الطلب",
      approval: "قرار اعتماد",
      inventory_alert: "تنبيه مخزون",
      system: "إشعار نظامي",
      deadline_warning: "تحذير انتهاء مهلة",
      ready_for_delivery: "جاهز للتسليم",
      inventory_low: "انخفاض المخزون",
    };
    return typeMap[type] || type;
  };

  const typeTone = (type: string) => {
    if (type.includes("alert") || type.includes("warning")) {
      return "warning" as const;
    }
    if (type.includes("approval") || type.includes("ready")) {
      return "success" as const;
    }
    if (type.includes("inventory")) {
      return "danger" as const;
    }
    return "info" as const;
  };

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl font-bold text-heading">إدارة الإشعارات</h1>
        <p className="mt-1 text-sm text-muted">
          عرض جميع الإشعارات في النظام
        </p>
      </header>

      {loading ? (
        <div className="text-center py-8">
          <p className="text-muted">جاري التحميل...</p>
        </div>
      ) : notifications.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted">
            لا توجد إشعارات
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {notifications.map((notification) => (
            <Card key={notification.id} padding="lg" shadow="soft">
              <CardHeader className="items-start gap-2">
                <CardTitle className="text-lg">{notification.title}</CardTitle>
                <div className="flex flex-wrap gap-2">
                  <Badge tone={typeTone(notification.type)}>
                    {typeLabel(notification.type)}
                  </Badge>
                  {notification.is_read ? (
                    <Badge tone="success">مقروء</Badge>
                  ) : (
                    <Badge tone="warning">غير مقروء</Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-muted">
                <p>{notification.message}</p>
                <div className="border-t border-border pt-3 space-y-1">
                  <p>
                    <strong className="text-heading">تاريخ الإنشاء:</strong> {formatDate(notification.created_at)}
                  </p>
                  {notification.read_at && (
                    <p>
                      <strong className="text-heading">تاريخ القراءة:</strong> {formatDate(notification.read_at)}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

export default function AdminNotificationsPage() {
  return (
    <ProtectedRoute requiredRoles={["print_manager", "admin"]}>
      <AdminNotificationsPageContent />
    </ProtectedRoute>
  );
}

