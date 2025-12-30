"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { PricingForm } from "@/components/forms/pricing-form";
import {
  fetchServicePricing,
  deleteServicePricing,
  fetchServices,
  type ServicePricing,
  type Service,
} from "@/lib/api-client";

function AdminPricingPageContent() {
  const [pricing, setPricing] = useState<ServicePricing[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingPricing, setEditingPricing] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [pricingData, servicesData] = await Promise.all([
        fetchServicePricing(),
        fetchServices(),
      ]);
      setPricing(Array.isArray(pricingData) ? pricingData : []);
      setServices(Array.isArray(servicesData) ? servicesData : []);
    } catch (error) {
      console.error("Error loading pricing:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("هل أنت متأكد من حذف هذه التسعيرة؟")) return;
    try {
      await deleteServicePricing(id);
      loadData();
    } catch (error: any) {
      alert(error.message || "فشل حذف التسعيرة");
    }
  };

  const getServiceName = (serviceId: string) => {
    const service = services.find((s) => s.id === serviceId);
    return service?.name || serviceId;
  };

  const calculateSavings = (internal: number, external: number) => {
    if (external === 0) return 0;
    return Math.round(((external - internal) / external) * 100);
  };

  if (showForm) {
    return (
      <PricingForm
        onSuccess={() => {
          setShowForm(false);
          loadData();
        }}
        onCancel={() => setShowForm(false)}
      />
    );
  }

  if (editingPricing) {
    return (
      <PricingForm
        pricingId={editingPricing}
        onSuccess={() => {
          setEditingPricing(null);
          loadData();
        }}
        onCancel={() => setEditingPricing(null)}
      />
    );
  }

  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-heading">إدارة الأسعار والتوفير</h1>
          <p className="mt-1 text-sm text-muted">
            حدّث أسعار التكلفة الداخلية وقارنها بالخدمات الخارجية لقياس التوفير.
          </p>
        </div>
        <Button onClick={() => setShowForm(true)}>+ إضافة تسعيرة</Button>
      </header>

      {loading ? (
        <div className="text-center py-8">جاري التحميل...</div>
      ) : pricing.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted">
            لا توجد تسعيرات
          </CardContent>
        </Card>
      ) : (
        <Card padding="lg" shadow="soft">
          <CardHeader className="flex items-center justify-between">
            <CardTitle>سجل الأسعار الحالي</CardTitle>
            <Button size="sm" onClick={() => setShowForm(true)}>
              + إضافة تسعيرة
            </Button>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="grid grid-cols-[2fr_repeat(3,_1fr)] gap-4 rounded-lg bg-brand-teal/10 px-5 py-3 text-xs font-semibold text-brand-teal">
              <span>الخدمة</span>
              <span>التكلفة الداخلية</span>
              <span>التكلفة الخارجية</span>
              <span>نسبة التوفير</span>
            </div>
            {pricing.map((row) => {
              const savings = calculateSavings(row.internal_cost, row.external_cost);
              return (
                <div
                  key={row.id}
                  className="grid grid-cols-[2fr_repeat(3,_1fr)] items-center gap-4 rounded-lg border border-border px-5 py-4 text-sm text-muted"
                >
                  <span className="font-medium text-heading">{getServiceName(row.service)}</span>
                  <span>{row.internal_cost.toFixed(2)} ريال</span>
                  <span>{row.external_cost.toFixed(2)} ريال</span>
                  <div className="flex items-center gap-2">
                    <Badge tone="success">{savings}%</Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setEditingPricing(row.id)}
                    >
                      تعديل
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(row.id)}
                    >
                      حذف
                    </Button>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default function AdminPricingPage() {
  return (
    <ProtectedRoute requiredRoles={["admin"]}>
      <AdminPricingPageContent />
    </ProtectedRoute>
  );
}
