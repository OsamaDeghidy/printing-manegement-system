"use client";

import { useState, useEffect } from "react";
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
import { ProtectedRoute } from "@/components/auth/protected-route";
import { apiFetch } from "@/lib/api-client";
import type { OrderSummary } from "@/data/orders";

// Backend API response types
interface BackendOrderListResponse {
  id: string;
  order_code: string;
  service: {
    id: string;
    name: string;
    slug: string;
    icon?: string;
  };
  requester: {
    id: string;
    full_name: string;
    department?: string;
  };
  department?: string;
  entity?: {
    id: string;
    name: string;
  };
  status: string;
  priority: string;
  submitted_at: string;
  requires_approval: boolean;
}

function AdminOrdersPageContent() {
  const [orders, setOrders] = useState<OrderSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "regular" | "design" | "print">("all");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    loadOrders();
  }, [filter]);

  // Helper function to extract results from paginated response
  const extractResults = <T,>(data: any): T[] => {
    if (Array.isArray(data)) {
      return data;
    }
    if (data && typeof data === 'object' && Array.isArray(data.results)) {
      return data.results;
    }
    return [];
  };

  const loadOrders = async () => {
    try {
      setLoading(true);
      let allOrders: OrderSummary[] = [];

      if (filter === "all" || filter === "regular") {
        const regularOrdersResponse = await apiFetch<any>("/orders/orders/").catch(() => ({}));
        const regularOrders = extractResults<BackendOrderListResponse>(regularOrdersResponse);
        allOrders.push(...regularOrders.map(mapBackendOrderToListSummary));
      }

      if (filter === "all" || filter === "design") {
        const designOrdersResponse = await apiFetch<any>("/orders/design-orders/").catch(() => ({}));
        const designOrders = extractResults<any>(designOrdersResponse);
        allOrders.push(...designOrders.map(mapDesignOrderToSummary));
      }

      if (filter === "all" || filter === "print") {
        const printOrdersResponse = await apiFetch<any>("/orders/print-orders/").catch(() => ({}));
        const printOrders = extractResults<any>(printOrdersResponse);
        allOrders.push(...printOrders.map(mapPrintOrderToSummary));
      }

      // Sort by submitted_at descending (newest first)
      allOrders.sort((a, b) => {
        const dateA = new Date(a.submittedAt).getTime();
        const dateB = new Date(b.submittedAt).getTime();
        return dateB - dateA;
      });

      setOrders(allOrders);
    } catch (error) {
      console.error("Error loading orders:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredOrders = orders.filter((order) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      order.orderCode.toLowerCase().includes(query) ||
      order.service.name.toLowerCase().includes(query) ||
      order.requester.name.toLowerCase().includes(query) ||
      order.status.toLowerCase().includes(query)
    );
  });

  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-heading">إدارة جميع الطلبات</h1>
          <p className="mt-1 text-sm text-muted">
            عرض وإدارة جميع الطلبات في النظام (عادية، تصميم، طباعة)
          </p>
        </div>
      </header>

      <Card padding="lg" shadow="soft">
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex-1 min-w-[200px]">
              <Input
                type="text"
                placeholder="بحث في الطلبات..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant={filter === "all" ? "primary" : "secondary"}
                onClick={() => setFilter("all")}
                size="sm"
              >
                الكل
              </Button>
              <Button
                variant={filter === "regular" ? "primary" : "secondary"}
                onClick={() => setFilter("regular")}
                size="sm"
              >
                عادية
              </Button>
              <Button
                variant={filter === "design" ? "primary" : "secondary"}
                onClick={() => setFilter("design")}
                size="sm"
              >
                تصميم
              </Button>
              <Button
                variant={filter === "print" ? "primary" : "secondary"}
                onClick={() => setFilter("print")}
                size="sm"
              >
                طباعة
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <div className="text-center py-8">
          <p className="text-muted">جاري تحميل الطلبات...</p>
        </div>
      ) : filteredOrders.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted">
            لا توجد طلبات
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filteredOrders.map((order) => (
            <Card key={order.id} padding="lg" shadow="soft">
              <CardHeader className="items-start gap-2">
                <Badge tone="info">{order.orderCode}</Badge>
                <CardTitle className="text-lg">
                  {order.service.icon ? `${order.service.icon} ` : ""}
                  {order.service.name}
                </CardTitle>
                <p className="text-xs text-muted">
                  مقدم الطلب: {order.requester.name}
                  {order.requester.department ? ` • ${order.requester.department}` : ""}
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-wrap items-center gap-2 text-sm">
                  <Badge tone={statusTone(order.status)}>
                    {statusLabel(order.status)}
                  </Badge>
                  <Badge tone="neutral">{priorityLabel(order.priority)}</Badge>
                  {order.quantity && (
                    <Badge tone="neutral">الكمية: {order.quantity}</Badge>
                  )}
                </div>
                <p className="text-xs text-muted">
                  تاريخ التقديم: {order.submittedAt}
                </p>
                <Button type="button" asChild variant="primary" fullWidth size="sm">
                  <Link href={`/orders/${order.orderCode}`}>عرض التفاصيل</Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function mapBackendOrderToListSummary(order: BackendOrderListResponse): OrderSummary {
  return {
    id: order.id,
    orderCode: order.order_code,
    service: {
      id: order.service.id,
      name: order.service.name,
      slug: order.service.slug,
      icon: order.service.icon,
    },
    requester: {
      name: order.requester.full_name,
      department: order.requester.department || order.department,
    },
    quantity: undefined,
    status: order.status as any,
    priority: order.priority as any,
    submittedAt: order.submitted_at,
    requiresApproval: order.requires_approval,
  };
}

function mapDesignOrderToSummary(order: any): OrderSummary {
  return {
    id: order.id,
    orderCode: order.order_code,
    service: {
      id: `design-${order.design_type}`,
      name: `خدمة التصميم - ${order.title}`,
      slug: `design-${order.design_type}`,
      icon: "🎨",
    },
    requester: {
      name: order.requester?.full_name || "غير محدد",
      department: order.requester?.department || order.entity?.name,
    },
    quantity: undefined,
    status: order.status as any,
    priority: order.priority as any,
    submittedAt: order.submitted_at,
    requiresApproval: true,
  };
}

function mapPrintOrderToSummary(order: any): OrderSummary {
  return {
    id: order.id,
    orderCode: order.order_code,
    service: {
      id: `print-${order.print_type}`,
      name: `خدمة الطباعة - ${order.print_type}`,
      slug: `print-${order.print_type}`,
      icon: "🖨️",
    },
    requester: {
      name: order.requester?.full_name || "غير محدد",
      department: order.requester?.department || order.entity?.name,
    },
    quantity: order.quantity,
    status: order.status as any,
    priority: order.priority as any,
    submittedAt: order.submitted_at,
    requiresApproval: true,
  };
}

function statusTone(status: string) {
  switch (status) {
    case "pending":
    case "pending_review":
      return "neutral" as const;
    case "in_review":
    case "in_design":
    case "in_production":
      return "warning" as const;
    case "approved":
    case "ready":
    case "completed":
    case "in_warehouse":
      return "success" as const;
    case "rejected":
      return "danger" as const;
    default:
      return "neutral" as const;
  }
}

function statusLabel(status: string): string {
  const statusMap: Record<string, string> = {
    draft: "مسودة",
    pending: "بانتظار المعالجة",
    pending_review: "بانتظار المراجعة",
    in_review: "قيد الاعتماد",
    in_design: "قيد التصميم",
    approved: "تم الاعتماد",
    in_production: "قيد الإنتاج",
    ready: "جاهز للتسليم",
    rejected: "مرفوض",
    completed: "مكتمل",
    in_warehouse: "في المستودع",
    pending_confirm: "بانتظار التأكيد",
    delivery_scheduled: "تم حجز موعد التسليم",
    suspended: "معلق",
    returned: "مرجع",
    cancelled: "ملغي",
  };
  return statusMap[status] || status;
}

function priorityLabel(priority: string): string {
  switch (priority) {
    case "low":
    case "normal":
      return "عادية";
    case "medium":
      return "متوسطة";
    case "high":
    case "urgent":
    case "emergency":
      return "عاجلة";
    default:
      return priority;
  }
}

export default function AdminOrdersPage() {
  return (
    <ProtectedRoute requiredRoles={["print_manager", "admin"]}>
      <AdminOrdersPageContent />
    </ProtectedRoute>
  );
}

