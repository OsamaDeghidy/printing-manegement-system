"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TextArea } from "@/components/ui/textarea";
import { createTrainingRequest } from "@/lib/api-client";

export function TrainingForm() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    trainee_name: "",
    trainee_id: "",
    trainee_phone: "",
    trainee_email: "",
    university: "",
    major: "",
    training_period_start: "",
    training_period_end: "",
    department: "",
    purpose: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await createTrainingRequest(formData);
      router.push("/orders");
    } catch (error) {
      console.error("Error creating training request:", error);
      alert("حدث خطأ أثناء إنشاء الطلب");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <div className="rounded-2xl bg-surface px-8 py-8 shadow-[var(--shadow-card)]">
        <div className="grid gap-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-heading">
                اسم المتدرب <span className="text-[#E53935]">*</span>
              </label>
              <Input
                value={formData.trainee_name}
                onChange={(e) => setFormData({ ...formData, trainee_name: e.target.value })}
                placeholder="اسم المتدرب الكامل"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-heading">
                رقم الهوية/الجامعي <span className="text-[#E53935]">*</span>
              </label>
              <Input
                value={formData.trainee_id}
                onChange={(e) => setFormData({ ...formData, trainee_id: e.target.value })}
                placeholder="رقم الهوية أو الرقم الجامعي"
                required
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-heading">
                رقم الجوال <span className="text-[#E53935]">*</span>
              </label>
              <Input
                type="tel"
                value={formData.trainee_phone}
                onChange={(e) => setFormData({ ...formData, trainee_phone: e.target.value })}
                placeholder="05xxxxxxxx"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-heading">
                البريد الإلكتروني <span className="text-[#E53935]">*</span>
              </label>
              <Input
                type="email"
                value={formData.trainee_email}
                onChange={(e) => setFormData({ ...formData, trainee_email: e.target.value })}
                placeholder="example@university.edu.sa"
                required
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-heading">
                الجامعة/المؤسسة <span className="text-[#E53935]">*</span>
              </label>
              <Input
                value={formData.university}
                onChange={(e) => setFormData({ ...formData, university: e.target.value })}
                placeholder="اسم الجامعة أو المؤسسة التعليمية"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-heading">
                التخصص <span className="text-[#E53935]">*</span>
              </label>
              <Input
                value={formData.major}
                onChange={(e) => setFormData({ ...formData, major: e.target.value })}
                placeholder="التخصص الدراسي"
                required
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-heading">
                بداية فترة التدريب <span className="text-[#E53935]">*</span>
              </label>
              <Input
                type="date"
                value={formData.training_period_start}
                onChange={(e) =>
                  setFormData({ ...formData, training_period_start: e.target.value })
                }
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-heading">
                نهاية فترة التدريب <span className="text-[#E53935]">*</span>
              </label>
              <Input
                type="date"
                value={formData.training_period_end}
                onChange={(e) =>
                  setFormData({ ...formData, training_period_end: e.target.value })
                }
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-heading">
              القسم المطلوب <span className="text-[#E53935]">*</span>
            </label>
            <Input
              value={formData.department}
              onChange={(e) => setFormData({ ...formData, department: e.target.value })}
              placeholder="قسم التصميم، قسم الطباعة، إلخ"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-heading">
              الغرض من التدريب <span className="text-[#E53935]">*</span>
            </label>
            <TextArea
              value={formData.purpose}
              onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
              placeholder="اذكر الغرض من التدريب والأهداف المرجوة..."
              rows={4}
              required
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

