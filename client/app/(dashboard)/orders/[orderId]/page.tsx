"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, type SelectOption } from "@/components/ui/select";
import { TextArea } from "@/components/ui/textarea";
import { 
  fetchOrderDetail, 
  updateOrderStatus, 
  fetchCurrentUser, 
  updateDesignOrderStatus, 
  updatePrintOrderStatus 
} from "@/lib/api-client";
import type { OrderDetail } from "@/data/orders";
import type { User } from "@/lib/types";

export default function OrderDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = params.orderId as string;
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [newStatus, setNewStatus] = useState("");
  const [statusNote, setStatusNote] = useState("");
  const [updating, setUpdating] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [canUpdateStatus, setCanUpdateStatus] = useState(false);

  useEffect(() => {
    async function loadData() {
      if (!orderId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        
        // Load user info to check permissions
        const currentUser = await fetchCurrentUser().catch(() => null);
        setUser(currentUser);
        
        // Check if user can update status
        if (currentUser) {
          const canUpdate = 
            currentUser.role === "print_manager" || 
            currentUser.role === "admin" || 
            currentUser.role === "approver";
          setCanUpdateStatus(canUpdate);
          console.log("User permissions:", { role: currentUser.role, canUpdate });
        }
        
        console.log(`Loading order details for: ${orderId}`);
        const orderData = await fetchOrderDetail(orderId);
        console.log("Order data received:", orderData);
        
        if (!orderData) {
          console.warn(`Order ${orderId} not found`);
          setLoading(false);
          return;
        }
        setOrder(orderData);
        setNewStatus(orderData.status);
      } catch (error) {
        console.error("Failed to fetch order:", error);
        setOrder(null);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [orderId]);

  const handleUpdateStatus = async () => {
    if (!order || !newStatus) return;

    try {
      setUpdating(true);
      
      // Use orderType from order detail to determine the correct endpoint
      // If orderType is not set, try to determine from orderCode or service name
      let orderType = order.orderType;
      if (!orderType) {
        // Fallback: determine from orderCode or service name
        if (order.orderCode.includes("DESIGN") || order.service.name.includes("تصميم") || order.service.slug.includes("design")) {
          orderType = "design_order";
        } else if (order.orderCode.includes("PRINT") || order.service.name.includes("طباعة") || order.service.slug.includes("print")) {
          orderType = "print_order";
        } else {
          orderType = "order";
        }
      }
      
      const orderCode = order.orderCode;
      
      console.log("Updating status:", { 
        orderId: order.id, 
        orderCode, 
        orderType, 
        newStatus,
        detectedOrderType: order.orderType || "not set, using fallback"
      });
      
      if (orderType === "design_order") {
        // For design orders, use specific actions or update-status
        if (newStatus === "in_design") {
          await updateDesignOrderStatus(orderCode, "approve");
        } else if (newStatus === "rejected") {
          await updateDesignOrderStatus(orderCode, "reject");
        } else if (newStatus === "returned") {
          await updateDesignOrderStatus(orderCode, "return_to_requester");
        } else {
          // For other statuses, use update-status endpoint
          await updateDesignOrderStatus(orderCode, newStatus, statusNote);
        }
      } else if (orderType === "print_order") {
        // For print orders, use approve action for in_production or update-status for others
        if (newStatus === "in_production") {
          await updatePrintOrderStatus(orderCode, "approve");
        } else {
          // For other statuses, use update-status endpoint
          await updatePrintOrderStatus(orderCode, newStatus, statusNote);
        }
      } else {
        // For regular orders
        await updateOrderStatus(orderCode, newStatus, statusNote);
      }
      
      // Reload order details
      const updatedOrder = await fetchOrderDetail(orderId);
      if (updatedOrder) {
        setOrder(updatedOrder);
        setNewStatus(updatedOrder.status);
      }
      
      setShowStatusModal(false);
      setStatusNote("");
      alert("تم تحديث الحالة بنجاح");
    } catch (error: any) {
      console.error("Failed to update status:", error);
      alert(error.message || "فشل تحديث الحالة. تأكد من أن لديك الصلاحيات المطلوبة.");
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <p className="text-muted">جاري تحميل تفاصيل الطلب...</p>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="text-center py-8">
        <p className="text-muted">الطلب غير موجود</p>
        <Button asChild className="mt-4">
          <Link href="/orders">العودة للطلبات</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="flex items-center gap-3 text-sm text-muted">
            <Link href="/orders" className="text-brand-blue">
              ← العودة للطلبات
            </Link>
            <span>رقم الطلب</span>
            <Badge tone="info">{order.orderCode}</Badge>
          </p>
          <h1 className="mt-3 text-3xl font-bold text-heading">
            {order.service.name}
          </h1>
          <p className="text-sm text-muted">
            مقدم الطلب: {order.requester.name} • القسم:{" "}
            {order.requester.department ?? "—"}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone={statusTone(order.status)}>
            الحالة الحالية: {statusLabel(order.status)}
          </Badge>
          <Badge tone="neutral">الأولوية: {priorityLabel(order.priority)}</Badge>
          <Badge tone={order.requiresApproval ? "warning" : "success"}>
            {order.requiresApproval ? "يتطلب اعتماد" : "لا يتطلب اعتماد"}
          </Badge>
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <Card padding="lg" shadow="soft">
          <CardHeader>
            <CardTitle className="text-lg">تفاصيل الطلب والحقول</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            {order.fieldValues.map((field) => (
              <div key={field.id} className="rounded-lg border border-border px-4 py-3">
                <p className="text-xs text-muted">{field.label}</p>
                <p className="text-sm font-semibold text-heading">
                  {renderFieldValue(field.value)}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card padding="lg" shadow="soft">
          <CardHeader>
            <CardTitle className="text-lg">المرفقات</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            {order.attachments.length ? (
              order.attachments.map((file) => (
                <Link
                  key={file.id}
                  href={file.url}
                  className="flex items-center justify-between rounded-lg border border-border px-4 py-3 transition hover:border-brand-teal hover:bg-brand-teal/10"
                >
                  <span className="flex items-center gap-2">
                    {file.type === "file" ? "📁" : "🔗"} {file.name}
                  </span>
                  <span className="text-xs text-muted">
                    {file.sizeKb ? `${file.sizeKb} كيلوبايت` : "رابط"}
                  </span>
                </Link>
              ))
            ) : (
              <p className="text-muted">لا توجد مرفقات.</p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card padding="lg" shadow="soft">
        <CardHeader>
          <CardTitle className="text-lg">سجل الحالة الزمني</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {order.statusHistory.map((entry) => (
            <div
              key={entry.id}
              className="grid gap-2 rounded-xl border border-border px-5 py-4 md:grid-cols-[200px_1fr]"
            >
              <div>
                <p className="text-sm font-semibold text-heading">
                  {statusLabel(entry.status)}
                </p>
                <p className="text-xs text-muted">بتاريخ: {entry.updatedAt}</p>
              </div>
              <div className="space-y-1 text-sm text-muted">
                <p>تم التحديث بواسطة: {entry.updatedBy ?? "النظام"}</p>
                {entry.note ? <p className="text-brand-navy">ملاحظة: {entry.note}</p> : null}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="flex flex-wrap items-center gap-3">
        {canUpdateStatus && (
          <Button 
            variant="primary" 
            onClick={() => setShowStatusModal(true)}
          >
            تحديث الحالة
          </Button>
        )}
        <Button variant="secondary">تحميل إيصال الطلب</Button>
        <Button variant="ghost" asChild>
          <Link href={`/services/${order.service.slug}`}>إعادة تقديم طلب مشابه</Link>
        </Button>
      </div>

      {/* Status Update Modal */}
      {showStatusModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <Card className="w-full max-w-md" padding="lg" shadow="soft">
            <CardHeader>
              <CardTitle className="text-lg">تحديث حالة الطلب</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-semibold text-heading">
                  الحالة الجديدة
                </label>
                <Select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  options={getStatusOptions(order.orderType || order.service.name)}
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-semibold text-heading">
                  ملاحظة (اختياري)
                </label>
                <TextArea
                  value={statusNote}
                  onChange={(e) => setStatusNote(e.target.value)}
                  placeholder="أضف ملاحظة حول التحديث..."
                  rows={3}
                />
              </div>
              <div className="flex gap-2 pt-4">
                <Button
                  variant="primary"
                  onClick={handleUpdateStatus}
                  disabled={updating || !newStatus}
                  fullWidth
                >
                  {updating ? "جاري التحديث..." : "تحديث"}
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => {
                    setShowStatusModal(false);
                    setStatusNote("");
                  }}
                  disabled={updating}
                  fullWidth
                >
                  إلغاء
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

function statusTone(status: string) {
  switch (status) {
    case "pending":
      return "neutral" as const;
    case "in_review":
      return "warning" as const;
    case "approved":
    case "ready":
      return "success" as const;
    case "in_production":
      return "info" as const;
    case "rejected":
      return "danger" as const;
    default:
      return "neutral" as const;
  }
}

function statusLabel(status: string): string {
  switch (status) {
    case "pending":
      return "بانتظار المعالجة";
    case "in_review":
      return "قيد الاعتماد";
    case "approved":
      return "تم الاعتماد";
    case "in_production":
      return "قيد التنفيذ";
    case "ready":
      return "جاهز للتسليم";
    case "rejected":
      return "مرفوض";
    default:
      return "مسودة";
  }
}

function priorityLabel(priority: string): string {
  switch (priority) {
    case "low":
      return "عادية";
    case "medium":
      return "متوسطة";
    case "high":
      return "عاجلة";
    default:
      return priority;
  }
}

function renderFieldValue(value: unknown): string {
  if (Array.isArray(value)) {
    return value.map((item) => String(item)).join(", ");
  }
  if (typeof value === "object" && value !== null) {
    return JSON.stringify(value);
  }
  if (value === undefined || value === null || value === "") {
    return "—";
  }
  return String(value);
}

function getStatusOptions(orderTypeOrServiceName: string): SelectOption[] {
  // Check if it's an orderType first
  if (orderTypeOrServiceName === "design_order") {
    // DesignOrder.Status.choices في الباك اند
    return [
      { value: "pending_review", label: "بانتظار المراجعة" },
      { value: "in_design", label: "قيد التصميم" },
      { value: "pending_confirm", label: "بانتظار التأكيد" },
      { value: "completed", label: "مكتمل" },
      { value: "suspended", label: "معلق" },
      { value: "rejected", label: "مرفوض" },
      { value: "returned", label: "مرتجع" },
    ];
  }
  
  if (orderTypeOrServiceName === "print_order") {
    // PrintOrder.Status.choices في الباك اند
    return [
      { value: "pending_review", label: "بانتظار المراجعة" },
      { value: "in_production", label: "قيد الإنتاج" },
      { value: "pending_confirm", label: "بانتظار التأكيد" },
      { value: "in_warehouse", label: "في المستودع" },
      { value: "delivery_scheduled", label: "تم حجز التسليم" },
      { value: "archived", label: "مؤرشف" },
      { value: "rejected", label: "مرفوض" },
      { value: "cancelled", label: "ملغي" },
    ];
  }
  
  // Fallback: check service name if orderType is not provided
  const isDesignOrder = orderTypeOrServiceName.includes("تصميم");
  const isPrintOrder = orderTypeOrServiceName.includes("طباعة");
  
  if (isDesignOrder) {
    // DesignOrder.Status.choices في الباك اند
    return [
      { value: "pending_review", label: "بانتظار المراجعة" },
      { value: "in_design", label: "قيد التصميم" },
      { value: "pending_confirm", label: "بانتظار التأكيد" },
      { value: "completed", label: "مكتمل" },
      { value: "suspended", label: "معلق" },
      { value: "rejected", label: "مرفوض" },
      { value: "returned", label: "مرتجع" },
    ];
  }
  
  if (isPrintOrder) {
    // PrintOrder.Status.choices في الباك اند
    return [
      { value: "pending_review", label: "بانتظار المراجعة" },
      { value: "in_production", label: "قيد الإنتاج" },
      { value: "pending_confirm", label: "بانتظار التأكيد" },
      { value: "in_warehouse", label: "في المستودع" },
      { value: "delivery_scheduled", label: "تم حجز التسليم" },
      { value: "archived", label: "مؤرشف" },
      { value: "rejected", label: "مرفوض" },
      { value: "cancelled", label: "ملغي" },
    ];
  }
  
  // Regular orders - يجب أن تطابق Order.Status.choices في الباك اند
  return [
    { value: "draft", label: "مسودة" },
    { value: "pending", label: "بانتظار المراجعة" },
    { value: "in_review", label: "قيد الاعتماد" },
    { value: "approved", label: "تم الاعتماد" },
    { value: "in_production", label: "قيد الإنتاج" },
    { value: "ready", label: "جاهز للتسليم" },
    { value: "rejected", label: "مرفوض" },
    { value: "cancelled", label: "ملغي" },
  ];
}


