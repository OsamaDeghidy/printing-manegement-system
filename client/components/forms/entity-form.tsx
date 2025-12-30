"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TextArea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { createEntity, updateEntity } from "@/lib/api-client";

export type EntityLevel =
  | "vice_rectorate"
  | "college_deanship"
  | "department_unit";

export interface EntityOption {
  id: string;
  name: string;
  level: EntityLevel;
}

export interface EntityFormValues {
  name: string;
  code?: string;
  level: EntityLevel;
  parent?: string | null;
  is_active: boolean;
  description?: string;
}

interface EntityFormProps {
  mode: "create" | "edit";
  initialValues?: Partial<EntityFormValues>;
  entityId?: string;
  parentOptions: EntityOption[];
  onSuccess: () => void;
  onCancel: () => void;
}

const levelOptions: { value: EntityLevel; label: string }[] = [
  { value: "vice_rectorate", label: "وكالة/قطاع" },
  { value: "college_deanship", label: "كلية/عمادة" },
  { value: "department_unit", label: "قسم/وحدة" },
];

export function EntityForm({
  mode,
  initialValues,
  entityId,
  parentOptions,
  onSuccess,
  onCancel,
}: EntityFormProps) {
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState<EntityFormValues>({
    name: initialValues?.name ?? "",
    code: initialValues?.code ?? "",
    level: initialValues?.level ?? "department_unit",
    parent: initialValues?.parent ?? null,
    is_active: initialValues?.is_active ?? true,
    description: initialValues?.description ?? "",
  });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setForm((prev) => ({
      ...prev,
      name: initialValues?.name ?? "",
      code: initialValues?.code ?? "",
      level: initialValues?.level ?? "department_unit",
      parent: initialValues?.parent ?? null,
      is_active: initialValues?.is_active ?? true,
      description: initialValues?.description ?? "",
    }));
  }, [initialValues]);

  const parentChoices = useMemo(() => {
    return parentOptions.filter((p) => p.id !== entityId);
  }, [parentOptions, entityId]);

  const handleChange = (
    key: keyof EntityFormValues,
    value: EntityFormValues[keyof EntityFormValues]
  ) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const payload = {
        name: form.name.trim(),
        code: form.code?.trim() || undefined,
        level: form.level,
        parent: form.parent || null,
        is_active: form.is_active,
        description: form.description?.trim() || "",
      };

      if (!payload.name) {
        setError("الاسم مطلوب");
        setSubmitting(false);
        return;
      }

      if (mode === "create") {
        await createEntity(payload);
      } else if (mode === "edit" && entityId) {
        await updateEntity(entityId, payload);
      }

      onSuccess();
    } catch (err: any) {
      setError(err?.message || "تعذر حفظ الجهة");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className="mb-2 block text-sm font-semibold text-heading">
            الاسم
          </label>
          <Input
            required
            value={form.name}
            onChange={(e) => handleChange("name", e.target.value)}
            placeholder="اسم الجهة"
          />
        </div>
        <div>
          <label className="mb-2 block text-sm font-semibold text-heading">
            الرمز (اختياري)
          </label>
          <Input
            value={form.code}
            onChange={(e) => handleChange("code", e.target.value)}
            placeholder="مثال: PR-001"
          />
        </div>
        <div>
          <label className="mb-2 block text-sm font-semibold text-heading">
            المستوى
          </label>
          <Select
            value={form.level}
            onChange={(e) => handleChange("level", e.target.value as EntityLevel)}
            options={levelOptions.map((opt) => ({
              value: opt.value,
              label: opt.label,
            }))}
          />
        </div>
        <div>
          <label className="mb-2 block text-sm font-semibold text-heading">
            الجهة الأم
          </label>
          <Select
            value={form.parent ?? ""}
            onChange={(e) =>
              handleChange("parent", e.target.value === "" ? null : (e.target.value as string))
            }
            options={[
              { value: "", label: "بدون (وكالة/قطاع فقط)" },
              ...parentChoices.map((p) => ({
                value: p.id,
                label: `${p.name} (${levelLabel(p.level)})`,
              })),
            ]}
          />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <label className="block text-sm font-semibold text-heading">
            الوصف
          </label>
          <TextArea
            rows={4}
            value={form.description}
            onChange={(e) => handleChange("description", e.target.value)}
            placeholder="وصف مختصر للجهة"
          />
        </div>
        <div className="space-y-3 rounded-lg border border-border p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-heading">الحالة</p>
              <p className="text-xs text-muted">
                إيقاف الجهة سيخفيها من القوائم.
              </p>
            </div>
            <Switch
              checked={form.is_active}
              onCheckedChange={(val) => handleChange("is_active", val)}
            />
          </div>
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


