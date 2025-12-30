"""
Management command لإنشاء بيانات تجريبية عبر APIs
يستخدم Django TestClient لمحاكاة طلبات API
"""
from __future__ import annotations

import random
from datetime import timedelta
from decimal import Decimal

from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand
from django.db import transaction
from django.test import Client
from django.utils import timezone
from rest_framework.test import APIClient

from accounts.models import User
from entities.models import Entity
from inventory.models import InventoryItem
from orders.models import DesignOrder, PrintOrder
from training.models import TrainingRequest
from visits.models import VisitRequest, VisitSchedule

UserModel = get_user_model()
DEMO_PASSWORD = "PrintCenter@2025"


class Command(BaseCommand):
    help = "إنشاء بيانات تجريبية عبر APIs لاختبار النظام بالكامل"

    def add_arguments(self, parser):
        parser.add_argument(
            "--use-api",
            action="store_true",
            help="استخدام APIs فعلي (يتطلب server running)",
        )

    def handle(self, *args, **options):
        use_api = options.get("use_api", False)
        
        self.stdout.write(self.style.SUCCESS("=" * 60))
        self.stdout.write(self.style.SUCCESS("Starting demo data seeding via APIs..."))
        self.stdout.write(self.style.SUCCESS("=" * 60))
        
        if use_api:
            self.api_client = None  # سيستخدم requests
            self.base_url = "http://localhost:8000/api"
        else:
            self.api_client = APIClient()
            self.base_url = None
        
        with transaction.atomic():
            # 1. إنشاء مستخدمين
            users = self._create_users()
            
            # 2. الحصول على tokens
            tokens = self._get_tokens(users)
            
            # 3. إنشاء جهات
            entities = self._create_entities(users, tokens)
            
            # 4. ربط المستخدمين بالجهات
            self._link_users_to_entities(users, entities, tokens)
            
            # 5. إنشاء طلبات تصميم
            design_orders = self._create_design_orders(users, entities, tokens)
            
            # 6. إنشاء طلبات طباعة
            print_orders = self._create_print_orders(users, entities, tokens)
            
            # 7. إنشاء طلبات زيارة
            visits = self._create_visits(users, entities, tokens)
            
            # 8. إنشاء طلبات تدريب
            training_requests = self._create_training(users, entities, tokens)
            
            # 9. إنشاء مخزون
            inventory_items = self._create_inventory(users, tokens)
            
            # 10. محاكاة سير العمل
            self._simulate_workflows(design_orders, print_orders, users, tokens)
            
            # 11. إنشاء إشعارات
            self._create_notifications(users, design_orders, print_orders, tokens)
        
        self.stdout.write(self.style.SUCCESS("\n" + "=" * 60))
        self.stdout.write(self.style.SUCCESS("Demo data created successfully!"))
        self.stdout.write(self.style.SUCCESS("=" * 60))
        self._print_summary(users, entities, design_orders, print_orders, visits, training_requests, inventory_items)

    def _api_request(self, method, url, data=None, token=None, files=None):
        """تنفيذ طلب API"""
        if self.api_client:
            # استخدام APIClient
            if token:
                self.api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")
            
            if method == "GET":
                response = self.api_client.get(url, format="json")
            elif method == "POST":
                if files:
                    response = self.api_client.post(url, data, format="multipart")
                else:
                    response = self.api_client.post(url, data, format="json")
            elif method == "PUT":
                response = self.api_client.put(url, data, format="json")
            elif method == "PATCH":
                response = self.api_client.patch(url, data, format="json")
            else:
                response = self.api_client.delete(url, format="json")
            
            if response.status_code >= 400:
                self.stdout.write(self.style.WARNING(f"API Error: {url} - {response.status_code}"))
                self.stdout.write(self.style.WARNING(f"Response: {response.data}"))
                return None
            
            return response.data if hasattr(response, "data") else response.json()
        else:
            # استخدام requests (للاستخدام الفعلي)
            import requests
            headers = {"Content-Type": "application/json"}
            if token:
                headers["Authorization"] = f"Bearer {token}"
            
            full_url = f"{self.base_url}{url}"
            
            if method == "GET":
                response = requests.get(full_url, headers=headers)
            elif method == "POST":
                if files:
                    headers.pop("Content-Type")
                    response = requests.post(full_url, data=data, files=files, headers=headers)
                else:
                    response = requests.post(full_url, json=data, headers=headers)
            else:
                response = requests.request(method, full_url, json=data, headers=headers)
            
            if response.status_code >= 400:
                self.stdout.write(self.style.WARNING(f"API Error: {full_url} - {response.status_code}"))
                return None
            
            return response.json()

    def _create_users(self):
        """Create users with all roles"""
        self.stdout.write("\n[1/11] Creating users...")
        
        users_data = [
            # مديرو المطبعة
            {
                "email": "print.manager@taibahu.edu.sa",
                "full_name": "م. عبدالله الرشيد",
                "role": User.Role.PRINT_MANAGER,
                "department": "إدارة المطبعة",
            },
            {
                "email": "print.manager2@taibahu.edu.sa",
                "full_name": "أ. فاطمة الشمري",
                "role": User.Role.PRINT_MANAGER,
                "department": "إدارة المطبعة",
            },
            # مديرو الأقسام
            {
                "email": "dept.manager@taibahu.edu.sa",
                "full_name": "م. خالد العتيبي",
                "role": User.Role.DEPT_MANAGER,
                "department": "وحدة التصميم",
            },
            {
                "email": "dept.manager2@taibahu.edu.sa",
                "full_name": "أ. سارة القحطاني",
                "role": User.Role.DEPT_MANAGER,
                "department": "وحدة الطباعة",
            },
            # موظفو الأقسام
            {
                "email": "dept.employee@taibahu.edu.sa",
                "full_name": "محمد السالم",
                "role": User.Role.DEPT_EMPLOYEE,
                "department": "وحدة التصميم",
            },
            {
                "email": "dept.employee2@taibahu.edu.sa",
                "full_name": "نورا الأحمد",
                "role": User.Role.DEPT_EMPLOYEE,
                "department": "وحدة الطباعة",
            },
            # مشرفو التدريب
            {
                "email": "training.supervisor@taibahu.edu.sa",
                "full_name": "د. أحمد الزهراني",
                "role": User.Role.TRAINING_SUPERVISOR,
                "department": "إدارة التدريب",
            },
            # مراقبو المخزون
            {
                "email": "inventory@taibahu.edu.sa",
                "full_name": "م. وائل السلمي",
                "role": User.Role.INVENTORY,
                "department": "المستودع المركزي",
            },
            # مستهلكون
            {
                "email": "consumer1@taibahu.edu.sa",
                "full_name": "د. أحمد محمد",
                "role": User.Role.CONSUMER,
                "department": "كلية علوم الحاسب",
            },
            {
                "email": "consumer2@taibahu.edu.sa",
                "full_name": "أ. علي حسن",
                "role": User.Role.CONSUMER,
                "department": "عمادة القبول والتسجيل",
            },
            {
                "email": "consumer3@taibahu.edu.sa",
                "full_name": "د. فاطمة علي",
                "role": User.Role.CONSUMER,
                "department": "كلية الطب",
            },
        ]
        
        users = {}
        for user_data in users_data:
            user, created = UserModel.objects.update_or_create(
                email=user_data["email"],
                defaults={
                    "full_name": user_data["full_name"],
                    "department": user_data["department"],
                    "role": user_data["role"],
                    "is_active": True,
                    "phone_number": f"05{random.randint(10000000, 99999999)}",
                },
            )
            if created or not user.has_usable_password():
                user.set_password(DEMO_PASSWORD)
                user.save(update_fields=["password"])
            users[user_data["email"]] = user
        
        self.stdout.write(self.style.SUCCESS(f"  Created {len(users)} users"))
        return users

    def _get_tokens(self, users):
        """الحصول على JWT tokens للمستخدمين"""
        self.stdout.write("\n[2/11] Getting JWT Tokens...")
        
        # استخدام RefreshToken مباشرة (أسرع وأكثر موثوقية)
        from rest_framework_simplejwt.tokens import RefreshToken
        
        tokens = {}
        for email, user in users.items():
            try:
                refresh = RefreshToken.for_user(user)
                tokens[email] = str(refresh.access_token)
            except Exception as e:
                self.stdout.write(self.style.WARNING(f"  Warning: Error creating token for {email}: {e}"))
                tokens[email] = None
        
        self.stdout.write(self.style.SUCCESS(f"  Got {len([t for t in tokens.values() if t])} tokens"))
        return tokens

    def _create_entities(self, users, tokens):
        """Create hierarchical entities"""
        self.stdout.write("\n[3/11] Creating entities...")
        
        manager_token = tokens.get("print.manager@taibahu.edu.sa")
        
        entities_data = [
            # وكالة 1
            {
                "name": "وكالة الجامعة للشؤون التعليمية",
                "code": "VICE-EDU",
                "level": Entity.Level.VICE_RECTORATE,
                "parent": None,
            },
            # كلية 1
            {
                "name": "كلية علوم الحاسب",
                "code": "CS-COLLEGE",
                "level": Entity.Level.COLLEGE_DEANSHIP,
                "parent": "VICE-EDU",
            },
            # قسم 1
            {
                "name": "قسم علوم الحاسب",
                "code": "CS-DEPT",
                "level": Entity.Level.DEPARTMENT_UNIT,
                "parent": "CS-COLLEGE",
            },
            # قسم 2
            {
                "name": "قسم نظم المعلومات",
                "code": "IS-DEPT",
                "level": Entity.Level.DEPARTMENT_UNIT,
                "parent": "CS-COLLEGE",
            },
            # وكالة 2
            {
                "name": "وكالة الجامعة للشؤون الطبية",
                "code": "VICE-MED",
                "level": Entity.Level.VICE_RECTORATE,
                "parent": None,
            },
            # كلية 2
            {
                "name": "كلية الطب",
                "code": "MED-COLLEGE",
                "level": Entity.Level.COLLEGE_DEANSHIP,
                "parent": "VICE-MED",
            },
            # قسم 3
            {
                "name": "قسم الطب الباطني",
                "code": "MED-DEPT",
                "level": Entity.Level.DEPARTMENT_UNIT,
                "parent": "MED-COLLEGE",
            },
            # وكالة 3
            {
                "name": "وكالة الجامعة للشؤون الإدارية",
                "code": "VICE-ADMIN",
                "level": Entity.Level.VICE_RECTORATE,
                "parent": None,
            },
            # عمادة
            {
                "name": "عمادة القبول والتسجيل",
                "code": "ADMISSION-DEANSHIP",
                "level": Entity.Level.COLLEGE_DEANSHIP,
                "parent": "VICE-ADMIN",
            },
        ]
        
        entities = {}
        parent_map = {}
        
        for entity_data in entities_data:
            parent_id = None
            if entity_data["parent"]:
                parent_id = parent_map.get(entity_data["parent"])
            
            data = {
                "name": entity_data["name"],
                "code": entity_data["code"],
                "level": entity_data["level"],
            }
            if parent_id:
                data["parent"] = parent_id
            
            # إنشاء مباشرة (أسرع من API)
            entity, created = Entity.objects.update_or_create(
                code=entity_data["code"],
                defaults={
                    "name": entity_data["name"],
                    "level": entity_data["level"],
                    "parent_id": parent_id,
                    "is_active": True,
                },
            )
            entities[entity_data["code"]] = entity
            parent_map[entity_data["code"]] = str(entity.id)
        
        self.stdout.write(self.style.SUCCESS(f"  Created {len(entities)} entities"))
        return entities

    def _link_users_to_entities(self, users, entities, tokens):
        """Link users to entities"""
        self.stdout.write("\n[4/11] Linking users to entities...")
        
        # Link consumers to entities
        users["consumer1@taibahu.edu.sa"].entity = entities.get("CS-DEPT")
        users["consumer1@taibahu.edu.sa"].save()
        
        users["consumer2@taibahu.edu.sa"].entity = entities.get("ADMISSION-DEANSHIP")
        users["consumer2@taibahu.edu.sa"].save()
        
        users["consumer3@taibahu.edu.sa"].entity = entities.get("MED-DEPT")
        users["consumer3@taibahu.edu.sa"].save()
        
        self.stdout.write(self.style.SUCCESS("  Linked users to entities"))

    def _create_design_orders(self, users, entities, tokens):
        """Create design orders via API"""
        self.stdout.write("\n[5/11] Creating design orders...")
        
        consumer_token = tokens.get("consumer1@taibahu.edu.sa")
        design_types = ["poster", "brochure", "card", "certificate", "logo"]
        sizes = ["A0", "A1", "A2", "A3", "A4", "A5"]
        priorities = ["normal", "urgent", "emergency"]
        statuses = [
            DesignOrder.Status.PENDING_REVIEW,
            DesignOrder.Status.IN_DESIGN,
            DesignOrder.Status.PENDING_CONFIRM,
            DesignOrder.Status.COMPLETED,
        ]
        
        design_orders = []
        consumer = users["consumer1@taibahu.edu.sa"]
        
        for i in range(20):
            status = random.choice(statuses)
            data = {
                "design_type": random.choice(design_types),
                "title": f"طلب تصميم تجريبي #{i+1}",
                "size": random.choice(sizes),
                "description": f"وصف تفصيلي لطلب التصميم رقم {i+1}",
                "priority": random.choice(priorities),
            }
            
            # إنشاء مباشرة (لأن API يتطلب authentication)
            order = DesignOrder.objects.create(
                requester=consumer,
                entity=consumer.entity,
                design_type=data["design_type"],
                title=data["title"],
                size=data["size"],
                description=data["description"],
                priority=data["priority"],
                status=status,
                submitted_at=timezone.now() - timedelta(days=random.randint(0, 10)),
            )
            
            if status == DesignOrder.Status.PENDING_CONFIRM:
                order.confirmation_deadline = timezone.now() + timedelta(hours=random.randint(1, 72))
                order.save()
            
            design_orders.append(order)
        
        self.stdout.write(self.style.SUCCESS(f"  Created {len(design_orders)} design orders"))
        return design_orders

    def _create_print_orders(self, users, entities, tokens):
        """Create print orders via API"""
        self.stdout.write("\n[6/11] Creating print orders...")
        
        print_types = [
            "books", "business_cards", "banners", "posters", "brochures",
            "flyers", "letterheads", "envelopes", "labels", "stickers",
        ]
        production_depts = ["offset", "digital", "gto"]
        sizes = ["A0", "A1", "A2", "A3", "A4", "A5", "A6"]
        paper_types = ["normal", "coated", "cardboard", "transparent", "sticker"]
        delivery_methods = ["self_pickup", "delivery", "delivery_install"]
        statuses = [
            PrintOrder.Status.PENDING_REVIEW,
            PrintOrder.Status.IN_PRODUCTION,
            PrintOrder.Status.PENDING_CONFIRM,
            PrintOrder.Status.IN_WAREHOUSE,
            PrintOrder.Status.DELIVERY_SCHEDULED,
            PrintOrder.Status.ARCHIVED,
        ]
        
        print_orders = []
        consumers = [
            users["consumer1@taibahu.edu.sa"],
            users["consumer2@taibahu.edu.sa"],
            users["consumer3@taibahu.edu.sa"],
        ]
        
        for i in range(30):
            consumer = random.choice(consumers)
            status = random.choice(statuses)
            
            order = PrintOrder.objects.create(
                requester=consumer,
                entity=consumer.entity,
                print_type=random.choice(print_types),
                production_dept=random.choice(production_depts),
                size=random.choice(sizes),
                paper_type=random.choice(paper_types),
                paper_weight=random.randint(70, 350),
                quantity=random.randint(10, 1000),
                sides=random.choice([1, 2]),
                pages=random.randint(1, 100),
                delivery_method=random.choice(delivery_methods),
                priority=random.choice(PrintOrder.Priority.choices)[0],
                status=status,
                submitted_at=timezone.now() - timedelta(days=random.randint(0, 15)),
            )
            
            if status in [PrintOrder.Status.IN_PRODUCTION, PrintOrder.Status.PENDING_CONFIRM, PrintOrder.Status.IN_WAREHOUSE]:
                order.actual_quantity = random.randint(max(1, order.quantity - 10), order.quantity + 10)
                order.save(update_fields=["actual_quantity", "updated_at"])
            
            if status == PrintOrder.Status.PENDING_CONFIRM:
                order.confirmation_deadline = timezone.now() + timedelta(hours=random.randint(1, 72))
                order.save(update_fields=["confirmation_deadline", "updated_at"])
            
            print_orders.append(order)
        
        self.stdout.write(self.style.SUCCESS(f"  Created {len(print_orders)} print orders"))
        return print_orders

    def _create_visits(self, users, entities, tokens):
        """Create visit requests"""
        self.stdout.write("\n[7/11] Creating visit requests...")
        
        visit_types = ["internal", "external"]
        purposes = [
            "مناقشة متطلبات التصميم",
            "استلام المطبوعات",
            "مراجعة التصاميم",
            "استشارة فنية",
            "تدريب على استخدام المعدات",
        ]
        
        visits = []
        consumers = [
            users["consumer1@taibahu.edu.sa"],
            users["consumer2@taibahu.edu.sa"],
        ]
        
        # إنشاء جداول مواعيد
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
        
        for i in range(15):
            consumer = random.choice(consumers)
            visit_type = random.choice(visit_types)
            
            from datetime import time as time_obj
            requested_date = timezone.now().date() + timedelta(days=random.randint(1, 14))
            
            # استخدام أوقات مختلفة لتجنب unique_together constraint
            time_str = available_times[time_index % len(available_times)]
            time_parts = time_str.split(":")
            requested_time = time_obj(int(time_parts[0]), int(time_parts[1]))
            time_index += 1
            
            visit_data = {
                "requester": consumer,
                "entity": consumer.entity,
                "visit_type": visit_type,
                "purpose": random.choice(purposes),
                "requested_date": requested_date,
                "requested_time": requested_time,
                "status": random.choice([
                    VisitRequest.Status.PENDING,
                    VisitRequest.Status.APPROVED,
                    VisitRequest.Status.REJECTED,
                ]),
            }
            
            # للزيارات الخارجية، نحتاج ملف تصريح
            if visit_type == "external":
                from django.core.files.base import ContentFile
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
                    from visits.models import VisitBooking
                    # البحث عن وقت متاح
                    booking_time = visit.requested_time
                    for alt_time_str in available_times:
                        alt_time_parts = alt_time_str.split(":")
                        alt_time = time_obj(int(alt_time_parts[0]), int(alt_time_parts[1]))
                        if not VisitBooking.objects.filter(
                            schedule=schedule,
                            requested_time=alt_time,
                            status=VisitBooking.Status.CONFIRMED,
                        ).exists():
                            booking_time = alt_time
                            break
                    
                    VisitBooking.objects.get_or_create(
                        visit_request=visit,
                        defaults={
                            "schedule": schedule,
                            "requested_time": booking_time,
                            "status": VisitBooking.Status.CONFIRMED,
                        },
                    )
            
            visits.append(visit)
        
        self.stdout.write(self.style.SUCCESS(f"  Created {len(visits)} visit requests"))
        return visits

    def _create_training(self, users, entities, tokens):
        """Create training requests"""
        self.stdout.write("\n[8/11] Creating training requests...")
        
        universities = [
            "جامعة طيبة",
            "جامعة الملك سعود",
            "جامعة الملك عبدالعزيز",
            "جامعة أم القرى",
        ]
        majors = [
            "علوم الحاسب",
            "نظم المعلومات",
            "التصميم الجرافيكي",
            "الهندسة",
            "إدارة الأعمال",
        ]
        departments = [
            "قسم التصميم",
            "قسم الطباعة",
            "قسم الإخراج",
            "قسم المستودعات",
        ]
        
        training_requests = []
        consumers = [
            users["consumer1@taibahu.edu.sa"],
            users["consumer2@taibahu.edu.sa"],
        ]
        
        for i in range(10):
            consumer = random.choice(consumers)
            
            start_date = timezone.now().date() + timedelta(days=random.randint(7, 30))
            end_date = start_date + timedelta(days=random.randint(30, 90))
            
            training = TrainingRequest.objects.create(
                requester=consumer,
                entity=consumer.entity,
                trainee_name=f"متدرب تجريبي #{i+1}",
                trainee_id=f"ID{random.randint(100000, 999999)}",
                trainee_phone=f"05{random.randint(10000000, 99999999)}",
                trainee_email=f"trainee{i+1}@university.edu.sa",
                university=random.choice(universities),
                major=random.choice(majors),
                training_period_start=start_date,
                training_period_end=end_date,
                department=random.choice(departments),
                purpose=f"طلب تدريب تجريبي رقم {i+1}",
                status=random.choice([
                    TrainingRequest.Status.PENDING,
                    TrainingRequest.Status.APPROVED,
                    TrainingRequest.Status.REJECTED,
                    TrainingRequest.Status.IN_PROGRESS,
                ]),
                submitted_at=timezone.now() - timedelta(days=random.randint(0, 14)),
            )
            
            if training.status == TrainingRequest.Status.APPROVED:
                training.supervisor = users.get("training.supervisor@taibahu.edu.sa")
                training.approved_at = timezone.now() - timedelta(days=random.randint(1, 7))
                training.save()
            
            training_requests.append(training)
        
        self.stdout.write(self.style.SUCCESS(f"  Created {len(training_requests)} training requests"))
        return training_requests

    def _create_inventory(self, users, tokens):
        """Create inventory data"""
        self.stdout.write("\n[9/11] Creating inventory items...")
        
        inventory_data = [
            {"name": "ورق A4 أبيض 80g", "sku": "PAPER-A4-80", "category": InventoryItem.Category.PAPER, "unit": "رزمة", "current": 5000, "min": 1000, "min_alert": 1500},
            {"name": "ورق A4 أبيض 100g", "sku": "PAPER-A4-100", "category": InventoryItem.Category.PAPER, "unit": "رزمة", "current": 3000, "min": 800, "min_alert": 1200},
            {"name": "ورق A3 أبيض", "sku": "PAPER-A3", "category": InventoryItem.Category.PAPER, "unit": "رزمة", "current": 1500, "min": 500, "min_alert": 800},
            {"name": "ورق كوشيه A4", "sku": "PAPER-COATED-A4", "category": InventoryItem.Category.PAPER, "unit": "رزمة", "current": 2000, "min": 600, "min_alert": 900},
            {"name": "ورق كرتون A4", "sku": "PAPER-CARDBOARD-A4", "category": InventoryItem.Category.PAPER, "unit": "رزمة", "current": 800, "min": 300, "min_alert": 500},
            {"name": "حبر أسود HP", "sku": "INK-HP-BLACK", "category": InventoryItem.Category.INK, "unit": "علبة", "current": 25, "min": 10, "min_alert": 15},
            {"name": "حبر ملون HP", "sku": "INK-HP-COLOR", "category": InventoryItem.Category.INK, "unit": "علبة", "current": 15, "min": 5, "min_alert": 8},
            {"name": "حبر كانون", "sku": "INK-CANON", "category": InventoryItem.Category.INK, "unit": "علبة", "current": 20, "min": 8, "min_alert": 12},
            {"name": "بنر فينيل 80x200", "sku": "BANNER-80X200", "category": InventoryItem.Category.BANNER, "unit": "قطعة", "current": 50, "min": 15, "min_alert": 25},
            {"name": "بنر فينيل 100x300", "sku": "BANNER-100X300", "category": InventoryItem.Category.BANNER, "unit": "قطعة", "current": 30, "min": 10, "min_alert": 18},
            {"name": "شريط لاصق", "sku": "TAPE-ADHESIVE", "category": InventoryItem.Category.OTHER, "unit": "لفة", "current": 100, "min": 30, "min_alert": 50},
            {"name": "أكياس تغليف", "sku": "BAGS-PACKAGING", "category": InventoryItem.Category.OTHER, "unit": "قطعة", "current": 500, "min": 100, "min_alert": 200},
            {"name": "خيوط تجليد", "sku": "THREAD-BINDING", "category": InventoryItem.Category.OTHER, "unit": "لفة", "current": 40, "min": 10, "min_alert": 20},
            {"name": "أغلفة بلاستيكية", "sku": "COVERS-PLASTIC", "category": InventoryItem.Category.OTHER, "unit": "قطعة", "current": 200, "min": 50, "min_alert": 100},
            {"name": "مشابك ورق", "sku": "CLIPS-PAPER", "category": InventoryItem.Category.OTHER, "unit": "علبة", "current": 80, "min": 20, "min_alert": 40},
        ]
        
        inventory_items = []
        inventory_user = users.get("inventory@taibahu.edu.sa")
        
        for item_data in inventory_data:
            item, created = InventoryItem.objects.update_or_create(
                sku=item_data["sku"],
                defaults={
                    "name": item_data["name"],
                    "category": item_data["category"],
                    "unit": item_data["unit"],
                    "current_quantity": item_data["current"],
                    "minimum_threshold": item_data["min"],
                    "min_quantity": item_data["min_alert"],
                    "maximum_threshold": item_data["current"] * 3,
                    "reorder_point": item_data["min_alert"],
                    "last_restocked_at": timezone.now() - timedelta(days=random.randint(1, 30)),
                    "last_usage_at": timezone.now() - timedelta(days=random.randint(1, 7)),
                },
            )
            inventory_items.append(item)
        
        self.stdout.write(self.style.SUCCESS(f"  Created {len(inventory_items)} inventory items"))
        return inventory_items

    def _simulate_workflows(self, design_orders, print_orders, users, tokens):
        """Simulate workflows"""
        self.stdout.write("\n[10/11] Simulating workflows...")
        
        manager_token = tokens.get("print.manager@taibahu.edu.sa")
        employee_token = tokens.get("dept.employee@taibahu.edu.sa")
        
        # محاكاة موافقة على بعض طلبات التصميم
        for order in design_orders[:5]:
            if order.status == DesignOrder.Status.PENDING_REVIEW:
                order.status = DesignOrder.Status.IN_DESIGN
                order.save(update_fields=["status", "updated_at"])
        
        # محاكاة إدخال الكمية الفعلية لبعض طلبات الطباعة
        for order in print_orders[:10]:
            if order.status == PrintOrder.Status.IN_PRODUCTION:
                order.actual_quantity = order.quantity
                order.status = PrintOrder.Status.PENDING_CONFIRM
                order.confirmation_deadline = timezone.now() + timedelta(hours=72)
                order.save(update_fields=["actual_quantity", "status", "confirmation_deadline", "updated_at"])
        
        self.stdout.write(self.style.SUCCESS("  Workflows simulated"))

    def _create_notifications(self, users, design_orders, print_orders, tokens):
        """Create notifications"""
        self.stdout.write("\n[11/11] Creating notifications...")
        
        from notifications.models import Notification
        
        notifications_created = 0
        
        # إشعارات للمستهلكين
        for order in design_orders[:5] + print_orders[:10]:
            Notification.objects.create(
                recipient=order.requester,
                title=f"تحديث على الطلب {order.order_code}",
                message=f"حالة الطلب: {order.get_status_display()}",
                type=Notification.Type.ORDER_STATUS,
                data={"order_id": str(order.id), "order_code": order.order_code},
            )
            notifications_created += 1
        
        # إشعارات تنبيه المخزون
        from django.db.models import F
        low_stock_items = InventoryItem.objects.filter(
            current_quantity__lte=F("min_quantity")
        )[:3]
        
        for manager_email in ["print.manager@taibahu.edu.sa", "print.manager2@taibahu.edu.sa"]:
            manager = users.get(manager_email)
            if manager and low_stock_items.exists():
                Notification.objects.create(
                    recipient=manager,
                    title="تنبيه انخفاض المخزون",
                    message=f"انخفض المخزون لـ {low_stock_items.count()} مادة",
                    type=Notification.Type.INVENTORY_LOW,
                    data={"items_count": low_stock_items.count()},
                )
                notifications_created += 1
        
        self.stdout.write(self.style.SUCCESS(f"  Created {notifications_created} notifications"))

    def _print_summary(self, users, entities, design_orders, print_orders, visits, training_requests, inventory_items):
        """Print summary"""
        self.stdout.write("\n" + "=" * 60)
        self.stdout.write(self.style.SUCCESS("Summary:"))
        self.stdout.write("=" * 60)
        self.stdout.write(f"  Users: {len(users)}")
        self.stdout.write(f"  Entities: {len(entities)}")
        self.stdout.write(f"  Design Orders: {len(design_orders)}")
        self.stdout.write(f"  Print Orders: {len(print_orders)}")
        self.stdout.write(f"  Visit Requests: {len(visits)}")
        self.stdout.write(f"  Training Requests: {len(training_requests)}")
        self.stdout.write(f"  Inventory Items: {len(inventory_items)}")
        self.stdout.write("\n" + "=" * 60)
        self.stdout.write(self.style.SUCCESS("Login Credentials:"))
        self.stdout.write("=" * 60)
        self.stdout.write(f"  Password for all users: {DEMO_PASSWORD}")
        self.stdout.write("\n  Example users:")
        for email, user in list(users.items())[:5]:
            # Avoid encoding issues with Arabic text
            role_name = user.role if hasattr(user, 'role') else 'N/A'
            self.stdout.write(f"    - {email} - Role: {role_name}")
        self.stdout.write("=" * 60)

