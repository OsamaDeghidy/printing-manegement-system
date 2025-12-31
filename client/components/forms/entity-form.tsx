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
    name: initialValues?.name || "",
    code: initialValues?.code || "",
    level: initialValues?.level || "department_unit",
    parent: initialValues?.parent || null,
    is_active: initialValues?.is_active ?? true,
    description: initialValues?.description || "",
  });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialValues) {
      setForm((prev) => ({
        ...prev,
        name: initialValues.name || "",
        code: initialValues.code || "",
        level: initialValues.level || "department_unit",
        parent: initialValues.parent || null,
        is_active: initialValues.is_active ?? true,
        description: initialValues.description || "",
      }));
    }
  }, [initialValues]);

  const parentChoices = useMemo(() => {
    // Filter parent options based on selected level
    let filtered = parentOptions.filter((p) => p.id !== entityId);
    
    // If level is vice_rectorate, no parent allowed
    if (form.level === "vice_rectorate") {
      return [];
    }
    
    // If level is college_deanship, only vice_rectorate can be parent
    if (form.level === "college_deanship") {
      filtered = filtered.filter((p) => p.level === "vice_rectorate");
    }
    
    // If level is department_unit, only college_deanship can be parent
    if (form.level === "department_unit") {
      filtered = filtered.filter((p) => p.level === "college_deanship");
    }
    
    return filtered;
  }, [parentOptions, entityId, form.level]);

  const handleChange = (
    key: keyof EntityFormValues,
    value: EntityFormValues[keyof EntityFormValues]
  ) => {
    setForm((prev) => {
      const updated = { ...prev, [key]: value };
      // When level changes, reset parent if it's not valid for the new level
      if (key === "level") {
        const newLevel = value as EntityLevel;
        if (newLevel === "vice_rectorate") {
          updated.parent = null;
        } else if (newLevel === "college_deanship" && prev.parent) {
          const parentEntity = parentOptions.find((p) => p.id === prev.parent);
          if (parentEntity?.level !== "vice_rectorate") {
            updated.parent = null;
          }
        } else if (newLevel === "department_unit" && prev.parent) {
          const parentEntity = parentOptions.find((p) => p.id === prev.parent);
          if (parentEntity?.level !== "college_deanship") {
            updated.parent = null;
          }
        }
      }
      return updated;
    });
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

      // Validate parent based on level
      if (payload.level === "vice_rectorate" && payload.parent) {
        setError("الوكالة/القطاع لا يمكن أن يكون له جهة أم");
        setSubmitting(false);
        return;
      }

      if (payload.level === "college_deanship" && !payload.parent) {
        setError("يجب تحديد الجهة الأم (وكالة/قطاع) للكلية/العمادة");
        setSubmitting(false);
        return;
      }

      if (payload.level === "department_unit" && !payload.parent) {
        setError("يجب تحديد الجهة الأم (كلية/عمادة) للقسم/الوحدة");
        setSubmitting(false);
        return;
      }

      // Validate parent level matches
      if (payload.parent) {
        const parentEntity = parentOptions.find((p) => p.id === payload.parent);
        if (payload.level === "college_deanship" && parentEntity?.level !== "vice_rectorate") {
          setError("الكلية/العمادة يجب أن تكون تابعة لوكالة/قطاع");
          setSubmitting(false);
          return;
        }
        if (payload.level === "department_unit" && parentEntity?.level !== "college_deanship") {
          setError("القسم/الوحدة يجب أن يكون تابعاً لكلية/عمادة");
          setSubmitting(false);
          return;
        }
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
            value={form.code || ""}
            onChange={(e) => handleChange("code", e.target.value)}
            placeholder="مثال: PR-001"
          />
        </div>
        <div>
          <label className="mb-2 block text-sm font-semibold text-heading">
            المستوى
          </label>
          <Select
            value={form.level || "department_unit"}
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
            {form.level !== "vice_rectorate" && (
              <span className="text-destructive"> *</span>
            )}
          </label>
          <Select
            value={form.parent ?? ""}
            onChange={(e) =>
              handleChange("parent", e.target.value === "" ? null : (e.target.value as string))
            }
            required={form.level !== "vice_rectorate"}
            disabled={form.level === "vice_rectorate"}
            options={
              form.level === "vice_rectorate"
                ? [{ value: "", label: "بدون (وكالة/قطاع لا يحتاج جهة أم)" }]
                : [
                    { value: "", label: "اختر الجهة الأم..." },
                    ...parentChoices.map((p) => ({
                      value: p.id,
                      label: `${p.name} (${levelLabel(p.level)})`,
                    })),
                  ]
            }
          />
          {form.level === "college_deanship" && (
            <p className="mt-1 text-xs text-muted">
              يجب اختيار وكالة/قطاع كجهة أم
            </p>
          )}
          {form.level === "department_unit" && (
            <p className="mt-1 text-xs text-muted">
              يجب اختيار كلية/عمادة كجهة أم
            </p>
          )}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <label className="block text-sm font-semibold text-heading">
            الوصف
          </label>
          <TextArea
            rows={4}
            value={form.description || ""}
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


