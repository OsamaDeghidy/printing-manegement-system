"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TextArea } from "@/components/ui/textarea";
import { 
  fetchVisitRequestDetail, 
  approveVisitRequest, 
  rejectVisitRequest, 
  postponeVisitRequest,
  type VisitRequest 
} from "@/lib/api-client";
import { useAuth } from "@/lib/auth-context";

export default function VisitDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { hasRole } = useAuth();
  const [visit, setVisit] = useState<VisitRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [action, setAction] = useState<"approve" | "reject" | "postpone" | null>(null);
  const [comment, setComment] = useState("");
  const [newDate, setNewDate] = useState("");

  const visitId = params.id as string;
  const isManager = hasRole(["print_manager", "admin", "dept_manager", "approver"]);

  useEffect(() => {
    loadVisit();
  }, [visitId]);

  const loadVisit = async () => {
    try {
      setLoading(true);
      const data = await fetchVisitRequestDetail(visitId);
      setVisit(data);
    } catch (error) {
      console.error("Error loading visit:", error);
      alert("حدث خطأ أثناء تحميل تفاصيل الزيارة");
      router.push("/visits");
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!visit) return;
    try {
      setUpdating(true);
      await approveVisitRequest(visit.id, comment);
      await loadVisit();
      setAction(null);
      setComment("");
    } catch (error: any) {
      alert(error.message || "حدث خطأ أثناء الموافقة على الطلب");
    } finally {
      setUpdating(false);
    }
  };

  const handleReject = async () => {
    if (!visit) return;
    if (!comment.trim()) {
      alert("يرجى إدخال سبب الرفض");
      return;
    }
    try {
      setUpdating(true);
      await rejectVisitRequest(visit.id, comment);
      await loadVisit();
      setAction(null);
      setComment("");
    } catch (error: any) {
      alert(error.message || "حدث خطأ أثناء رفض الطلب");
    } finally {
      setUpdating(false);
    }
  };

  const handlePostpone = async () => {
    if (!visit) return;
    if (!newDate.trim()) {
      alert("يرجى إدخال التاريخ الجديد");
      return;
    }
    try {
      setUpdating(true);
      await postponeVisitRequest(visit.id, newDate, comment);
      await loadVisit();
      setAction(null);
      setComment("");
      setNewDate("");
    } catch (error: any) {
      alert(error.message || "حدث خطأ أثناء تأجيل الطلب");
    } finally {
      setUpdating(false);
    }
  };

  const formatDate = (dateString: string): string => {
    try {
      const date = new Date(dateString);
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      const year = date.getFullYear();
      return `${month}/${day}/${year}`;
    } catch {
      return dateString;
    }
  };

  const formatTime = (timeString: string): string => {
    try {
      const [hours, minutes] = timeString.split(":");
      const hour = parseInt(hours);
      const ampm = hour >= 12 ? "م" : "ص";
      const hour12 = hour % 12 || 12;
      return `${hour12}:${minutes} ${ampm}`;
    } catch {
      return timeString;
    }
  };

  const getStatusLabel = (status: string): string => {
    const labels: Record<string, string> = {
      pending: "بانتظار المراجعة",
      approved: "موافق عليه",
      rejected: "مرفوض",
      postponed: "مؤجل",
      cancelled: "ملغي",
      completed: "مكتمل",
    };
    return labels[status] || status;
  };

  const getStatusTone = (status: string): "info" | "success" | "warning" | "danger" => {
    switch (status) {
      case "approved":
      case "completed":
        return "success";
      case "rejected":
      case "cancelled":
        return "danger";
      case "pending":
      case "postponed":
        return "warning";
      default:
        return "info";
    }
  };

  if (loading) {
    return <div className="text-center py-8">جاري التحميل...</div>;
  }

  if (!visit) {
    return (
      <div className="text-center py-8">
        <p className="text-muted">لم يتم العثور على الزيارة</p>
        <Button variant="ghost" onClick={() => router.push("/visits")} className="mt-4">
          العودة إلى قائمة الزيارات
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-heading">تفاصيل الزيارة</h1>
          <p className="mt-1 text-sm text-muted">معلومات تفصيلية عن طلب الزيارة</p>
        </div>
        <Button variant="ghost" onClick={() => router.push("/visits")}>
          العودة إلى القائمة
        </Button>
      </header>

      <div className="grid gap-6 md:grid-cols-2">
        <Card padding="lg" shadow="soft">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>معلومات الزيارة</CardTitle>
              <Badge tone={getStatusTone(visit.status)}>
                {getStatusLabel(visit.status)}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <span className="text-sm font-semibold text-heading">طالب الزيارة:</span>
              <p className="text-muted">{visit.requester?.full_name || "غير محدد"}</p>
            </div>
            {visit.entity && (
              <div>
                <span className="text-sm font-semibold text-heading">الجهة:</span>
                <p className="text-muted">{visit.entity.name}</p>
              </div>
            )}
            <div>
              <span className="text-sm font-semibold text-heading">نوع الزيارة:</span>
              <p className="text-muted">
                {visit.visit_type === "internal" ? "زيارة داخلية" : "زيارة خارجية"}
              </p>
            </div>
            <div>
              <span className="text-sm font-semibold text-heading">التاريخ المطلوب:</span>
              <p className="text-muted">{formatDate(visit.requested_date)}</p>
            </div>
            <div>
              <span className="text-sm font-semibold text-heading">الوقت المطلوب:</span>
              <p className="text-muted">{formatTime(visit.requested_time)}</p>
            </div>
            <div>
              <span className="text-sm font-semibold text-heading">تاريخ التقديم:</span>
              <p className="text-muted">{formatDate(visit.submitted_at)}</p>
            </div>
            {visit.approved_at && (
              <div>
                <span className="text-sm font-semibold text-heading">تاريخ الموافقة:</span>
                <p className="text-muted">{formatDate(visit.approved_at)}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card padding="lg" shadow="soft">
          <CardHeader>
            <CardTitle>الغرض من الزيارة</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted whitespace-pre-wrap">{visit.purpose}</p>
          </CardContent>
        </Card>
      </div>

      {visit.manager_comment && (
        <Card padding="lg" shadow="soft">
          <CardHeader>
            <CardTitle>ملاحظات المدير</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted whitespace-pre-wrap">{visit.manager_comment}</p>
          </CardContent>
        </Card>
      )}

      {visit.permit_file && (
        <Card padding="lg" shadow="soft">
          <CardHeader>
            <CardTitle>تصريح الزيارة</CardTitle>
          </CardHeader>
          <CardContent>
            <a
              href={visit.permit_file}
              target="_blank"
              rel="noopener noreferrer"
              className="text-brand-teal hover:underline"
            >
              عرض الملف
            </a>
          </CardContent>
        </Card>
      )}

      {isManager && visit.status === "pending" && (
        <Card padding="lg" shadow="soft">
          <CardHeader>
            <CardTitle>إدارة الطلب</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {action === null ? (
              <div className="flex flex-wrap gap-3">
                <Button variant="primary" onClick={() => setAction("approve")}>
                  موافقة
                </Button>
                <Button variant="secondary" onClick={() => setAction("reject")}>
                  رفض
                </Button>
                <Button variant="secondary" onClick={() => setAction("postpone")}>
                  تأجيل
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {action === "postpone" && (
                  <div>
                    <label className="block text-sm font-semibold text-heading mb-2">
                      التاريخ الجديد <span className="text-[#E53935]">*</span>
                    </label>
                    <input
                      type="date"
                      value={newDate}
                      onChange={(e) => setNewDate(e.target.value)}
                      className="w-full px-4 py-2 border border-border rounded-md"
                      required
                    />
                  </div>
                )}
                <div>
                  <label className="block text-sm font-semibold text-heading mb-2">
                    {action === "approve" ? "ملاحظات (اختياري)" : "السبب"}
                  </label>
                  <TextArea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder={action === "approve" ? "ملاحظات إضافية..." : "يرجى إدخال السبب..."}
                    rows={4}
                    required={action !== "approve"}
                  />
                </div>
                <div className="flex flex-wrap gap-3">
                  <Button
                    variant="primary"
                    onClick={
                      action === "approve"
                        ? handleApprove
                        : action === "reject"
                        ? handleReject
                        : handlePostpone
                    }
                    disabled={updating}
                  >
                    {updating ? "جاري المعالجة..." : "تأكيد"}
                  </Button>
                  <Button variant="secondary" onClick={() => {
                    setAction(null);
                    setComment("");
                    setNewDate("");
                  }}>
                    إلغاء
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

