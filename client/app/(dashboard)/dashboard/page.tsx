"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { services } from "@/data/services";
import { fetchOrders, fetchDashboardStats, type OrderSummary } from "@/lib/api-client";
import type { DashboardStats } from "@/lib/api-client";

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentOrders, setRecentOrders] = useState<OrderSummary[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [statsData, ordersData] = await Promise.all([
        fetchDashboardStats(),
        fetchOrders(),
      ]);
      setStats(statsData);
      setRecentOrders(ordersData.slice(0, 3));
    } catch (error) {
      console.error("Error loading dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const heroStats = stats ? buildHeroStats(stats) : [];

  if (loading) {
    return (
      <div className="text-center py-8">جاري التحميل...</div>
    );
  }

  return (
    <div className="space-y-10">
      <section className="grid gap-4 rounded-3xl bg-gradient-to-l from-brand-teal/10 via-brand-teal/5 to-surface px-8 py-10 shadow-[var(--shadow-soft)]">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-heading">
              مرحباً بك في منصة إدارة مطابع جامعة طيبة 👋
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-muted">
              هنا يمكنك تقديم طلبات الطباعة، متابعة حالة الطلب، وإدارة المخزون
              والتقارير بكل سهولة وشفافية.
            </p>
          </div>
          <div className="flex gap-3">
            <Button type="button" variant="primary" asChild>
              <Link href="/services/business-cards">+ طلب خدمة جديدة</Link>
            </Button>
            <Button type="button" variant="secondary" asChild>
              <Link href="/orders">عرض جميع الطلبات</Link>
            </Button>
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {heroStats.map((stat) => (
            <Card key={stat.title} padding="lg" shadow="soft">
              <CardHeader className="flex items-center justify-between">
                <span className="text-3xl">{stat.icon}</span>
                <Badge tone="info">محدث الآن</Badge>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="text-sm text-muted">{stat.title}</p>
                <p className="text-2xl font-bold text-heading">{stat.value}</p>
                <p className="text-xs text-brand-teal">{stat.trend}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-heading">الخدمات المتاحة</h2>
          <Button variant="ghost" asChild>
            <Link href="/services">عرض كل الخدمات</Link>
          </Button>
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {services.map((service) => (
            <Card key={service.slug} padding="lg" shadow="soft">
              <CardHeader className="items-start gap-4">
                <span className="text-4xl">{service.icon}</span>
                <div className="space-y-1">
                  <CardTitle className="text-lg">{service.name}</CardTitle>
                  <p className="text-sm text-muted">{service.description}</p>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {service.requiresApproval ? (
                  <Badge tone="warning">تتطلب موافقة قبل التنفيذ</Badge>
                ) : (
                  <Badge tone="success">تنفيذ فوري</Badge>
                )}
                <Button variant="primary" fullWidth asChild>
                  <Link href={`/services/${service.slug}`}>طلب الخدمة</Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-heading">
            أحدث الطلبات
          </h2>
          <Button variant="ghost" asChild>
            <Link href="/orders">إدارة الطلبات</Link>
          </Button>
        </div>
        {recentOrders.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-3">
            {recentOrders.map((order) => (
              <Card key={order.id} padding="lg" shadow="soft">
                <CardHeader className="items-start gap-2">
                  <Badge tone="info">{order.orderCode}</Badge>
                  <p className="text-sm text-muted">
                    {order.requester?.name || "غير محدد"}
                    {order.requester?.department
                      ? ` • ${order.requester.department}`
                      : ""}
                  </p>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-1">
                    <p className="text-sm text-heading">
                      الخدمة:{" "}
                      <span className="font-medium text-brand-navy">
                        {order.service?.name || "غير محدد"}
                      </span>
                    </p>
                    {order.quantity && (
                      <p className="text-sm text-muted">
                        الكمية: {order.quantity} قطعة
                      </p>
                    )}
                  </div>
                  <Badge tone={getStatusTone(order.status)}>
                    الحالة: {statusLabel(order.status)}
                  </Badge>
                  <Button variant="ghost" asChild size="sm">
                    <Link href={`/orders/${order.orderCode}`}>عرض التفاصيل</Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card padding="lg" shadow="soft">
            <CardContent className="py-8 text-center text-muted">
              لا توجد طلبات حديثة
            </CardContent>
          </Card>
        )}
      </section>
    </div>
  );
}

function buildHeroStats(stats: DashboardStats) {
  return [
    {
      title: "الطلبات الحالية",
      value: `${stats.active_orders} طلب`,
      trend: `إجمالي الطلبات النشطة`,
      icon: "📝",
    },
    {
      title: "طلبات قيد الاعتماد",
      value: `${stats.pending_approvals} طلب`,
      trend: "تأكد من اعتماد الطلبات العاجلة",
      icon: "✅",
    },
    {
      title: "التوفير الشهري",
      value: `${stats.savings_percentage}%`,
      trend: "مقارنة بالأسعار الخارجية",
      icon: "💰",
    },
  ];
}

function getStatusTone(status: string): "info" | "success" | "warning" | "danger" {
  switch (status) {
    case "ready":
    case "completed":
      return "success";
    case "rejected":
    case "cancelled":
      return "danger";
    case "pending":
    case "in_review":
      return "warning";
    default:
      return "info";
  }
}

function statusLabel(status: string): string {
  switch (status) {
    case "draft":
      return "مسودة";
    case "pending":
      return "بانتظار المراجعة";
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
    case "cancelled":
      return "ملغي";
    case "archived":
      return "مؤرشف";
    default:
      return status;
  }
}


