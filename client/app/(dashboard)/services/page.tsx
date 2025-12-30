import Link from "next/link";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { services } from "@/data/services";
import type { ServiceDefinition } from "@/data/services";

export default async function ServicesCatalogPage() {
  // Use static data for server-side rendering
  // Client-side components will fetch from API
  const serviceList = services;
  const grouped = serviceList.reduce<Record<string, ServiceDefinition[]>>(
    (acc, service) => {
      const key = service.category;
      acc[key] = acc[key] ?? [];
      acc[key].push(service);
      return acc;
    },
    {}
  );

  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <h1 className="text-3xl font-bold text-heading">مجموعة خدمات الطباعة</h1>
        <p className="text-sm text-muted">
          اختر الخدمة المناسبة لاحتياجك وسيقوم فريق المطبعة بمعالجة الطلب فوراً.
        </p>
      </header>

      <div className="space-y-6">
        {Object.entries(grouped).map(([category, group]) => (
          <section key={category} className="space-y-4">
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-semibold text-heading">
                {resolveCategoryTitle(category)}
              </h2>
              <Badge tone="neutral">{group.length} خدمة</Badge>
            </div>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {group.map((service) => (
                <Link key={service.id} href={`/services/${service.slug}`}>
                  <Card padding="lg" shadow="soft" className="h-full transition hover:-translate-y-1 hover:border-brand-teal">
                    <CardHeader className="items-start gap-3">
                      <span className="text-4xl">{service.icon}</span>
                      <CardTitle className="text-lg">{service.name}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3 text-sm text-muted">
                      <p>{service.description}</p>
                      <div className="flex flex-wrap gap-2">
                        <Badge tone={service.requiresApproval ? "warning" : "success"}>
                          {service.requiresApproval
                            ? "يتطلب اعتماد"
                            : "تنفيذ فوري"}
                        </Badge>
                        <Badge tone="info">حقول: {service.fields.length}</Badge>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}

function resolveCategoryTitle(category: string): string {
  switch (category) {
    case "documents":
      return "المستندات الرسمية";
    case "design":
      return "التصميم والإبداع";
    case "marketing":
      return "الترويج والفعاليات";
    case "medical":
      return "الخدمات الطبية";
    default:
      return "خدمات عامة";
  }
}


