"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  createServicePricing,
  updateServicePricing,
  fetchServicePricingDetail,
  fetchServices,
  type ServicePricing,
  type Service,
} from "@/lib/api-client";

interface PricingFormProps {
  pricingId?: string;
  serviceId?: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function PricingForm({ pricingId, serviceId, onSuccess, onCancel }: PricingFormProps) {
  const [loading, setLoading] = useState(false);
  const [loadingPricing, setLoadingPricing] = useState(!!pricingId);
  const [services, setServices] = useState<Service[]>([]);
  const [formData, setFormData] = useState({
    service: serviceId || "",
    internal_cost: 0,
    external_cost: 0,
    notes: "",
    effective_from: "",
    effective_to: "",
  });

  useEffect(() => {
    loadServices();
    if (pricingId) {
      loadPricing();
    }
  }, [pricingId]);

  const loadServices = async () => {
    try {
      const data = await fetchServices();
      setServices(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error loading services:", error);
    }
  };

  const loadPricing = async () => {
    try {
      setLoadingPricing(true);
      const pricing = await fetchServicePricingDetail(pricingId!);
      setFormData({
        service: pricing.service,
        internal_cost: pricing.internal_cost,
        external_cost: pricing.external_cost,
        notes: pricing.notes || "",
        effective_from: pricing.effective_from ? pricing.effective_from.split("T")[0] : "",
        effective_to: pricing.effective_to ? pricing.effective_to.split("T")[0] : "",
      });
    } catch (error) {
      console.error("Error loading pricing:", error);
      alert("فشل تحميل بيانات التسعيرة");
    } finally {
      setLoadingPricing(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const data = {
        ...formData,
        internal_cost: parseFloat(formData.internal_cost.toString()),
        external_cost: parseFloat(formData.external_cost.toString()),
        effective_from: formData.effective_from || undefined,
        effective_to: formData.effective_to || undefined,
      };
      if (pricingId) {
        await updateServicePricing(pricingId, data);
      } else {
        await createServicePricing(data);
      }
      onSuccess?.();
    } catch (error: any) {
      console.error("Error saving pricing:", error);
      alert(error.message || "فشل حفظ التسعيرة");
    } finally {
      setLoading(false);
    }
  };

  const savingsPercentage = formData.external_cost > 0
    ? Math.round(((formData.external_cost - formData.internal_cost) / formData.external_cost) * 100)
    : 0;

  if (loadingPricing) {
    return (
      <Card>
        <CardContent className="py-8 text-center">جاري التحميل...</CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{pricingId ? "تعديل تسعيرة" : "إضافة تسعيرة جديدة"}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-semibold text-heading">
                الخدمة *
              </label>
              <select
                value={formData.service}
                onChange={(e) => setFormData({ ...formData, service: e.target.value })}
                className="w-full rounded-md border border-border bg-background px-4 py-2"
                required
                disabled={!!pricingId}
              >
                <option value="">اختر الخدمة</option>
                {services.map((service) => (
                  <option key={service.id} value={service.id}>
                    {service.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-2 block text-sm font-semibold text-heading">
                التكلفة الداخلية (ريال) *
              </label>
              <Input
                type="number"
                step="0.01"
                value={formData.internal_cost}
                onChange={(e) =>
                  setFormData({ ...formData, internal_cost: parseFloat(e.target.value) || 0 })
                }
                required
                min="0"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-semibold text-heading">
                تكلفة السوق (ريال) *
              </label>
              <Input
                type="number"
                step="0.01"
                value={formData.external_cost}
                onChange={(e) =>
                  setFormData({ ...formData, external_cost: parseFloat(e.target.value) || 0 })
                }
                required
                min="0"
              />
            </div>
            {savingsPercentage > 0 && (
              <div>
                <label className="mb-2 block text-sm font-semibold text-heading">
                  نسبة التوفير
                </label>
                <div className="rounded-md border border-border bg-background px-4 py-2 text-lg font-bold text-success">
                  {savingsPercentage}%
                </div>
              </div>
            )}
            <div>
              <label className="mb-2 block text-sm font-semibold text-heading">
                تاريخ السريان
              </label>
              <Input
                type="date"
                value={formData.effective_from}
                onChange={(e) => setFormData({ ...formData, effective_from: e.target.value })}
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-semibold text-heading">
                تاريخ الانتهاء
              </label>
              <Input
                type="date"
                value={formData.effective_to}
                onChange={(e) => setFormData({ ...formData, effective_to: e.target.value })}
              />
            </div>
          </div>
          <div>
            <label className="mb-2 block text-sm font-semibold text-heading">
              ملاحظات
            </label>
            <Input
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            />
          </div>
          <div className="flex gap-3 justify-end">
            {onCancel && (
              <Button type="button" variant="secondary" onClick={onCancel}>
                إلغاء
              </Button>
            )}
            <Button type="submit" disabled={loading}>
              {loading ? "جاري الحفظ..." : pricingId ? "تحديث" : "إضافة"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}




