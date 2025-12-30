# Quick Start Guide - دليل البدء السريع

دليل سريع لتشغيل النظام واختباره بالكامل.

## المتطلبات الأساسية

- Python 3.11+
- Node.js 18+
- PostgreSQL 15 (أو SQLite للتطوير)
- Redis (لـ Celery - اختياري)

## الخطوة 1: إعداد البيئة

### Backend

```bash
# الانتقال لمجلد المشروع
cd server

# إنشاء virtual environment
python -m venv venv

# تفعيل virtual environment
# Windows:
venv\Scripts\activate
# Linux/Mac:
source venv/bin/activate

# تثبيت المتطلبات
pip install -r requirements.txt
```

### Frontend

```bash
# الانتقال لمجلد Frontend
cd client

# تثبيت المتطلبات
npm install
```

## الخطوة 2: إعداد قاعدة البيانات

### Backend

```bash
# إنشاء ملف .env (إذا لم يكن موجوداً)
cp .env.example .env

# تعديل إعدادات قاعدة البيانات في .env
# للـ SQLite (التطوير):
DATABASE_URL=sqlite:///db.sqlite3

# للـ PostgreSQL (الإنتاج):
DATABASE_URL=postgresql://user:password@localhost:5432/printcenter

# تشغيل Migrations
python manage.py migrate

# إنشاء superuser (اختياري)
python manage.py createsuperuser
```

## الخطوة 3: إنشاء البيانات التجريبية

### الطريقة 1: استخدام Seed Demo (أسرع)

```bash
cd server
python manage.py seed_demo
```

هذا الأمر سينشئ:
- 6 مستخدمين بجميع الأدوار
- 10 خدمات
- 4 طلبات
- 3 مواد مخزون
- إشعارات

### الطريقة 2: استخدام Seed via API (أكثر واقعية)

```bash
cd server
python manage.py seed_via_api
```

هذا الأمر سينشئ:
- 10 مستخدمين
- 9 جهات
- 20 طلب تصميم
- 30 طلب طباعة
- 15 طلب زيارة
- 10 طلب تدريب
- 15 مادة مخزون
- 50+ إشعار

**ملاحظة:** يمكن استخدام `--use-api` لاستخدام APIs فعلي (يتطلب server running)

## الخطوة 4: تشغيل الخوادم

### Backend

```bash
cd server
python manage.py runserver
```

الخادم سيعمل على: `http://localhost:8000`

### Frontend

```bash
cd client
npm run dev
```

الواجهة ستعمل على: `http://localhost:3000`

### Celery (اختياري - للإشعارات المبرمجة)

```bash
# Terminal 1: Celery Worker
cd server
celery -A project worker -l INFO

# Terminal 2: Celery Beat (للمهام المبرمجة)
cd server
celery -A project beat -l INFO
```

## الخطوة 5: تسجيل الدخول

### بيانات المستخدمين التجريبيين

بعد تشغيل `seed_demo` أو `seed_via_api`:

| الدور | Email | Password |
|-------|-------|----------|
| Consumer | `consumer@taibahu.edu.sa` | `PrintCenter@2025` |
| Print Manager | `print.manager@taibahu.edu.sa` | `PrintCenter@2025` |
| Department Manager | `dept.manager@taibahu.edu.sa` | `PrintCenter@2025` |
| Department Employee | `dept.employee@taibahu.edu.sa` | `PrintCenter@2025` |
| Training Supervisor | `training.supervisor@taibahu.edu.sa` | `PrintCenter@2025` |
| Inventory | `inventory@taibahu.edu.sa` | `PrintCenter@2025` |

### تسجيل الدخول عبر الواجهة

1. افتح `http://localhost:3000`
2. اضغط "تسجيل الدخول"
3. أدخل email وكلمة المرور
4. اضغط "دخول"

### الحصول على JWT Token (للاستخدام مع APIs)

