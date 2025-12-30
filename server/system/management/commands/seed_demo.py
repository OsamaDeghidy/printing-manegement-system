from __future__ import annotations

import random
from datetime import timedelta
from decimal import Decimal

from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand
from django.db import transaction
from django.utils import timezone

from accounts.models import User
from catalog.models import (
    Service,
    ServiceField,
    ServiceFieldOption,
    ServicePricing,
)
from entities.models import Entity
from inventory.models import InventoryItem, InventoryLog, ReorderRequest
from notifications.models import Notification, NotificationPreference
from orders.models import (
    Order,
    OrderApproval,
    OrderAttachment,
    OrderFieldValue,
    OrderStatusLog,
    DesignOrder,
    PrintOrder,
)
from training.models import TrainingRequest
from visits.models import VisitRequest, VisitSchedule, VisitBooking
from system.models import ApprovalPolicy, AuditLog, SystemSetting


class Command(BaseCommand):
    help = "Populate the database with rich demo data covering all models."

    SEED_TAG = "demo-seed"

    def handle(self, *args, **options):
        with transaction.atomic():
            self.stdout.write("Seeding demo data...")
            users = self._create_users()
            entities = self._create_entities(users)
            services, field_map = self._create_services()
            inventory_items = self._create_inventory(users)
            orders = self._create_orders(users, services, field_map)
            design_orders = self._create_design_orders(users, entities)
            print_orders = self._create_print_orders(users, entities)
            visits = self._create_visits(users, entities)
            training_requests = self._create_training(users, entities)
            self._create_notifications(users, orders)
            self._configure_system(users, services)
        self.stdout.write(self.style.SUCCESS("Demo data seeded successfully."))

    # ------------------------------------------------------------------ Users
    def _create_users(self) -> dict[str, User]:
        UserModel = get_user_model()
        demo_password = "PrintCenter@2025"

        def ensure_user(
            email: str,
            role: User.Role,
            full_name: str,
            department: str = "",
            is_staff: bool = False,
            is_superuser: bool = False,
        ) -> User:
            user, created = UserModel.objects.update_or_create(
                email=email,
                defaults={
                    "full_name": full_name,
                    "department": department,
                    "role": role,
                    "is_staff": is_staff or is_superuser,
                    "is_superuser": is_superuser,
                    "is_active": True,
                    "phone_number": "0555123456",
                },
            )
            if created or not user.has_usable_password():
                user.set_password(demo_password)
                user.save(update_fields=["password"])
            NotificationPreference.objects.get_or_create(user=user)
            return user

        users = {
            "admin": ensure_user(
                "admin@printcenter.demo",
                User.Role.ADMIN,
                "م. عبدالله الرشيد",
                "إدارة المطبعة",
                is_staff=True,
                is_superuser=True,
            ),
            "approver": ensure_user(
                "approver@printcenter.demo",
                User.Role.APPROVER,
                "أ. فاطمة الشمري",
                "عمادة شؤون الطلاب",
                is_staff=True,
            ),
            "staff": ensure_user(
                "staff@printcenter.demo",
                User.Role.STAFF,
                "خالد العتيبي",
                "ورشة الطباعة",
                is_staff=True,
            ),
            "inventory": ensure_user(
                "inventory@printcenter.demo",
                User.Role.INVENTORY,
                "م. وائل السلمي",
                "المستودع المركزي",
                is_staff=True,
            ),
            "requester_doctor": ensure_user(
                "doctor@printcenter.demo",
                User.Role.REQUESTER,
                "د. أحمد محمد",
                "كلية علوم الحاسب",
            ),
            "requester_department": ensure_user(
                "dept@printcenter.demo",
                User.Role.REQUESTER,
                "أ. سارة القحطاني",
                "عمادة القبول والتسجيل",
            ),
            "print_manager": ensure_user(
                "print.manager@printcenter.demo",
                User.Role.PRINT_MANAGER,
                "م. سعد الدوسري",
                "إدارة المطبعة",
                is_staff=True,
            ),
            "dept_manager": ensure_user(
                "dept.manager@printcenter.demo",
                User.Role.DEPT_MANAGER,
                "أ. نورة العتيبي",
                "وحدة التصميم",
                is_staff=True,
            ),
            "dept_employee": ensure_user(
                "dept.employee@printcenter.demo",
                User.Role.DEPT_EMPLOYEE,
                "محمد السالم",
                "وحدة الطباعة",
                is_staff=True,
            ),
            "training_supervisor": ensure_user(
                "training@printcenter.demo",
                User.Role.TRAINING_SUPERVISOR,
                "د. فهد الزهراني",
                "إدارة التدريب",
                is_staff=True,
            ),
            "consumer": ensure_user(
                "consumer@printcenter.demo",
                User.Role.CONSUMER,
                "د. خالد أحمد",
                "كلية الطب",
            ),
        }

        self.stdout.write(f"  • Users created/updated: {len(users)}")
        return users

    # --------------------------------------------------------------- Entities
    def _create_entities(self, users: dict[str, User]) -> dict[str, Entity]:
        """إنشاء الجهات الهرمية"""
        self.stdout.write("Creating entities...")
        
        # وكالة
        vice_edu, _ = Entity.objects.update_or_create(
            code="VICE-EDU",
            defaults={
                "name": "وكالة الجامعة للشؤون التعليمية",
                "level": Entity.Level.VICE_RECTORATE,
                "is_active": True,
            },
        )
        
        # كلية
        cs_college, _ = Entity.objects.update_or_create(
            code="CS-COLLEGE",
            defaults={
                "name": "كلية علوم الحاسب",
                "level": Entity.Level.COLLEGE_DEANSHIP,
                "parent": vice_edu,
                "is_active": True,
            },
        )
        
        # قسم
        cs_dept, _ = Entity.objects.update_or_create(
            code="CS-DEPT",
            defaults={
                "name": "قسم علوم الحاسب",
                "level": Entity.Level.DEPARTMENT_UNIT,
                "parent": cs_college,
                "is_active": True,
            },
        )
        
        # ربط المستخدمين بالجهات
        users["requester_doctor"].entity = cs_dept
        users["requester_doctor"].save()
        
        users["consumer"].entity = cs_dept
        users["consumer"].save()
        
        entities = {
            "vice_edu": vice_edu,
            "cs_college": cs_college,
            "cs_dept": cs_dept,
        }
        
        self.stdout.write(f"  • Entities created: {len(entities)}")
        return entities

    # --------------------------------------------------------------- Services
    def _create_services(self):
        SERVICE_DEFINITIONS = [
            {
                "name": "طباعة الورق الرسمي",
                "slug": "official-paper",
                "icon": "📄",
                "category": Service.Category.DOCUMENTS,
                "requires_approval": False,
                "description": "تجهيز المراسلات الرسمية مع شعار الجامعة وترويسة معتمدة.",
                "fields": [
                    {"key": "entity_name", "label": "اسم الجهة", "type": ServiceField.FieldType.TEXT, "order": 1},
                    {"key": "entity_number", "label": "رقم الجهة", "type": ServiceField.FieldType.NUMBER, "order": 2},
                    {
                        "key": "paper_type",
                        "label": "نوع الورق",
                        "type": ServiceField.FieldType.RADIO,
                        "order": 3,
                        "options": [
                            {"value": "standard", "label": "ورق عادي"},
                            {"value": "premium", "label": "ورق فاخر"},
                        ],
                    },
                    {"key": "quantity", "label": "الكمية", "type": ServiceField.FieldType.NUMBER, "order": 4},
                    {"key": "attachments", "label": "المرفقات", "type": ServiceField.FieldType.FILE, "order": 5},
                    {"key": "notes", "label": "ملاحظات", "type": ServiceField.FieldType.TEXTAREA, "order": 6},
                ],
                "pricing": {"internal": Decimal("0.35"), "external": Decimal("0.90")},
            },
            {
                "name": "طباعة إحالات",
                "slug": "referrals",
                "icon": "📋",
                "category": Service.Category.DOCUMENTS,
                "requires_approval": False,
                "description": "مخاطبات داخلية مع اعتماد المسؤول المناسب.",
                "fields": [
                    {"key": "entity_name", "label": "اسم الجهة", "type": ServiceField.FieldType.TEXT, "order": 1},
                    {
                        "key": "owner",
                        "label": "صاحب الجهة",
                        "type": ServiceField.FieldType.RADIO,
                        "order": 2,
                        "options": [
                            {"value": "manager", "label": "المدير"},
                            {"value": "dean", "label": "الوكيل"},
                            {"value": "doctor", "label": "الدكتور"},
                            {"value": "professor", "label": "الأستاذ"},
                            {"value": "president", "label": "رئيس الجامعة"},
                            {"value": "head-department", "label": "رئيس قسم"},
                            {"value": "unit-lead", "label": "رئيس وحدة"},
                        ],
                    },
                    {"key": "quantity", "label": "الكمية", "type": ServiceField.FieldType.NUMBER, "order": 3},
                    {"key": "attachments", "label": "المرفقات", "type": ServiceField.FieldType.FILE, "order": 4},
                    {"key": "notes", "label": "ملاحظات", "type": ServiceField.FieldType.TEXTAREA, "order": 5},
                ],
                "pricing": {"internal": Decimal("1.50"), "external": Decimal("3.50")},
            },
            {
                "name": "طباعة مذكرات",
                "slug": "memos",
                "icon": "📝",
                "category": Service.Category.DOCUMENTS,
                "requires_approval": False,
                "description": "مذكرات داخلية بأنواع وأحجام مختلفة.",
                "fields": [
                    {"key": "entity_name", "label": "اسم الجهة", "type": ServiceField.FieldType.TEXT, "order": 1},
                    {
                        "key": "size",
                        "label": "حجم المذكرة",
                        "type": ServiceField.FieldType.RADIO,
                        "order": 2,
                        "options": [
                            {"value": "a4", "label": "A4"},
                            {"value": "a5", "label": "A5"},
                            {"value": "a3", "label": "A3"},
                            {"value": "a6", "label": "A6"},
                        ],
                    },
                    {
                        "key": "memo_type",
                        "label": "نوع المذكرة",
                        "type": ServiceField.FieldType.RADIO,
                        "order": 3,
                        "options": [
                            {"value": "review", "label": "مذكرة مراجعة"},
                            {"value": "internal", "label": "مذكرة داخلية"},
                            {"value": "notes", "label": "مذكرة ملاحظات"},
                        ],
                    },
                    {"key": "quantity", "label": "الكمية", "type": ServiceField.FieldType.NUMBER, "order": 4},
                    {"key": "attachments", "label": "المرفقات", "type": ServiceField.FieldType.FILE, "order": 5},
                    {"key": "notes", "label": "ملاحظات", "type": ServiceField.FieldType.TEXTAREA, "order": 6},
                ],
                "pricing": {"internal": Decimal("2.00"), "external": Decimal("4.50")},
            },
            {
                "name": "طباعة بنرات",
                "slug": "banners",
                "icon": "🖼️",
                "category": Service.Category.MARKETING,
                "requires_approval": True,
                "description": "تصميم وطباعة بنرات للمؤتمرات والفعاليات.",
                "fields": [
                    {"key": "entity_name", "label": "اسم الجهة", "type": ServiceField.FieldType.TEXT, "order": 1},
                    {"key": "reason", "label": "سبب الطلب", "type": ServiceField.FieldType.TEXT, "order": 2},
                    {"key": "quantity", "label": "الكمية", "type": ServiceField.FieldType.NUMBER, "order": 3},
                    {"key": "design", "label": "إرفاق التصميم", "type": ServiceField.FieldType.FILE, "order": 4},
                    {"key": "notes", "label": "ملاحظات", "type": ServiceField.FieldType.TEXTAREA, "order": 5},
                ],
                "pricing": {"internal": Decimal("45.00"), "external": Decimal("80.00")},
            },
            {
                "name": "طباعة الشهادات",
                "slug": "certificates",
                "icon": "🎓",
                "category": Service.Category.DOCUMENTS,
                "requires_approval": True,
                "description": "شهادات التخرج، الامتياز، التقدير وغيرها.",
                "fields": [
                    {
                        "key": "certificate_type",
                        "label": "نوع الشهادة",
                        "type": ServiceField.FieldType.RADIO,
                        "order": 1,
                        "options": [
                            {"value": "graduation", "label": "شهادة تخرج"},
                            {"value": "honor", "label": "شهادة امتياز"},
                            {"value": "appreciation", "label": "شهادة شكر وتقدير"},
                            {"value": "excellence", "label": "شهادة تميز"},
                            {"value": "attendance", "label": "شهادة حضور أو إتمام"},
                        ],
                    },
                    {"key": "entity_name", "label": "اسم الجهة", "type": ServiceField.FieldType.TEXT, "order": 2},
                    {"key": "quantity", "label": "الكمية", "type": ServiceField.FieldType.NUMBER, "order": 3},
                    {"key": "attachments", "label": "المرفقات", "type": ServiceField.FieldType.FILE, "order": 4},
                    {"key": "notes", "label": "ملاحظات", "type": ServiceField.FieldType.TEXTAREA, "order": 5},
                ],
                "pricing": {"internal": Decimal("12.00"), "external": Decimal("25.00")},
            },
            {
                "name": "طباعة الأظرف",
                "slug": "envelopes",
                "icon": "✉️",
                "category": Service.Category.DOCUMENTS,
                "requires_approval": False,
                "description": "أظرف بمختلف الأحجام والألوان مع الطباعة.",
                "fields": [
                    {
                        "key": "size",
                        "label": "حجم الظرف",
                        "type": ServiceField.FieldType.RADIO,
                        "order": 1,
                        "options": [
                            {"value": "a3", "label": "A3"},
                            {"value": "a4", "label": "A4"},
                            {"value": "a5", "label": "A5"},
                            {"value": "a6", "label": "A6"},
                        ],
                    },
                    {
                        "key": "color",
                        "label": "اللون",
                        "type": ServiceField.FieldType.RADIO,
                        "order": 2,
                        "options": [
                            {"value": "white", "label": "أبيض"},
                            {"value": "brown", "label": "بني"},
                            {"value": "black", "label": "أسود"},
                        ],
                    },
                    {"key": "entity_name", "label": "اسم الجهة", "type": ServiceField.FieldType.TEXT, "order": 3},
                    {"key": "quantity", "label": "الكمية", "type": ServiceField.FieldType.NUMBER, "order": 4},
                    {"key": "attachments", "label": "المرفقات", "type": ServiceField.FieldType.FILE, "order": 5},
                    {"key": "notes", "label": "ملاحظات", "type": ServiceField.FieldType.TEXTAREA, "order": 6},
                ],
                "pricing": {"internal": Decimal("1.20"), "external": Decimal("2.80")},
            },
            {
                "name": "طباعة الإحالات الطبية",
                "slug": "medical-referrals",
                "icon": "🏥",
                "category": Service.Category.MEDICAL,
                "requires_approval": True,
                "description": "نماذج إحالة طبية معتمدة للمستفيدين.",
                "fields": [
                    {"key": "entity_name", "label": "اسم الجهة", "type": ServiceField.FieldType.TEXT, "order": 1},
                    {"key": "doctor_name", "label": "اسم الطبيب", "type": ServiceField.FieldType.TEXT, "order": 2},
                    {"key": "clinic_name", "label": "اسم العيادة", "type": ServiceField.FieldType.TEXT, "order": 3},
                    {"key": "quantity", "label": "الكمية", "type": ServiceField.FieldType.NUMBER, "order": 4},
                    {"key": "attachments", "label": "المرفقات", "type": ServiceField.FieldType.FILE, "order": 5},
                    {"key": "notes", "label": "ملاحظات", "type": ServiceField.FieldType.TEXTAREA, "order": 6},
                ],
                "pricing": {"internal": Decimal("3.50"), "external": Decimal("7.00")},
            },
            {
                "name": "طباعة عامة",
                "slug": "general-print",
                "icon": "📑",
                "category": Service.Category.GENERAL,
                "requires_approval": False,
                "description": "طلبات طباعة متنوعة لا تندرج تحت تصنيف محدد.",
                "fields": [
                    {"key": "entity_name", "label": "اسم الجهة", "type": ServiceField.FieldType.TEXT, "order": 1},
                    {"key": "reason", "label": "سبب الطلب", "type": ServiceField.FieldType.TEXT, "order": 2},
                    {"key": "quantity", "label": "الكمية", "type": ServiceField.FieldType.NUMBER, "order": 3},
                    {"key": "attachments", "label": "المرفقات", "type": ServiceField.FieldType.FILE, "order": 4},
                    {"key": "notes", "label": "ملاحظات", "type": ServiceField.FieldType.TEXTAREA, "order": 5},
                ],
                "pricing": {"internal": Decimal("2.25"), "external": Decimal("5.50")},
            },
            {
                "name": "خدمة التصميم",
                "slug": "design-service",
                "icon": "🎨",
                "category": Service.Category.DESIGN,
                "requires_approval": True,
                "description": "تصميم المواد الإبداعية قبل طباعتها.",
                "fields": [
                    {"key": "entity_name", "label": "اسم الجهة", "type": ServiceField.FieldType.TEXT, "order": 1},
                    {"key": "reason", "label": "سبب الطلب", "type": ServiceField.FieldType.TEXT, "order": 2},
                    {"key": "quantity", "label": "الكمية", "type": ServiceField.FieldType.NUMBER, "order": 3},
                    {"key": "attachments", "label": "مرفقات مرجعية", "type": ServiceField.FieldType.FILE, "order": 4},
                    {"key": "notes", "label": "ملاحظات", "type": ServiceField.FieldType.TEXTAREA, "order": 5},
                ],
                "pricing": {"internal": Decimal("150.00"), "external": Decimal("320.00")},
            },
            {
                "name": "طباعة بروشورات",
                "slug": "brochures",
                "icon": "📰",
                "category": Service.Category.MARKETING,
                "requires_approval": False,
                "description": "بروشورات تعريفية للفعاليات والبرامج.",
                "fields": [
                    {"key": "entity_name", "label": "اسم الجهة", "type": ServiceField.FieldType.TEXT, "order": 1},
                    {"key": "reason", "label": "سبب الطلب", "type": ServiceField.FieldType.TEXT, "order": 2},
                    {"key": "quantity", "label": "الكمية", "type": ServiceField.FieldType.NUMBER, "order": 3},
                    {"key": "attachments", "label": "المرفقات", "type": ServiceField.FieldType.FILE, "order": 4},
                    {"key": "notes", "label": "ملاحظات", "type": ServiceField.FieldType.TEXTAREA, "order": 5},
                ],
                "pricing": {"internal": Decimal("18.00"), "external": Decimal("32.00")},
            },
            {
                "name": "طباعة كروت شخصية",
                "slug": "business-cards",
                "icon": "🎴",
                "category": Service.Category.MARKETING,
                "requires_approval": True,
                "description": "كروت شخصية باللغتين مع الشعار الرسمي.",
                "fields": [
                    {"key": "name_ar", "label": "الاسم بالعربية", "type": ServiceField.FieldType.TEXT, "order": 1},
                    {"key": "name_en", "label": "الاسم بالإنجليزية", "type": ServiceField.FieldType.TEXT, "order": 2},
                    {"key": "title_ar", "label": "المنصب بالعربية", "type": ServiceField.FieldType.TEXT, "order": 3},
                    {"key": "title_en", "label": "المنصب بالإنجليزية", "type": ServiceField.FieldType.TEXT, "order": 4},
                    {
                        "key": "role",
                        "label": "الصفة",
                        "type": ServiceField.FieldType.RADIO,
                        "order": 5,
                        "options": [
                            {"value": "president", "label": "رئيس جامعة"},
                            {"value": "professor", "label": "أستاذ دكتور"},
                            {"value": "doctor", "label": "دكتور"},
                            {"value": "engineer", "label": "مهندس"},
                            {"value": "lecturer", "label": "محاضر"},
                            {"value": "head", "label": "رئيس"},
                            {"value": "dean", "label": "وكيل"},
                            {"value": "manager", "label": "مدير"},
                            {"value": "general-manager", "label": "مدير عام"},
                            {"value": "technician", "label": "فني"},
                        ],
                    },
                    {"key": "quantity", "label": "الكمية", "type": ServiceField.FieldType.NUMBER, "order": 6},
                    {
                        "key": "appointment_decision",
                        "label": "قرار التكليف / الترقية",
                        "type": ServiceField.FieldType.FILE,
                        "order": 7,
                        "required": True,
                    },
                    {"key": "notes", "label": "ملاحظات", "type": ServiceField.FieldType.TEXTAREA, "order": 8},
                ],
                "pricing": {"internal": Decimal("55.00"), "external": Decimal("95.00")},
            },
        ]

        service_map: dict[str, Service] = {}
        field_map: dict[tuple[str, str], ServiceField] = {}

        for definition in SERVICE_DEFINITIONS:
            service, _ = Service.objects.update_or_create(
                slug=definition["slug"],
                defaults={
                    "name": definition["name"],
                    "description": definition["description"],
                    "icon": definition["icon"],
                    "category": definition["category"],
                    "is_active": True,
                    "requires_approval": definition["requires_approval"],
                },
            )
            service_map[service.slug] = service

            ServiceField.objects.filter(service=service).exclude(
                key__in=[field["key"] for field in definition["fields"]]
            ).delete()

            for idx, field_def in enumerate(definition["fields"], start=1):
                field_obj, _ = ServiceField.objects.update_or_create(
                    service=service,
                    key=field_def["key"],
                    defaults={
                        "label": field_def["label"],
                        "field_type": field_def["type"],
                        "order": field_def.get("order", idx),
                        "is_required": field_def.get("required", False),
                        "is_visible": field_def.get("visible", True),
                        "placeholder": field_def.get("placeholder", ""),
                        "help_text": field_def.get("help_text", ""),
                        "config": field_def.get("config", {}),
                    },
                )
                field_map[(service.slug, field_obj.key)] = field_obj

                if field_def.get("options"):
                    ServiceFieldOption.objects.filter(field=field_obj).exclude(
                        value__in=[option["value"] for option in field_def["options"]]
                    ).delete()
                    for opt_index, option in enumerate(field_def["options"], start=1):
                        ServiceFieldOption.objects.update_or_create(
                            field=field_obj,
                            value=option["value"],
                            defaults={
                                "label": option["label"],
                                "order": option.get("order", opt_index),
                                "is_active": option.get("is_active", True),
                            },
                        )

            ServicePricing.objects.filter(service=service, notes="بيانات تجريبية").delete()
            ServicePricing.objects.create(
                service=service,
                internal_cost=definition["pricing"]["internal"],
                external_cost=definition["pricing"]["external"],
                notes="بيانات تجريبية",
            )

        self.stdout.write(f"  • Services prepared: {len(service_map)}")
        return service_map, field_map

    # -------------------------------------------------------------- Inventory
    def _create_inventory(self, users: dict[str, User]):
        items_data = [
            {
                "name": "ورق A4 أبيض",
                "sku": "PAPER-A4-WHITE",
                "category": InventoryItem.Category.PAPER,
                "unit": "رزمة",
                "current_quantity": 4800,
                "minimum_threshold": 1000,
                "maximum_threshold": 10000,
                "reorder_point": 1500,
            },
            {
                "name": "حبر أسود HP LaserJet",
                "sku": "INK-HP-BLACK",
                "category": InventoryItem.Category.INK,
                "unit": "علبة",
                "current_quantity": 12,
                "minimum_threshold": 5,
                "maximum_threshold": 30,
                "reorder_point": 8,
            },
            {
                "name": "بنرات Vinly مقاس 80x200",
                "sku": "BANNER-80X200",
                "category": InventoryItem.Category.BANNER,
                "unit": "قطعة",
                "current_quantity": 35,
                "minimum_threshold": 10,
                "maximum_threshold": 60,
                "reorder_point": 20,
            },
        ]

        inventory_items = []
        for data in items_data:
            item, _ = InventoryItem.objects.update_or_create(
                sku=data["sku"],
                defaults={
                    "name": data["name"],
                    "category": data["category"],
                    "unit": data["unit"],
                    "current_quantity": data["current_quantity"],
                    "minimum_threshold": data["minimum_threshold"],
                    "maximum_threshold": data["maximum_threshold"],
                    "reorder_point": data["reorder_point"],
                    "last_restocked_at": timezone.now() - timedelta(days=random.randint(1, 7)),
                    "last_usage_at": timezone.now() - timedelta(days=random.randint(1, 4)),
                },
            )
            inventory_items.append(item)

            InventoryLog.objects.filter(item=item, note__icontains=self.SEED_TAG).delete()
            InventoryLog.objects.create(
                item=item,
                operation=InventoryLog.Operation.IN,
                quantity=item.current_quantity,
                balance_after=item.current_quantity,
                performed_by=users["inventory"],
                note=f"إدخال أولي ({self.SEED_TAG})",
            )

        ReorderRequest.objects.filter(notes__icontains=self.SEED_TAG).delete()
        ReorderRequest.objects.create(
            item=inventory_items[1],
            quantity=20,
            status=ReorderRequest.Status.ORDERED,
            requested_by=users["inventory"],
            approved_by=users["admin"],
            requested_at=timezone.now() - timedelta(days=2),
            approved_at=timezone.now() - timedelta(days=1),
            notes=f"تزويد تجريبي ({self.SEED_TAG})",
        )

        self.stdout.write(f"  • Inventory items prepared: {len(inventory_items)}")
        return inventory_items

    # ----------------------------------------------------------------- Orders
    def _create_orders(
        self,
        users: dict[str, User],
        services: dict[str, Service],
        field_map: dict[tuple[str, str], ServiceField],
    ):
        Order.objects.filter(metadata__seed=self.SEED_TAG).delete()

        now = timezone.now()
        orders_data = [
            {
                "service": services["business-cards"],
                "requester": users["requester_doctor"],
                "current_approver": users["approver"],
                "status": Order.Status.IN_REVIEW,
                "priority": Order.Priority.HIGH,
                "submitted_at": now - timedelta(days=1, hours=2),
                "field_values": {
                    "name_ar": "د. أحمد محمد السالم",
                    "name_en": "Dr. Ahmed Mohammed Alsalem",
                    "title_ar": "أستاذ مشارك",
                    "title_en": "Associate Professor",
                    "role": "professor",
                    "quantity": 100,
                    "appointment_decision": "decision.pdf",
                    "notes": "يُرجى استخدام النسخة الإنجليزية المحدثة.",
                },
                "attachments": [
                    {
                        "type": OrderAttachment.AttachmentType.LINK,
                        "name": "قرار الترقية",
                        "url": "https://example.com/files/decision",
                    }
                ],
                "approvals": [
                    {
                        "approver": users["approver"],
                        "decision": OrderApproval.Decision.PENDING,
                        "comment": "",
                    }
                ],
                "status_notes": [
                    ("pending", "تم إرسال الطلب من مقدم الخدمة."),
                    ("in_review", "بانتظار اعتماد مدير عمادة شؤون الطلاب."),
                ],
            },
            {
                "service": services["banners"],
                "requester": users["requester_department"],
                "current_approver": users["approver"],
                "status": Order.Status.IN_PRODUCTION,
                "priority": Order.Priority.MEDIUM,
                "submitted_at": now - timedelta(days=3),
                "approved_at": now - timedelta(days=2),
                "field_values": {
                    "entity_name": "عمادة القبول والتسجيل",
                    "reason": "حملة تعريفية بالأقسام الجديدة",
                    "quantity": 6,
                    "notes": "قياس 80×200، ألوان الشعار الرسمية.",
                },
                "attachments": [
                    {
                        "type": OrderAttachment.AttachmentType.LINK,
                        "name": "ملف التصميم",
                        "url": "https://drive.google.com/demo-design",
                    }
                ],
                "approvals": [
                    {
                        "approver": users["approver"],
                        "decision": OrderApproval.Decision.APPROVED,
                        "comment": "تمت المراجعة والموافقة.",
                    }
                ],
                "status_notes": [
                    ("pending", "تم إرسال الطلب."),
                    ("in_review", "جارٍ التحقق من التصميم."),
                    ("approved", "تم الاعتماد من قبل المعتمد."),
                    ("in_production", "الطلب قيد الطباعة."),
                ],
            },
            {
                "service": services["official-paper"],
                "requester": users["requester_department"],
                "current_approver": None,
                "status": Order.Status.READY,
                "priority": Order.Priority.LOW,
                "submitted_at": now - timedelta(days=5),
                "approved_at": now - timedelta(days=4, hours=2),
                "completed_at": now - timedelta(days=3),
                "field_values": {
                    "entity_name": "عمادة القبول والتسجيل",
                    "entity_number": 1204,
                    "paper_type": "standard",
                    "quantity": 500,
                },
                "attachments": [],
                "approvals": [],
                "status_notes": [
                    ("pending", "تم استلام الطلب."),
                    ("approved", "تمت الموافقة تلقائياً."),
                    ("in_production", "جاري تجهيز الطباعة."),
                    ("ready", "الطلب جاهز للاستلام من المستودع."),
                ],
            },
            {
                "service": services["design-service"],
                "requester": users["requester_doctor"],
                "current_approver": users["admin"],
                "status": Order.Status.APPROVED,
                "priority": Order.Priority.MEDIUM,
                "submitted_at": now - timedelta(days=2, hours=5),
                "approved_at": now - timedelta(days=1),
                "field_values": {
                    "entity_name": "كلية علوم الحاسب",
                    "reason": "تصميم بوسترات مؤتمر الذكاء الاصطناعي",
                    "quantity": 3,
                    "notes": "مطلوب ثلاثة خيارات تصميم مختلفة.",
                },
                "attachments": [
                    {
                        "type": OrderAttachment.AttachmentType.LINK,
                        "name": "مراجع سابقة",
                        "url": "https://example.com/reference-board",
                    }
                ],
                "approvals": [
                    {
                        "approver": users["admin"],
                        "decision": OrderApproval.Decision.APPROVED,
                        "comment": "الموافقة على بدء التصميم.",
                    }
                ],
                "status_notes": [
                    ("pending", "تم استلام الطلب."),
                    ("in_review", "تمت مراجعته من الإدارة."),
                    ("approved", "تمت الموافقة على الطلب."),
                ],
            },
        ]

        created_orders = []
        for data in orders_data:
            order = Order.objects.create(
                service=data["service"],
                requester=data["requester"],
                department=data["requester"].department,
                status=data["status"],
                priority=data["priority"],
                requires_approval=data["service"].requires_approval,
                current_approver=data.get("current_approver"),
                submitted_at=data["submitted_at"],
                approved_at=data.get("approved_at"),
                completed_at=data.get("completed_at"),
                metadata={"seed": self.SEED_TAG},
            )

            for key, value in data["field_values"].items():
                field = field_map.get((order.service.slug, key))
                if not field:
                    continue
                OrderFieldValue.objects.create(order=order, field=field, value=value)

            for attachment in data.get("attachments", []):
                OrderAttachment.objects.create(
                    order=order,
                    attachment_type=attachment["type"],
                    link_url=attachment.get("url", ""),
                    name=attachment["name"],
                    uploaded_by=data["requester"],
                )

            if data.get("approvals"):
                for step, approval in enumerate(data["approvals"], start=1):
                    OrderApproval.objects.create(
                        order=order,
                        approver=approval["approver"],
                        step=step,
                        decision=approval["decision"],
                        comment=approval.get("comment", ""),
                        decided_at=data.get("approved_at") if approval["decision"] != OrderApproval.Decision.PENDING else None,
                    )

            for status_code, note in data.get("status_notes", []):
                OrderStatusLog.objects.create(
                    order=order,
                    status=status_code,
                    note=note,
                    changed_by=data.get("current_approver") or data["requester"],
                )

            created_orders.append(order)

        self.stdout.write(f"  • Orders generated: {len(created_orders)}")
        return created_orders

    # ----------------------------------------------------------- Notifications
    def _create_notifications(self, users: dict[str, User], orders: list[Order]):
        Notification.objects.filter(data__seed=self.SEED_TAG).delete()

        for order in orders:
            Notification.objects.create(
                recipient=order.requester,
                title=f"تحديث على الطلب {order.order_code}",
                message=f"حالة الطلب الحالية: {order.get_status_display()}",
                type=Notification.Type.ORDER_STATUS,
                data={"seed": self.SEED_TAG, "order": order.order_code},
            )

        Notification.objects.create(
            recipient=users["approver"],
            title="طلبات بانتظار الاعتماد",
            message="لديك طلبات جديدة تحتاج إلى قرار.",
            type=Notification.Type.APPROVAL,
            data={"seed": self.SEED_TAG, "pending": [order.order_code for order in orders if order.status == Order.Status.IN_REVIEW]},
        )

        NotificationPreference.objects.update_or_create(
            user=users["approver"],
            defaults={
                "order_updates": True,
                "approvals": True,
                "inventory_alerts": False,
                "weekly_digest": True,
                "email_subscription": True,
            },
        )

        self.stdout.write("  • Notifications refreshed.")

    # --------------------------------------------------------- Design Orders
    def _create_design_orders(self, users: dict[str, User], entities: dict[str, Entity]):
        """إنشاء طلبات تصميم"""
        self.stdout.write("Creating design orders...")
        
        design_orders = []
        consumer = users.get("consumer") or users.get("requester_doctor")
        
        for i in range(5):
            order = DesignOrder.objects.create(
                requester=consumer,
                entity=consumer.entity if consumer.entity else entities.get("cs_dept"),
                design_type=random.choice(DesignOrder.DesignType.choices)[0],
                title=f"طلب تصميم تجريبي #{i+1}",
                size=random.choice(DesignOrder.Size.choices)[0],
                description=f"وصف تفصيلي لطلب التصميم رقم {i+1}",
                priority=random.choice(DesignOrder.Priority.choices)[0],
                status=random.choice([
                    DesignOrder.Status.PENDING_REVIEW,
                    DesignOrder.Status.IN_DESIGN,
                    DesignOrder.Status.PENDING_CONFIRM,
                    DesignOrder.Status.COMPLETED,
                ]),
                submitted_at=timezone.now() - timedelta(days=random.randint(0, 10)),
            )
            design_orders.append(order)
        
        self.stdout.write(f"  • Design orders created: {len(design_orders)}")
        return design_orders

    # ---------------------------------------------------------- Print Orders
    def _create_print_orders(self, users: dict[str, User], entities: dict[str, Entity]):
        """إنشاء طلبات طباعة"""
        self.stdout.write("Creating print orders...")
        
        print_orders = []
        consumer = users.get("consumer") or users.get("requester_doctor")
        
        for i in range(10):
            order = PrintOrder.objects.create(
                requester=consumer,
                entity=consumer.entity if consumer.entity else entities.get("cs_dept"),
                print_type=random.choice(PrintOrder.PrintType.choices)[0],
                production_dept=random.choice(PrintOrder.ProductionDept.choices)[0],
                size=random.choice(DesignOrder.Size.choices)[0],
                paper_type=random.choice(PrintOrder.PaperType.choices)[0],
                paper_weight=random.randint(70, 350),
                quantity=random.randint(10, 1000),
                sides=random.choice([1, 2]),
                pages=random.randint(1, 100),
                actual_quantity=0,
                delivery_method=random.choice(PrintOrder.DeliveryMethod.choices)[0],
                priority=random.choice(PrintOrder.Priority.choices)[0],
                status=random.choice([
                    PrintOrder.Status.PENDING_REVIEW,
                    PrintOrder.Status.IN_PRODUCTION,
                    PrintOrder.Status.PENDING_CONFIRM,
                    PrintOrder.Status.IN_WAREHOUSE,
                ]),
                submitted_at=timezone.now() - timedelta(days=random.randint(0, 15)),
            )
            print_orders.append(order)
        
        self.stdout.write(f"  • Print orders created: {len(print_orders)}")
        return print_orders

    # -------------------------------------------------------------- Visits
    def _create_visits(self, users: dict[str, User], entities: dict[str, Entity]):
        """إنشاء طلبات زيارة"""
        self.stdout.write("Creating visit requests...")
        
        visits = []
        consumer = users.get("consumer") or users.get("requester_doctor")
        
        # إنشاء جدول مواعيد
        for i in range(7):
            date = timezone.now().date() + timedelta(days=i)
            VisitSchedule.objects.get_or_create(
                date=date,
                defaults={
                    "is_blocked": False,
                    "available_slots": ["09:00", "10:00", "11:00", "14:00", "15:00", "16:00"],
                },
            )
        
        available_times = ["09:00", "10:00", "11:00", "14:00", "15:00", "16:00"]
        time_index = 0
        
        for i in range(5):
            from datetime import time as time_obj
            from django.core.files.base import ContentFile
            requested_date = timezone.now().date() + timedelta(days=random.randint(1, 14))
            visit_type = random.choice(VisitRequest.VisitType.choices)[0]
            
            # استخدام أوقات مختلفة
            time_str = available_times[time_index % len(available_times)]
            time_parts = time_str.split(":")
            requested_time = time_obj(int(time_parts[0]), int(time_parts[1]))
            time_index += 1
            
            visit_data = {
                "requester": consumer,
                "entity": consumer.entity if consumer.entity else entities.get("cs_dept"),
                "visit_type": visit_type,
                "purpose": f"طلب زيارة تجريبي #{i+1}",
                "requested_date": requested_date,
                "requested_time": requested_time,
                "status": random.choice([
                    VisitRequest.Status.PENDING,
                    VisitRequest.Status.APPROVED,
                    VisitRequest.Status.REJECTED,
                ]),
            }
            
            # للزيارات الخارجية، نحتاج ملف تصريح
            if visit_type == VisitRequest.VisitType.EXTERNAL:
                fake_file = ContentFile(b"Fake permit file for demo data")
                fake_file.name = f"permit_{i}.pdf"
                visit_data["permit_file"] = fake_file
            
            visit = VisitRequest.objects.create(**visit_data)
            
            if visit.status == VisitRequest.Status.APPROVED:
                schedule, _ = VisitSchedule.objects.get_or_create(
                    date=visit.requested_date,
                    defaults={
                        "is_blocked": False,
                        "available_slots": available_times,
                    },
                )
                if schedule and not schedule.is_blocked:
                    # استخدام get_or_create لتجنب duplicate
                    VisitBooking.objects.get_or_create(
                        visit_request=visit,
                        defaults={
                            "schedule": schedule,
                            "requested_time": visit.requested_time,
                            "status": VisitBooking.Status.CONFIRMED,
                        },
                    )
            
            visits.append(visit)
        
        self.stdout.write(f"  • Visit requests created: {len(visits)}")
        return visits

    # ------------------------------------------------------------ Training
    def _create_training(self, users: dict[str, User], entities: dict[str, Entity]):
        """إنشاء طلبات تدريب"""
        self.stdout.write("Creating training requests...")
        
        training_requests = []
        consumer = users.get("consumer") or users.get("requester_doctor")
        supervisor = users.get("training_supervisor")
        
        for i in range(3):
            start_date = timezone.now().date() + timedelta(days=random.randint(7, 30))
            end_date = start_date + timedelta(days=random.randint(30, 90))
            
            training = TrainingRequest.objects.create(
                requester=consumer,
                entity=consumer.entity if consumer.entity else entities.get("cs_dept"),
                trainee_name=f"متدرب تجريبي #{i+1}",
                trainee_id=f"ID{random.randint(100000, 999999)}",
                trainee_phone=f"05{random.randint(10000000, 99999999)}",
                trainee_email=f"trainee{i+1}@university.edu.sa",
                university="جامعة طيبة",
                major=random.choice(["علوم الحاسب", "نظم المعلومات", "التصميم الجرافيكي"]),
                training_period_start=start_date,
                training_period_end=end_date,
                department=random.choice(["قسم التصميم", "قسم الطباعة", "قسم الإخراج"]),
                purpose=f"طلب تدريب تجريبي رقم {i+1}",
                supervisor=supervisor if random.choice([True, False]) else None,
                status=random.choice([
                    TrainingRequest.Status.PENDING,
                    TrainingRequest.Status.APPROVED,
                    TrainingRequest.Status.IN_PROGRESS,
                ]),
            )
            training_requests.append(training)
        
        self.stdout.write(f"  • Training requests created: {len(training_requests)}")
        return training_requests

    # -------------------------------------------------------------- System cfg
    def _configure_system(self, users: dict[str, User], services: dict[str, Service]):
        SystemSetting.objects.update_or_create(
            key="branding",
            defaults={
                "value": {
                    "name_ar": "إدارة مطابع جامعة طيبة",
                    "name_en": "Taibah University Print Center",
                    "primary_color": "#0A8E6E",
                    "secondary_color": "#4056E3",
                },
                "description": "إعدادات الهوية البصرية (بيانات تجريبية)",
                "updated_by": users["admin"],
            },
        )

        policy, _ = ApprovalPolicy.objects.get_or_create()
        policy.is_global_enabled = True
        policy.updated_by = users["admin"]
        policy.save()
        policy.selective_services.set(
            [services["business-cards"], services["banners"], services["design-service"]]
        )

        AuditLog.objects.create(
            actor=users["admin"],
            action="تطبيق بيانات تجريبية",
            metadata={"seed": self.SEED_TAG, "timestamp": timezone.now().isoformat()},
        )

        self.stdout.write("  • System settings and audit log updated.")

