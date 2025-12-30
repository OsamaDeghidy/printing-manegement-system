"use client";

import Link from "next/link";
import { PrintingForm } from "@/components/forms/printing-form";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function PrintingServicePage() {
  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="mb-2 flex items-center gap-3 text-brand-teal text-3xl">
            <span>🖨️</span>
            <h1 className="text-2xl font-bold text-heading">طلب طباعة جديد</h1>
          </div>
          <p className="max-w-3xl text-sm text-muted">
            قدم طلب طباعة للمطبوعات مع تحديد المواصفات الكاملة والكمية المطلوبة
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
            <p>3-7 أيام عمل حسب الكمية ونوع الطباعة</p>
          </div>
          <div>
            <span className="font-semibold text-heading">المرفقات المطلوبة</span>
            <p>ملفات جاهزة للطباعة - الكروت الشخصية تتطلب ملف إلزامي</p>
          </div>
          <div>
            <span className="font-semibold text-heading">قاعدة التأكيد</span>
            <p>يجب تأكيد الطلب خلال 72 ساعة من إرساله</p>
          </div>
        </CardContent>
      </Card>

      <PrintingForm />
    </div>
  );
}

