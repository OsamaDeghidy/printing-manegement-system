"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  createUser,
  updateUser,
  fetchEntities,
  type EntityLevel,
} from "@/lib/api-client";

type UserRole =
  | "consumer"
  | "print_manager"
  | "dept_manager"
  | "dept_employee"
  | "training_supervisor"
  | "inventory"
  | "admin"
  | "approver"
  | "staff"
  | "requester";

interface UserFormValues {
  email: string;
  full_name: string;
  department?: string;
  phone_number?: string;
  role: UserRole;
  entity?: string | null;
  is_active: boolean;
  password?: string;
}

interface UserFormProps {
  mode: "create" | "edit";
  userId?: string;
  initialValues?: Partial<UserFormValues>;
  onSuccess: () => void;
  onCancel: () => void;
}

const roleOptions: { value: UserRole; label: string }[] = [
  { value: "consumer", label: "مستخدم" },
  { value: "print_manager", label: "مدير الطباعة" },
  { value: "dept_manager", label: "مدير قسم" },
  { value: "dept_employee", label: "موظف قسم" },
  { value: "training_supervisor", label: "مشرف تدريب" },
  { value: "inventory", label: "مسؤول مخزون" },
  { value: "approver", label: "معتمد" },
  { value: "staff", label: "موظف" },
  { value: "requester", label: "طالب خدمة" },
  { value: "admin", label: "مسؤول نظام" },
];

export function UserForm({
  mode,
  userId,
  initialValues,
  onSuccess,
  onCancel,
}: UserFormProps) {
  const [form, setForm] = useState<UserFormValues>({
    email: initialValues?.email ?? "",
    full_name: initialValues?.full_name ?? "",
    department: initialValues?.department ?? "",
    phone_number: initialValues?.phone_number ?? "",
    role: initialValues?.role ?? "consumer",
    entity: initialValues?.entity ?? null,
    is_active: initialValues?.is_active ?? true,
    password: "",
  });
  const [entities, setEntities] = useState<
    { id: string; name: string; level: EntityLevel }[]
  >([]);
  const [loadingEntities, setLoadingEntities] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadEntities = async () => {
      try {
        setLoadingEntities(true);
        const data = await fetchEntities();
        if (Array.isArray(data)) {
          setEntities(
            data.map((e: any) => ({
              id: e.id,
              name: e.name,
              level: e.level as EntityLevel,
            }))
          );
        }
      } finally {
        setLoadingEntities(false);
      }
    };
    loadEntities();
  }, []);

  useEffect(() => {
    setForm((prev) => ({
      ...prev,
      email: initialValues?.email ?? "",
      full_name: initialValues?.full_name ?? "",
      department: initialValues?.department ?? "",
      phone_number: initialValues?.phone_number ?? "",
      role: initialValues?.role ?? "consumer",
      entity: initialValues?.entity ?? null,
      is_active: initialValues?.is_active ?? true,
      password: "",
    }));
  }, [initialValues]);

  const handleChange = (key: keyof UserFormValues, value: any) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const payload = {
        email: form.email.trim(),
        full_name: form.full_name.trim(),
        department: form.department?.trim() || "",
        phone_number: form.phone_number?.trim() || "",
        role: form.role,
        entity: form.entity || null,
        is_active: form.is_active,
        password: form.password?.trim() || undefined,
      };

      if (!payload.email || !payload.full_name) {
        setError("البريد والاسم مطلوبان");
        setSubmitting(false);
        return;
      }

      if (mode === "create") {
        if (!payload.password) {
          setError("كلمة المرور مطلوبة للإنشاء");
          setSubmitting(false);
          return;
        }
        await createUser(payload as any);
      } else if (mode === "edit" && userId) {
        // لا نرسل كلمة المرور إذا كانت فارغة
        if (!payload.password) {
          delete (payload as any).password;
        }
        await updateUser(userId, payload as any);
      }

      onSuccess();
    } catch (err: any) {
      setError(err?.message || "تعذر حفظ المستخدم");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className="mb-2 block text-sm font-semibold text-heading">
            البريد الإلكتروني
          </label>
          <Input
            type="email"
            required
            disabled={mode === "edit"}
            value={form.email}
            onChange={(e) => handleChange("email", e.target.value)}
            placeholder="name@domain.com"
          />
        </div>
        <div>
          <label className="mb-2 block text-sm font-semibold text-heading">
            الاسم الكامل
          </label>
          <Input
            required
            value={form.full_name}
            onChange={(e) => handleChange("full_name", e.target.value)}
            placeholder="الاسم الكامل"
          />
        </div>
        <div>
          <label className="mb-2 block text-sm font-semibold text-heading">
            القسم / الكلية
          </label>
          <Input
            value={form.department}
            onChange={(e) => handleChange("department", e.target.value)}
            placeholder="مثال: قسم علوم الحاسب"
          />
        </div>
        <div>
          <label className="mb-2 block text-sm font-semibold text-heading">
            رقم التواصل
          </label>
          <Input
            value={form.phone_number}
            onChange={(e) => handleChange("phone_number", e.target.value)}
            placeholder="05XXXXXXXX"
          />
        </div>
        <div>
          <label className="mb-2 block text-sm font-semibold text-heading">
            الدور
          </label>
          <Select
            value={form.role}
            onChange={(e) => handleChange("role", e.target.value as UserRole)}
            options={roleOptions.map((r) => ({
              value: r.value,
              label: r.label,
            }))}
          />
        </div>
        <div>
          <label className="mb-2 block text-sm font-semibold text-heading">
            الجهة
          </label>
          <Select
            value={form.entity ?? ""}
            disabled={loadingEntities}
            onChange={(e) =>
              handleChange("entity", e.target.value === "" ? null : e.target.value)
            }
            options={[
              { value: "", label: "بدون" },
              ...entities.map((e) => ({
                value: e.id,
                label: `${e.name} (${levelLabel(e.level)})`,
              })),
            ]}
          />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className="mb-2 block text-sm font-semibold text-heading">
            كلمة المرور {mode === "edit" ? "(اتركها فارغة للحفاظ عليها)" : ""}
          </label>
          <Input
            type="password"
            required={mode === "create"}
            value={form.password}
            onChange={(e) => handleChange("password", e.target.value)}
            placeholder="••••••••"
          />
        </div>
        <div className="flex items-center justify-between rounded-lg border border-border px-4 py-3">
          <div>
            <p className="text-sm font-semibold text-heading">حالة الحساب</p>
            <p className="text-xs text-muted">تفعيل/إيقاف حساب المستخدم</p>
          </div>
          <Switch
            checked={form.is_active}
            onCheckedChange={(val) => handleChange("is_active", val)}
          />
        </div>
      </div>

      {error && (
        <div className="rounded-md border border-destructive/60 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </div>
      )}

      <div className="flex justify-end gap-3">
        <Button type="button" variant="secondary" onClick={onCancel}>
          إلغاء
        </Button>
        <Button type="submit" disabled={submitting}>
          {submitting ? "جارٍ الحفظ..." : mode === "create" ? "حفظ" : "تحديث"}
        </Button>
      </div>
    </form>
  );
}

function levelLabel(level: EntityLevel) {
  switch (level) {
    case "vice_rectorate":
      return "وكالة/قطاع";
    case "college_deanship":
      return "كلية/عمادة";
    default:
      return "قسم/وحدة";
  }
}


