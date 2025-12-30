"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TextArea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { RadioGroup } from "@/components/ui/radio-group";
import { FileUpload } from "@/components/ui/file-upload";
import { createVisitRequest, fetchAvailableDates, type AvailableDate } from "@/lib/api-client";

const VISIT_TYPES = [
  { value: "internal", label: "زيارة داخلية" },
  { value: "external", label: "زيارة خارجية" },
];

interface VisitFormProps {
  onCancel: () => void;
  onSuccess?: () => void;
}

export function VisitForm({ onCancel, onSuccess }: VisitFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadingDates, setLoadingDates] = useState(false);
  const [formData, setFormData] = useState({
    visit_type: "internal",
    purpose: "",
    requested_date: "",
    requested_time: "",
  });
  const [permitFile, setPermitFile] = useState<File | null>(null);
  const [availableDates, setAvailableDates] = useState<AvailableDate[]>([]);
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);

  // Load available dates when visit type changes
  useEffect(() => {
    loadAvailableDates();
  }, [formData.visit_type]);

  // Load available slots when date changes
  useEffect(() => {
    if (formData.requested_date) {
      const selectedDate = availableDates.find(d => d.date === formData.requested_date);
      if (selectedDate) {
        setAvailableSlots(selectedDate.available_slots);
        // Reset time when date changes
        setFormData(prev => ({ ...prev, requested_time: "" }));
      } else {
        setAvailableSlots([]);
      }
    } else {
      setAvailableSlots([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.requested_date, availableDates]);

  const loadAvailableDates = async () => {
    try {
      setLoadingDates(true);
      const dates = await fetchAvailableDates(formData.visit_type);
      setAvailableDates(dates);
    } catch (error) {
      console.error("Error loading available dates:", error);
    } finally {
      setLoadingDates(false);
    }
  };


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.visit_type === "external" && !permitFile) {
      alert("الزيارات الخارجية تتطلب إرفاق تصريح موقع ومختوم");
      return;
    }

    setIsSubmitting(true);

    try {
      const formDataToSend = new FormData();
      // Convert date from mm/dd/yyyy to YYYY-MM-DD
      const selectedDate = availableDates.find(d => d.date === formData.requested_date);
      if (selectedDate) {
        formDataToSend.append("requested_date", selectedDate.date_iso);
      } else {
        formDataToSend.append("requested_date", formData.requested_date);
      }
      formDataToSend.append("visit_type", formData.visit_type);
      formDataToSend.append("purpose", formData.purpose);
      formDataToSend.append("requested_time", formData.requested_time);
      if (permitFile) {
        formDataToSend.append("permit_file", permitFile);
      }

      await createVisitRequest(formDataToSend);
      // في حالة النجاح، التوجيه إلى صفحة الزيارات
      if (onSuccess) {
        onSuccess();
      }
      router.push("/visits");
    } catch (error: any) {
      console.error("Error creating visit request:", error);
      alert(error.message || "حدث خطأ أثناء إنشاء الطلب");
      // في حالة الفشل، يبقى في نفس الصفحة (لا يتم التوجيه)
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-heading">طلب زيارة جديد</h2>
        <p className="mt-1 text-sm text-muted">املأ البيانات التالية لحجز موعد زيارة</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="rounded-2xl bg-surface px-8 py-8 shadow-[var(--shadow-card)]">
          <div className="grid gap-6">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-heading">
                نوع الزيارة <span className="text-[#E53935]">*</span>
              </label>
              <RadioGroup
                name="visit_type"
                value={formData.visit_type}
                options={VISIT_TYPES}
                onChange={(value) => setFormData({ ...formData, visit_type: value })}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-heading">
                الغرض من الزيارة <span className="text-[#E53935]">*</span>
              </label>
              <TextArea
                value={formData.purpose}
                onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
                placeholder="اذكر الغرض من الزيارة..."
                rows={4}
                required
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-heading">
                  التاريخ المطلوب <span className="text-[#E53935]">*</span>
                </label>
                {loadingDates ? (
                  <div className="text-sm text-muted">جاري تحميل المواعيد المتاحة...</div>
                ) : (
                  <Select
                    value={formData.requested_date}
                    onChange={(e) => setFormData({ ...formData, requested_date: e.target.value, requested_time: "" })}
                    required
                    options={[
                      { value: "", label: "اختر التاريخ" },
                      ...availableDates.map((date) => ({
                        value: date.date,
                        label: `${date.date} (${date.available_slots.length} مواعيد متاحة)`,
                      })),
                    ]}
                  />
                )}
                {availableDates.length === 0 && !loadingDates && (
                  <p className="text-xs text-muted">لا توجد مواعيد متاحة حالياً</p>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-heading">
                  الوقت المطلوب <span className="text-[#E53935]">*</span>
                </label>
                <Select
                  value={formData.requested_time}
                  onChange={(e) => setFormData({ ...formData, requested_time: e.target.value })}
                  required
                  disabled={!formData.requested_date || availableSlots.length === 0}
                  options={[
                    { value: "", label: "اختر الوقت" },
                    ...availableSlots.map((slot) => ({
                      value: slot,
                      label: slot,
                    })),
                  ]}
                />
                {formData.requested_date && availableSlots.length === 0 && (
                  <p className="text-xs text-muted">لا توجد مواعيد متاحة لهذا التاريخ</p>
                )}
              </div>
            </div>

            {formData.visit_type === "external" && (
              <div className="space-y-2">
                <label className="text-sm font-semibold text-heading">
                  تصريح موقع ومختوم <span className="text-[#E53935]">*</span>
                </label>
                <FileUpload
                  onFilesChange={(files) => setPermitFile(files[0] || null)}
                  description="إلزامي للزيارات الخارجية"
                />
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 pt-4">
          <Button type="submit" variant="primary" size="lg" disabled={isSubmitting}>
            {isSubmitting ? "جاري الإرسال..." : "إرسال الطلب"}
          </Button>
          <Button type="button" variant="secondary" size="lg" onClick={onCancel} disabled={isSubmitting}>
            إلغاء
          </Button>
        </div>
      </form>
    </div>
  );
}

