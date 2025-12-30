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
import { fetchDashboardStats, fetchOrders, fetchInventoryItems } from "@/lib/api-client";

function AdminOverviewPageContent() {
  const [stats, setStats] = useState({
    active_orders: 0,
    pending_approvals: 0,
    inventory_alerts: 0,
    savings_percentage: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      setLoading(true);
      const dashboardStats = await fetchDashboardStats();
      setStats(dashboardStats);
    } catch (error) {
      console.error("Error loading dashboard stats:", error);
    } finally {
      setLoading(false);
    }
  };

  const tiles = [
    {
      title: "الطلبات النشطة",
      value: stats.active_orders.toString(),
      trend: "جاري المعالجة",
      tone: "info" as const,
    },
    {
      title: "طلبات بانتظار الاعتماد",
      value: stats.pending_approvals.toString(),
      trend: "تحتاج مراجعة",
      tone: "warning" as const,
    },
    {
      title: "تنبيهات المخزون",
      value: stats.inventory_alerts.toString(),
      trend: "مواد تحتاج تزويد",
      tone: "danger" as const,
    },
    {
      title: "نسبة التوفير",
      value: `${stats.savings_percentage}%`,
      trend: "مقارنة بالسوق",
      tone: "success" as const,
    },
  ];

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl font-bold text-heading">لوحة المدير التنفيذية</h1>
        <p className="mt-1 text-sm text-muted">
          مؤشرات الأداء الرئيسية للمطبعة، مع لمحة عن الطلبات والمخزون والمالية.
        </p>
      </header>

      {loading ? (
        <div className="text-center py-8">جاري التحميل...</div>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {tiles.map((tile) => (
              <Card key={tile.title} padding="lg" shadow="soft">
                <CardHeader className="items-start">
                  <Badge tone={tile.tone}>{tile.title}</Badge>
                </CardHeader>
                <CardContent className="space-y-2">
                  <p className="text-3xl font-bold text-heading">{tile.value}</p>
                  <p className="text-xs text-muted">{tile.trend}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card padding="lg" shadow="soft">
              <CardHeader>
                <CardTitle>مؤشرات سريعة</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-muted">
                <InsightRow label="الطلبات النشطة" value={stats.active_orders.toString()} />
                <InsightRow label="بانتظار الاعتماد" value={stats.pending_approvals.toString()} tone="warning" />
                <InsightRow label="تنبيهات المخزون" value={stats.inventory_alerts.toString()} tone="danger" />
                <InsightRow label="نسبة التوفير" value={`${stats.savings_percentage}%`} tone="success" />
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}

function InsightRow({
  label,
  value,
  tone = "info",
}: {
  label: string;
  value: string;
  tone?: "info" | "success" | "warning" | "danger";
}) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-border px-4 py-3">
      <span>{label}</span>
      <Badge tone={tone}>{value}</Badge>
    </div>
  );
}

export default function AdminOverviewPage() {
  return (
    <ProtectedRoute requiredRoles={["print_manager", "admin"]}>
      <AdminOverviewPageContent />
    </ProtectedRoute>
  );
}
