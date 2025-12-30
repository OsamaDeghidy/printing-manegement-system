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
import {
  fetchReports,
  fetchProductivityReport,
  fetchInventoryReport,
  fetchROIReport,
  fetchEntities,
} from "@/lib/api-client";

function AdminReportsPageContent() {
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState<any>(null);
  const [filters, setFilters] = useState({
    entity: "",
    start_date: "",
    end_date: "",
    order_type: "",
  });
  const [entities, setEntities] = useState<any[]>([]);

  useEffect(() => {
    loadEntities();
  }, []);

  const loadEntities = async () => {
    try {
      const data = await fetchEntities();
      setEntities(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error loading entities:", error);
    }
  };

  const handleGenerateReport = async () => {
    try {
      setLoading(true);
      const data = await fetchReports(filters);
      setReportData(data);
    } catch (error) {
      console.error("Error generating report:", error);
      alert("فشل إنشاء التقرير");
    } finally {
      setLoading(false);
    }
  };

  const reportTypes = [
    { id: "orders", title: "الطلبات", description: "عدد الطلبات، مدة الإنجاز، الخدمة الأكثر طلباً." },
    { id: "financial", title: "القيمة المالية", description: "إجمالي التكلفة الداخلية، التوفير مقابل السوق." },
    { id: "inventory", title: "المخزون", description: "تحليل الاستهلاك، المواد الحرجة، توقع النفاد." },
    { id: "users", title: "المستخدمون", description: "الأقسام النشطة، نسب اعتماد الطلبات، مستخدمون جدد." },
  ];

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
          <div className="md:col-span-4">
            <Button onClick={handleGenerateReport} disabled={loading}>
              {loading ? "جاري الإنشاء..." : "إنشاء التقرير"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {reportData && (
        <Card padding="lg" shadow="soft">
          <CardHeader>
            <CardTitle>نتائج التقرير</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="overflow-auto rounded-lg border border-border p-4 text-sm">
              {JSON.stringify(reportData, null, 2)}
            </pre>
          </CardContent>
        </Card>
      )}

      <Card padding="lg" shadow="soft">
        <CardHeader>
          <CardTitle>إنشاء تقرير مخصص</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          {reportTypes.map((report) => (
            <div key={report.id} className="rounded-xl border border-border px-5 py-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-heading">{report.title}</h2>
                <Badge tone="neutral">متاح</Badge>
              </div>
              <p className="mt-2 text-sm text-muted">{report.description}</p>
              <Button variant="secondary" size="sm" className="mt-4 w-full">
                إنشاء التقرير
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
