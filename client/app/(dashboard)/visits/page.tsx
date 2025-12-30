"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TextArea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { VisitForm } from "@/components/forms/visit-form";
import { 
  fetchVisitRequests, 
  approveVisitRequest, 
  rejectVisitRequest, 
  postponeVisitRequest,
  type VisitRequest 
} from "@/lib/api-client";
import { useAuth } from "@/lib/auth-context";

export default function VisitsPage() {
  const router = useRouter();
  const { hasRole } = useAuth();
  const [showForm, setShowForm] = useState(false);
  const [visits, setVisits] = useState<VisitRequest[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modal states
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showPostponeModal, setShowPostponeModal] = useState(false);
  const [selectedVisitId, setSelectedVisitId] = useState<string | null>(null);
  const [comment, setComment] = useState("");
  const [newDate, setNewDate] = useState("");
  const [processing, setProcessing] = useState(false);

  // Check if user can view all visits (managers and print employees)
  const canViewAllVisits = hasRole(["print_manager", "dept_employee", "admin"]);
  
  // Check if user is a manager (can approve/reject/postpone)
  const isManager = hasRole(["print_manager", "admin", "dept_manager", "approver"]);

  useEffect(() => {
    loadVisits();
  }, []);

  const loadVisits = async () => {
    try {
      setLoading(true);
      const data = await fetchVisitRequests();
      setVisits(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error loading visits:", error);
    } finally {
      setLoading(false);
    }
  };

  const openApproveModal = (id: string) => {
    setSelectedVisitId(id);
    setComment("");
    setShowApproveModal(true);
  };

  const openRejectModal = (id: string) => {
    setSelectedVisitId(id);
    setComment("");
    setShowRejectModal(true);
  };

  const openPostponeModal = (id: string) => {
    setSelectedVisitId(id);
    setComment("");
    setNewDate("");
    setShowPostponeModal(true);
  };

  const handleApprove = async () => {
    if (!selectedVisitId) return;
    try {
      setProcessing(true);
      await approveVisitRequest(selectedVisitId, comment);
      await loadVisits();
      setShowApproveModal(false);
      setSelectedVisitId(null);
      setComment("");
    } catch (error: any) {
      alert(error.message || "حدث خطأ أثناء الموافقة على الطلب");
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!selectedVisitId) return;
    if (!comment.trim()) {
      alert("يرجى إدخال سبب الرفض");
      return;
    }
    try {
      setProcessing(true);
      await rejectVisitRequest(selectedVisitId, comment);
      await loadVisits();
      setShowRejectModal(false);
      setSelectedVisitId(null);
      setComment("");
    } catch (error: any) {
      alert(error.message || "حدث خطأ أثناء رفض الطلب");
    } finally {
      setProcessing(false);
    }
  };

  const handlePostpone = async () => {
    if (!selectedVisitId) return;
    if (!newDate.trim()) {
      alert("يرجى إدخال التاريخ الجديد");
      return;
    }
    try {
      setProcessing(true);
      await postponeVisitRequest(selectedVisitId, newDate, comment);
      await loadVisits();
      setShowPostponeModal(false);
      setSelectedVisitId(null);
      setComment("");
      setNewDate("");
    } catch (error: any) {
      alert(error.message || "حدث خطأ أثناء تأجيل الطلب");
    } finally {
      setProcessing(false);
    }
  };

  if (showForm) {
    return <VisitForm onCancel={() => setShowForm(false)} onSuccess={loadVisits} />;
  }

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

  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-heading">حجز الزيارات</h1>
          <p className="mt-1 text-sm text-muted">
            {canViewAllVisits 
              ? "متابعة جميع طلبات الزيارات وإدارتها"
              : "احجز موعد زيارة للمطبعة للتناقش أو الاستلام"}
          </p>
        </div>
        {!canViewAllVisits && (
          <Button type="button" variant="primary" onClick={() => setShowForm(true)}>
            + طلب زيارة جديدة
          </Button>
        )}
      </header>

      {loading ? (
        <div className="text-center py-8">جاري التحميل...</div>
      ) : visits.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted">
            لا توجد طلبات زيارة
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {visits.map((visit) => (
            <Card key={visit.id} padding="lg" shadow="soft">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{visit.purpose}</CardTitle>
                  <Badge tone={getStatusTone(visit.status)}>
                    {getStatusLabel(visit.status)}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 text-sm">
                  <div>
                    <span className="font-semibold text-heading">طالب الزيارة:</span>{" "}
                    <span className="text-muted">{visit.requester?.full_name || "غير محدد"}</span>
                  </div>
                  {visit.entity && (
                    <div>
                      <span className="font-semibold text-heading">الجهة:</span>{" "}
                      <span className="text-muted">{visit.entity.name}</span>
                    </div>
                  )}
                  <div>
                    <span className="font-semibold text-heading">النوع:</span>{" "}
                    <span className="text-muted">
                      {visit.visit_type === "internal" ? "زيارة داخلية" : "زيارة خارجية"}
                    </span>
                  </div>
                  <div>
                    <span className="font-semibold text-heading">التاريخ:</span>{" "}
                    <span className="text-muted">{formatDate(visit.requested_date)}</span>
                  </div>
                  <div>
                    <span className="font-semibold text-heading">الوقت:</span>{" "}
                    <span className="text-muted">{formatTime(visit.requested_time)}</span>
                  </div>
                  {visit.manager_comment && (
                    <div>
                      <span className="font-semibold text-heading">ملاحظات المدير:</span>{" "}
                      <span className="text-muted">{visit.manager_comment}</span>
                    </div>
                  )}
                </div>
                {isManager && (
                  <div className="mt-4 flex flex-wrap gap-2 pt-4 border-t border-border">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => router.push(`/visits/${visit.id}`)}
                    >
                      عرض التفاصيل
                    </Button>
                    {visit.status === "pending" && (
                      <>
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => openApproveModal(visit.id)}
                        >
                          موافقة
                        </Button>
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => openRejectModal(visit.id)}
                        >
                          رفض
                        </Button>
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => openPostponeModal(visit.id)}
                        >
                          تأجيل
                        </Button>
                      </>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Approve Modal */}
      <Modal
        isOpen={showApproveModal}
        onClose={() => {
          setShowApproveModal(false);
          setSelectedVisitId(null);
          setComment("");
        }}
        title="موافقة على طلب الزيارة"
        footer={
          <div className="flex gap-3 justify-end">
            <Button
              variant="secondary"
              onClick={() => {
                setShowApproveModal(false);
                setSelectedVisitId(null);
                setComment("");
              }}
              disabled={processing}
            >
              إلغاء
            </Button>
            <Button variant="primary" onClick={handleApprove} disabled={processing}>
              {processing ? "جاري المعالجة..." : "تأكيد الموافقة"}
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <p className="text-muted">هل أنت متأكد من الموافقة على هذا الطلب؟</p>
          <div>
            <label className="block text-sm font-semibold text-heading mb-2">
              ملاحظات (اختياري)
            </label>
            <TextArea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="ملاحظات إضافية..."
              rows={3}
            />
          </div>
        </div>
      </Modal>

      {/* Reject Modal */}
      <Modal
        isOpen={showRejectModal}
        onClose={() => {
          setShowRejectModal(false);
          setSelectedVisitId(null);
          setComment("");
        }}
        title="رفض طلب الزيارة"
        footer={
          <div className="flex gap-3 justify-end">
            <Button
              variant="secondary"
              onClick={() => {
                setShowRejectModal(false);
                setSelectedVisitId(null);
                setComment("");
              }}
              disabled={processing}
            >
              إلغاء
            </Button>
            <Button variant="secondary" onClick={handleReject} disabled={processing || !comment.trim()}>
              {processing ? "جاري المعالجة..." : "تأكيد الرفض"}
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <p className="text-muted">يرجى إدخال سبب الرفض:</p>
          <TextArea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="سبب الرفض..."
            rows={4}
            required
          />
        </div>
      </Modal>

      {/* Postpone Modal */}
      <Modal
        isOpen={showPostponeModal}
        onClose={() => {
          setShowPostponeModal(false);
          setSelectedVisitId(null);
          setComment("");
          setNewDate("");
        }}
        title="تأجيل طلب الزيارة"
        footer={
          <div className="flex gap-3 justify-end">
            <Button
              variant="secondary"
              onClick={() => {
                setShowPostponeModal(false);
                setSelectedVisitId(null);
                setComment("");
                setNewDate("");
              }}
              disabled={processing}
            >
              إلغاء
            </Button>
            <Button variant="secondary" onClick={handlePostpone} disabled={processing || !newDate.trim()}>
              {processing ? "جاري المعالجة..." : "تأكيد التأجيل"}
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-heading mb-2">
              التاريخ الجديد <span className="text-[#E53935]">*</span>
            </label>
            <Input
              type="date"
              value={newDate}
              onChange={(e) => setNewDate(e.target.value)}
              min={new Date().toISOString().split("T")[0]}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-heading mb-2">
              سبب التأجيل (اختياري)
            </label>
            <TextArea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="سبب التأجيل..."
              rows={3}
            />
          </div>
        </div>
      </Modal>
    </div>
  );
}

