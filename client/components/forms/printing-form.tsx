"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RadioGroup } from "@/components/ui/radio-group";
import { FileUpload } from "@/components/ui/file-upload";
import { createPrintOrder } from "@/lib/api-client";

const PRINT_TYPES = [
  { value: "books", label: "كتب" },
  { value: "business_cards", label: "كروت شخصية" },
  { value: "banners", label: "بانرات" },
  { value: "posters", label: "بوسترات" },
  { value: "brochures", label: "بروشورات" },
  { value: "flyers", label: "منشورات" },
  { value: "letterheads", label: "أوراق رسمية" },
  { value: "envelopes", label: "ظروف" },
  { value: "labels", label: "ملصقات" },
  { value: "stickers", label: "ستيكر" },
  { value: "certificates", label: "شهادات" },
  { value: "forms", label: "نماذج" },
  { value: "other", label: "أخرى" },
];

const PRODUCTION_DEPTS = [
  { value: "offset", label: "أوفست" },
  { value: "digital", label: "ديجيتال" },
  { value: "gto", label: "GTO" },
];

const SIZES = [
  { value: "A0", label: "A0" },
  { value: "A1", label: "A1" },
  { value: "A2", label: "A2" },
  { value: "A3", label: "A3" },
  { value: "A4", label: "A4" },
  { value: "A5", label: "A5" },
  { value: "A6", label: "A6" },
  { value: "A7", label: "A7" },
  { value: "custom", label: "مخصص" },
];

const PAPER_TYPES = [
  { value: "normal", label: "عادي" },
  { value: "coated", label: "كوشيه" },
  { value: "cardboard", label: "كرتون" },
  { value: "transparent", label: "شفاف" },
  { value: "sticker", label: "ستيكر" },
];

const DELIVERY_METHODS = [
  { value: "self_pickup", label: "استلام ذاتي" },
  { value: "delivery", label: "توصيل" },
  { value: "delivery_install", label: "توصيل + تركيب" },
];

export function PrintingForm() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    print_type: "",
    production_dept: "",
    size: "",
    custom_size: "",
    paper_type: "",
    paper_weight: "",
    quantity: "",
    sides: "1",
    pages: "1",
    delivery_method: "",
    priority: "normal",
  });
  const [attachments, setAttachments] = useState<File[]>([]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // التحقق من أن الكروت الشخصية تتطلب ملف
    if (formData.print_type === "business_cards" && attachments.length === 0) {
      alert("الكروت الشخصية تتطلب إرفاق ملف");
      return;
    }

    setIsSubmitting(true);

    try {
      const formDataToSend = new FormData();
      Object.entries(formData).forEach(([key, value]) => {
        if (value) formDataToSend.append(key, value);
      });
      attachments.forEach((file) => {
        formDataToSend.append("attachments", file);
      });

      await createPrintOrder(formDataToSend);
      router.push("/orders");
    } catch (error) {
      console.error("Error creating print order:", error);
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
              نوع الطباعة <span className="text-[#E53935]">*</span>
            </label>
            <RadioGroup
              name="print_type"
              value={formData.print_type}
              options={PRINT_TYPES}
              onChange={(value) => setFormData({ ...formData, print_type: value })}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-heading">
              قسم الإنتاج <span className="text-[#E53935]">*</span>
            </label>
            <RadioGroup
              name="production_dept"
              value={formData.production_dept}
              options={PRODUCTION_DEPTS}
              onChange={(value) => setFormData({ ...formData, production_dept: value })}
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
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
                نوع الورق <span className="text-[#E53935]">*</span>
              </label>
              <RadioGroup
                name="paper_type"
                value={formData.paper_type}
                options={PAPER_TYPES}
                onChange={(value) => setFormData({ ...formData, paper_type: value })}
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-heading">
                وزن الورق (جرام) <span className="text-[#E53935]">*</span>
              </label>
              <Input
                type="number"
                value={formData.paper_weight}
                onChange={(e) => setFormData({ ...formData, paper_weight: e.target.value })}
                placeholder="70-350"
                min={70}
                max={350}
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-heading">
                الكمية <span className="text-[#E53935]">*</span>
              </label>
              <Input
                type="number"
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                placeholder="1"
                min={1}
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-heading">
                عدد الأوجه <span className="text-[#E53935]">*</span>
              </label>
              <Input
                type="number"
                value={formData.sides}
                onChange={(e) => setFormData({ ...formData, sides: e.target.value })}
                placeholder="1 أو 2"
                min={1}
                max={2}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-heading">
              عدد الصفحات <span className="text-[#E53935]">*</span>
            </label>
            <Input
              type="number"
              value={formData.pages}
              onChange={(e) => setFormData({ ...formData, pages: e.target.value })}
              placeholder="1"
              min={1}
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-heading">
              طريقة التسليم <span className="text-[#E53935]">*</span>
            </label>
            <RadioGroup
              name="delivery_method"
              value={formData.delivery_method}
              options={DELIVERY_METHODS}
              onChange={(value) => setFormData({ ...formData, delivery_method: value })}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-heading">الملفات</label>
            <FileUpload
              onFilesChange={(files) => setAttachments(files)}
              description="ملفات جاهزة للطباعة"
            />
            {formData.print_type === "business_cards" && (
              <p className="text-xs text-[#E53935]">الكروت الشخصية تتطلب ملف إلزامي</p>
            )}
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

