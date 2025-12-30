# User Flows و Routes - دليل شامل

هذا الدليل يوثق جميع User Flows و Routes المتاحة لكل نوع مستخدم في النظام.

## جدول المحتويات

1. [المستهلك (Consumer)](#المستهلك-consumer)
2. [مدير المطبعة (Print Manager)](#مدير-المطبعة-print-manager)
3. [مدير القسم (Department Manager)](#مدير-القسم-department-manager)
4. [موظف القسم (Department Employee)](#موظف-القسم-department-employee)
5. [مشرف التدريب (Training Supervisor)](#مشرف-التدريب-training-supervisor)
6. [مراقب المخزون (Inventory)](#مراقب-المخزون-inventory)

---

## المستهلك (Consumer)

### Routes المتاحة

| Route | Method | الوصف |
|-------|--------|-------|
| `/api/orders/design-orders/` | GET | عرض طلبات التصميم الخاصة بالمستخدم |
| `/api/orders/design-orders/` | POST | إنشاء طلب تصميم جديد |
| `/api/orders/design-orders/{id}/` | GET | تفاصيل طلب تصميم |
| `/api/orders/print-orders/` | GET | عرض طلبات الطباعة الخاصة بالمستخدم |
| `/api/orders/print-orders/` | POST | إنشاء طلب طباعة جديد |
| `/api/orders/print-orders/{id}/` | GET | تفاصيل طلب طباعة |
| `/api/visits/requests/` | GET | عرض طلبات الزيارة الخاصة بالمستخدم |
| `/api/visits/requests/` | POST | إنشاء طلب زيارة جديد |
| `/api/visits/requests/{id}/` | GET | تفاصيل طلب زيارة |
| `/api/training/requests/` | GET | عرض طلبات التدريب الخاصة بالمستخدم |
| `/api/training/requests/` | POST | إنشاء طلب تدريب جديد |
| `/api/notifications/` | GET | عرض الإشعارات |
| `/api/notifications/{id}/read/` | POST | تحديد إشعار كمقروء |

### Use Cases

#### 1. إنشاء طلب تصميم

**Route:** `POST /api/orders/design-orders/`

**الخطوات:**
1. المستخدم يفتح صفحة `/services/design`
2. يملأ النموذج:
   - نوع التصميم (poster, brochure, card, certificate, logo, other)
   - العنوان (مطلوب)
   - الحجم (A0-A6, custom)
   - الوصف (مطلوب)
   - الأولوية (normal, urgent, emergency)
   - المرفقات (اختياري)
3. يضغط "إرسال الطلب"
4. يتم إنشاء الطلب بحالة `PENDING_REVIEW`

**المتوقع:**
- يتم إنشاء الطلب بنجاح
- يتم إرسال إشعار للمستخدم
- يتم إرسال إشعار لمدير المطبعة إذا كان يتطلب اعتماد

**Test Data:**
```json
{
  "design_type": "poster",
  "title": "بوستر مؤتمر الذكاء الاصطناعي",
  "size": "A1",
  "description": "تصميم بوستر لمؤتمر الذكاء الاصطناعي",
  "priority": "normal"
}
```

#### 2. إنشاء طلب طباعة

**Route:** `POST /api/orders/print-orders/`

**الخطوات:**
1. المستخدم يفتح صفحة `/services/printing`
2. يملأ النموذج:
   - نوع الطباعة (books, business_cards, banners, etc.)
   - قسم الإنتاج (offset, digital, gto)
   - الحجم
   - نوع الورق
   - وزن الورق
   - الكمية
   - عدد الأوجه (1 أو 2)
   - عدد الصفحات
   - طريقة التسليم
   - المرفقات (إلزامي للكروت الشخصية)
3. يضغط "إرسال الطلب"
4. يتم إنشاء الطلب بحالة `PENDING_REVIEW`

**المتوقع:**
- يتم إنشاء الطلب بنجاح
- يتم إرسال إشعار للمستخدم
- يتم إرسال إشعار لمدير المطبعة

**Test Data:**
```json
{
  "print_type": "business_cards",
  "production_dept": "digital",
  "size": "A7",
  "paper_type": "coated",
  "paper_weight": "300",
  "quantity": 100,
  "sides": 2,
  "pages": 1,
  "delivery_method": "self_pickup"
}
```

#### 3. تأكيد الطلب (72 ساعة)

**Route:** `POST /api/orders/design-orders/{id}/confirm/` أو `/api/orders/print-orders/{id}/confirm/`

**الخطوات:**
1. المستخدم يتلقى إشعار بطلب بانتظار التأكيد
2. يفتح تفاصيل الطلب
3. يرى التصميم/الطباعة
4. يضغط "تأكيد" أو "طلب تعديل"
5. إذا أكد، يتغير الحالة إلى `COMPLETED`
6. إذا لم يؤكد خلال 72 ساعة، يتغير الحالة إلى `SUSPENDED`

**المتوقع:**
- إذا أكد: الطلب يكتمل
- إذا لم يؤكد: يتم تعليق الطلب تلقائياً بعد 72 ساعة

#### 4. إنشاء طلب زيارة

**Route:** `POST /api/visits/requests/`

**الخطوات:**
1. المستخدم يفتح صفحة `/visits`
2. يضغط "طلب زيارة جديدة"
3. يملأ النموذج:
   - نوع الزيارة (internal, external)
   - الغرض من الزيارة
   - التاريخ المطلوب
   - الوقت المطلوب
   - تصريح (إلزامي للزيارات الخارجية)
4. يضغط "إرسال الطلب"
5. يتم إنشاء الطلب بحالة `PENDING_REVIEW`

**المتوقع:**
- يتم إنشاء الطلب بنجاح
- للزيارات الداخلية: يتم إرسال إشعار لمدير المطبعة
- للزيارات الخارجية: يتم إرسال إشعار لمدير المطبعة والأمن

**Test Data:**
```json
{
  "visit_type": "internal",
  "purpose": "مناقشة متطلبات التصميم",
  "requested_date": "2025-12-25",
  "preferred_time_from": "09:00",
  "preferred_time_to": "11:00"
}
```

#### 5. متابعة الطلبات

**Route:** `GET /api/orders/design-orders/` أو `/api/orders/print-orders/`

**الخطوات:**
1. المستخدم يفتح صفحة `/orders`
2. يرى قائمة بجميع طلباته
3. يمكنه فلترة حسب:
   - الحالة
   - نوع الخدمة
   - التاريخ
4. يضغط على طلب لرؤية التفاصيل

**المتوقع:**
- عرض جميع الطلبات الخاصة بالمستخدم فقط
- إمكانية الفلترة والبحث

---

## مدير المطبعة (Print Manager)

### Routes المتاحة

| Route | Method | الوصف |
|-------|--------|-------|
| `/api/orders/design-orders/` | GET | عرض جميع طلبات التصميم |
| `/api/orders/design-orders/{id}/approve/` | POST | الموافقة على طلب تصميم |
| `/api/orders/design-orders/{id}/reject/` | POST | رفض طلب تصميم |
| `/api/orders/design-orders/{id}/suspend/` | POST | تعليق طلب تصميم |
| `/api/orders/print-orders/` | GET | عرض جميع طلبات الطباعة |
| `/api/orders/print-orders/{id}/approve/` | POST | الموافقة على طلب طباعة |
| `/api/orders/print-orders/{id}/reject/` | POST | رفض طلب طباعة |
| `/api/visits/requests/` | GET | عرض جميع طلبات الزيارة |
| `/api/visits/requests/{id}/approve/` | POST | الموافقة على طلب زيارة |
| `/api/visits/requests/{id}/reject/` | POST | رفض طلب زيارة |
| `/api/entities/entities/` | GET | عرض جميع الجهات |
| `/api/entities/entities/` | POST | إنشاء جهة جديدة |
| `/api/system/settings/` | GET | عرض إعدادات النظام |
| `/api/system/settings/{key}/` | PATCH | تحديث إعداد |
| `/api/system/reports/summary/` | GET | تقرير ملخص |
| `/api/system/reports/productivity/` | GET | تقرير الإنتاجية |
| `/api/inventory/items/` | GET | عرض المخزون |
| `/api/inventory/items/{id}/` | PATCH | تحديث مادة مخزون |

### Use Cases

#### 1. مراجعة طلبات التصميم

**Route:** `GET /api/orders/design-orders/` ثم `POST /api/orders/design-orders/{id}/approve/`

**الخطوات:**
1. مدير المطبعة يفتح لوحة التحكم
2. يرى قائمة بطلبات التصميم بانتظار المراجعة
3. يفتح طلب معين
4. يراجع التفاصيل
5. يختار:
   - **الموافقة:** يتغير الحالة إلى `IN_DESIGN`
   - **الرفض:** يتغير الحالة إلى `REJECTED` مع إضافة ملاحظات
   - **التعليق:** يتغير الحالة إلى `SUSPENDED`

**المتوقع:**
- عند الموافقة: يتم إرسال إشعار للمستخدم ووحدة التصميم
- عند الرفض: يتم إرسال إشعار للمستخدم مع سبب الرفض
- عند التعليق: يتم إرسال إشعار للمستخدم مع سبب التعليق

#### 2. إدارة الجهات

**Route:** `GET /api/entities/entities/` و `POST /api/entities/entities/`

**الخطوات:**
1. مدير المطبعة يفتح صفحة `/admin/entities`
2. يرى الهيكل الهرمي للجهات
3. يمكنه:
   - إضافة جهة جديدة
   - تعديل جهة موجودة
   - ربط مستخدم بجهة

**المتوقع:**
- عرض الهيكل الهرمي بشكل واضح
- إمكانية إضافة/تعديل الجهات

#### 3. عرض التقارير

**Route:** `GET /api/system/reports/summary/`

**الخطوات:**
1. مدير المطبعة يفتح صفحة `/admin/reports`
2. يختار نوع التقرير:
   - ملخص عام
   - الإنتاجية
   - المخزون
   - التوفير (ROI)
3. يختار الفترة الزمنية
4. يضغط "عرض التقرير"

**المتوقع:**
- عرض بيانات واضحة في جداول ورسوم بيانية
- إمكانية التصدير (Excel, PDF)

---

## مدير القسم (Department Manager)

### Routes المتاحة

| Route | Method | الوصف |
|-------|--------|-------|
| `/api/orders/design-orders/` | GET | عرض طلبات التصميم في القسم |
| `/api/orders/design-orders/{id}/suspend/` | POST | تعليق طلب تصميم |
| `/api/orders/print-orders/` | GET | عرض طلبات الطباعة في القسم |
| `/api/orders/print-orders/{id}/suspend/` | POST | تعليق طلب طباعة |
| `/api/system/reports/productivity/` | GET | تقرير إنتاجية القسم |

### Use Cases

#### 1. تعليق الطلبات

**Route:** `POST /api/orders/design-orders/{id}/suspend/` أو `/api/orders/print-orders/{id}/suspend/`

**الخطوات:**
1. مدير القسم يفتح قائمة الطلبات
2. يرى طلب يحتاج تعليق (مشكلة تقنية، نقص مواد، إلخ)
3. يضغط "تعليق"
4. يكتب سبب التعليق
5. يضغط "تأكيد"

**المتوقع:**
- يتغير الحالة إلى `SUSPENDED`
- يتم إرسال إشعار للمستخدم
- يتم إرسال إشعار لمدير المطبعة

#### 2. متابعة الإنتاجية

**Route:** `GET /api/system/reports/productivity/`

**الخطوات:**
1. مدير القسم يفتح صفحة التقارير
2. يختار "تقرير الإنتاجية"
3. يختار القسم والفترة الزمنية
4. يرى:
   - عدد الطلبات المكتملة
   - متوسط وقت الإنجاز
   - الطلبات المتأخرة

**المتوقع:**
- عرض بيانات واضحة
- إمكانية المقارنة بين الفترات

---

## موظف القسم (Department Employee)

### Routes المتاحة

| Route | Method | الوصف |
|-------|--------|-------|
| `/api/orders/design-orders/{id}/set_in_design/` | POST | تعيين طلب للتصميم |
| `/api/orders/design-orders/{id}/complete/` | POST | إكمال طلب تصميم |
| `/api/orders/print-orders/{id}/set_in_production/` | POST | تعيين طلب للإنتاج |
| `/api/orders/print-orders/{id}/update_actual_quantity/` | POST | تحديث الكمية الفعلية |
| `/api/orders/print-orders/{id}/set_in_warehouse/` | POST | نقل الطلب للمستودع |

### Use Cases

#### 1. تحديث حالة الطلب

**Route:** `POST /api/orders/design-orders/{id}/set_in_design/`

**الخطوات:**
1. موظف القسم يفتح قائمة الطلبات المخصصة له
2. يرى طلب بحالة `PENDING_REVIEW` أو `APPROVED`
3. يضغط "بدء العمل"
4. يتغير الحالة إلى `IN_DESIGN` أو `IN_PRODUCTION`

**المتوقع:**
- يتغير الحالة
- يتم إرسال إشعار للمستخدم

#### 2. إدخال الكمية الفعلية

**Route:** `POST /api/orders/print-orders/{id}/update_actual_quantity/`

**الخطوات:**
1. موظف القسم يكمل طلب طباعة
2. يفتح تفاصيل الطلب
3. يضغط "تحديث الكمية الفعلية"
4. يدخل الكمية الفعلية المنفذة
5. يضغط "حفظ"

**المتوقع:**
- يتم تحديث `actual_quantity`
- يتم خصم المخزون تلقائياً
- يتغير الحالة إلى `PENDING_CONFIRM`

**Test Data:**
```json
{
  "actual_quantity": 95
}
```

---

## مشرف التدريب (Training Supervisor)

### Routes المتاحة

| Route | Method | الوصف |
|-------|--------|-------|
| `/api/training/requests/` | GET | عرض طلبات التدريب |
| `/api/training/requests/{id}/approve/` | POST | الموافقة على طلب تدريب |
| `/api/training/requests/{id}/reject/` | POST | رفض طلب تدريب |
| `/api/training/evaluations/` | POST | إنشاء تقييم |

### Use Cases

#### 1. قبول/رفض طلبات التدريب

**Route:** `POST /api/training/requests/{id}/approve/`

**الخطوات:**
1. مشرف التدريب يفتح قائمة طلبات التدريب
2. يرى طلب بحالة `PENDING_REVIEW`
3. يراجع:
   - بيانات المتدرب
   - خطاب الجامعة
   - فترة التدريب
4. يختار:
   - **الموافقة:** يتغير الحالة إلى `APPROVED` ويتم تعيينه كمشرف
   - **الرفض:** يتغير الحالة إلى `REJECTED` مع إضافة ملاحظات

**المتوقع:**
- عند الموافقة: يتم إرسال إشعار للمتدرب
- عند الرفض: يتم إرسال إشعار للمتدرب مع سبب الرفض

#### 2. التقييم الأسبوعي

**Route:** `POST /api/training/evaluations/`

**الخطوات:**
1. مشرف التدريب يفتح قائمة المتدربين
2. يختار متدرب في حالة `IN_PROGRESS`
3. يضغط "إضافة تقييم أسبوعي"
4. يملأ:
   - رقم الأسبوع
   - التقييم العام (0-100)
   - الملاحظات
5. يضغط "حفظ"

**المتوقع:**
- يتم حفظ التقييم
- يمكن للمتدرب رؤية التقييم

**Test Data:**
```json
{
  "training_request": "uuid",
  "week_number": 1,
  "overall_score": 85,
  "comments": "أداء جيد، يحتاج تحسين في..."
}
```

---

## مراقب المخزون (Inventory)

### Routes المتاحة

| Route | Method | الوصف |
|-------|--------|-------|
| `/api/inventory/items/` | GET | عرض جميع مواد المخزون |
| `/api/inventory/items/` | POST | إضافة مادة جديدة |
| `/api/inventory/items/{id}/` | PATCH | تحديث مادة |
| `/api/inventory/logs/` | GET | عرض سجل المخزون |
| `/api/inventory/logs/` | POST | إضافة سجل |

### Use Cases

#### 1. إدارة المخزون

**Route:** `GET /api/inventory/items/` و `PATCH /api/inventory/items/{id}/`

**الخطوات:**
1. مراقب المخزون يفتح صفحة `/admin/inventory`
2. يرى قائمة بجميع المواد
3. يمكنه:
   - إضافة مادة جديدة
   - تحديث الكمية الحالية
   - تحديث الحد الأدنى للتنبيه
   - إضافة سجل (إدخال/إخراج)

**المتوقع:**
- عرض المواد مع حالة المخزون (OK, Warning, Critical)
- إمكانية الفلترة حسب الحالة

#### 2. إضافة سجل مخزون

**Route:** `POST /api/inventory/logs/`

**الخطوات:**
1. مراقب المخزون يفتح مادة معينة
2. يضغط "إضافة سجل"
3. يختار العملية (IN, OUT)
4. يدخل الكمية
5. يضغط "حفظ"

**المتوقع:**
- يتم تحديث الكمية الحالية تلقائياً
- يتم حفظ السجل

**Test Data:**
```json
{
  "item": "uuid",
  "operation": "IN",
  "quantity": 100,
  "note": "تزويد جديد"
}
```

---

## ملاحظات عامة

### Authentication

جميع الـ APIs تتطلب JWT Token:
```
Authorization: Bearer <access_token>
```

### Error Handling

جميع الـ APIs ترجع أخطاء بصيغة:
```json
{
  "detail": "رسالة الخطأ"
}
```

### Pagination

جميع قوائم الـ APIs تستخدم pagination:
```json
{
  "count": 100,
  "next": "http://api/endpoint/?page=2",
  "previous": null,
  "results": [...]
}
```

---

## Flow Diagrams

### Flow: إنشاء طلب تصميم

```
Consumer → POST /api/orders/design-orders/
         → Order Created (PENDING_REVIEW)
         → Notification to Print Manager
         → Print Manager Reviews
         → Approve/Reject/Suspend
         → Notification to Consumer
         → If Approved: Status → IN_DESIGN
         → Department Employee Works
         → Status → PENDING_CONFIRM
         → Consumer Confirms (72 hours)
         → Status → COMPLETED
```

### Flow: إنشاء طلب طباعة

```
Consumer → POST /api/orders/print-orders/
         → Order Created (PENDING_REVIEW)
         → Notification to Print Manager
         → Print Manager Reviews
         → Approve/Reject/Suspend
         → If Approved: Status → IN_PRODUCTION
         → Department Employee Works
         → Update Actual Quantity
         → Auto Deduct Inventory
         → Status → PENDING_CONFIRM
         → Consumer Confirms (72 hours)
         → Status → IN_WAREHOUSE
         → Schedule Delivery
         → Status → DELIVERY_SCHEDULED
         → Archive
```

---

## Test Credentials

للاستخدام في الاختبار:

| الدور | Email | Password |
|-------|-------|----------|
| Consumer | consumer@taibahu.edu.sa | PrintCenter@2025 |
| Print Manager | print.manager@taibahu.edu.sa | PrintCenter@2025 |
| Department Manager | dept.manager@taibahu.edu.sa | PrintCenter@2025 |
| Department Employee | dept.employee@taibahu.edu.sa | PrintCenter@2025 |
| Training Supervisor | training.supervisor@taibahu.edu.sa | PrintCenter@2025 |
| Inventory | inventory@taibahu.edu.sa | PrintCenter@2025 |

