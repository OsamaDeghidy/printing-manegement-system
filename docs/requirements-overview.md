# Taibah Print Center – Functional Notes

## 1. Personas and Journeys
- **Requester (Faculty/Staff):** يتصفح الخدمات، يرسل طلبات فردية، يتابع حالة الطلب، يحمل المخرجات.
- **Print Staff:** يدير قائمة الطلبات الواردة، يحدّث الحالات، يتعامل مع الأولويات والتقدم.
- **Approver (اختياري):** يعتمد الطلبات حسب الخدمة أو يعيدها مع ملاحظات.
- **Administrator:** يدير الهوية البصرية، الحقول المخصصة، إعدادات الاعتماد، المستخدمين، الأسعار، والمخزون.

## 2. Page Inventory (Next.js)
- `app/(public)/login`: شاشة تسجيل الدخول مع استرجاع كلمة المرور والتسجيل البديل.
- `app/(dashboard)/dashboard`: لوحة رئيسية للمستخدم مع بطاقات الخدمات، إحصائيات سريعة، وتنبيهات.
- `app/(dashboard)/orders`: عرض الطلبات مع بحث/فلترة، بطاقات حالة، وتتبع.
- `app/(dashboard)/orders/[orderId]`: تفاصيل الطلب، المرفقات، سجل الحالة، وإجراءات المتابعة.
- `app/(dashboard)/services/[serviceSlug]`: صفحة إنشاء الطلب لكل خدمة (نموذج ديناميكي).
- `app/(dashboard)/notifications`: مركز الإشعارات والرسائل.
- `app/(dashboard)/settings`: إعدادات المستخدم، اللغة، التفضيلات.
- `app/(admin)/overview`: لوحة المدير مع مؤشرات الأداء، تنبيهات المخزون، وسجل النشاط.
- `app/(admin)/services`: إدارة الخدمات والحقول مع القدرة على الإخفاء/الإظهار وخيارات Radio.
- `app/(admin)/approvals`: تفعيل/إيقاف الاعتماد لكل خدمة، تحديد المعتمدين، وتتبع القرارات.
- `app/(admin)/inventory`: إدارة المواد، الحدود الدنيا/العظمى، إضافة كميات، وطلبات التوريد.
- `app/(admin)/pricing`: جداول الأسعار المخفية لحسابات التوفير.
- `app/(admin)/reports`: تقارير الطلبات، القيمة المالية، المخزون، المستخدمين مع خيارات تصدير.
- `app/(admin)/users`: إدارة الحسابات، الأدوار، الصلاحيات.
- `app/(admin)/logs`: عرض السجلات النظامية والتدقيق.

## 3. UI Building Blocks
- **Navigation:** شريط علوي ثابت (شعار، تنبيهات، ملف شخصي) + قائمة جانبية بارتفاع كامل مع تمييز الحالة.
- **Cards Grid:** بطاقات الخدمات (أيقونة، عنوان، وصف قصير، زر طلب).
- **Dynamic Form Sections:** عناوين فرعية، حقول نص/رقم، Radio Buttons كبيرة، حقول تحميل ملفات مع Drag & Drop وخيار الرابط.
- **Status Pills:** ألوان للحالات (`success`, `warning`, `info`, `danger`).
- **Data Tables / Lists:** لطلبات المستخدم، الطلبات قيد المعالجة، المخزون، التقارير المالية.
- **Modals:** تأكيد إرسال الطلب، نافذة إجراءات الاعتماد، إنشاء طلب مخزون جديد.
- **Progress Indicators:** شرائط تقدم للطلبات قيد التصنيع ومؤشرات الأولوية.
- **Charts:** استخدام Chart.js/Recharts للملخص المالي، المقارنات الشهرية، توزيع الطلبات.
- **Alerts & Toasts:** تنبيهات فورية للنجاح/الخطأ، إشعارات المخزون الحرجة.

## 4. Service Catalog & Field Matrix
كل طلب = خدمة واحدة. جميع الحقول اختيارية ماعدا مرفق قرار التكليف في الكروت الشخصية.

| الخدمة | الحقول النصية | خيارات Radio | الحقول العددية | المرفقات | ملاحظات |
|--------|---------------|--------------|----------------|----------|---------|
| الورق الرسمي | اسم الجهة، رقم الجهة | نوع الورق (عادي/فاخر) | الكمية | ملفات/روابط | نص متعدد |
| إحالات | اسم الجهة | صاحب الجهة (مدير/وكيل/دكتور/أستاذ/رئيس جامعة/رئيس قسم/رئيس وحدة) | الكمية | ملفات/روابط | نص متعدد |
| مذكرات | اسم الجهة | حجم (A4/A5/A3/A6)، نوع (مراجعة/داخلية/ملاحظات) | الكمية | ملفات/روابط | نص متعدد |
| بنرات | اسم الجهة، سبب الطلب | — | الكمية | تصميم مرفق/رابط | نص متعدد |
| شهادات | اسم الجهة | نوع الشهادة (تخرج/امتياز/شكر/تميز/حضور) | الكمية | ملفات/روابط | نص متعدد |
| أظرف | اسم الجهة | الحجم (A3/A4/A5/A6)، اللون (أبيض/بني/أسود) | الكمية | ملفات/روابط | نص متعدد |
| إحالات طبية | اسم الجهة، اسم الطبيب، اسم العيادة | — | الكمية | ملفات/روابط | نص متعدد |
| طباعة عامة | اسم الجهة، سبب الطلب | — | الكمية | ملفات/روابط | نص متعدد |
| خدمة التصميم | اسم الجهة، سبب الطلب | — | الكمية | ملفات/روابط | نص متعدد |
| بروشورات | اسم الجهة، سبب الطلب | — | الكمية | ملفات/روابط | نص متعدد |
| كروت شخصية | الاسم بالعربي، الاسم بالإنجليزي، المنصب بالعربية، المنصب بالإنجليزية | الصفة (10 خيارات) | الكمية | قرار التكليف (ملف/رابط) ✅ | نص متعدد |

