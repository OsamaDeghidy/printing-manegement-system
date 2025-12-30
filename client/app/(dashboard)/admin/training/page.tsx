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
import { fetchTrainingRequests } from "@/lib/api-client";

// Training Request type
interface TrainingRequest {
  id: string;
  requester: {
    id: string;
    full_name: string;
  };
  entity?: {
    id: string;
    name: string;
  };
  trainee_name: string;
  trainee_id: string;
  trainee_phone: string;
  trainee_email: string;
  university: string;
  major: string;
  training_period_start: string;
  training_period_end: string;
  department: string;
  status: string;
  created_at: string;
}

function AdminTrainingPageContent() {
  const [requests, setRequests] = useState<TrainingRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRequests();
  }, []);

  const loadRequests = async () => {
    try {
      setLoading(true);
      const data = await fetchTrainingRequests();
      setRequests(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error loading training requests:", error);
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

  const statusLabel = (status: string) => {
    const statusMap: Record<string, string> = {
      pending: "بانتظار المراجعة",
      approved: "موافق عليه",
      rejected: "مرفوض",
      in_progress: "قيد التنفيذ",
      completed: "مكتمل",
      cancelled: "ملغي",
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
      case "in_progress":
        return "info" as const;
      default:
        return "neutral" as const;
    }
  };

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl font-bold text-heading">طلبات التدريب التعاوني</h1>
        <p className="mt-1 text-sm text-muted">
          عرض وإدارة طلبات التدريب التعاوني
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
                <CardTitle className="text-lg">{request.trainee_name}</CardTitle>
                <Badge tone={statusTone(request.status)}>
                  {statusLabel(request.status)}
                </Badge>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-muted">
                <p>
                  <strong className="text-heading">المتدرب:</strong> {request.trainee_name}
                </p>
                <p>
                  <strong className="text-heading">رقم الهوية:</strong> {request.trainee_id}
                </p>
                <p>
                  <strong className="text-heading">الجامعة:</strong> {request.university}
                </p>
                <p>
                  <strong className="text-heading">التخصص:</strong> {request.major}
                </p>
                <p>
                  <strong className="text-heading">القسم المطلوب:</strong> {request.department}
                </p>
                <p>
                  <strong className="text-heading">فترة التدريب:</strong>{" "}
                  {formatDate(request.training_period_start)} - {formatDate(request.training_period_end)}
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
                  <strong className="text-heading">تاريخ التقديم:</strong> {formatDate(request.created_at)}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

export default function AdminTrainingPage() {
  return (
    <ProtectedRoute requiredRoles={["print_manager", "admin", "training_supervisor"]}>
      <AdminTrainingPageContent />
    </ProtectedRoute>
  );
}

