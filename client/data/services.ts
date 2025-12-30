export type ServiceFieldType =
  | "text"
  | "number"
  | "radio"
  | "textarea"
  | "file"
  | "link"
  | "entity";

export interface ServiceFieldOption {
  value: string;
  label: string;
}

export interface ServiceField {
  id: string;
  name: string;
  type: ServiceFieldType;
  label: string;
  helperText?: string;
  required?: boolean;
  options?: ServiceFieldOption[];
}

export interface ServiceDefinition {
  id: string;
  slug: string;
  icon: string;
  name: string;
  description: string;
  category: "documents" | "design" | "marketing" | "medical" | "general";
  requiresApproval?: boolean;
  fields: ServiceField[];
}

export const services: ServiceDefinition[] = [
  {
    id: "svc-paper",
    slug: "official-paper",
    icon: "📄",
    name: "طباعة الورق الرسمي",
    description: "خدمة تجهيز وطباعة الورق الرسمي بشعارات الجامعة.",
    category: "documents",
    fields: [
      { id: "paper-entity-name", name: "entity_name", type: "entity", label: "اسم الجهة" },
      {
        id: "paper-entity-number",
        name: "entity_number",
        type: "number",
        label: "رقم الجهة",
        helperText: "أرقام فقط",
      },
      {
        id: "paper-paper-type",
        name: "paper_type",
        type: "radio",
        label: "نوع الورق",
        options: [
          { value: "standard", label: "ورق عادي" },
          { value: "premium", label: "ورق فاخر" },
        ],
      },
      {
        id: "paper-quantity",
        name: "quantity",
        type: "number",
        label: "الكمية المطلوبة",
      },
      {
        id: "paper-attachments",
        name: "attachments",
        type: "file",
        label: "المرفقات (تصميم/ملف)",
      },
      {
        id: "paper-notes",
        name: "notes",
        type: "textarea",
        label: "ملاحظات إضافية",
      },
    ],
  },
  {
    id: "svc-referrals",
    slug: "referrals",
    icon: "📋",
    name: "طباعة إحالات",
    description: "إنشاء إحالات رسمية للأقسام والجهات المختلفة.",
    category: "documents",
    fields: [
      { id: "ref-entity-name", name: "entity_name", type: "entity", label: "اسم الجهة" },
      {
        id: "ref-owner",
        name: "owner",
        type: "radio",
        label: "صاحب الجهة",
        options: [
          { value: "manager", label: "المدير" },
          { value: "dean", label: "الوكيل" },
          { value: "doctor", label: "الدكتور" },
          { value: "professor", label: "الأستاذ" },
          { value: "president", label: "رئيس الجامعة" },
          { value: "head-department", label: "رئيس قسم" },
          { value: "unit-lead", label: "رئيس وحدة" },
        ],
      },
      { id: "ref-quantity", name: "quantity", type: "number", label: "الكمية" },
      {
        id: "ref-attachments",
        name: "attachments",
        type: "file",
        label: "المرفقات",
      },
      { id: "ref-notes", name: "notes", type: "textarea", label: "ملاحظات" },
    ],
  },
  {
    id: "svc-memos",
    slug: "memos",
    icon: "📝",
    name: "طباعة مذكرات",
    description: "طباعة المذكرات الرسمية بأنواعها وأحجامها المختلفة.",
    category: "documents",
    fields: [
      { id: "memo-entity-name", name: "entity_name", type: "entity", label: "اسم الجهة" },
      {
        id: "memo-size",
        name: "size",
        type: "radio",
        label: "حجم المذكرة",
        options: [
          { value: "a4", label: "A4" },
          { value: "a5", label: "A5" },
          { value: "a3", label: "A3" },
          { value: "a6", label: "A6" },
        ],
      },
      {
        id: "memo-type",
        name: "memo_type",
        type: "radio",
        label: "نوع المذكرة",
        options: [
          { value: "review", label: "مذكرة مراجعة" },
          { value: "internal", label: "مذكرة داخلية" },
          { value: "notes", label: "مذكرة ملاحظات" },
        ],
      },
      { id: "memo-quantity", name: "quantity", type: "number", label: "الكمية" },
      {
        id: "memo-attachments",
        name: "attachments",
        type: "file",
        label: "المرفقات",
      },
      { id: "memo-notes", name: "notes", type: "textarea", label: "ملاحظات" },
    ],
  },
  {
    id: "svc-banners",
    slug: "banners",
    icon: "🖼️",
    name: "طباعة بنرات",
    description: "تصميم وطباعة بنرات للفعاليات والأنشطة.",
    category: "marketing",
    requiresApproval: true,
    fields: [
      { id: "banner-entity", name: "entity_name", type: "entity", label: "اسم الجهة" },
      {
        id: "banner-reason",
        name: "reason",
        type: "text",
        label: "سبب الطلب",
      },
      { id: "banner-quantity", name: "quantity", type: "number", label: "الكمية" },
      {
        id: "banner-design",
        name: "design",
        type: "file",
        label: "إرفاق التصميم",
        helperText: "يمكن تحميل ملف أو مشاركة رابط من الكلاود.",
      },
      { id: "banner-notes", name: "notes", type: "textarea", label: "ملاحظات" },
    ],
  },
  {
    id: "svc-certificates",
    slug: "certificates",
    icon: "🎓",
    name: "طباعة الشهادات",
    description: "طباعة شهادات التخرج، الامتياز، الشكر وغيرها.",
    category: "documents",
    fields: [
      {
        id: "cert-type",
        name: "certificate_type",
        type: "radio",
        label: "نوع الشهادة",
        options: [
          { value: "graduation", label: "شهادات التخرج" },
          { value: "honor", label: "شهادات الامتياز" },
          { value: "appreciation", label: "شهادات الشكر والتقدير" },
          { value: "excellence", label: "شهادة التميز" },
          { value: "attendance", label: "شهادة حضور أو إتمام" },
        ],
      },
      { id: "cert-entity", name: "entity_name", type: "entity", label: "اسم الجهة" },
      { id: "cert-quantity", name: "quantity", type: "number", label: "الكمية" },
      {
        id: "cert-attachments",
        name: "attachments",
        type: "file",
        label: "المرفقات",
      },
      { id: "cert-notes", name: "notes", type: "textarea", label: "ملاحظات" },
    ],
  },
  {
    id: "svc-envelopes",
    slug: "envelopes",
    icon: "✉️",
    name: "طباعة الأظرف",
    description: "اختيار أحجام وألوان الأظرف مع التفاصيل المطلوبة.",
    category: "documents",
    fields: [
      {
        id: "env-size",
        name: "size",
        type: "radio",
        label: "حجم الظرف",
        options: [
          { value: "a3", label: "A3" },
          { value: "a4", label: "A4" },
          { value: "a5", label: "A5" },
          { value: "a6", label: "A6" },
        ],
      },
      {
        id: "env-color",
        name: "color",
        type: "radio",
        label: "اختيار اللون",
        options: [
          { value: "white", label: "أبيض" },
          { value: "brown", label: "بني" },
          { value: "black", label: "أسود" },
        ],
      },
      { id: "env-entity", name: "entity_name", type: "entity", label: "اسم الجهة" },
      { id: "env-quantity", name: "quantity", type: "number", label: "الكمية" },
      {
        id: "env-attachments",
        name: "attachments",
        type: "file",
        label: "المرفقات",
      },
      { id: "env-notes", name: "notes", type: "textarea", label: "ملاحظات" },
    ],
  },
  {
    id: "svc-medical",
    slug: "medical-referrals",
    icon: "🏥",
    name: "طباعة الإحالات الطبية",
    description: "نماذج الإحالات الطبية للأطباء والعيادات.",
    category: "medical",
    fields: [
      { id: "med-entity", name: "entity_name", type: "entity", label: "اسم الجهة" },
      { id: "med-doctor", name: "doctor_name", type: "text", label: "اسم الطبيب" },
      { id: "med-clinic", name: "clinic_name", type: "text", label: "اسم العيادة" },
      { id: "med-quantity", name: "quantity", type: "number", label: "الكمية" },
      {
        id: "med-attachments",
        name: "attachments",
        type: "file",
        label: "المرفقات",
      },
      { id: "med-notes", name: "notes", type: "textarea", label: "ملاحظات" },
    ],
  },
  {
    id: "svc-general",
    slug: "general-print",
    icon: "📑",
    name: "طباعة عامة",
    description: "طلبات الطباعة العامة والمتنوعة.",
    category: "general",
    fields: [
      { id: "gen-entity", name: "entity_name", type: "entity", label: "اسم الجهة" },
      { id: "gen-reason", name: "reason", type: "text", label: "سبب الطلب" },
      { id: "gen-quantity", name: "quantity", type: "number", label: "الكمية" },
      {
        id: "gen-attachments",
        name: "attachments",
        type: "file",
        label: "المرفقات",
      },
      { id: "gen-notes", name: "notes", type: "textarea", label: "ملاحظات" },
    ],
  },
  {
    id: "svc-design",
    slug: "design-service",
    icon: "🎨",
    name: "خدمة التصميم",
    description: "دعم تصميم المواد البصرية قبل الطباعة.",
    category: "design",
    fields: [
      { id: "design-entity", name: "entity_name", type: "entity", label: "اسم الجهة" },
      { id: "design-reason", name: "reason", type: "text", label: "سبب الطلب" },
      { id: "design-quantity", name: "quantity", type: "number", label: "الكمية" },
      {
        id: "design-attachments",
        name: "attachments",
        type: "file",
        label: "مرفقات مرجعية",
      },
      { id: "design-notes", name: "notes", type: "textarea", label: "ملاحظات" },
    ],
  },
  {
    id: "svc-brochures",
    slug: "brochures",
    icon: "📰",
    name: "طباعة بروشورات",
    description: "بروشورات تعريفية للمناسبات والفعاليات.",
    category: "marketing",
    fields: [
      { id: "bro-entity", name: "entity_name", type: "entity", label: "اسم الجهة" },
      { id: "bro-reason", name: "reason", type: "text", label: "سبب الطلب" },
      { id: "bro-quantity", name: "quantity", type: "number", label: "الكمية" },
      {
        id: "bro-attachments",
        name: "attachments",
        type: "file",
        label: "المرفقات",
      },
      { id: "bro-notes", name: "notes", type: "textarea", label: "ملاحظات" },
    ],
  },
  {
    id: "svc-cards",
    slug: "business-cards",
    icon: "🎴",
    name: "طباعة كروت شخصية",
    description: "إعداد وطباعة الكروت الشخصية الرسمية.",
    category: "marketing",
    requiresApproval: true,
    fields: [
      {
        id: "card-name-ar",
        name: "name_ar",
        type: "text",
        label: "الاسم بالعربية",
      },
      {
        id: "card-name-en",
        name: "name_en",
        type: "text",
        label: "الاسم بالإنجليزية",
      },
      {
        id: "card-title-ar",
        name: "title_ar",
        type: "text",
        label: "المنصب بالعربية",
      },
      {
        id: "card-title-en",
        name: "title_en",
        type: "text",
        label: "المنصب بالإنجليزية",
      },
      {
        id: "card-role",
        name: "role",
        type: "radio",
        label: "الصفة",
        options: [
          { value: "president", label: "رئيس جامعة" },
          { value: "professor", label: "أستاذ دكتور" },
          { value: "doctor", label: "دكتور" },
          { value: "engineer", label: "مهندس" },
          { value: "lecturer", label: "محاضر" },
          { value: "head", label: "رئيس" },
          { value: "dean", label: "وكيل" },
          { value: "manager", label: "مدير" },
          { value: "general-manager", label: "مدير عام" },
          { value: "technician", label: "فني" },
        ],
      },
      {
        id: "card-quantity",
        name: "quantity",
        type: "number",
        label: "الكمية",
      },
      {
        id: "card-decision",
        name: "appointment_decision",
        type: "file",
        label: "قرار التكليف / الترقية (إلزامي)",
        required: true,
      },
      {
        id: "card-notes",
        name: "notes",
        type: "textarea",
        label: "ملاحظات",
      },
    ],
  },
];

export function getServiceBySlug(slug: string): ServiceDefinition | undefined {
  return services.find((service) => service.slug === slug);
}


