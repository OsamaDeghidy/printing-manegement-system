"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { adjustInventoryItem } from "@/lib/api-client";

interface InventoryAdjustFormProps {
  itemId: string;
  itemName: string;
  currentQuantity: number;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function InventoryAdjustForm({
  itemId,
  itemName,
  currentQuantity,
  onSuccess,
  onCancel,
}: InventoryAdjustFormProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    operation: "adjust" as "in" | "out" | "adjust",
    quantity: 0,
    note: "",
    reference_order: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await adjustInventoryItem(itemId, formData);
      onSuccess?.();
    } catch (error: any) {
      console.error("Error adjusting inventory:", error);
      alert(error.message || "فشل تحديث الكمية");
    } finally {
      setLoading(false);
    }
  };

  const getNewQuantity = () => {
    if (formData.operation === "in") {
      return currentQuantity + formData.quantity;
    } else if (formData.operation === "out") {
      return Math.max(0, currentQuantity - formData.quantity);
    } else {
      return formData.quantity;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>تعديل كمية: {itemName}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-2 block text-sm font-semibold text-heading">
              نوع العملية *
            </label>
            <select
              value={formData.operation}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  operation: e.target.value as "in" | "out" | "adjust",
                })
              }
              className="w-full rounded-md border border-border bg-background px-4 py-2"
              required
            >
              <option value="in">إضافة</option>
              <option value="out">صرف</option>
              <option value="adjust">تعديل مباشر</option>
            </select>
          </div>
          <div>
            <label className="mb-2 block text-sm font-semibold text-heading">
              الكمية *
            </label>
            <Input
              type="number"
              value={formData.quantity}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  quantity: parseInt(e.target.value) || 0,
                })
              }
              min="0"
              required
            />
            {formData.operation === "in" && (
              <p className="mt-1 text-xs text-muted">
                الكمية الجديدة: {getNewQuantity()} (الحالية: {currentQuantity} + {formData.quantity})
              </p>
            )}
            {formData.operation === "out" && (
              <p className="mt-1 text-xs text-muted">
                الكمية الجديدة: {getNewQuantity()} (الحالية: {currentQuantity} - {formData.quantity})
              </p>
            )}
            {formData.operation === "adjust" && (
              <p className="mt-1 text-xs text-muted">
                الكمية الحالية: {currentQuantity} → الكمية الجديدة: {formData.quantity}
              </p>
            )}
          </div>
          <div>
            <label className="mb-2 block text-sm font-semibold text-heading">
              رقم الطلب المرجعي (اختياري)
            </label>
            <Input
              value={formData.reference_order}
              onChange={(e) =>
                setFormData({ ...formData, reference_order: e.target.value })
              }
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-semibold text-heading">
              ملاحظة
            </label>
            <Input
              value={formData.note}
              onChange={(e) => setFormData({ ...formData, note: e.target.value })}
            />
          </div>
          <div className="flex gap-3 justify-end">
            {onCancel && (
              <Button type="button" variant="secondary" onClick={onCancel}>
                إلغاء
              </Button>
            )}
            <Button type="submit" disabled={loading}>
              {loading ? "جاري التحديث..." : "تحديث الكمية"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}












