import { formatDate } from "@/lib/utils";
import { services } from "@/data/services";

export type OrderStatus =
  | "draft"
  | "pending"
  | "in_review"
  | "approved"
  | "in_production"
  | "ready"
  | "rejected"
  | "cancelled";

export interface OrderFieldValue {
  id: string;
  fieldId: string;
  label: string;
  key: string;
  value: unknown;
}

export interface OrderAttachment {
  id: string;
  type: "file" | "link";
  name: string;
  url: string;
  sizeKb?: number;
}

export interface OrderApprovalSummary {
  id: string;
  approver?: string;
  step: number;
  decision: "pending" | "approved" | "rejected";
  comment?: string;
  decidedAt?: string;
}

export interface OrderStatusEntry {
  id: string;
  status: OrderStatus;
  note?: string;
  updatedBy?: string;
  updatedAt: string;
}

export interface OrderSummary {
  id: string;
  orderCode: string;
  service: {
    id: string;
    name: string;
    slug: string;
    icon?: string;
  };
  requester: {
    name: string;
    department?: string;
  };
  quantity?: number;
  status: OrderStatus;
  priority: "low" | "medium" | "high";
  submittedAt: string;
  requiresApproval: boolean;
}

export interface OrderDetail extends OrderSummary {
  orderType?: "order" | "design_order" | "print_order"; // نوع الطلب لتحديد الـ endpoint الصحيح
  fieldValues: OrderFieldValue[];
  attachments: OrderAttachment[];
  approvals: OrderApprovalSummary[];
  statusHistory: OrderStatusEntry[];
}

