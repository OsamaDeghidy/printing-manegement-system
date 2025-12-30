"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { fetchAuditLogs, type AuditLog } from "@/lib/api-client";

function AdminLogsPageContent() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLogs();
  }, []);

  const loadLogs = async () => {
    try {
      setLoading(true);
      const data = await fetchAuditLogs();
      setLogs(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error loading audit logs:", error);
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

  const severityLabel = (severity: string) => {
    switch (severity) {
      case "info":
        return "معلومة";
      case "success":
        return "نجاح";
      case "warning":
        return "تنبيه";
      case "danger":
        return "خطأ";
      default:
        return severity;
    }
  };

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl font-bold text-heading">سجل النظام والتدقيق</h1>
        <p className="mt-1 text-sm text-muted">
          راقب كل العمليات في النظام، وحافظ على الامتثال لسياسات الجامعة.
        </p>
      </header>

      {loading ? (
        <div className="text-center py-8">جاري التحميل...</div>
      ) : logs.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted">
            لا توجد سجلات
          </CardContent>
        </Card>
      ) : (
        <Card padding="lg" shadow="soft">
          <CardHeader>
            <CardTitle>آخر العمليات</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted">
            {logs.map((log) => (
              <div
                key={log.id}
                className="grid gap-3 rounded-xl border border-border px-5 py-4 md:grid-cols-[160px_140px_1fr]"
              >
                <span className="font-mono text-xs text-muted">
                  {formatDate(log.created_at)}
                </span>
                <span className="text-sm font-semibold text-heading">{log.actor}</span>
                <div className="flex items-center justify-between gap-2">
                  <p>{log.action}</p>
                  <Badge tone={log.severity as any}>{severityLabel(log.severity)}</Badge>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default function AdminLogsPage() {
  return (
    <ProtectedRoute requiredRoles={["admin"]}>
      <AdminLogsPageContent />
    </ProtectedRoute>
  );
}
