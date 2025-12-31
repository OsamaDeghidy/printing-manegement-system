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
import { fetchVisitRequests, type VisitRequest } from "@/lib/api-client";

function AdminVisitsPageContent() {
  const [requests, setRequests] = useState<VisitRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRequests();
  }, []);

  const loadRequests = async () => {
    try {
      setLoading(true);
      const data = await fetchVisitRequests();
      setRequests(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error loading visit requests:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("ar-SA", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
  };

  const formatDateTime = (dateString: string, timeString?: string) => {
    const date = new Date(dateString);
    const dateStr = date.toLocaleDateString("ar-SA", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
    return timeString ? `${dateStr} ${timeString}` : dateStr;
  };

  const statusLabel = (status: string) => {
    const statusMap: Record<string, string> = {
      pending: "بانتظار المراجعة",
      approved: "موافق عليه",
      rejected: "مرفوض",
      postponed: "مؤجل",
      cancelled: "ملغي",
      completed: "مكتمل",
    };
    return statusMap[status] || status;
  };

  const statusTone = (status: string) => {
    switch (status) {
      case "pending":
        return "warning" as const;
      case "approved":
      case "completed":
        return "success" as const;
      case "rejected":
      case "cancelled":
        return "danger" as const;
      case "postponed":
        return "info" as const;
      default:
        return "neutral" as const;
    }
  };

  const visitTypeLabel = (type: string) => {
    return type === "internal" ? "زيارة داخلية" : "زيارة خارجية";
  };

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl font-bold text-heading">طلبات الزيارات</h1>
        <p className="mt-1 text-sm text-muted">
          عرض وإدارة طلبات الزيارات
        </p>
      </header>

      {loading ? (
        <div className="text-center py-8">
          <p className="text-muted">جاري التحميل...</p>
        </div>
      ) : requests.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted">
            لا توجد طلبات
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {requests.map((request) => (
            <Card key={request.id} padding="lg" shadow="soft">
              <CardHeader className="items-start gap-2">
                <CardTitle className="text-lg">{request.purpose}</CardTitle>
                <div className="flex flex-wrap gap-2">
                  <Badge tone={statusTone(request.status)}>
                    {statusLabel(request.status)}
                  </Badge>
                  <Badge tone="info">{visitTypeLabel(request.visit_type)}</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-muted">
                <p>
                  <strong className="text-heading">الغرض:</strong> {request.purpose}
                </p>
                <p>
                  <strong className="text-heading">تاريخ الزيارة:</strong>{" "}
                  {formatDateTime(request.requested_date, request.requested_time)}
                </p>
                {request.entity && (
                  <p>
                    <strong className="text-heading">الجهة:</strong> {request.entity.name}
                  </p>
                )}
                <p>
                  <strong className="text-heading">مقدم الطلب:</strong> {request.requester.full_name}
                </p>
                <p>
                  <strong className="text-heading">تاريخ التقديم:</strong> {formatDate(request.submitted_at)}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

export default function AdminVisitsPage() {
  return (
    <ProtectedRoute requiredRoles={["print_manager", "admin"]}>
      <AdminVisitsPageContent />
    </ProtectedRoute>
  );
}

