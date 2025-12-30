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
import { fetchInventoryLogs, type InventoryLog } from "@/lib/api-client";

function AdminInventoryLogsPageContent() {
  const [logs, setLogs] = useState<InventoryLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLogs();
  }, []);

  const loadLogs = async () => {
    try {
      setLoading(true);
      const data = await fetchInventoryLogs();
      setLogs(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error loading inventory logs:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString("ar-SA", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const operationLabel = (operation: string) => {
    switch (operation) {
      case "in":
        return "إدخال";
      case "out":
        return "إخراج";
      case "adjust":
        return "تعديل";
      default:
        return operation;
    }
  };

  const operationTone = (operation: string) => {
    switch (operation) {
      case "in":
        return "success" as const;
      case "out":
        return "warning" as const;
      case "adjust":
        return "info" as const;
      default:
        return "neutral" as const;
    }
  };

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl font-bold text-heading">سجل حركة المخزون</h1>
        <p className="mt-1 text-sm text-muted">
          عرض جميع عمليات الإدخال والإخراج والتعديل على المخزون
        </p>
      </header>

      {loading ? (
        <div className="text-center py-8">
          <p className="text-muted">جاري التحميل...</p>
        </div>
      ) : logs.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted">
            لا توجد سجلات
          </CardContent>
        </Card>
      ) : (
        <Card padding="lg" shadow="soft">
          <CardHeader>
            <CardTitle>سجل الحركة</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-right py-3 px-4">التاريخ</th>
                    <th className="text-right py-3 px-4">المادة</th>
                    <th className="text-right py-3 px-4">العملية</th>
                    <th className="text-right py-3 px-4">الكمية</th>
                    <th className="text-right py-3 px-4">الرصيد بعد</th>
                    <th className="text-right py-3 px-4">منفذ العملية</th>
                    <th className="text-right py-3 px-4">ملاحظات</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log) => (
                    <tr key={log.id} className="border-b border-border">
                      <td className="py-3 px-4 text-muted">
                        {formatDate(log.created_at)}
                      </td>
                      <td className="py-3 px-4">
                        <div>
                          <div className="font-semibold text-heading">{log.item.name}</div>
                          <div className="text-xs text-muted">{log.item.sku}</div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <Badge tone={operationTone(log.operation)}>
                          {operationLabel(log.operation)}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 font-semibold">{log.quantity}</td>
                      <td className="py-3 px-4">{log.balance_after}</td>
                      <td className="py-3 px-4 text-muted">
                        {log.performed_by.full_name}
                      </td>
                      <td className="py-3 px-4 text-muted">
                        {log.note || "—"}
                        {log.reference_order && (
                          <div className="text-xs mt-1">
                            طلب: {log.reference_order}
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default function AdminInventoryLogsPage() {
  return (
    <ProtectedRoute requiredRoles={["print_manager", "admin"]}>
      <AdminInventoryLogsPageContent />
    </ProtectedRoute>
  );
}



