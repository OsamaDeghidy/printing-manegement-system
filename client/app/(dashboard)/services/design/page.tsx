"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { DesignForm } from "@/components/forms/design-form";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

export default function DesignServicePage() {
  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="mb-2 flex items-center gap-3 text-brand-teal text-3xl">
            <span>🎨</span>
            <h1 className="text-2xl font-bold text-heading">طلب تصميم جديد</h1>
          </div>
          <p className="max-w-3xl text-sm text-muted">
            قدم طلب تصميم للمطبوعات والمواد الإعلانية مع ضمان الالتزام بالهوية البصرية
          </p>
        </div>
        <Badge tone="neutral">
          <Link href="/services">← الرجوع لكل الخدمات</Link>
        </Badge>
      </div>

      <Card padding="lg" shadow="soft" className="bg-surface-muted">
        <CardContent className="grid gap-2 text-sm text-muted md:grid-cols-3">
          <div>
            <span className="font-semibold text-heading">زمن الإنجاز المتوقع</span>
            <p>2-5 أيام عمل حسب نوع التصميم والأولوية</p>
          </div>
          <div>
            <span className="font-semibold text-heading">المرفقات المطلوبة</span>
            <p>ملفات PDF, PNG, AI, PSD بحد أقصى 25 ميجابايت لكل ملف</p>
          </div>
          <div>
            <span className="font-semibold text-heading">قاعدة التأكيد</span>
            <p>يجب تأكيد التصميم خلال 72 ساعة من إرساله</p>
          </div>
        </CardContent>
      </Card>

      <DesignForm />
    </div>
  );
}

