"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { TextArea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  createServiceField,
  updateServiceField,
  fetchServiceField,
  type ServiceField,
} from "@/lib/api-client";

interface ServiceFieldFormProps {
  serviceId: string;
  fieldId?: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

// Common field keys used in services
const COMMON_FIELD_KEYS = [
  { value: "quantity", label: "quantity - الكمية" },
  { value: "entity_name", label: "entity_name - اسم الجهة" },
  { value: "entity_number", label: "entity_number - رقم الجهة" },
  { value: "paper_type", label: "paper_type - نوع الورق" },
  { value: "name_ar", label: "name_ar - الاسم بالعربية" },
  { value: "name_en", label: "name_en - الاسم بالإنجليزية" },
  { value: "title", label: "title - العنوان" },
  { value: "description", label: "description - الوصف" },
  { value: "notes", label: "notes - الملاحظات" },
  { value: "attachments", label: "attachments - المرفقات" },
  { value: "size", label: "size - الحجم" },
  { value: "design_type", label: "design_type - نوع التصميم" },
  { value: "print_type", label: "print_type - نوع الطباعة" },
  { value: "reason", label: "reason - السبب" },
  { value: "custom", label: "مفتاح مخصص..." },
];

export function ServiceFieldForm({ serviceId, fieldId, onSuccess, onCancel }: ServiceFieldFormProps) {
  const [loading, setLoading] = useState(false);
  const [loadingField, setLoadingField] = useState(!!fieldId);
  const [useCustomKey, setUseCustomKey] = useState(false);
  const [formData, setFormData] = useState({
    key: "",
    label: "",
    field_type: "text" as "text" | "number" | "radio" | "textarea" | "file" | "link",
    order: 1,
    is_required: false,
    is_visible: true,
    placeholder: "",
    help_text: "",
  });

  useEffect(() => {
    if (fieldId) {
      loadField();
    }
  }, [fieldId]);

  const loadField = async () => {
    try {
      setLoadingField(true);
      const field = await fetchServiceField(fieldId!);
      setFormData({
        key: field.key,
        label: field.label,
        field_type: field.field_type,
        order: field.order,
        is_required: field.is_required,
        is_visible: field.is_visible,
        placeholder: field.placeholder || "",
        help_text: field.help_text || "",
      });
    } catch (error) {
      console.error("Error loading service field:", error);
      alert("فشل تحميل بيانات الحقل");
    } finally {
      setLoadingField(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!serviceId) {
      alert("معرف الخدمة غير موجود");
      return;
    }
    
    if (!formData.key.trim()) {
      alert("المفتاح البرمجي مطلوب");
      return;
    }
    
    if (!/^[a-z0-9_]+$/.test(formData.key)) {
      alert("المفتاح البرمجي يجب أن يحتوي على أحرف صغيرة وأرقام وشرطة سفلية فقط");
      return;
    }
    
    if (!formData.label.trim()) {
      alert("العنوان الظاهر مطلوب");
      return;
    }
    
    if (formData.order < 1) {
      alert("الترتيب يجب أن يكون أكبر من 0");
      return;
    }
    
    setLoading(true);

    try {
      const data = {
        service: serviceId,
        key: formData.key.trim(),
        label: formData.label.trim(),
        field_type: formData.field_type,
        order: formData.order,
        is_required: formData.is_required,
        is_visible: formData.is_visible,
        placeholder: formData.placeholder?.trim() || "",
        help_text: formData.help_text?.trim() || "",
      };
      
      if (fieldId) {
        await updateServiceField(fieldId, data);
      } else {
        await createServiceField(data);
      }
      onSuccess?.();
    } catch (error: any) {
      console.error("Error saving service field:", error);
      const errorMessage = error?.message || error?.detail || "فشل حفظ الحقل";
      alert(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (loadingField) {
    return (
      <Card>
        <CardContent className="py-8 text-center">جاري التحميل...</CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{fieldId ? "تعديل حقل" : "إضافة حقل جديد"}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-semibold text-heading">
                المفتاح البرمجي <span className="text-[#E53935]">*</span>
              </label>
              {!fieldId && !useCustomKey ? (
                <Select
                  value={formData.key || ""}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (value === "custom") {
                      setUseCustomKey(true);
                      setFormData({ ...formData, key: "" });
                    } else {
                      setFormData({ ...formData, key: value });
                    }
                  }}
                  required
                  placeholder="اختر مفتاح برمجي شائع"
                  options={[
                    { value: "", label: "اختر مفتاح برمجي..." },
                    ...COMMON_FIELD_KEYS,
                  ]}
                />
              ) : (
                <div className="space-y-2">
                  <Input
                    value={formData.key}
                    onChange={(e) => {
                      // Convert to lowercase and replace spaces with underscores
                      const value = e.target.value
                        .toLowerCase()
                        .replace(/\s+/g, "_")
                        .replace(/[^a-z0-9_]/g, "");
                      setFormData({ ...formData, key: value });
                    }}
                    required
                    disabled={!!fieldId}
                    placeholder="مثال: card_name"
                    pattern="[a-z0-9_]+"
                    title="يجب أن يحتوي على أحرف صغيرة وأرقام وشرطة سفلية فقط"
                  />
                  {!fieldId && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setUseCustomKey(false);
                        setFormData({ ...formData, key: "" });
                      }}
                    >
                      استخدام مفتاح شائع
                    </Button>
                  )}
                </div>
              )}
              <p className="mt-1 text-xs text-muted">
                المفتاح البرمجي يستخدم في الكود ويجب أن يكون فريداً داخل الخدمة
              </p>
            </div>
            <div>
              <label className="mb-2 block text-sm font-semibold text-heading">
                العنوان الظاهر *
              </label>
              <Input
                value={formData.label}
                onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-semibold text-heading">
                نوع الحقل <span className="text-[#E53935]">*</span>
              </label>
              <Select
                value={formData.field_type}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    field_type: e.target.value as ServiceField["field_type"],
                  })
                }
                required
                options={[
                  { value: "text", label: "نص" },
                  { value: "number", label: "عدد" },
                  { value: "radio", label: "اختيار واحد" },
                  { value: "textarea", label: "نص متعدد" },
                  { value: "file", label: "ملف" },
                  { value: "link", label: "رابط" },
                ]}
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-semibold text-heading">
                الترتيب
              </label>
              <Select
                value={String(formData.order)}
                onChange={(e) =>
                  setFormData({ ...formData, order: parseInt(e.target.value) || 1 })
                }
                options={Array.from({ length: 20 }, (_, i) => ({
                  value: String(i + 1),
                  label: String(i + 1),
                }))}
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-semibold text-heading">
                نص إرشادي
              </label>
              <Input
                value={formData.placeholder}
                onChange={(e) => setFormData({ ...formData, placeholder: e.target.value })}
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-semibold text-heading">
                وصف مختصر
              </label>
              <TextArea
                value={formData.help_text}
                onChange={(e) => setFormData({ ...formData, help_text: e.target.value })}
                rows={2}
                placeholder="وصف مختصر للحقل..."
              />
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="flex items-center justify-between rounded-lg border border-border px-4 py-3">
              <div>
                <p className="text-sm font-semibold text-heading">إلزامي</p>
                <p className="text-xs text-muted">هل هذا الحقل مطلوب؟</p>
              </div>
              <Switch
                checked={formData.is_required}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, is_required: checked })
                }
              />
            </div>
            <div className="flex items-center justify-between rounded-lg border border-border px-4 py-3">
              <div>
                <p className="text-sm font-semibold text-heading">ظاهر</p>
                <p className="text-xs text-muted">هل يظهر هذا الحقل في النموذج؟</p>
              </div>
              <Switch
                checked={formData.is_visible}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, is_visible: checked })
                }
              />
            </div>
          </div>
          <div className="flex gap-3 justify-end">
            {onCancel && (
              <Button type="button" variant="secondary" onClick={onCancel}>
                إلغاء
              </Button>
            )}
            <Button type="submit" disabled={loading}>
              {loading ? "جاري الحفظ..." : fieldId ? "تحديث" : "إضافة"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}




