"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { useAuth } from "@/lib/auth-context";
import { fetchAuditLogs, fetchUsers, type AuditLog, type User } from "@/lib/api-client";

function AdminLogsPageContent() {
  const { hasRole } = useAuth();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    search: "",
    actor: "",
    start_date: "",
    end_date: "",
    severity: "",
  });

  // Check permissions
  const canViewLogs = hasRole("admin");

  useEffect(() => {
    if (canViewLogs) {
      loadLogs();
      loadUsers();
    }
  }, [canViewLogs]);

  useEffect(() => {
    if (canViewLogs) {
      loadLogs();
    }
  }, [filters]);

  const loadUsers = async () => {
    try {
      const data = await fetchUsers();
      if (Array.isArray(data)) {
        setUsers(data);
      } else {
        setUsers([]);
      }
    } catch (error) {
      console.error("Error loading users:", error);
      setUsers([]);
    }
  };

  const loadLogs = async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (filters.search) params.search = filters.search;
      if (filters.actor) params.actor = filters.actor;
      if (filters.start_date) params.start_date = filters.start_date;
      if (filters.end_date) params.end_date = filters.end_date;
      if (filters.severity) params.severity = filters.severity;
      
      const data = await fetchAuditLogs(params);
      setLogs(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error loading audit logs:", error);
      setLogs([]);
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

  const getSeverityTone = (severity: string): "info" | "success" | "warning" | "danger" => {
    return (severity as any) || "info";
  };

  const clearFilters = () => {
    setFilters({
      search: "",
      actor: "",
      start_date: "",
      end_date: "",
      severity: "",
    });
  };

  const hasActiveFilters = filters.search || filters.actor || filters.start_date || filters.end_date || filters.severity;

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl font-bold text-heading">سجل النظام والتدقيق</h1>
        <p className="mt-1 text-sm text-muted">
          راقب كل العمليات في النظام، وحافظ على الامتثال لسياسات الجامعة.
        </p>
      </header>

      <Card padding="lg" shadow="soft">
        <CardHeader>
          <CardTitle>فلترة السجلات</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-5">
          <div>
            <label className="mb-2 block text-sm font-semibold text-heading">البحث</label>
            <Input
              type="text"
              placeholder="ابحث في الأحداث..."
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-semibold text-heading">المستخدم</label>
            <select
              value={filters.actor}
              onChange={(e) => setFilters({ ...filters, actor: e.target.value })}
              className="w-full rounded-md border border-border bg-background px-4 py-2"
            >
              <option value="">جميع المستخدمين</option>
              {users.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.full_name || user.email}
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
            <label className="mb-2 block text-sm font-semibold text-heading">مستوى الخطورة</label>
            <select
              value={filters.severity}
              onChange={(e) => setFilters({ ...filters, severity: e.target.value })}
              className="w-full rounded-md border border-border bg-background px-4 py-2"
            >
              <option value="">الكل</option>
              <option value="info">معلومة</option>
              <option value="success">نجاح</option>
              <option value="warning">تنبيه</option>
              <option value="danger">خطأ</option>
            </select>
          </div>
          {hasActiveFilters && (
            <div className="md:col-span-5">
              <Button variant="secondary" onClick={clearFilters}>
                مسح الفلاتر
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

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
          <CardHeader className="flex items-center justify-between">
            <CardTitle>سجل العمليات ({logs.length})</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {logs.map((log) => (
              <div
                key={log.id}
                className="grid gap-3 rounded-xl border border-border px-5 py-4 hover:bg-surface/50 transition-colors md:grid-cols-[180px_200px_1fr_auto]"
              >
                <span className="font-mono text-xs text-muted">
                  {formatDate(log.created_at)}
                </span>
                <div>
                  <span className="text-sm font-semibold text-heading">
                    {log.actor_name || log.actor_email || "نظام"}
                  </span>
                  {log.actor_email && log.actor_name && (
                    <p className="text-xs text-muted">{log.actor_email}</p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <p className="text-sm text-body">{log.action}</p>
                </div>
                <Badge tone={getSeverityTone(log.severity)}>
                  {severityLabel(log.severity)}
                </Badge>
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
