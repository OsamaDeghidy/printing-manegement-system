# Test Scenarios - سيناريوهات الاختبار

هذا الدليل يحتوي على سيناريوهات اختبار كاملة لكل use case في النظام.

## جدول المحتويات

1. [Consumer Scenarios](#consumer-scenarios)
2. [Print Manager Scenarios](#print-manager-scenarios)
3. [Department Manager Scenarios](#department-manager-scenarios)
4. [Department Employee Scenarios](#department-employee-scenarios)
5. [Training Supervisor Scenarios](#training-supervisor-scenarios)
6. [Inventory Scenarios](#inventory-scenarios)

---

## Consumer Scenarios

### Scenario 1: إنشاء طلب تصميم جديد

**User Role:** Consumer  
**Route:** `POST /api/orders/design-orders/`  
**Prerequisites:** 
- User logged in
- JWT token valid

**Steps:**
1. Login as consumer: `consumer@taibahu.edu.sa` / `PrintCenter@2025`
2. Get JWT token from `/api/auth/token/`
3. Call `POST /api/orders/design-orders/` with:
```json
{
  "design_type": "poster",
  "title": "بوستر مؤتمر الذكاء الاصطناعي",
  "size": "A1",
  "description": "تصميم بوستر احترافي لمؤتمر الذكاء الاصطناعي",
  "priority": "normal"
}
```
4. Verify response status is 201
5. Verify order is created with status `PENDING_REVIEW`
6. Check notification is sent to print manager

**Expected Result:**
- Order created successfully
- Order code generated (format: DES-YYYY-XXXX)
- Status is `PENDING_REVIEW`
- Notification sent to print manager
- Response includes order details

**Test Data:**
```json
{
  "design_type": "poster",
  "title": "بوستر مؤتمر الذكاء الاصطناعي",
  "size": "A1",
  "description": "تصميم بوستر احترافي",
  "priority": "normal"
}
```

---

### Scenario 2: إنشاء طلب طباعة (كروت شخصية)

**User Role:** Consumer  
**Route:** `POST /api/orders/print-orders/`  
**Prerequisites:**
- User logged in
- File attachment required for business cards

**Steps:**
1. Login as consumer
2. Get JWT token
3. Prepare file attachment (PDF or image)
4. Call `POST /api/orders/print-orders/` with FormData:
   - `print_type`: "business_cards"
   - `production_dept`: "digital"
   - `size`: "A7"
   - `paper_type`: "coated"
   - `paper_weight`: "300"
   - `quantity`: 100
   - `sides`: 2
   - `pages`: 1
   - `delivery_method`: "self_pickup"
   - `attachments`: [file]
5. Verify response status is 201
6. Verify order is created

**Expected Result:**
- Order created successfully
- File attachment saved
- Status is `PENDING_REVIEW`
- Notification sent

**Test Data:**
- File: `business_card_design.pdf`
- All required fields filled

---

### Scenario 3: تأكيد طلب تصميم (72 ساعة)

**User Role:** Consumer  
**Route:** `POST /api/orders/design-orders/{id}/confirm/`  
**Prerequisites:**
- Order exists with status `PENDING_CONFIRM`
- Order has `confirmation_deadline` set

**Steps:**
1. Login as consumer
2. Get JWT token
3. Get order list: `GET /api/orders/design-orders/`
4. Find order with status `PENDING_CONFIRM`
5. Call `POST /api/orders/design-orders/{id}/confirm/`
6. Verify response status is 200
7. Verify order status changed to `COMPLETED`

**Expected Result:**
- Order status changed to `COMPLETED`
- Notification sent to requester
- Order archived

**Test Data:**
- Order ID from previous scenario

---

### Scenario 4: إنشاء طلب زيارة داخلية

**User Role:** Consumer  
**Route:** `POST /api/visits/requests/`  
**Prerequisites:**
- User logged in
- Entity assigned to user

**Steps:**
1. Login as consumer
2. Get JWT token
3. Call `POST /api/visits/requests/` with:
```json
{
  "visit_type": "internal",
  "purpose": "مناقشة متطلبات التصميم",
  "requested_date": "2025-12-25",
  "preferred_time_from": "09:00",
  "preferred_time_to": "11:00"
}
```
4. Verify response status is 201
5. Verify visit request created with status `PENDING_REVIEW`

**Expected Result:**
- Visit request created
- Status is `PENDING_REVIEW`
- Notification sent to print manager
- No permit file required (internal visit)

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

---

### Scenario 5: إنشاء طلب زيارة خارجية (مع تصريح)

**User Role:** Consumer  
**Route:** `POST /api/visits/requests/`  
**Prerequisites:**
- User logged in
- Permit file required

**Steps:**
1. Login as consumer
2. Get JWT token
3. Prepare permit file (PDF)
4. Call `POST /api/visits/requests/` with FormData:
   - `visit_type`: "external"
   - `purpose`: "زيارة من شركة خارجية"
   - `requested_date`: "2025-12-25"
   - `preferred_time_from`: "09:00"
   - `preferred_time_to`: "11:00"
   - `permit_file`: [file]
5. Verify response status is 201
6. Verify permit file is saved

**Expected Result:**
- Visit request created
- Permit file saved
- Status is `PENDING_REVIEW`
- Requires both manager and security approval

**Test Data:**
- File: `permit.pdf`
- All required fields filled

---

## Print Manager Scenarios

### Scenario 6: الموافقة على طلب تصميم

**User Role:** Print Manager  
**Route:** `POST /api/orders/design-orders/{id}/approve/`  
**Prerequisites:**
- Order exists with status `PENDING_REVIEW`
- User is print manager

**Steps:**
1. Login as print manager: `print.manager@taibahu.edu.sa` / `PrintCenter@2025`
2. Get JWT token
3. Get pending orders: `GET /api/orders/design-orders/?status=PENDING_REVIEW`
4. Select an order
5. Call `POST /api/orders/design-orders/{id}/approve/` with:
```json
{
  "notes": "تمت الموافقة، يمكن البدء بالتصميم"
}
```
6. Verify response status is 200
7. Verify order status changed to `IN_DESIGN`

**Expected Result:**
- Order status changed to `IN_DESIGN`
- Notification sent to consumer
- Notification sent to department employee
- Notes saved

**Test Data:**
- Order ID from Scenario 1
- Notes: "تمت الموافقة"

---

### Scenario 7: رفض طلب تصميم

**User Role:** Print Manager  
**Route:** `POST /api/orders/design-orders/{id}/reject/`  
**Prerequisites:**
- Order exists with status `PENDING_REVIEW`

**Steps:**
1. Login as print manager
2. Get JWT token
3. Get pending orders
4. Select an order
5. Call `POST /api/orders/design-orders/{id}/reject/` with:
```json
{
  "notes": "الطلب لا يتوافق مع الهوية البصرية"
}
```
6. Verify response status is 200
7. Verify order status changed to `REJECTED`

**Expected Result:**
- Order status changed to `REJECTED`
- Notification sent to consumer with rejection reason
- Order cannot be modified

**Test Data:**
- Order ID
- Notes: "سبب الرفض"

---

### Scenario 8: تعليق طلب طباعة

**User Role:** Print Manager  
**Route:** `POST /api/orders/print-orders/{id}/suspend/`  
**Prerequisites:**
- Order exists with status `IN_PRODUCTION`

**Steps:**
1. Login as print manager
2. Get JWT token
3. Get orders in production
4. Select an order
5. Call `POST /api/orders/print-orders/{id}/suspend/` with:
```json
{
  "notes": "نقص في المواد الخام"
}
```
6. Verify response status is 200
7. Verify order status changed to `SUSPENDED`

**Expected Result:**
- Order status changed to `SUSPENDED`
- Notification sent to consumer
- Order can be resumed later

**Test Data:**
- Order ID
- Notes: "سبب التعليق"

---

### Scenario 9: الموافقة على طلب زيارة

**User Role:** Print Manager  
**Route:** `POST /api/visits/requests/{id}/approve/`  
**Prerequisites:**
- Visit request exists with status `PENDING_REVIEW`

**Steps:**
1. Login as print manager
2. Get JWT token
3. Get pending visit requests
4. Select a visit request
5. Call `POST /api/visits/requests/{id}/approve/`
6. Verify response status is 200
7. Verify visit request status changed to `APPROVED`
8. Verify booking is created (if internal visit)

**Expected Result:**
- Visit request status changed to `APPROVED`
- Booking created for internal visits
- For external visits: still needs security approval
- Notification sent to requester

**Test Data:**
- Visit request ID from Scenario 4

---

### Scenario 10: عرض تقرير ملخص

**User Role:** Print Manager  
**Route:** `GET /api/system/reports/summary/`  
**Prerequisites:**
- User is print manager
- Some orders exist in system

**Steps:**
1. Login as print manager
2. Get JWT token
3. Call `GET /api/system/reports/summary/`
4. Verify response status is 200
5. Verify response includes:
   - Total orders
   - Completed orders
   - Pending orders
   - Rejected orders

**Expected Result:**
- Response includes all summary statistics
- Data is accurate
- Can filter by date range

**Test Data:**
- Optional query params: `?start_date=2025-01-01&end_date=2025-12-31`

---

## Department Manager Scenarios

### Scenario 11: تعليق طلب في القسم

**User Role:** Department Manager  
**Route:** `POST /api/orders/design-orders/{id}/suspend/`  
**Prerequisites:**
- Order exists with status `IN_DESIGN`
- User is department manager

**Steps:**
1. Login as department manager: `dept.manager@taibahu.edu.sa` / `PrintCenter@2025`
2. Get JWT token
3. Get orders in design
4. Select an order
5. Call `POST /api/orders/design-orders/{id}/suspend/` with:
```json
{
  "notes": "مشكلة تقنية في البرنامج"
}
```
6. Verify response status is 200
7. Verify order status changed to `SUSPENDED`

**Expected Result:**
- Order status changed to `SUSPENDED`
- Notification sent to consumer
- Notification sent to print manager
- Notes saved

**Test Data:**
- Order ID
- Notes: "سبب التعليق"

---

### Scenario 12: عرض تقرير إنتاجية القسم

**User Role:** Department Manager  
**Route:** `GET /api/system/reports/productivity/`  
**Prerequisites:**
- User is department manager

**Steps:**
1. Login as department manager
2. Get JWT token
3. Call `GET /api/system/reports/productivity/?entity={entity_id}`
4. Verify response status is 200
5. Verify response includes productivity metrics

**Expected Result:**
- Response includes productivity data for the department
- Data is accurate
- Can filter by date range

**Test Data:**
- Entity ID (optional)

---

## Department Employee Scenarios

### Scenario 13: تعيين طلب للتصميم

**User Role:** Department Employee  
**Route:** `POST /api/orders/design-orders/{id}/set_in_design/`  
**Prerequisites:**
- Order exists with status `APPROVED`
- User is department employee

**Steps:**
1. Login as department employee: `dept.employee@taibahu.edu.sa` / `PrintCenter@2025`
2. Get JWT token
3. Get approved orders
4. Select an order
5. Call `POST /api/orders/design-orders/{id}/set_in_design/`
6. Verify response status is 200
7. Verify order status changed to `IN_DESIGN`

**Expected Result:**
- Order status changed to `IN_DESIGN`
- Notification sent to consumer
- Order assigned to employee

**Test Data:**
- Order ID from Scenario 6

---

### Scenario 14: إدخال الكمية الفعلية

**User Role:** Department Employee  
**Route:** `POST /api/orders/print-orders/{id}/update_actual_quantity/`  
**Prerequisites:**
- Order exists with status `IN_PRODUCTION`
- User is department employee

**Steps:**
1. Login as department employee
2. Get JWT token
3. Get orders in production
4. Select an order
5. Call `POST /api/orders/print-orders/{id}/update_actual_quantity/` with:
```json
{
  "actual_quantity": 95
}
```
6. Verify response status is 200
7. Verify `actual_quantity` is updated
8. Verify inventory is deducted automatically
9. Verify order status changed to `PENDING_CONFIRM`

**Expected Result:**
- `actual_quantity` updated
- Inventory deducted automatically
- Order status changed to `PENDING_CONFIRM`
- `confirmation_deadline` set (72 hours from now)
- Notification sent to consumer

**Test Data:**
```json
{
  "actual_quantity": 95
}
```

---

### Scenario 15: نقل الطلب للمستودع

**User Role:** Department Employee  
**Route:** `POST /api/orders/print-orders/{id}/set_in_warehouse/`  
**Prerequisites:**
- Order exists with status `PENDING_CONFIRM` and consumer confirmed

**Steps:**
1. Login as department employee
2. Get JWT token
3. Get confirmed orders
4. Select an order
5. Call `POST /api/orders/print-orders/{id}/set_in_warehouse/`
6. Verify response status is 200
7. Verify order status changed to `IN_WAREHOUSE`

**Expected Result:**
- Order status changed to `IN_WAREHOUSE`
- Notification sent to consumer (ready for pickup)
- Order ready for delivery scheduling

**Test Data:**
- Order ID

---

## Training Supervisor Scenarios

### Scenario 16: الموافقة على طلب تدريب

**User Role:** Training Supervisor  
**Route:** `POST /api/training/requests/{id}/approve/`  
**Prerequisites:**
- Training request exists with status `PENDING_REVIEW`
- User is training supervisor

**Steps:**
1. Login as training supervisor: `training.supervisor@taibahu.edu.sa` / `PrintCenter@2025`
2. Get JWT token
3. Get pending training requests
4. Select a request
5. Call `POST /api/training/requests/{id}/approve/` with:
```json
{
  "notes": "تمت الموافقة، يمكن بدء التدريب"
}
```
6. Verify response status is 200
7. Verify request status changed to `APPROVED`
8. Verify supervisor is assigned

**Expected Result:**
- Request status changed to `APPROVED`
- Supervisor assigned
- Notification sent to student
- Training period can start

**Test Data:**
- Training request ID
- Notes: "تمت الموافقة"

---

### Scenario 17: إضافة تقييم أسبوعي

**User Role:** Training Supervisor  
**Route:** `POST /api/training/evaluations/`  
**Prerequisites:**
- Training request exists with status `IN_PROGRESS`
- User is assigned supervisor

**Steps:**
1. Login as training supervisor
2. Get JWT token
3. Get training requests in progress
4. Select a request
5. Call `POST /api/training/evaluations/` with:
```json
{
  "training_request": "uuid",
  "week_number": 1,
  "overall_score": 85,
  "comments": "أداء جيد، يحتاج تحسين في..."
}
```
6. Verify response status is 201
7. Verify evaluation is created

**Expected Result:**
- Evaluation created
- Week number unique per training request
- Score saved (0-100)
- Comments saved

**Test Data:**
```json
{
  "training_request": "uuid",
  "week_number": 1,
  "overall_score": 85,
  "comments": "أداء جيد"
}
```

---

## Inventory Scenarios

### Scenario 18: إضافة مادة مخزون جديدة

**User Role:** Inventory  
**Route:** `POST /api/inventory/items/`  
**Prerequisites:**
- User is inventory manager

**Steps:**
1. Login as inventory: `inventory@taibahu.edu.sa` / `PrintCenter@2025`
2. Get JWT token
3. Call `POST /api/inventory/items/` with:
```json
{
  "name": "ورق A4 أبيض 80g",
  "sku": "PAPER-A4-80",
  "category": "paper",
  "unit": "رزمة",
  "current_quantity": 5000,
  "minimum_threshold": 1000,
  "min_quantity": 1500,
  "maximum_threshold": 10000
}
```
4. Verify response status is 201
5. Verify item is created

**Expected Result:**
- Item created successfully
- SKU is unique
- All fields saved correctly

**Test Data:**
```json
{
  "name": "ورق A4 أبيض 80g",
  "sku": "PAPER-A4-80",
  "category": "paper",
  "unit": "رزمة",
  "current_quantity": 5000,
  "minimum_threshold": 1000,
  "min_quantity": 1500,
  "maximum_threshold": 10000
}
```

---

### Scenario 19: إضافة سجل مخزون (إدخال)

**User Role:** Inventory  
**Route:** `POST /api/inventory/logs/`  
**Prerequisites:**
- Inventory item exists

**Steps:**
1. Login as inventory
2. Get JWT token
3. Get inventory items
4. Select an item
5. Call `POST /api/inventory/logs/` with:
```json
{
  "item": "uuid",
  "operation": "IN",
  "quantity": 100,
  "note": "تزويد جديد"
}
```
6. Verify response status is 201
7. Verify log is created
8. Verify item quantity is updated

**Expected Result:**
- Log created
- Item `current_quantity` increased by 100
- `last_restocked_at` updated

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

### Scenario 20: تنبيه انخفاض المخزون

**User Role:** System (Automatic)  
**Route:** Celery Task  
**Prerequisites:**
- Inventory item with `current_quantity <= min_quantity`

**Steps:**
1. Create inventory item with low quantity
2. Wait for Celery task to run (or trigger manually)
3. Verify notification is sent to print managers

**Expected Result:**
- Notification sent to all print managers
- Notification includes list of low stock items
- Notification type is `INVENTORY_LOW`

**Test Data:**
- Item with `current_quantity = 500` and `min_quantity = 1000`

---

## Integration Test Scenarios

### Scenario 21: سير العمل الكامل لطلب تصميم

**User Roles:** Consumer → Print Manager → Department Employee → Consumer

**Steps:**
1. **Consumer:** Create design order (Scenario 1)
2. **Print Manager:** Approve order (Scenario 6)
3. **Department Employee:** Set order in design (Scenario 13)
4. **Department Employee:** Complete design
5. **Consumer:** Confirm order (Scenario 3)

**Expected Result:**
- Complete workflow executed successfully
- All status transitions correct
- All notifications sent
- Order completed

---

### Scenario 22: سير العمل الكامل لطلب طباعة

**User Roles:** Consumer → Print Manager → Department Employee → Consumer

**Steps:**
1. **Consumer:** Create print order (Scenario 2)
2. **Print Manager:** Approve order
3. **Department Employee:** Set order in production
4. **Department Employee:** Update actual quantity (Scenario 14)
5. **Consumer:** Confirm order
6. **Department Employee:** Set order in warehouse (Scenario 15)
7. **Consumer:** Schedule delivery

**Expected Result:**
- Complete workflow executed
- Inventory deducted automatically
- All status transitions correct
- Order ready for delivery

---

## Performance Test Scenarios

### Scenario 23: تحميل قائمة كبيرة من الطلبات

**User Role:** Any  
**Route:** `GET /api/orders/design-orders/`  
**Prerequisites:**
- 1000+ orders exist

**Steps:**
1. Login
2. Get JWT token
3. Call `GET /api/orders/design-orders/`
4. Measure response time
5. Verify pagination works

**Expected Result:**
- Response time < 2 seconds
- Pagination returns 25 items per page
- Can navigate through pages

---

## Security Test Scenarios

### Scenario 24: محاولة الوصول لطلب مستخدم آخر

**User Role:** Consumer  
**Route:** `GET /api/orders/design-orders/{id}/`  
**Prerequisites:**
- Order exists for different user

**Steps:**
1. Login as consumer1
2. Get JWT token
3. Try to access order of consumer2
4. Verify access is denied

**Expected Result:**
- Response status is 403 or 404
- Error message indicates unauthorized access

---

### Scenario 25: محاولة تنفيذ إجراء بدون صلاحية

**User Role:** Consumer  
**Route:** `POST /api/orders/design-orders/{id}/approve/`  
**Prerequisites:**
- Order exists
- User is not print manager

**Steps:**
1. Login as consumer
2. Get JWT token
3. Try to approve order
4. Verify access is denied

**Expected Result:**
- Response status is 403
- Error message indicates insufficient permissions

---

## Notes

- جميع السيناريوهات تتطلب JWT authentication
- استخدم بيانات الاختبار المرفقة
- تحقق من جميع النتائج المتوقعة
- سجل أي أخطاء أو سلوك غير متوقع

