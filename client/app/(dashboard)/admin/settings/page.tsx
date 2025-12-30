"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ProtectedRoute } from "@/components/auth/protected-route";
import {
  fetchFieldSettings,
  updateFieldSetting,
  fetchServiceSettings,
  updateServiceSetting,
  type FieldSetting,
  type ServiceSetting,
} from "@/lib/api-client";

function AdminSettingsPageContent() {
  const [activeTab, setActiveTab] = useState<"fields" | "services">("fields");
  const [fields, setFields] = useState<FieldSetting[]>([]);
  const [services, setServices] = useState<ServiceSetting[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);

  useEffect(() => {
    if (activeTab === "fields") {
      loadFields();
    } else {
      loadServices();
    }
  }, [activeTab]);

  const loadFields = async () => {
    try {
      setLoading(true);
      const data = await fetchFieldSettings();
      setFields(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error loading field settings:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadServices = async () => {
    try {
      setLoading(true);
      const data = await fetchServiceSettings();
      setServices(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error loading service settings:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateField = async (fieldId: string, updates: Partial<FieldSetting>) => {
    try {
      setSaving(fieldId);
      await updateFieldSetting(fieldId, updates);
      loadFields();
      alert("تم التحديث بنجاح");
    } catch (error: any) {
      alert(error.message || "فشل التحديث");
    } finally {
      setSaving(null);
    }
  };

  const handleUpdateService = async (serviceId: string, updates: Partial<ServiceSetting>) => {
    try {
      setSaving(serviceId);
      await updateServiceSetting(serviceId, updates);
      loadServices();
      alert("تم التحديث بنجاح");
    } catch (error: any) {
      alert(error.message || "فشل التحديث");
    } finally {
      setSaving(null);
    }
  };

  const fieldsByService = fields.reduce((acc, field) => {
    if (!acc[field.service_name]) {
      acc[field.service_name] = [];
    }
    acc[field.service_name].push(field);
    return acc;
  }, {} as Record<string, FieldSetting[]>);

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl font-bold text-heading">إعدادات النظام</h1>
        <p className="mt-1 text-sm text-muted">
          إدارة الحقول والخدمات - إخفاء/إظهار، تعديل الإلزامية والخيارات
        </p>
      </header>

      <div className="flex gap-2 border-b">
        <Button
          variant={activeTab === "fields" ? "primary" : "ghost"}
          onClick={() => setActiveTab("fields")}
        >
          الحقول
        </Button>
        <Button
          variant={activeTab === "services" ? "primary" : "ghost"}
          onClick={() => setActiveTab("services")}
        >
          الخدمات
        </Button>
      </div>

      {loading ? (
        <div className="text-center py-8">جاري التحميل...</div>
      ) : activeTab === "fields" ? (
        <div className="space-y-6">
          {Object.entries(fieldsByService).map(([serviceName, serviceFields]) => (
            <Card key={serviceName}>
              <CardHeader>
                <CardTitle>{serviceName}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {serviceFields.map((field) => (
                  <div
                    key={field.id}
                    className="flex flex-wrap items-center justify-between gap-4 rounded-lg border border-border p-4"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-heading">{field.label}</span>
                        <Badge>{field.field_type}</Badge>
                        {field.is_required && <Badge tone="warning">إلزامي</Badge>}
                        {!field.is_visible && <Badge tone="danger">مخفي</Badge>}
                      </div>
                      <p className="text-xs text-muted mt-1">المفتاح: {field.key}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <label className="flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={field.is_visible}
                          onChange={(e) =>
                            handleUpdateField(field.id, { is_visible: e.target.checked })
                          }
                          disabled={saving === field.id}
                          className="size-4 rounded border-border"
                        />
                        ظاهر
                      </label>
                      <label className="flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={field.is_required}
                          onChange={(e) =>
                            handleUpdateField(field.id, { is_required: e.target.checked })
                          }
                          disabled={saving === field.id}
                          className="size-4 rounded border-border"
                        />
                        إلزامي
                      </label>
                      <Input
                        type="number"
                        value={field.order}
                        onChange={(e) =>
                          handleUpdateField(field.id, {
                            order: parseInt(e.target.value) || 1,
                          })
                        }
                        disabled={saving === field.id}
                        className="w-20"
                        min="1"
                      />
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {services.map((service) => (
            <Card key={service.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{service.name}</CardTitle>
                  <Badge tone={service.is_active ? "success" : "danger"}>
                    {service.is_active ? "مفعل" : "معطل"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted">{service.description}</p>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={service.is_active}
                    onChange={(e) =>
                      handleUpdateService(service.id, { is_active: e.target.checked })
                    }
                    disabled={saving === service.id}
                    className="size-4 rounded border-border"
                  />
                  <span className="text-sm font-semibold text-heading">تفعيل الخدمة</span>
                </label>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

export default function AdminSettingsPage() {
  return (
    <ProtectedRoute requiredRoles={["admin", "print_manager"]}>
      <AdminSettingsPageContent />
    </ProtectedRoute>
  );
}
