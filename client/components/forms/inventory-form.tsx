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
  createInventoryItem,
  updateInventoryItem,
  fetchInventoryItem,
  type InventoryItem,
} from "@/lib/api-client";

interface InventoryFormProps {
  itemId?: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function InventoryForm({ itemId, onSuccess, onCancel }: InventoryFormProps) {
  const [loading, setLoading] = useState(false);
  const [loadingItem, setLoadingItem] = useState(!!itemId);
  const [formData, setFormData] = useState({
    name: "",
    sku: "",
    category: "other" as "paper" | "ink" | "banner" | "other",
    unit: "قطعة",
    current_quantity: 0,
    minimum_threshold: 0,
    min_quantity: 0,
    maximum_threshold: 1000,
    reorder_point: 0,
    notes: "",
  });

  useEffect(() => {
    if (itemId) {
      loadItem();
    }
  }, [itemId]);

  const loadItem = async () => {
    try {
      setLoadingItem(true);
      const item = await fetchInventoryItem(itemId!);
      setFormData({
        name: item.name,
        sku: item.sku,
        category: item.category,
        unit: item.unit,
        current_quantity: item.current_quantity,
        minimum_threshold: item.minimum_threshold,
        min_quantity: item.min_quantity,
        maximum_threshold: item.maximum_threshold,
        reorder_point: item.reorder_point,
        notes: item.notes || "",
      });
    } catch (error) {
      console.error("Error loading inventory item:", error);
      alert("فشل تحميل بيانات المادة");
    } finally {
      setLoadingItem(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (itemId) {
        await updateInventoryItem(itemId, formData);
      } else {
        await createInventoryItem(formData);
      }
      onSuccess?.();
    } catch (error: any) {
      console.error("Error saving inventory item:", error);
      alert(error.message || "فشل حفظ المادة");
    } finally {
      setLoading(false);
    }
  };

  if (loadingItem) {
    return (
      <Card>
        <CardContent className="py-8 text-center">جاري التحميل...</CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{itemId ? "تعديل مادة" : "إضافة مادة جديدة"}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-semibold text-heading">
                اسم المادة *
              </label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-semibold text-heading">
                رمز المخزون (SKU) *
              </label>
              <Input
                value={formData.sku}
                onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                required
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
                    category: e.target.value as "paper" | "ink" | "banner" | "other",
                  })
                }
                className="w-full rounded-md border border-border bg-background px-4 py-2"
                required
              >
                <option value="paper">ورق</option>
                <option value="ink">أحبار</option>
                <option value="banner">بنرات</option>
                <option value="other">مستهلكات أخرى</option>
              </select>
            </div>
            <div>
              <label className="mb-2 block text-sm font-semibold text-heading">
                وحدة القياس *
              </label>
              <Input
                value={formData.unit}
                onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-semibold text-heading">
                الكمية الحالية
              </label>
              <Input
                type="number"
                value={formData.current_quantity}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    current_quantity: parseInt(e.target.value) || 0,
                  })
                }
                min="0"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-semibold text-heading">
                الحد الأدنى
              </label>
              <Input
                type="number"
                value={formData.minimum_threshold}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    minimum_threshold: parseInt(e.target.value) || 0,
                  })
                }
                min="0"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-semibold text-heading">
                الحد الأدنى للتنبيه
              </label>
              <Input
                type="number"
                value={formData.min_quantity}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    min_quantity: parseInt(e.target.value) || 0,
                  })
                }
                min="0"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-semibold text-heading">
                الحد الأعلى
              </label>
              <Input
                type="number"
                value={formData.maximum_threshold}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    maximum_threshold: parseInt(e.target.value) || 1000,
                  })
                }
                min="0"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-semibold text-heading">
                نقطة إعادة الطلب
              </label>
              <Input
                type="number"
                value={formData.reorder_point}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    reorder_point: parseInt(e.target.value) || 0,
                  })
                }
                min="0"
              />
            </div>
          </div>
          <div>
            <label className="mb-2 block text-sm font-semibold text-heading">
              ملاحظات
            </label>
            <TextArea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
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
              {loading ? "جاري الحفظ..." : itemId ? "تحديث" : "إضافة"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}