```bash
# استخدام curl
curl -X POST http://localhost:8000/api/auth/token/ \
  -H "Content-Type: application/json" \
  -d '{"email": "consumer@taibahu.edu.sa", "password": "PrintCenter@2025"}'

# أو استخدام Python
python -c "
import requests
response = requests.post('http://localhost:8000/api/auth/token/', json={
    'email': 'consumer@taibahu.edu.sa',
    'password': 'PrintCenter@2025'
})
print(response.json())
"
```

## الخطوة 6: اختبار Use Cases

### Use Case 1: إنشاء طلب تصميم (Consumer)

1. سجل الدخول كـ Consumer
2. اذهب إلى `/services/design`
3. املأ النموذج:
   - نوع التصميم: بوستر
   - العنوان: بوستر مؤتمر
   - الحجم: A1
   - الوصف: تصميم بوستر احترافي
   - الأولوية: عادي
4. اضغط "إرسال الطلب"
5. تحقق من إنشاء الطلب بنجاح

### Use Case 2: الموافقة على طلب (Print Manager)

1. سجل الدخول كـ Print Manager
2. اذهب إلى `/orders`
3. ابحث عن طلب بحالة "بانتظار المراجعة"
4. افتح الطلب
5. اضغط "موافقة"
6. تحقق من تغيير الحالة إلى "قيد التصميم"

### Use Case 3: إدخال الكمية الفعلية (Department Employee)

1. سجل الدخول كـ Department Employee
2. اذهب إلى `/orders`
3. ابحث عن طلب طباعة بحالة "قيد الإنتاج"
4. افتح الطلب
5. اضغط "تحديث الكمية الفعلية"
6. أدخل الكمية: 95
7. اضغط "حفظ"
8. تحقق من:
   - تحديث الكمية
   - خصم المخزون تلقائياً
   - تغيير الحالة إلى "بانتظار التأكيد"

### Use Case 4: تأكيد الطلب (Consumer)

1. سجل الدخول كـ Consumer
2. اذهب إلى `/orders`
3. ابحث عن طلب بحالة "بانتظار التأكيد"
4. افتح الطلب
5. راجع التصميم/الطباعة
6. اضغط "تأكيد"
7. تحقق من تغيير الحالة إلى "مكتمل"

### Use Case 5: إنشاء طلب زيارة (Consumer)

1. سجل الدخول كـ Consumer
2. اذهب إلى `/visits`
3. اضغط "طلب زيارة جديدة"
4. املأ النموذج:
   - نوع الزيارة: داخلية
   - الغرض: مناقشة متطلبات التصميم
   - التاريخ: اختر تاريخ
   - الوقت: 09:00 - 11:00
5. اضغط "إرسال الطلب"
6. تحقق من إنشاء الطلب

## الخطوة 7: اختبار APIs مباشرة

### استخدام Postman أو Insomnia

1. استورد Collection من `docs/api_collection.json` (إن وجد)
2. أو أنشئ requests يدوياً:

**Get Token:**
```
POST http://localhost:8000/api/auth/token/
Body (JSON):
{
  "email": "consumer@taibahu.edu.sa",
  "password": "PrintCenter@2025"
}
```

**Create Design Order:**
```
POST http://localhost:8000/api/orders/design-orders/
Headers:
  Authorization: Bearer <token>
Body (JSON):
{
  "design_type": "poster",
  "title": "بوستر مؤتمر",
  "size": "A1",
  "description": "تصميم بوستر احترافي",
  "priority": "normal"
}
```

**Get Orders:**
```
GET http://localhost:8000/api/orders/design-orders/
Headers:
  Authorization: Bearer <token>
```

### استخدام curl

```bash
# Get Token
TOKEN=$(curl -X POST http://localhost:8000/api/auth/token/ \
  -H "Content-Type: application/json" \
  -d '{"email": "consumer@taibahu.edu.sa", "password": "PrintCenter@2025"}' \
  | jq -r '.access')

# Create Design Order
curl -X POST http://localhost:8000/api/orders/design-orders/ \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "design_type": "poster",
    "title": "بوستر مؤتمر",
    "size": "A1",
    "description": "تصميم بوستر احترافي",
    "priority": "normal"
  }'

# Get Orders
curl -X GET http://localhost:8000/api/orders/design-orders/ \
  -H "Authorization: Bearer $TOKEN"
```

