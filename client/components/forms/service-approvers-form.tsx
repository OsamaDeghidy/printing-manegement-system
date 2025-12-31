"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Modal } from "@/components/ui/modal";
import { updateServiceApproval, type Service } from "@/lib/api-client";

interface ServiceApproversFormProps {
  service: Service;
  onSuccess: () => void;
  onCancel: () => void;
}

export function ServiceApproversForm({
  service,
  onSuccess,
  onCancel,
}: ServiceApproversFormProps) {
  const [requiresApproval, setRequiresApproval] = useState(service.requires_approval ?? false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await updateServiceApproval(service.id, requiresApproval);
      onSuccess();
    } catch (err: any) {
      setError(err?.message || "تعذر تحديث إعدادات الاعتماد");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      isOpen={true}
      onClose={onCancel}
      title={`تعديل المعتمدين: ${service.name}`}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-3 rounded-lg border border-border p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-heading">يتطلب اعتماد</p>
              <p className="text-xs text-muted">
                عند التفعيل، سيتم إرسال طلبات هذه الخدمة للمعتمد قبل التنفيذ.
              </p>
            </div>
            <Switch
              checked={requiresApproval}
              onCheckedChange={setRequiresApproval}
            />
          </div>
        </div>

        {error && (
          <div className="rounded-md border border-destructive/60 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </div>
        )}

        <div className="flex justify-end gap-3">
          <Button type="button" variant="secondary" onClick={onCancel}>
            إلغاء
          </Button>
          <Button type="submit" disabled={saving}>
            {saving ? "جارٍ الحفظ..." : "حفظ"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

