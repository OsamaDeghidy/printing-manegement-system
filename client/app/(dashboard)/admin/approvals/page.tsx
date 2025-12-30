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
import {
  fetchApprovalPolicy,
  updateApprovalPolicy,
  fetchServices,
  type ApprovalPolicy,
  type Service,
} from "@/lib/api-client";
import { services } from "@/data/services";

function AdminApprovalsPageContent() {
  const [policy, setPolicy] = useState<ApprovalPolicy>({
    mode: "selective",
    selective_services: [],
  });
  const [servicesList, setServicesList] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [policyData, servicesData] = await Promise.all([
        fetchApprovalPolicy().catch(() => policy),
        fetchServices().catch(() => []),
      ]);
      setPolicy(policyData);
      // Convert ServiceDefinition[] to Service[] if needed
      if (Array.isArray(servicesData)) {
        setServicesList(servicesData);
      } else {
        // Fallback: convert local services to Service format
        const convertedServices: Service[] = services.map((s) => ({
          id: s.id,
          name: s.name,
          slug: s.slug,
          description: s.description,
          icon: s.icon,
          category: s.category as Service["category"],
          is_active: true,
          requires_approval: s.requiresApproval ?? false,
          fields: [],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }));
        setServicesList(convertedServices);
      }
    } catch (error) {
      console.error("Error loading approval data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handlePolicyChange = async (mode: "all" | "selective" | "none") => {
    try {
      setSaving(true);
      await updateApprovalPolicy({ mode });
      setPolicy({ ...policy, mode });
      alert("تم تحديث سياسة الاعتماد بنجاح");
    } catch (error: any) {
      alert(error.message || "فشل تحديث السياسة");
    } finally {
      setSaving(false);
    }
  };

  const approvalPolicies = [
    {
      id: "all",
      name: "تفعيل شامل لجميع الخدمات",
      description: "يتم إرسال كل طلب إلى المعتمد العام قبل التنفيذ.",
      mode: "all" as const,
    },
    {
      id: "selective",
      name: "تفعيل انتقائي",
      description: "يتم تحديد الخدمات التي تتطلب اعتماداً من الأسفل.",
      mode: "selective" as const,
    },
    {
      id: "none",
      name: "إيقاف نظام الاعتماد",
      description: "جميع الطلبات تنتقل مباشرةً إلى التنفيذ.",
      mode: "none" as const,
    },
  ];

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl font-bold text-heading">إعدادات الاعتماد المرن</h1>
        <p className="mt-1 text-sm text-muted">
          اختر آلية الاعتماد المناسبة وحدد المعتمدين لكل خدمة.
        </p>
      </header>

      {loading ? (
        <div className="text-center py-8">جاري التحميل...</div>
      ) : (
        <>
          <Card padding="lg" shadow="soft">
            <CardHeader>
              <CardTitle>خيارات نظام الاعتماد</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {approvalPolicies.map((p) => (
                <label
                  key={p.id}
                  className="flex cursor-pointer flex-col gap-2 rounded-xl border border-border px-5 py-4 transition hover:border-brand-teal"
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="radio"
                      name="approval-policy"
                      checked={policy.mode === p.mode}
                      onChange={() => handlePolicyChange(p.mode)}
                      disabled={saving}
                      className="size-5 rounded-full border border-border"
                    />
                    <div>
                      <p className="text-sm font-semibold text-heading">{p.name}</p>
                      <p className="text-xs text-muted">{p.description}</p>
                    </div>
                  </div>
                </label>
              ))}
            </CardContent>
          </Card>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {servicesList.map((service) => (
              <Card key={service.id} padding="lg" shadow="soft">
                <CardHeader className="items-start gap-3">
                  <CardTitle className="text-lg">
                    {service.icon || "📄"} {service.name}
                  </CardTitle>
                  <Badge tone={service.requires_approval ? "warning" : "success"}>
                    {service.requires_approval ? "مفعل" : "لا يتطلب اعتماد"}
                  </Badge>
                </CardHeader>
                <CardContent className="space-y-3 text-sm text-muted">
                  <p>الحالة: {service.is_active ? "مفعل" : "معطل"}</p>
                  <Button variant="secondary" fullWidth size="sm">
                    تعديل المعتمدين
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export default function AdminApprovalsPage() {
  return (
    <ProtectedRoute requiredRoles={["admin", "approver"]}>
      <AdminApprovalsPageContent />
    </ProtectedRoute>
  );
}
