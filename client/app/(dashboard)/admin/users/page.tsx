"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { UserForm } from "@/components/forms/user-form";
import { fetchUsers, fetchUserDetail, updateUser, type User } from "@/lib/api-client";
import { ProtectedRoute } from "@/components/auth/protected-route";

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState<"create" | "edit" | null>(null);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchUsers();
      setUsers(Array.isArray(data) ? data : []);
    } catch (err: any) {
      console.error("Error loading users", err);
      setError(err?.message || "تعذر تحميل المستخدمين");
    } finally {
      setLoading(false);
    }
  };

  const loadUserDetail = async (id: string) => {
    try {
      setSaving(true);
      const detail = await fetchUserDetail(id);
      setSelectedUser(detail);
      setShowForm("edit");
    } catch (err) {
      setError("تعذر جلب بيانات المستخدم");
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (user: User) => {
    try {
      setSaving(true);
      setError(null);
      await updateUser(user.id, { is_active: !user.is_active });
      await loadUsers();
    } catch (err: any) {
      setError(err?.message || "تعذر تحديث الحالة");
    } finally {
      setSaving(false);
    }
  };

  const renderForm = () => {
    if (!showForm) return null;
    const isEdit = showForm === "edit" && selectedUser;
    return (
      <Card>
        <CardHeader>
          <CardTitle>{isEdit ? "تعديل مستخدم" : "إضافة مستخدم"}</CardTitle>
        </CardHeader>
        <CardContent>
          <UserForm
            mode={isEdit ? "edit" : "create"}
            userId={isEdit ? selectedUser.id : undefined}
            initialValues={
              isEdit && selectedUser
                ? {
                    email: selectedUser.email,
                    full_name: selectedUser.full_name,
                    department: selectedUser.department || "",
                    phone_number: selectedUser.phone_number || "",
                    role: selectedUser.role as any,
                    entity: selectedUser.entity?.id ?? null,
                    is_active: selectedUser.is_active,
                  }
                : undefined
            }
            onSuccess={async () => {
              await loadUsers();
              setShowForm(null);
              setSelectedUser(null);
            }}
            onCancel={() => {
              setShowForm(null);
              setSelectedUser(null);
            }}
          />
        </CardContent>
      </Card>
    );
  };

  const getRoleLabel = (role: string): string => {
    const labels: Record<string, string> = {
      consumer: "مستخدم",
      print_manager: "مدير المطبعة",
      dept_manager: "مدير القسم",
      dept_employee: "موظف القسم",
      training_supervisor: "مشرف التدريب",
      inventory: "مراقب مخزون",
      admin: "مدير النظام",
      approver: "معتمد",
      staff: "موظف",
      requester: "طالب خدمة",
    };
    return labels[role] || role;
  };

  return (
    <ProtectedRoute requiredRoles={["admin", "print_manager"]}>
      <div className="space-y-8">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-heading">إدارة المستخدمين والصلاحيات</h1>
            <p className="mt-1 text-sm text-muted">
              أضف مستخدمين جدد، حدّث أدوارهم، وتحقق من حالة تفعيل الحسابات.
            </p>
          </div>
          <Button
            variant="primary"
            onClick={() => {
              setSelectedUser(null);
              setShowForm("create");
            }}
          >
            + إضافة مستخدم
          </Button>
        </header>

        {error && (
          <div className="rounded-md border border-destructive/60 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </div>
        )}

        {showForm && renderForm()}

        <Card padding="lg" shadow="soft">
          <CardHeader>
            <CardTitle>قائمة المستخدمين</CardTitle>
          </CardHeader>
          <CardContent className="divide-y divide-border text-sm">
            {loading ? (
              <div className="py-6 text-center text-muted">جاري التحميل...</div>
            ) : users.length === 0 ? (
              <div className="py-6 text-center text-muted">لا يوجد مستخدمون</div>
            ) : (
              users.map((user) => (
                <div
                  key={user.id}
                  className="flex flex-wrap items-center justify-between gap-3 py-4"
                >
                  <div>
                    <p className="text-base font-semibold text-heading">
                      {user.full_name}
                    </p>
                    <p className="text-xs text-muted">
                      {user.department || "—"} • {getRoleLabel(user.role)}
                      {user.entity && ` • ${user.entity.name}`}
                    </p>
                    <p className="text-[11px] text-muted">{user.email}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge tone={user.is_active ? "success" : "warning"}>
                      {user.is_active ? "نشط" : "معلق"}
                    </Badge>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => loadUserDetail(user.id)}
                    >
                      تعديل
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={saving}
                      onClick={() => toggleActive(user)}
                    >
                      {user.is_active ? "إيقاف" : "تفعيل"}
                    </Button>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </ProtectedRoute>
  );
}
