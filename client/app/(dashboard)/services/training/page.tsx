"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { TrainingForm } from "@/components/forms/training-form";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

export default function TrainingServicePage() {
  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="mb-2 flex items-center gap-3 text-brand-teal text-3xl">
            <span>🎓</span>
            <h1 className="text-2xl font-bold text-heading">طلب تدريب تعاوني</h1>
          </div>
          <p className="max-w-3xl text-sm text-muted">
            قدم طلب للتدريب التعاوني في مطابع جامعة طيبة
          </p>
        </div>
        <Badge tone="neutral">
          <Link href="/services">← الرجوع لكل الخدمات</Link>
        </Badge>
      </div>

      <Card padding="lg" shadow="soft" className="bg-surface-muted">
        <CardContent className="grid gap-2 text-sm text-muted md:grid-cols-3">
          <div>
            <span className="font-semibold text-heading">مدة التدريب</span>
            <p>حسب الفترة المحددة في الطلب</p>
          </div>
          <div>
            <span className="font-semibold text-heading">التقييم</span>
            <p>تقييم أسبوعي ونهائي من مشرف التدريب</p>
          </div>
          <div>
            <span className="font-semibold text-heading">المتطلبات</span>
            <p>يجب أن يكون المتدرب طالباً في جامعة أو مؤسسة تعليمية</p>
          </div>
        </CardContent>
      </Card>

      <TrainingForm />
    </div>
  );
}

