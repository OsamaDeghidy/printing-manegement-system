"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { ProtectedRoute } from "@/components/auth/protected-route";
import {
  fetchReorderRequests,
  approveReorderRequest,
  markReorderRequestReceived,
  type ReorderRequest,
} from "@/lib/api-client";

function AdminReorderRequestsPageContent() {
  const [requests, setRequests] = useState<ReorderRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const [showApproveModal, setShowApproveModal] = useState<string | null>(null);
  const [showReceiveModal, setShowReceiveModal] = useState<string | null>(null);

  useEffect(() => {
    loadRequests();
  }, []);

  const loadRequests = async () => {
    try {
      setLoading(true);
      const data = await fetchReorderRequests();
      setRequests(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error loading reorder requests:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!showApproveModal) return;
    try {
      setProcessing(showApproveModal);
      await approveReorderRequest(showApproveModal);
      await loadRequests();
      setShowApproveModal(null);
      alert("تمت الموافقة بنجاح");
    } catch (error: any) {
      alert(error.message || "فشلت الموافقة");
    } finally {
      setProcessing(null);
    }
  };

  const handleMarkReceived = async () => {
    if (!showReceiveModal) return;
    try {
      setProcessing(showReceiveModal);
      await markReorderRequestReceived(showReceiveModal);
      await loadRequests();
      setShowReceiveModal(null);
      alert("تم تحديث الحالة بنجاح");
    } catch (error: any) {
      alert(error.message || "فشل التحديث");
    } finally {
      setProcessing(null);
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
    switch (status) {
      case "pending":
        return "بانتظار الموافقة";
      case "ordered":
        return "تم الطلب";
      case "received":
        return "تم الاستلام";
      case "cancelled":
        return "ملغي";
      default:
        return status;
    }
  };

  const statusTone = (status: string) => {
    switch (status) {
      case "pending":
        return "warning" as const;
      case "ordered":
        return "info" as const;
      case "received":
        return "success" as const;
      case "cancelled":
        return "danger" as const;
      default:
        return "neutral" as const;
    }
  };

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl font-bold text-heading">طلبات إعادة التزويد</h1>
        <p className="mt-1 text-sm text-muted">
          إدارة طلبات إعادة تزويد المواد من المخزون
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
                <CardTitle className="text-lg">{request.item.name}</CardTitle>
                <Badge tone={statusTone(request.status)}>
                  {statusLabel(request.status)}
                </Badge>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-muted">
                <p>
                  <strong className="text-heading">الكمية المطلوبة:</strong> {request.quantity}
                </p>
                <p>
                  <strong className="text-heading">رمز المخزون:</strong> {request.item.sku}
                </p>
                <p>
                  <strong className="text-heading">طالب التزويد:</strong> {request.requested_by.full_name}
                </p>
                <p>
                  <strong className="text-heading">تاريخ الطلب:</strong> {formatDate(request.requested_at)}
                </p>
                {request.approved_by && (
                  <p>
                    <strong className="text-heading">المعتمد:</strong> {request.approved_by.full_name}
                    {request.approved_at && ` • ${formatDate(request.approved_at)}`}
                  </p>
                )}
                {request.received_at && (
                  <p>
                    <strong className="text-heading">تاريخ الاستلام:</strong> {formatDate(request.received_at)}
                  </p>
                )}
                {request.notes && (
                  <p>
                    <strong className="text-heading">ملاحظات:</strong> {request.notes}
                  </p>
                )}
                <div className="flex gap-2 pt-2">
                  {request.status === "pending" && (
                    <Button
                      variant="primary"
                      size="sm"
                      fullWidth
                      onClick={() => setShowApproveModal(request.id)}
                      disabled={processing === request.id}
                    >
                      {processing === request.id ? "جاري..." : "الموافقة"}
                    </Button>
                  )}
                  {request.status === "ordered" && (
                    <Button
                      variant="success"
                      size="sm"
                      fullWidth
                      onClick={() => setShowReceiveModal(request.id)}
                      disabled={processing === request.id}
                    >
                      {processing === request.id ? "جاري..." : "تم الاستلام"}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Approve Confirmation Modal */}
      {showApproveModal && (
        <Modal
          isOpen={!!showApproveModal}
          onClose={() => setShowApproveModal(null)}
          title="تأكيد الموافقة"
        >
          <div className="space-y-4">
            <p>هل أنت متأكد من الموافقة على طلب التزويد هذا؟</p>
            <div className="flex gap-2">
              <Button
                variant="primary"
                onClick={handleApprove}
                disabled={processing === showApproveModal}
                fullWidth
              >
                {processing === showApproveModal ? "جاري..." : "نعم، موافق"}
              </Button>
              <Button
                variant="secondary"
                onClick={() => setShowApproveModal(null)}
                disabled={processing === showApproveModal}
                fullWidth
              >
                إلغاء
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Receive Confirmation Modal */}
      {showReceiveModal && (
        <Modal
          isOpen={!!showReceiveModal}
          onClose={() => setShowReceiveModal(null)}
          title="تأكيد الاستلام"
        >
          <div className="space-y-4">
            <p>هل تم استلام المواد بالفعل؟</p>
            <div className="flex gap-2">
              <Button
                variant="success"
                onClick={handleMarkReceived}
                disabled={processing === showReceiveModal}
                fullWidth
              >
                {processing === showReceiveModal ? "جاري..." : "نعم، تم الاستلام"}
              </Button>
              <Button
                variant="secondary"
                onClick={() => setShowReceiveModal(null)}
                disabled={processing === showReceiveModal}
                fullWidth
              >
                إلغاء
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

export default function AdminReorderRequestsPage() {
  return (
    <ProtectedRoute requiredRoles={["print_manager", "admin"]}>
      <AdminReorderRequestsPageContent />
    </ProtectedRoute>
  );
}







