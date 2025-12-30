"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { fetchOrders } from "@/lib/api-client";
import type { OrderSummary } from "@/data/orders";

interface OrdersListProps {
  initialOrders: OrderSummary[];
}

export function OrdersList({ initialOrders }: OrdersListProps) {
  const [orders, setOrders] = useState<OrderSummary[]>(initialOrders);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Fetch fresh data from API after component mounts (client-side)
    async function loadOrders() {
      try {
        setLoading(true);
        const freshOrders = await fetchOrders();
        setOrders(freshOrders);
      } catch (error) {
        console.error("Failed to fetch orders:", error);
        // Keep initial orders if fetch fails
      } finally {
        setLoading(false);
      }
    }

    loadOrders();
  }, []);

  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-heading">إدارة الطلبات</h1>
          <p className="mt-1 text-sm text-muted">
            تابع حالة طلباتك، عدّلها، أو قم بإنشاء طلب جديد بسرعة.
          </p>
        </div>
        <Button type="button" variant="primary" asChild>
          <Link href="/services">+ إنشاء طلب جديد</Link>
        </Button>
      </header>

      {loading && (
        <div className="text-center py-8">
          <p className="text-muted">جاري تحديث البيانات...</p>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {orders.length === 0 ? (
          <div className="col-span-full text-center py-8">
            <p className="text-muted">لا توجد طلبات حالياً</p>
          </div>
        ) : (
          orders.map((order) => (
            <Card key={order.id} padding="lg" shadow="soft">
              <CardHeader className="items-start gap-2">
                <Badge tone="info">{order.orderCode}</Badge>
                <CardTitle className="text-lg">
                  {order.service.icon ? `${order.service.icon} ` : ""}
                  {order.service.name}
                </CardTitle>
                <p className="text-xs text-muted">
                  القسم: {order.requester.department ?? "—"} • مقدم الطلب:{" "}
                  {order.requester.name}
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-wrap items-center gap-2 text-sm">
                  <Badge tone={statusTone(order.status)}>
                    الحالة: {statusLabel(order.status)}
                  </Badge>
                  <Badge tone="neutral">الأولوية: {priorityLabel(order.priority)}</Badge>
                  {order.quantity ? (
                    <Badge tone="neutral">الكمية: {order.quantity}</Badge>
                  ) : null}
                </div>
                <p className="text-xs text-muted">
                  تاريخ التقديم: {order.submittedAt}
                </p>
                <div className="flex gap-2 pt-2">
                  <Button type="button" asChild variant="primary" fullWidth size="sm">
                    <Link href={`/orders/${order.orderCode}`}>عرض التفاصيل</Link>
                  </Button>
                  <Button type="button" asChild variant="secondary" fullWidth size="sm">
                    <Link href={`/services/${order.service.slug}`}>
                      إعادة الطلب
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
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
      return "قيد الإنتاج";
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


