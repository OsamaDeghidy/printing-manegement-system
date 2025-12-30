"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { ServiceConfigForm } from "@/components/forms/service-config-form";
import { ServiceFieldForm } from "@/components/forms/service-field-form";
import {
  fetchServices,
  deleteService,
  fetchServiceFields,
  deleteServiceField,
  type Service,
  type ServiceField,
} from "@/lib/api-client";

function AdminServicesConfigPageContent() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingService, setEditingService] = useState<string | null>(null);
  const [managingFields, setManagingFields] = useState<Service | null>(null);
  const [showFieldForm, setShowFieldForm] = useState(false);
  const [editingField, setEditingField] = useState<string | null>(null);
  const [serviceFields, setServiceFields] = useState<ServiceField[]>([]);
  const [loadingFields, setLoadingFields] = useState(false);

  useEffect(() => {
    loadServices();
  }, []);

  useEffect(() => {
    if (managingFields) {
      console.log("Managing fields for service:", managingFields);
      loadServiceFields();
    } else {
      setServiceFields([]);
    }
  }, [managingFields]);

  const loadServices = async () => {
    try {
      setLoading(true);
      const data = await fetchServices();
      setServices(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error loading services:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadServiceFields = async () => {
    if (!managingFields) {
      setServiceFields([]);
      return;
    }
    try {
      setLoadingFields(true);
      console.log("Loading fields for service:", managingFields.id, managingFields.name);
      const fields = await fetchServiceFields(managingFields.id);
      console.log("Fetched fields:", fields);
      if (Array.isArray(fields)) {
        setServiceFields(fields);
      } else {
        console.warn("Fields is not an array:", fields);
        setServiceFields([]);
      }
    } catch (error: any) {
      console.error("Error loading service fields:", error);
      console.error("Error message:", error?.message);
      setServiceFields([]);
      // Show user-friendly error message
      if (error?.message?.includes("403") || error?.message?.includes("Forbidden")) {
        alert("ليس لديك صلاحية لعرض حقول الخدمة. يرجى التأكد من أنك مسجل كمسؤول.");
      } else if (error?.message?.includes("401") || error?.message?.includes("Unauthorized")) {
        alert("يرجى تسجيل الدخول مرة أخرى.");
      }
    } finally {
      setLoadingFields(false);
    }
  };

  const handleDeleteService = async (id: string) => {
    if (!confirm("هل أنت متأكد من حذف هذه الخدمة؟")) return;
    try {
      await deleteService(id);
      loadServices();
    } catch (error: any) {
      alert(error.message || "فشل حذف الخدمة");
    }
  };

  const handleDeleteField = async (id: string) => {
    if (!confirm("هل أنت متأكد من حذف هذا الحقل؟")) return;
    try {
      await deleteServiceField(id);
      loadServiceFields();
    } catch (error: any) {
      alert(error.message || "فشل حذف الحقل");
    }
  };

  if (showForm) {
    return (
      <ServiceConfigForm
        onSuccess={() => {
          setShowForm(false);
          loadServices();
        }}
        onCancel={() => setShowForm(false)}
      />
    );
  }

  if (editingService) {
    return (
      <ServiceConfigForm
        serviceId={editingService}
        onSuccess={() => {
          setEditingService(null);
          loadServices();
        }}
        onCancel={() => setEditingService(null)}
      />
    );
  }

  if (managingFields) {
    if (showFieldForm) {
      return (
        <ServiceFieldForm
          serviceId={managingFields.id}
          fieldId={editingField || undefined}
          onSuccess={() => {
            setShowFieldForm(false);
            setEditingField(null);
            loadServiceFields();
          }}
          onCancel={() => {
            setShowFieldForm(false);
            setEditingField(null);
          }}
        />
      );
    }

    return (
      <div className="space-y-8">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-heading">
              إدارة حقول: {managingFields.name}
            </h1>
            <p className="mt-1 text-sm text-muted">
              إضافة وتعديل حقول الخدمة
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => setManagingFields(null)}>
              رجوع
            </Button>
            <Button onClick={() => setShowFieldForm(true)}>+ إضافة حقل</Button>
          </div>
        </header>

        {loadingFields ? (
          <Card>
            <CardContent className="py-8 text-center text-muted">
              جاري تحميل حقول الخدمة...
            </CardContent>
          </Card>
        ) : serviceFields.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted">
              لا توجد حقول لهذه الخدمة. قم بإضافة حقل جديد.
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {serviceFields
              .sort((a, b) => a.order - b.order)
              .map((field) => (
                <Card key={field.id} padding="lg" shadow="soft">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{field.label}</CardTitle>
                      <Badge tone="info">
                        {field.field_type === "text" ? "نص" :
                         field.field_type === "number" ? "عدد" :
                         field.field_type === "radio" ? "اختيار واحد" :
                         field.field_type === "textarea" ? "نص متعدد" :
                         field.field_type === "file" ? "ملف" :
                         field.field_type === "link" ? "رابط" :
                         field.field_type}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3 text-sm">
                      <div className="grid gap-2 md:grid-cols-2">
                        <div>
                          <span className="font-semibold text-heading">المفتاح البرمجي:</span>
                          <p className="text-muted font-mono">{field.key}</p>
                        </div>
                        <div>
                          <span className="font-semibold text-heading">الترتيب:</span>
                          <p className="text-muted">{field.order}</p>
                        </div>
                        {field.placeholder && (
                          <div>
                            <span className="font-semibold text-heading">النص الإرشادي:</span>
                            <p className="text-muted">{field.placeholder}</p>
                          </div>
                        )}
                        {field.help_text && (
                          <div>
                            <span className="font-semibold text-heading">الوصف:</span>
                            <p className="text-muted">{field.help_text}</p>
                          </div>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-2 pt-2 border-t border-border">
                        {field.is_required ? (
                          <Badge tone="warning">إلزامي</Badge>
                        ) : (
                          <Badge tone="info">اختياري</Badge>
                        )}
                        {field.is_visible ? (
                          <Badge tone="success">ظاهر</Badge>
                        ) : (
                          <Badge tone="danger">مخفي</Badge>
                        )}
                      </div>
                      <div className="flex gap-2 pt-2">
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => {
                            setEditingField(field.id);
                            setShowFieldForm(true);
                          }}
                        >
                          تعديل
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteField(field.id)}
                        >
                          حذف
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-heading">إدارة الخدمات والحقول</h1>
          <p className="mt-1 text-sm text-muted">
            تحكم في تفعيل الخدمات، أعد ترتيب الحقول، وأخفِ الخيارات غير الضرورية.
          </p>
        </div>
        <Button onClick={() => setShowForm(true)}>+ إضافة خدمة جديدة</Button>
      </header>

      {loading ? (
        <div className="text-center py-8">جاري التحميل...</div>
      ) : services.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted">
            لا توجد خدمات
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {services.map((service) => (
            <Card key={service.id} padding="lg" shadow="soft">
              <CardHeader className="items-start gap-2">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <span className="text-2xl">{service.icon || "📄"}</span>
                  {service.name}
                </CardTitle>
                {service.requires_approval ? (
                  <Badge tone="warning">يتطلب اعتماد</Badge>
                ) : (
                  <Badge tone="success">متاح مباشرة</Badge>
                )}
                {!service.is_active && <Badge tone="danger">معطل</Badge>}
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted">{service.description}</p>
                <div className="rounded-lg border border-border px-4 py-3 text-xs text-muted">
                  حقول الخدمة: {service.fields?.length || 0} حقل
                  {service.fields && service.fields.length > 0 && (
                    <ul className="mt-2 space-y-1">
                      {service.fields.slice(0, 3).map((field) => (
                        <li key={field.id} className="flex items-center justify-between">
                          <span>{field.label}</span>
                          <span className="text-[11px] text-muted">{field.field_type}</span>
                        </li>
                      ))}
                      {service.fields.length > 3 && (
                        <li className="text-muted">... و {service.fields.length - 3} أكثر</li>
                      )}
                    </ul>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="secondary"
                    fullWidth
                    size="sm"
                    onClick={() => setManagingFields(service)}
                  >
                    ضبط الحقول
                  </Button>
                  <Button
                    variant="secondary"
                    fullWidth
                    size="sm"
                    onClick={() => setEditingService(service.id)}
                  >
                    تعديل
                  </Button>
                  <Button
                    variant="ghost"
                    fullWidth
                    size="sm"
                    onClick={() => handleDeleteService(service.id)}
                  >
                    حذف
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

export default function AdminServicesConfigPage() {
  return (
    <ProtectedRoute requiredRoles={["admin"]}>
      <AdminServicesConfigPageContent />
    </ProtectedRoute>
  );
}
