"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TextArea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  createService,
  updateService,
  fetchService,
  type Service,
} from "@/lib/api-client";

interface ServiceConfigFormProps {
  serviceId?: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function ServiceConfigForm({ serviceId, onSuccess, onCancel }: ServiceConfigFormProps) {
  const [loading, setLoading] = useState(false);
  const [loadingService, setLoadingService] = useState(!!serviceId);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    icon: "",
    category: "general" as "documents" | "design" | "marketing" | "medical" | "general",
    is_active: true,
    requires_approval: false,
  });

  useEffect(() => {
    if (serviceId) {
      loadService();
    }
  }, [serviceId]);

  const loadService = async () => {
    try {
      setLoadingService(true);
      const service = await fetchService(serviceId!);
      setFormData({
        name: service.name,
        description: service.description || "",
        icon: service.icon || "",
        category: service.category,
        is_active: service.is_active,
        requires_approval: service.requires_approval,
      });
    } catch (error) {
      console.error("Error loading service:", error);
      alert("فشل تحميل بيانات الخدمة");
    } finally {
      setLoadingService(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (serviceId) {
        await updateService(serviceId, formData);
      } else {
        await createService(formData);
      }
      onSuccess?.();
    } catch (error: any) {
      console.error("Error saving service:", error);
      alert(error.message || "فشل حفظ الخدمة");
    } finally {
      setLoading(false);
    }
  };

  if (loadingService) {
    return (
      <Card>
        <CardContent className="py-8 text-center">جاري التحميل...</CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{serviceId ? "تعديل خدمة" : "إضافة خدمة جديدة"}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-semibold text-heading">
                اسم الخدمة *
              </label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-semibold text-heading">
                الأيقونة (Emoji)
              </label>
              <Input
                value={formData.icon}
                onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                placeholder="📄"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-semibold text-heading">
                التصنيف *
              </label>
              <select
                value={formData.category}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    category: e.target.value as Service["category"],
                  })
                }
                className="w-full rounded-md border border-border bg-background px-4 py-2"
                required
              >
                <option value="documents">المستندات الرسمية</option>
                <option value="design">التصميم والإبداع</option>
                <option value="marketing">الترويج والفعاليات</option>
                <option value="medical">الخدمات الطبية</option>
                <option value="general">خدمات عامة</option>
              </select>
            </div>
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.is_active}
                  onChange={(e) =>
                    setFormData({ ...formData, is_active: e.target.checked })
                  }
                  className="size-4 rounded border-border"
                />
                <span className="text-sm font-semibold text-heading">مفعلة</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.requires_approval}
                  onChange={(e) =>
                    setFormData({ ...formData, requires_approval: e.target.checked })
                  }
                  className="size-4 rounded border-border"
                />
                <span className="text-sm font-semibold text-heading">يتطلب اعتماد</span>
              </label>
            </div>
          </div>
          <div>
            <label className="mb-2 block text-sm font-semibold text-heading">
              الوصف
            </label>
            <TextArea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
            />
          </div>
          <div className="flex gap-3 justify-end">
            {onCancel && (
              <Button type="button" variant="secondary" onClick={onCancel}>
                إلغاء
              </Button>
            )}
            <Button type="submit" disabled={loading}>
              {loading ? "جاري الحفظ..." : serviceId ? "تحديث" : "إضافة"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}




