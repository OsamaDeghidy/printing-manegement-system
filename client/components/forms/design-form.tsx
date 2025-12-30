"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TextArea } from "@/components/ui/textarea";
import { RadioGroup } from "@/components/ui/radio-group";
import { FileUpload } from "@/components/ui/file-upload";
import { createDesignOrder } from "@/lib/api-client";

const DESIGN_TYPES = [
  { value: "poster", label: "بوستر" },
  { value: "brochure", label: "بروشور" },
  { value: "card", label: "كارت" },
  { value: "certificate", label: "شهادة" },
  { value: "logo", label: "شعار" },
  { value: "other", label: "أخرى" },
];

const SIZES = [
  { value: "A0", label: "A0" },
  { value: "A1", label: "A1" },
  { value: "A2", label: "A2" },
  { value: "A3", label: "A3" },
  { value: "A4", label: "A4" },
  { value: "A5", label: "A5" },
  { value: "A6", label: "A6" },
  { value: "custom", label: "مخصص" },
];

const PRIORITIES = [
  { value: "normal", label: "عادي" },
  { value: "urgent", label: "عاجل" },
  { value: "emergency", label: "طارئ" },
];

export function DesignForm() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    design_type: "",
    title: "",
    size: "",
    custom_size: "",
    description: "",
    priority: "normal",
  });
  const [attachments, setAttachments] = useState<File[]>([]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const formDataToSend = new FormData();
      Object.entries(formData).forEach(([key, value]) => {
        if (value) formDataToSend.append(key, value);
      });
      attachments.forEach((file) => {
        formDataToSend.append("attachments", file);
      });

      await createDesignOrder(formDataToSend);
      router.push("/orders");
    } catch (error) {
      console.error("Error creating design order:", error);
      alert("حدث خطأ أثناء إنشاء الطلب");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <div className="rounded-2xl bg-surface px-8 py-8 shadow-[var(--shadow-card)]">
        <div className="grid gap-6">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-heading">
              نوع التصميم <span className="text-[#E53935]">*</span>
            </label>
            <RadioGroup
              name="design_type"
              value={formData.design_type}
              options={DESIGN_TYPES}
              onChange={(value) => setFormData({ ...formData, design_type: value })}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-heading">
              العنوان <span className="text-[#E53935]">*</span>
            </label>
            <Input
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="عنوان واضح للتصميم"
              maxLength={200}
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-heading">
              الحجم <span className="text-[#E53935]">*</span>
            </label>
            <RadioGroup
              name="size"
              value={formData.size}
              options={SIZES}
              onChange={(value) => setFormData({ ...formData, size: value })}
            />
            {formData.size === "custom" && (
              <Input
                value={formData.custom_size}
                onChange={(e) => setFormData({ ...formData, custom_size: e.target.value })}
                placeholder="حدد الحجم المخصص"
                className="mt-2"
              />
            )}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-heading">
              الوصف <span className="text-[#E53935]">*</span>
            </label>
            <TextArea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="الهدف، الألوان المطلوبة، الرسالة..."
              rows={4}
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-heading">
              الأولوية <span className="text-[#E53935]">*</span>
            </label>
            <RadioGroup
              name="priority"
              value={formData.priority}
              options={PRIORITIES}
              onChange={(value) => setFormData({ ...formData, priority: value })}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-heading">المرفقات</label>
            <FileUpload
              onFilesChange={(files) => setAttachments(files)}
              description="PDF, PNG, AI, PSD - بحد أقصى 25 ميجابايت"
            />
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3 pt-4">
        <Button type="submit" variant="primary" size="lg" disabled={isSubmitting}>
          {isSubmitting ? "جاري الإرسال..." : "إرسال الطلب"}
        </Button>
        <Button type="button" variant="secondary" size="lg" onClick={() => router.back()} disabled={isSubmitting}>
          إلغاء
        </Button>
      </div>
    </form>
  );
}

