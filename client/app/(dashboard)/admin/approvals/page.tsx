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
import { useAuth } from "@/lib/auth-context";
import {
  fetchServices,
  type Service,
} from "@/lib/api-client";
import { ServiceApproversForm } from "@/components/forms/service-approvers-form";

function AdminApprovalsPageContent() {
  const { hasRole } = useAuth();
  const [servicesList, setServicesList] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingService, setEditingService] = useState<Service | null>(null);
  
  // Check if user can manage approvals (admin only)
  const canManage = hasRole("admin");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const servicesData = await fetchServices();
      // fetchServices always returns Service[] array
      if (Array.isArray(servicesData)) {
        setServicesList(servicesData);
      } else {
        setServicesList([]);
      }
    } catch (error) {
      console.error("Error loading services:", error);
      setServicesList([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl font-bold text-heading">إدارة المعتمدين</h1>
        <p className="mt-1 text-sm text-muted">
          حدد الخدمات التي تتطلب اعتماداً قبل التنفيذ.
        </p>
      </header>

      {loading ? (
        <div className="text-center py-8">جاري التحميل...</div>
      ) : servicesList.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted">
            لا توجد خدمات
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {servicesList.map((service) => (
            <Card key={service.id} padding="lg" shadow="soft">
              <CardHeader className="items-start gap-3">
                <CardTitle className="text-lg">
                  {service.icon || "📄"} {service.name}
                </CardTitle>
                <Badge tone={service.requires_approval ? "warning" : "success"}>
                  {service.requires_approval ? "يتطلب اعتماد" : "لا يتطلب اعتماد"}
                </Badge>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="space-y-1 text-muted">
                  <p>الحالة: {service.is_active ? "مفعل" : "معطل"}</p>
                  {service.description && (
                    <p className="text-xs">{service.description}</p>
                  )}
                </div>
                {canManage && (
                  <Button
                    variant="secondary"
                    fullWidth
                    size="sm"
                    onClick={() => setEditingService(service)}
                  >
                    تعديل المعتمدين
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {editingService && (
        <ServiceApproversForm
          service={editingService}
          onSuccess={() => {
            setEditingService(null);
            loadData();
          }}
          onCancel={() => setEditingService(null)}
        />
      )}
    </div>
  );
}

export default function AdminApprovalsPage() {
  return (
    <ProtectedRoute requiredRoles={["admin"]}>
      <AdminApprovalsPageContent />
    </ProtectedRoute>
  );
}