## الخطوة 8: اختبار سيناريوهات متقدمة

راجع `docs/TEST_SCENARIOS.md` لسيناريوهات اختبار كاملة.

### مثال: سير العمل الكامل

1. **Consumer:** إنشاء طلب تصميم
2. **Print Manager:** الموافقة على الطلب
3. **Department Employee:** تعيين الطلب للتصميم
4. **Department Employee:** إكمال التصميم
5. **Consumer:** تأكيد الطلب

## الخطوة 9: فحص التقارير

1. سجل الدخول كـ Print Manager
2. اذهب إلى `/admin/reports`
3. اختر نوع التقرير:
   - ملخص عام
   - الإنتاجية
   - المخزون
   - التوفير
4. اختر الفترة الزمنية
5. اضغط "عرض التقرير"

## الخطوة 10: فحص الإشعارات

1. سجل الدخول بأي مستخدم
2. اذهب إلى `/notifications`
3. تحقق من:
   - الإشعارات الجديدة
   - الإشعارات المقروءة
   - أنواع الإشعارات المختلفة

## استكشاف الأخطاء

### المشكلة: لا يمكن تسجيل الدخول

**الحل:**
1. تحقق من تشغيل Backend: `http://localhost:8000/api/auth/token/`
2. تحقق من بيانات المستخدم: `python manage.py shell`
   ```python
   from accounts.models import User
   user = User.objects.get(email="consumer@taibahu.edu.sa")
   user.check_password("PrintCenter@2025")
   ```
3. أعد تشغيل `seed_demo` أو `seed_via_api`

### المشكلة: لا تظهر الطلبات

**الحل:**
1. تحقق من إنشاء الطلبات: `python manage.py shell`
   ```python
   from orders.models import DesignOrder, PrintOrder
   print(DesignOrder.objects.count())
   print(PrintOrder.objects.count())
   ```
2. تحقق من ربط المستخدم بالجهة
3. تحقق من JWT token

### المشكلة: Celery لا يعمل

**الحل:**
1. تحقق من تشغيل Redis: `redis-cli ping`
2. تحقق من تشغيل Celery Worker
3. تحقق من logs: `celery -A project worker -l INFO`

### المشكلة: APIs ترجع 401 Unauthorized

**الحل:**
1. تحقق من JWT token (قد يكون منتهي الصلاحية)
2. احصل على token جديد
3. تحقق من header: `Authorization: Bearer <token>`

### المشكلة: لا يتم خصم المخزون

**الحل:**
1. تحقق من ربط `InventoryLog` بـ `PrintOrder`
2. تحقق من signals: `python manage.py shell`
   ```python
   from inventory.signals import *
   ```
3. تحقق من `actual_quantity` في الطلب

## نصائح إضافية

1. **استخدم Django Admin:** `http://localhost:8000/admin/` لفحص البيانات مباشرة
2. **استخدم API Docs:** `http://localhost:8000/api/docs/` لاستكشاف APIs
3. **راقب Logs:** راقب console logs في Backend و Frontend
4. **استخدم Browser DevTools:** لفحص Network requests و responses

## الخطوات التالية

1. راجع `docs/USER_FLOWS_AND_ROUTES.md` لفهم جميع User Flows
2. راجع `docs/TEST_SCENARIOS.md` لسيناريوهات اختبار كاملة
3. راجع `docs/IMPLEMENTATION_SUMMARY.md` لفهم البنية الكاملة

## الدعم

- **Backend Issues:** راجع `server/README.md`
- **Frontend Issues:** راجع `client/README.md`
- **API Documentation:** `http://localhost:8000/api/docs/`

---

**ملاحظة:** جميع البيانات التجريبية تستخدم كلمة المرور: `PrintCenter@2025`