export const mockOrders: OrderDetail[] = [
  {
    id: "9b44a7cc-e5ad-4142-90ac-7df62374ef11",
    orderCode: "TP-251103-0001",
    service: {
      id: "svc-cards",
      name: "طباعة كروت شخصية",
      slug: "business-cards",
      icon: "🎴",
    },
    requester: {
      name: "د. أحمد محمد",
      department: "علوم الحاسب",
    },
    submittedAt: formatDate("2025-11-03T12:30:00Z"),
    quantity: 100,
    status: "in_review",
    priority: "high",
    requiresApproval: true,
    fieldValues: [
      {
        id: "fv-1",
        fieldId: "card-name-ar",
        label: "الاسم بالعربية",
        key: "name_ar",
        value: "د. أحمد محمد السالم",
      },
      {
        id: "fv-2",
        fieldId: "card-name-en",
        label: "الاسم بالإنجليزية",
        key: "name_en",
        value: "Dr. Ahmed Mohammed Alsalem",
      },
      {
        id: "fv-3",
        fieldId: "card-quantity",
        label: "الكمية",
        key: "quantity",
        value: 100,
      },
    ],
    attachments: [
      {
        id: "att-1",
        type: "file",
        name: "قرار-التكليف.pdf",
        url: "#",
        sizeKb: 820,
      },
    ],
    approvals: [
      {
        id: "app-1",
        approver: "أ. فاطمة الشمري",
        step: 1,
        decision: "pending",
        comment: undefined,
      },
    ],
    statusHistory: [
      {
        id: "hst-1",
        status: "pending",
        updatedBy: "نظام المنصة",
        updatedAt: formatDate("2025-11-03T12:30:00Z"),
      },
      {
        id: "hst-2",
        status: "in_review",
        note: "بانتظار قرار أ. فاطمة الشمري",
        updatedBy: "أ. فاطمة الشمري",
        updatedAt: formatDate("2025-11-03T13:05:00Z"),
      },
    ],
  },
  {
    id: "2b191790-f421-4d28-9a4d-5d7a5edf7681",
    orderCode: "TP-251102-0007",
    service: {
      id: "svc-banners",
      name: "طباعة بنرات",
      slug: "banners",
      icon: "🖼️",
    },
    requester: {
      name: "قسم الإعلام",
      department: "عمادة شؤون الطلاب",
    },
    submittedAt: formatDate("2025-11-02T09:45:00Z"),
    quantity: 5,
    status: "in_production",
    priority: "medium",
    requiresApproval: true,
    fieldValues: [
      {
        id: "fv-4",
        fieldId: "banner-reason",
        label: "سبب الطلب",
        key: "reason",
        value: "المؤتمر الدولي للإعلام 2025",
      },
      {
        id: "fv-5",
        fieldId: "banner-quantity",
        label: "الكمية",
        key: "quantity",
        value: 5,
      },
    ],
    attachments: [
      {
        id: "att-2",
        type: "file",
        name: "تصميم-المؤتمر.pdf",
        url: "#",
        sizeKb: 2350,
      },
      {
        id: "att-3",
        type: "link",
        name: "رابط التصميم",
        url: "https://drive.google.com/...",
      },
    ],
    approvals: [
      {
        id: "app-2",
        approver: "م. عبد الله الرشيد",
        step: 1,
        decision: "approved",
        comment: "تم اعتماد التصميم",
        decidedAt: formatDate("2025-11-02T11:00:00Z"),
      },
    ],
    statusHistory: [
      {
        id: "hst-3",
        status: "pending",
        updatedBy: "نظام المنصة",
        updatedAt: formatDate("2025-11-02T09:45:00Z"),
      },
      {
        id: "hst-4",
        status: "in_review",
        updatedBy: "م. عبد الله الرشيد",
        updatedAt: formatDate("2025-11-02T10:10:00Z"),
      },
      {
        id: "hst-5",
        status: "approved",
        note: "تم اعتماد التصميم",
        updatedBy: "م. عبد الله الرشيد",
        updatedAt: formatDate("2025-11-02T11:00:00Z"),
      },
      {
        id: "hst-6",
        status: "in_production",
        note: "طباعة على خامة Vinly",
        updatedBy: "فريق الطباعة",
        updatedAt: formatDate("2025-11-02T16:20:00Z"),
      },
    ],
  },
  {
    id: "4fd527a8-253d-4d73-8bb7-cf8304321fbb",
    orderCode: "TP-251028-0012",
    service: {
      id: "svc-paper",
      name: "طباعة الورق الرسمي",
      slug: "official-paper",
      icon: "📄",
    },
    requester: {
      name: "قسم القبول والتسجيل",
      department: "عمادة القبول",
    },
    submittedAt: formatDate("2025-10-28T08:20:00Z"),
    quantity: 500,
    status: "ready",
    priority: "low",
    requiresApproval: false,
    fieldValues: [
      {
        id: "fv-7",
        fieldId: "paper-paper-type",
        label: "نوع الورق",
        key: "paper_type",
        value: "standard",
      },
      {
        id: "fv-8",
        fieldId: "paper-quantity",
        label: "الكمية",
        key: "quantity",
        value: 500,
      },
    ],
    attachments: [],
    approvals: [],
    statusHistory: [
      {
        id: "hst-7",
        status: "pending",
        updatedBy: "نظام المنصة",
        updatedAt: formatDate("2025-10-28T08:20:00Z"),
      },
      {
        id: "hst-8",
        status: "approved",
        updatedBy: "م. مريم البحيري",
        updatedAt: formatDate("2025-10-28T09:05:00Z"),
      },
      {
        id: "hst-9",
        status: "in_production",
        updatedBy: "ورشة الطباعة",
        updatedAt: formatDate("2025-10-28T09:30:00Z"),
      },
      {
        id: "hst-10",
        status: "ready",
        note: "جاهز للاستلام من المستودع",
        updatedBy: "مستودع المطبعة",
        updatedAt: formatDate("2025-10-29T14:45:00Z"),
      },
    ],
  },
];

export function getOrderById(id: string): OrderDetail | undefined {
  return mockOrders.find((order) => order.id.toLowerCase() === id.toLowerCase());
}

export function resolveServiceName(slug: string): string {
  return services.find((service) => service.slug === slug)?.name ?? slug;
}


