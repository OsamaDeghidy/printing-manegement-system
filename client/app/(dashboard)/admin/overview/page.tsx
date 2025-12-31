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
import { useAuth } from "@/lib/auth-context";
import { fetchDashboardStats, type DashboardStats } from "@/lib/api-client";

function AdminOverviewPageContent() {
  const { hasRole } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    active_orders: 0,
    pending_approvals: 0,
    inventory_alerts: 0,
    savings_percentage: 0,
  });
  const [loading, setLoading] = useState(true);

  // Check permissions
  const canViewOverview = hasRole("admin") || hasRole("print_manager");

  useEffect(() => {
    if (canViewOverview) {
      loadStats();
      // Refresh stats every 30 seconds
      const interval = setInterval(() => {
        loadStats();
      }, 30000);
      return () => clearInterval(interval);
    }
  }, [canViewOverview]);

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
      icon: "📋",
    },
    {
      title: "طلبات بانتظار الاعتماد",
      value: stats.pending_approvals.toString(),
      trend: "تحتاج مراجعة",
      tone: "warning" as const,
      icon: "⏳",
    },
    {
      title: "تنبيهات المخزون",
      value: stats.inventory_alerts.toString(),
      trend: "مواد تحتاج تزويد",
      tone: "danger" as const,
      icon: "⚠️",
    },
    {
      title: "نسبة التوفير",
      value: `${stats.savings_percentage}%`,
      trend: "مقارنة بالسوق",
      tone: "success" as const,
      icon: "💰",
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
              <Card key={tile.title} padding="lg" shadow="soft" className="hover:shadow-md transition-shadow">
                <CardHeader className="items-start">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{tile.icon}</span>
                    <Badge tone={tile.tone}>{tile.title}</Badge>
                  </div>
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
              <CardContent className="space-y-3 text-sm">
                <InsightRow 
                  label="الطلبات النشطة" 
                  value={stats.active_orders.toString()} 
                  icon="📋"
                />
                <InsightRow 
                  label="بانتظار الاعتماد" 
                  value={stats.pending_approvals.toString()} 
                  tone="warning"
                  icon="⏳"
                />
                <InsightRow 
                  label="تنبيهات المخزون" 
                  value={stats.inventory_alerts.toString()} 
                  tone="danger"
                  icon="⚠️"
                />
                <InsightRow 
                  label="نسبة التوفير" 
                  value={`${stats.savings_percentage}%`} 
                  tone="success"
                  icon="💰"
                />
              </CardContent>
            </Card>

            <Card padding="lg" shadow="soft">
              <CardHeader>
                <CardTitle>ملخص الأداء</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted">إجمالي الطلبات النشطة</span>
                    <span className="text-lg font-semibold text-heading">{stats.active_orders}</span>
                  </div>
                  <div className="w-full bg-surface rounded-full h-2">
                    <div 
                      className="bg-brand-teal h-2 rounded-full transition-all"
                      style={{ width: `${Math.min((stats.active_orders / 100) * 100, 100)}%` }}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted">طلبات تحتاج مراجعة</span>
                    <span className="text-lg font-semibold text-warning">{stats.pending_approvals}</span>
                  </div>
                  <div className="w-full bg-surface rounded-full h-2">
                    <div 
                      className="bg-warning h-2 rounded-full transition-all"
                      style={{ width: `${Math.min((stats.pending_approvals / 50) * 100, 100)}%` }}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted">نسبة التوفير الإجمالية</span>
                    <span className="text-lg font-semibold text-success">{stats.savings_percentage}%</span>
                  </div>
                  <div className="w-full bg-surface rounded-full h-2">
                    <div 
                      className="bg-success h-2 rounded-full transition-all"
                      style={{ width: `${Math.min(stats.savings_percentage, 100)}%` }}
                    />
                  </div>
                </div>
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
  icon,
}: {
  label: string;
  value: string;
  tone?: "info" | "success" | "warning" | "danger";
  icon?: string;
}) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-border px-4 py-3 hover:bg-surface transition-colors">
      <div className="flex items-center gap-2">
        {icon && <span>{icon}</span>}
        <span className="text-body">{label}</span>
      </div>
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
