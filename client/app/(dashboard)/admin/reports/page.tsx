"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { useAuth } from "@/lib/auth-context";
import {
  fetchOrdersReport,
  fetchProductivityReport,
  fetchInventoryReport,
  fetchROIReport,
  fetchEntities,
  type Entity,
} from "@/lib/api-client";

// Helper function to get status label in Arabic
const getStatusLabel = (status: string): string => {
  const statusMap: Record<string, string> = {
    pending: "قيد الانتظار",
    in_review: "قيد المراجعة",
    approved: "معتمد",
    rejected: "مرفوض",
    in_production: "قيد الإنتاج",
    completed: "مكتمل",
    archived: "مؤرشف",
    delivery_scheduled: "مجدول للتسليم",
    cancelled: "ملغي",
    suspended: "معلق",
    returned: "معاد",
    in_warehouse: "في المستودع",
  };
  return statusMap[status] || status;
};

function AdminReportsPageContent() {
  const { hasRole } = useAuth();
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState<any>(null);
  const [filters, setFilters] = useState({
    entity: "",
    start_date: "",
    end_date: "",
    order_type: "",
  });
  const [entities, setEntities] = useState<Entity[]>([]);
  const [selectedReportType, setSelectedReportType] = useState<string>("orders");

  // Check permissions
  const canViewReports = hasRole("admin") || hasRole("print_manager");

  useEffect(() => {
    if (canViewReports) {
      loadEntities();
    }
  }, [canViewReports]);

  const loadEntities = async () => {
    try {
      const data = await fetchEntities();
      if (Array.isArray(data)) {
        setEntities(data);
      } else if (data?.results && Array.isArray(data.results)) {
        setEntities(data.results);
      } else {
        setEntities([]);
      }
    } catch (error) {
      console.error("Error loading entities:", error);
      setEntities([]);
    }
  };

  const handleGenerateReport = async (type?: string) => {
    const reportTypeToGenerate = type || selectedReportType || "orders";
    try {
      setLoading(true);
      setReportData(null);
      let data;
      
      switch (reportTypeToGenerate) {
        case "orders":
          data = await fetchOrdersReport(filters);
          break;
        case "productivity":
          data = await fetchProductivityReport(filters.start_date);
          break;
        case "inventory":
          data = await fetchInventoryReport();
          break;
        case "roi":
          data = await fetchROIReport();
          break;
        default:
          data = await fetchOrdersReport(filters);
      }
      
      setReportData({ type: reportTypeToGenerate, data });
      setSelectedReportType(reportTypeToGenerate);
    } catch (error: any) {
      console.error("Error generating report:", error);
      alert(error.message || "فشل إنشاء التقرير");
    } finally {
      setLoading(false);
    }
  };

  const reportTypes = [
    { id: "orders", title: "الطلبات", description: "عدد الطلبات، مدة الإنجاز، الخدمة الأكثر طلباً.", icon: "📊" },
    { id: "productivity", title: "الإنتاجية", description: "تقارير الإنتاجية اليومية للتصميم والطباعة.", icon: "⚡" },
    { id: "inventory", title: "المخزون", description: "تحليل الاستهلاك، المواد الحرجة، توقع النفاد.", icon: "📦" },
    { id: "roi", title: "التوفير (ROI)", description: "تحليل التوفير مقابل التكلفة الخارجية.", icon: "💰" },
  ];

  const renderReportData = () => {
    if (!reportData) return null;

    const { type, data } = reportData;

    switch (type) {
      case "orders":
        const totalOrders = data.summary?.total_orders || 
          (data.design?.total || 0) + (data.print?.total || 0) + (data.general?.total || 0);
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold text-heading">تقرير الطلبات</h3>
              {data.summary && (
                <Badge tone="info">إجمالي الطلبات: {totalOrders}</Badge>
              )}
            </div>
            
            {data.design && data.design.total > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">طلبات التصميم</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="mb-4">
                    <span className="text-2xl font-bold text-brand-teal">{data.design.total}</span>
                    <span className="text-muted mr-2">طلب</span>
                  </div>
                  {data.design.by_status && Object.keys(data.design.by_status).length > 0 && (
                    <div className="space-y-2">
                      <h4 className="font-semibold text-sm mb-2">حسب الحالة:</h4>
                      {Object.entries(data.design.by_status).map(([status, count]: [string, any]) => (
                        <div key={status} className="flex items-center justify-between py-2 border-b border-border">
                          <span className="text-sm">{getStatusLabel(status)}</span>
                          <Badge tone="neutral">{count}</Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
            
            {data.print && data.print.total > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">طلبات الطباعة</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="mb-4">
                    <span className="text-2xl font-bold text-brand-teal">{data.print.total}</span>
                    <span className="text-muted mr-2">طلب</span>
                  </div>
                  {data.print.by_status && Object.keys(data.print.by_status).length > 0 && (
                    <div className="space-y-2">
                      <h4 className="font-semibold text-sm mb-2">حسب الحالة:</h4>
                      {Object.entries(data.print.by_status).map(([status, count]: [string, any]) => (
                        <div key={status} className="flex items-center justify-between py-2 border-b border-border">
                          <span className="text-sm">{getStatusLabel(status)}</span>
                          <Badge tone="neutral">{count}</Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
            
            {data.general && data.general.total > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">الطلبات العامة</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="mb-4">
                    <span className="text-2xl font-bold text-brand-teal">{data.general.total}</span>
                    <span className="text-muted mr-2">طلب</span>
                  </div>
                  {data.general.by_status && Object.keys(data.general.by_status).length > 0 && (
                    <div className="space-y-2">
                      <h4 className="font-semibold text-sm mb-2">حسب الحالة:</h4>
                      {Object.entries(data.general.by_status).map(([status, count]: [string, any]) => (
                        <div key={status} className="flex items-center justify-between py-2 border-b border-border">
                          <span className="text-sm">{getStatusLabel(status)}</span>
                          <Badge tone="neutral">{count}</Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
            
            {totalOrders === 0 && (
              <div className="text-center py-8 text-muted">
                لا توجد طلبات في الفترة المحددة
              </div>
            )}
          </div>
        );
      case "productivity":
        return (
          <div className="space-y-6">
            <h3 className="text-xl font-bold text-heading">تقرير الإنتاجية</h3>
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">التصميم</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div>
                      <span className="text-2xl font-bold text-success">{data.design_completed || 0}</span>
                      <span className="text-muted mr-2">مكتمل</span>
                    </div>
                    {data.design_pending !== undefined && (
                      <div>
                        <span className="text-lg font-semibold text-warning">{data.design_pending || 0}</span>
                        <span className="text-muted mr-2">قيد المعالجة</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">الطباعة</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div>
                      <span className="text-2xl font-bold text-success">{data.print_completed || 0}</span>
                      <span className="text-muted mr-2">مكتمل</span>
                    </div>
                    {data.print_pending !== undefined && (
                      <div>
                        <span className="text-lg font-semibold text-warning">{data.print_pending || 0}</span>
                        <span className="text-muted mr-2">قيد المعالجة</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="text-sm text-muted mb-2">التاريخ: {data.date}</p>
                  <div className="text-3xl font-bold text-brand-teal">{data.total_completed || 0}</div>
                  <p className="text-muted">إجمالي المكتمل</p>
                </div>
              </CardContent>
            </Card>
          </div>
        );
      case "inventory":
        return (
          <div className="space-y-6">
            <h3 className="text-xl font-bold text-heading">تقرير المخزون</h3>
            {data.low_stock_items && data.low_stock_items.length > 0 ? (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg text-warning">عناصر منخفضة المخزون</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {data.low_stock_items.map((item: any) => (
                      <div key={item.id} className="flex items-center justify-between p-3 rounded-lg border border-warning/20 bg-warning/5">
                        <div>
                          <p className="font-semibold">{item.name}</p>
                          <p className="text-sm text-muted">الحد الأدنى: {item.min_quantity}</p>
                        </div>
                        <Badge tone={item.current_quantity === 0 ? "danger" : "warning"}>
                          {item.current_quantity} متبقي
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="py-8 text-center text-muted">
                  لا توجد عناصر منخفضة المخزون
                </CardContent>
              </Card>
            )}
            {data.movement_last_30_days && Object.keys(data.movement_last_30_days).length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">حركة المخزون (آخر 30 يوم)</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {Object.entries(data.movement_last_30_days).map(([operation, total]: [string, any]) => (
                      <div key={operation} className="flex items-center justify-between py-2 border-b border-border">
                        <span className="text-sm">
                          {operation === "in" ? "إضافة" : operation === "out" ? "صرف" : "تعديل"}
                        </span>
                        <Badge tone={operation === "in" ? "success" : "neutral"}>{total}</Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        );
      case "roi":
        return (
          <div className="space-y-6">
            <h3 className="text-xl font-bold text-heading">تقرير التوفير (ROI)</h3>
            <Card>
              <CardContent className="py-8 text-center">
                <p className="text-muted">{data.message || "قيد التطوير"}</p>
              </CardContent>
            </Card>
          </div>
        );
      default:
        return (
          <pre className="overflow-auto rounded-lg border border-border p-4 text-sm">
            {JSON.stringify(data, null, 2)}
          </pre>
        );
    }
  };

  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-heading">التقارير والإحصائيات</h1>
          <p className="mt-1 text-sm text-muted">
            أنشئ تقارير مفصلة عن الطلبات والقيم المالية والمخزون، مع إمكانية التصدير أو الإرسال بالبريد.
          </p>
        </div>
      </header>

      <Card padding="lg" shadow="soft">
        <CardHeader>
          <CardTitle>فلترة التقرير</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-4">
          <div>
            <label className="mb-2 block text-sm font-semibold text-heading">الجهة</label>
            <select
              value={filters.entity}
              onChange={(e) => setFilters({ ...filters, entity: e.target.value })}
              className="w-full rounded-md border border-border bg-background px-4 py-2"
            >
              <option value="">جميع الجهات</option>
              {entities.map((entity) => (
                <option key={entity.id} value={entity.id}>
                  {entity.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-2 block text-sm font-semibold text-heading">من تاريخ</label>
            <Input
              type="date"
              value={filters.start_date}
              onChange={(e) => setFilters({ ...filters, start_date: e.target.value })}
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-semibold text-heading">إلى تاريخ</label>
            <Input
              type="date"
              value={filters.end_date}
              onChange={(e) => setFilters({ ...filters, end_date: e.target.value })}
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-semibold text-heading">نوع الطلب</label>
            <select
              value={filters.order_type}
              onChange={(e) => setFilters({ ...filters, order_type: e.target.value })}
              className="w-full rounded-md border border-border bg-background px-4 py-2"
            >
              <option value="">الكل</option>
              <option value="design">تصميم</option>
              <option value="print">طباعة</option>
              <option value="general">عام</option>
            </select>
          </div>
          <div className="md:col-span-4 flex gap-3">
            <Button onClick={() => handleGenerateReport("orders")} disabled={loading}>
              {loading ? "جاري الإنشاء..." : "إنشاء تقرير الطلبات"}
            </Button>
            {(filters.entity || filters.start_date || filters.end_date || filters.order_type) && (
              <Button 
                variant="secondary" 
                onClick={() => {
                  setFilters({ entity: "", start_date: "", end_date: "", order_type: "" });
                  setReportData(null);
                }}
              >
                مسح الفلاتر
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {reportData && (
        <Card padding="lg" shadow="soft">
          <CardHeader>
            <CardTitle>نتائج التقرير</CardTitle>
          </CardHeader>
          <CardContent>
            {renderReportData()}
          </CardContent>
        </Card>
      )}

      <Card padding="lg" shadow="soft">
        <CardHeader>
          <CardTitle>إنشاء تقرير مخصص</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          {reportTypes.map((report) => (
            <div key={report.id} className="rounded-xl border border-border px-5 py-4 hover:border-brand-teal transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{report.icon}</span>
                  <h2 className="text-lg font-semibold text-heading">{report.title}</h2>
                </div>
                <Badge tone="neutral">متاح</Badge>
              </div>
              <p className="mt-2 text-sm text-muted">{report.description}</p>
              <Button 
                variant="secondary" 
                size="sm" 
                className="mt-4 w-full"
                onClick={() => handleGenerateReport(report.id)}
                disabled={loading}
              >
                {loading ? "جاري الإنشاء..." : "إنشاء التقرير"}
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

export default function AdminReportsPage() {
  return (
    <ProtectedRoute requiredRoles={["print_manager", "admin"]}>
      <AdminReportsPageContent />
    </ProtectedRoute>
  );
}
