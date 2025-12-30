import Link from "next/link";
import { notFound } from "next/navigation";
import { getServiceBySlug } from "@/data/services";
import { ServiceForm } from "@/components/forms/service-form";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

interface ServiceRequestPageProps {
  params: Promise<{ serviceSlug: string }>;
}

export const dynamic = 'force-dynamic';

export default async function ServiceRequestPage({ params }: ServiceRequestPageProps) {
  // Use static data for server-side rendering
  // Client-side components will fetch from API
  const { serviceSlug } = await params;
  const service = getServiceBySlug(serviceSlug);

  if (!service) {
    notFound();
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="mb-2 flex items-center gap-3 text-brand-teal text-3xl">
            <span>{service.icon}</span>
            <h1 className="text-2xl font-bold text-heading">{service.name}</h1>
          </div>
          <p className="max-w-3xl text-sm text-muted">{service.description}</p>
        </div>
        <Badge tone="neutral">
          <Link href="/services">← الرجوع لكل الخدمات</Link>
        </Badge>
      </div>

      <Card padding="lg" shadow="soft" className="bg-surface-muted">
        <CardContent className="grid gap-2 text-sm text-muted md:grid-cols-3">
          <div>
            <span className="font-semibold text-heading">زمن الإنجاز المتوقع</span>
            <p>2-3 أيام عمل حسب ضغط الطلبات</p>
          </div>
          <div>
            <span className="font-semibold text-heading">المرفقات المطلوبة</span>
            <p>
              ملفات PDF, DOCX, صور أو روابط من الكلاود. بحد أقصى 50 ميجابايت لكل
              ملف.
            </p>
          </div>
          <div>
            <span className="font-semibold text-heading">دعم إضافي</span>
            <p>للدعم الفني يرجى التواصل على it-print@taibahu.edu.sa</p>
          </div>
        </CardContent>
      </Card>

      <ServiceForm service={service} />
    </div>
  );
}