## 5. Data Contracts (Draft)

### 5.1 Service Definition
```json
{
  "id": "uuid",
  "slug": "business-cards",
  "name_ar": "طباعة كروت شخصية",
  "name_en": "Business Cards",
  "is_active": true,
  "requires_approval": true,
  "fields": [
    {
      "id": "uuid",
      "type": "text|number|radio|file|textarea|link",
      "label_ar": "الاسم بالعربية",
      "label_en": "Arabic Name",
      "options": [
        {"id": "uuid", "value": "president", "label_ar": "رئيس جامعة", "label_en": "University President"}
      ],
      "is_required": false,
      "is_visible": true
    }
  ]
}
```

### 5.2 Order Payload
```json
{
  "id": "TP-2025-0001",
  "service_id": "uuid",
  "service_name": "طباعة كروت شخصية",
  "requester": {
    "user_id": "uuid",
    "name": "د. أحمد محمد",
    "department": "علوم الحاسب",
    "email": "ahmed@taibahu.edu.sa"
  },
  "status": "pending|in_review|approved|in_production|ready|rejected",
  "priority": "low|medium|high",
  "submitted_at": "2025-11-03T12:30:00Z",
  "fields": [
    {"field_id": "uuid", "value": "د. أحمد محمد السالم"},
    {"field_id": "uuid", "value": "associate-professor"},
    {"field_id": "uuid", "value": 100}
  ],
  "attachments": [
    {
      "id": "uuid",
      "type": "file|link",
      "name": "decision.pdf",
      "url": "https://cdn/files/decision.pdf",
      "size_bytes": 2345678
    }
  ],
  "approval": {
    "is_required": true,
    "current_step": 1,
    "history": [
      {
        "approver_id": "uuid",
        "decision": "approved",
        "comment": "مكتمل",
        "decided_at": "2025-11-03T13:15:00Z"
      }
    ]
  },
  "production": {
    "assigned_to": "uuid",
    "progress_percent": 60,
    "estimated_completion": "2025-11-05T16:00:00Z"
  },
  "delivery": {
    "method": "pickup|delivery",
    "ready_at": null
  }
}
```

### 5.3 Inventory Item
```json
{
  "id": "uuid",
  "name": "ورق A4 أبيض",
  "sku": "PAPER-A4-WHITE",
  "category": "paper|ink|banner|other",
  "unit": "قطعة|علبة|رزمة",
  "current_quantity": 200,
  "min_threshold": 500,
  "max_threshold": 10000,
  "status": "critical|warning|ok",
  "last_restock": "2025-11-02T09:00:00Z",
  "last_usage_order_id": "TP-145",
  "reorder_requests": [
    {
      "id": "uuid",
      "quantity": 1000,
      "status": "pending|ordered|received",
      "created_at": "2025-11-03T10:00:00Z"
    }
  ]
}
```

### 5.4 Notification
```json
{
  "id": "uuid",
  "recipient_id": "uuid",
  "type": "order_status|approval|inventory_alert|system",
  "title": "تم اعتماد طلبك",
  "message": "تم اعتماد طلب كروت شخصية رقم TP-002.",
  "is_read": false,
  "created_at": "2025-11-03T13:20:00Z"
}
```

## 6. Admin Controls Matrix
- **حقول الخدمات:** toggles per field per service (`visible`, `required`, default values).
- **خيارات Radio:** يمكن إلغاء تفعيل خيار محدد بدون حذفه.
- **إعدادات الاعتماد:** مستويات (إيقاف، شامل، انتقائي)، تحديد المعتمدين لكل مستوى.
- **إدارة المستخدمين:** أدوار (`admin`, `approver`, `staff`, `requester`)، تفعيل/إيقاف الحساب، ربط الأقسام.
- **المخزون:** تحديد الحدود الدنيا/العليا، توليد تنبيهات تلقائية، التكامل مع طلبات التوريد.
- **التقارير المالية:** حساب التوفير مقارنة بالخدمات الخارجية، تجميع حسب القسم أو الخدمة، تصدير Excel/Email.

## 7. Open Questions / Assumptions
- مسار التخزين الأولي للمرفقات محلي (`/media/uploads`) قبل الانتقال إلى BunnyCDN.
- سيتم استخدام JWT مع Refresh/Access Tokens؛ إعداد SSO (Microsoft/جامعة) مؤجل.
- الدعم اللغوي: افتراض توفر واجهة عربية بشكل افتراضي مع إمكانية إضافة الإنجليزية لاحقاً.


