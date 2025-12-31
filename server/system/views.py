from django.db import models
from django.utils import timezone
from rest_framework import mixins, status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from accounts.permissions import IsPrintManager, IsSystemAdmin
from catalog.models import Service, ServiceField, ServiceFieldOption
from system.models import ApprovalPolicy, AuditLog, SystemSetting
from system.serializers import (
    ApprovalPolicySerializer,
    AuditLogSerializer,
    SystemSettingSerializer,
)


class SystemSettingViewSet(
    mixins.ListModelMixin,
    mixins.CreateModelMixin,
    mixins.UpdateModelMixin,
    viewsets.GenericViewSet,
):
    queryset = SystemSetting.objects.all()
    serializer_class = SystemSettingSerializer
    permission_classes = [IsAuthenticated & IsSystemAdmin]


class ApprovalPolicyViewSet(
    mixins.RetrieveModelMixin, mixins.UpdateModelMixin, viewsets.GenericViewSet
):
    queryset = ApprovalPolicy.objects.all()
    serializer_class = ApprovalPolicySerializer
    permission_classes = [IsAuthenticated & IsSystemAdmin]

    def get_object(self):
        policy, _ = ApprovalPolicy.objects.get_or_create()
        return policy
    
    @action(detail=False, methods=["get", "patch"])
    def current(self, request):
        """
        Get or update the current approval policy (singleton pattern)
        """
        policy, _ = ApprovalPolicy.objects.get_or_create()
        if request.method == "GET":
            serializer = self.get_serializer(policy)
            return Response(serializer.data)
        elif request.method == "PATCH":
            serializer = self.get_serializer(policy, data=request.data, partial=True)
            serializer.is_valid(raise_exception=True)
            serializer.save(updated_by=request.user)
            return Response(serializer.data)


class AuditLogViewSet(mixins.ListModelMixin, viewsets.GenericViewSet):
    queryset = AuditLog.objects.select_related("actor").all()
    serializer_class = AuditLogSerializer
    permission_classes = [IsAuthenticated & IsSystemAdmin]
    
    def get_queryset(self):
        queryset = AuditLog.objects.select_related("actor").all()
        
        # فلترة حسب البحث
        search = self.request.query_params.get("search")
        if search:
            queryset = queryset.filter(action__icontains=search)
        
        # فلترة حسب المستخدم
        actor_id = self.request.query_params.get("actor")
        if actor_id:
            queryset = queryset.filter(actor_id=actor_id)
        
        # فلترة حسب التاريخ
        start_date = self.request.query_params.get("start_date")
        end_date = self.request.query_params.get("end_date")
        if start_date:
            try:
                from datetime import datetime
                start_dt = timezone.make_aware(datetime.strptime(start_date, "%Y-%m-%d"))
                queryset = queryset.filter(created_at__gte=start_dt)
            except ValueError:
                pass
        if end_date:
            try:
                from datetime import datetime, timedelta
                end_dt = timezone.make_aware(datetime.strptime(end_date, "%Y-%m-%d") + timedelta(days=1) - timedelta(seconds=1))
                queryset = queryset.filter(created_at__lte=end_dt)
            except ValueError:
                pass
        
        return queryset.order_by("-created_at")


class FieldSettingsViewSet(viewsets.ViewSet):
    """
    ViewSet لإدارة إعدادات الحقول (إخفاء/إظهار، الإلزامية، الخيارات)
    """
    permission_classes = [IsAuthenticated & IsPrintManager]
    
    @action(detail=False, methods=["get"], url_path="list")
    def list_fields(self, request):
        """إرجاع جميع إعدادات الحقول"""
        fields = ServiceField.objects.select_related("service").prefetch_related("options").all()
        result = []
        for field in fields:
            result.append({
                "id": str(field.id),
                "service_id": str(field.service.id),
                "service_name": field.service.name,
                "key": field.key,
                "label": field.label,
                "field_type": field.field_type,
                "order": field.order,
                "is_required": field.is_required,
                "is_visible": field.is_visible,
                "options": [
                    {
                        "id": str(opt.id),
                        "label": opt.label,
                        "value": opt.value,
                        "is_active": opt.is_active,
                        "order": opt.order,
                    }
                    for opt in field.options.all()
                ],
            })
        return Response(result)
    
    @action(detail=False, methods=["put"], url_path="update/(?P<field_id>[^/.]+)")
    def update_field(self, request, field_id=None):
        """تحديث إعدادات حقل معين"""
        try:
            field = ServiceField.objects.get(id=field_id)
        except ServiceField.DoesNotExist:
            return Response(
                {"detail": "الحقل غير موجود."},
                status=status.HTTP_404_NOT_FOUND,
            )
        
        # تحديث الإعدادات الأساسية
        if "is_visible" in request.data:
            field.is_visible = request.data["is_visible"]
        if "is_required" in request.data:
            field.is_required = request.data["is_required"]
        if "order" in request.data:
            field.order = request.data["order"]
        if "label" in request.data:
            field.label = request.data["label"]
        
        field.save()
        
        # تحديث الخيارات (لحقول radio)
        if "options" in request.data and field.field_type == ServiceField.FieldType.RADIO:
            options_data = request.data["options"]
            for opt_data in options_data:
                if "id" in opt_data:
                    # تحديث خيار موجود
                    try:
                        option = ServiceFieldOption.objects.get(id=opt_data["id"], field=field)
                        if "is_active" in opt_data:
                            option.is_active = opt_data["is_active"]
                        if "label" in opt_data:
                            option.label = opt_data["label"]
                        if "order" in opt_data:
                            option.order = opt_data["order"]
                        option.save()
                    except ServiceFieldOption.DoesNotExist:
                        pass
                else:
                    # إنشاء خيار جديد
                    ServiceFieldOption.objects.create(
                        field=field,
                        label=opt_data.get("label", ""),
                        value=opt_data.get("value", ""),
                        is_active=opt_data.get("is_active", True),
                        order=opt_data.get("order", 1),
                    )
        
        return Response({"detail": "تم التحديث بنجاح."})


class ServiceSettingsViewSet(viewsets.ViewSet):
    """
    ViewSet لإدارة إعدادات الخدمات (إخفاء/إظهار)
    """
    permission_classes = [IsAuthenticated & IsPrintManager]
    
    @action(detail=False, methods=["get"], url_path="list")
    def list_services(self, request):
        """إرجاع جميع الخدمات مع حالة الإظهار"""
        services = Service.objects.all()
        result = []
        for service in services:
            result.append({
                "id": str(service.id),
                "name": service.name,
                "slug": service.slug,
                "category": service.category,
                "is_active": service.is_active,
                "description": service.description,
            })
        return Response(result)
    
    @action(detail=False, methods=["put"], url_path="update/(?P<service_id>[^/.]+)")
    def update_service(self, request, service_id=None):
        """تحديث إعدادات خدمة معينة"""
        try:
            service = Service.objects.get(id=service_id)
        except Service.DoesNotExist:
            return Response(
                {"detail": "الخدمة غير موجودة."},
                status=status.HTTP_404_NOT_FOUND,
            )
        
        if "is_active" in request.data:
            service.is_active = request.data["is_active"]
        if "name" in request.data:
            service.name = request.data["name"]
        if "description" in request.data:
            service.description = request.data["description"]
        
        service.save()
        return Response({"detail": "تم التحديث بنجاح."})


class AdminOverviewViewSet(viewsets.ViewSet):
    """
    ViewSet لإحصائيات لوحة المدير التنفيذية
    """
    permission_classes = [IsAuthenticated & (IsPrintManager | IsSystemAdmin)]
    
    @action(detail=False, methods=["get"])
    def stats(self, request):
        """إحصائيات شاملة للمدير"""
        from orders.models import Order, DesignOrder, PrintOrder
        from inventory.models import InventoryItem
        from catalog.models import ServicePricing
        from django.db.models import Q, Count, Sum
        from decimal import Decimal
        
        # إحصائيات الطلبات
        all_orders = Order.objects.all()
        all_design_orders = DesignOrder.objects.all()
        all_print_orders = PrintOrder.objects.all()
        
        # الطلبات النشطة (كل الطلبات ما عدا المرفوضة والملغاة والمؤرشفة)
        active_orders = (
            all_orders.exclude(status__in=[Order.Status.REJECTED, Order.Status.CANCELLED, Order.Status.ARCHIVED]).count() +
            all_design_orders.exclude(status__in=[DesignOrder.Status.REJECTED, DesignOrder.Status.CANCELLED, DesignOrder.Status.ARCHIVED]).count() +
            all_print_orders.exclude(status__in=[PrintOrder.Status.REJECTED, PrintOrder.Status.CANCELLED, PrintOrder.Status.ARCHIVED]).count()
        )
        
        # طلبات بانتظار الاعتماد
        pending_approvals = (
            all_orders.filter(status__in=[Order.Status.PENDING, Order.Status.IN_REVIEW]).count() +
            all_design_orders.filter(status__in=[DesignOrder.Status.PENDING, DesignOrder.Status.IN_REVIEW]).count() +
            all_print_orders.filter(status__in=[PrintOrder.Status.PENDING, PrintOrder.Status.IN_REVIEW]).count()
        )
        
        # تنبيهات المخزون (عناصر منخفضة المخزون)
        inventory_alerts = InventoryItem.objects.filter(
            current_quantity__lte=models.F("min_quantity")
        ).count()
        
        # حساب نسبة التوفير من ServicePricing
        savings_percentage = 0
        try:
            pricing_items = ServicePricing.objects.filter(
                internal_cost__gt=0,
                external_cost__gt=0
            )
            if pricing_items.exists():
                total_savings = Decimal(0)
                total_external = Decimal(0)
                for item in pricing_items:
                    if item.external_cost > item.internal_cost:
                        savings = item.external_cost - item.internal_cost
                        total_savings += savings
                        total_external += item.external_cost
                if total_external > 0:
                    savings_percentage = float((total_savings / total_external) * 100)
        except Exception:
            savings_percentage = 0
        
        return Response({
            "active_orders": active_orders,
            "pending_approvals": pending_approvals,
            "inventory_alerts": inventory_alerts,
            "savings_percentage": round(savings_percentage, 1),
        })


class ReportsViewSet(viewsets.ViewSet):
    """
    ViewSet للتقارير المحسّنة مع الفلاتر المتقدمة
    """
    permission_classes = [IsAuthenticated & (IsPrintManager | IsSystemAdmin)]
    
    @action(detail=False, methods=["get"])
    def orders(self, request):
        """تقرير الطلبات مع فلترة متقدمة"""
        from orders.models import Order, DesignOrder, PrintOrder
        from entities.models import Entity
        from django.db.models import Count, Sum, Q
        from datetime import datetime, timedelta
        
        # الفلاتر
        entity_id = request.query_params.get("entity")
        college_id = request.query_params.get("college")
        vice_rectorate_id = request.query_params.get("vice_rectorate")
        start_date = request.query_params.get("start_date")
        end_date = request.query_params.get("end_date")
        order_type = request.query_params.get("order_type")  # design, print, general
        
        # بناء الاستعلام
        filters = Q()
        
        # فلترة حسب الجهة
        if entity_id:
            filters &= Q(entity_id=entity_id)
        elif college_id:
            # جميع الأقسام التابعة للكلية
            college = Entity.objects.get(id=college_id)
            department_ids = [dept.id for dept in college.get_all_children()]
            filters &= Q(entity_id__in=department_ids)
        elif vice_rectorate_id:
            # جميع الجهات التابعة للوكالة
            vice_rectorate = Entity.objects.get(id=vice_rectorate_id)
            all_entities = [vice_rectorate.id] + [e.id for e in vice_rectorate.get_all_children()]
            filters &= Q(entity_id__in=all_entities)
        
        # فلترة حسب التاريخ (مع timezone)
        if start_date:
            try:
                start_dt = timezone.make_aware(datetime.strptime(start_date, "%Y-%m-%d"))
                filters &= Q(created_at__gte=start_dt)
            except ValueError:
                pass
        if end_date:
            try:
                # إضافة 23:59:59 لليوم الأخير
                end_dt = timezone.make_aware(datetime.strptime(end_date, "%Y-%m-%d") + timedelta(days=1) - timedelta(seconds=1))
                filters &= Q(created_at__lte=end_dt)
            except ValueError:
                pass
        
        result = {
            "summary": {},
            "by_status": {},
            "by_entity": {},
        }
        
        # تقارير حسب النوع
        if not order_type or order_type == "design":
            design_orders = DesignOrder.objects.filter(filters)
            result["design"] = {
                "total": design_orders.count(),
                "by_status": dict(design_orders.values("status").annotate(count=Count("id")).values_list("status", "count")),
            }
        
        if not order_type or order_type == "print":
            print_orders = PrintOrder.objects.filter(filters)
            result["print"] = {
                "total": print_orders.count(),
                "by_status": dict(print_orders.values("status").annotate(count=Count("id")).values_list("status", "count")),
            }
        
        if not order_type or order_type == "general":
            general_orders = Order.objects.filter(filters)
            result["general"] = {
                "total": general_orders.count(),
                "by_status": dict(general_orders.values("status").annotate(count=Count("id")).values_list("status", "count")),
            }
        
        # إحصائيات إضافية
        total_all = sum([
            result.get("design", {}).get("total", 0),
            result.get("print", {}).get("total", 0),
            result.get("general", {}).get("total", 0),
        ])
        result["summary"] = {
            "total_orders": total_all,
            "filter_applied": bool(entity_id or start_date or end_date or order_type),
        }
        
        return Response(result)
    
    @action(detail=False, methods=["get"])
    def productivity(self, request):
        """تقرير الإنتاجية اليومية"""
        from orders.models import DesignOrder, PrintOrder
        from django.db.models import Count
        from datetime import datetime, timedelta
        
        date_str = request.query_params.get("date")
        if not date_str:
            target_date = timezone.now().date()
        else:
            try:
                target_date = datetime.strptime(date_str, "%Y-%m-%d").date()
            except ValueError:
                target_date = timezone.now().date()
        
        # استخدام timezone-aware datetime
        start_of_day = timezone.make_aware(datetime.combine(target_date, datetime.min.time()))
        end_of_day = timezone.make_aware(datetime.combine(target_date, datetime.max.time()))
        
        # طلبات التصميم المكتملة في هذا اليوم
        design_completed = DesignOrder.objects.filter(
            completed_at__gte=start_of_day,
            completed_at__lte=end_of_day,
            status=DesignOrder.Status.COMPLETED,
        ).count()
        
        # طلبات الطباعة المكتملة في هذا اليوم
        print_completed = PrintOrder.objects.filter(
            completed_at__gte=start_of_day,
            completed_at__lte=end_of_day,
            status__in=[PrintOrder.Status.ARCHIVED, PrintOrder.Status.DELIVERY_SCHEDULED],
        ).count()
        
        # إحصائيات إضافية
        design_pending = DesignOrder.objects.filter(
            created_at__gte=start_of_day,
            created_at__lte=end_of_day,
        ).exclude(status=DesignOrder.Status.COMPLETED).count()
        
        print_pending = PrintOrder.objects.filter(
            created_at__gte=start_of_day,
            created_at__lte=end_of_day,
        ).exclude(status__in=[PrintOrder.Status.ARCHIVED, PrintOrder.Status.DELIVERY_SCHEDULED]).count()
        
        return Response({
            "date": target_date.isoformat(),
            "design_completed": design_completed,
            "print_completed": print_completed,
            "design_pending": design_pending,
            "print_pending": print_pending,
            "total_completed": design_completed + print_completed,
            "total_pending": design_pending + print_pending,
        })
    
    @action(detail=False, methods=["get"])
    def inventory(self, request):
        """تقرير المخزون"""
        from inventory.models import InventoryItem, InventoryLog
        from django.db.models import Sum
        
        # العناصر منخفضة المخزون
        low_stock = InventoryItem.objects.filter(
            current_quantity__lte=models.F("min_quantity")
        )
        
        # حركة المخزون (آخر 30 يوم)
        from datetime import timedelta
        thirty_days_ago = timezone.now() - timedelta(days=30)
        inventory_movement = InventoryLog.objects.filter(
            created_at__gte=thirty_days_ago,
        ).values("operation").annotate(total=Sum("quantity")).values_list("operation", "total")
        
        return Response({
            "low_stock_items": [
                {
                    "id": str(item.id),
                    "name": item.name,
                    "current_quantity": item.current_quantity,
                    "min_quantity": item.min_quantity,
                }
                for item in low_stock
            ],
            "movement_last_30_days": dict(inventory_movement),
        })
    
    @action(detail=False, methods=["get"])
    def roi(self, request):
        """تقرير التوفير (ROI)"""
        from catalog.models import ServicePricing
        from orders.models import Order, DesignOrder, PrintOrder
        from django.db.models import Sum
        
        # TODO: حساب ROI بناءً على ServicePricing
        # هذا مثال بسيط - يحتاج تطوير أكثر
        
        return Response({
            "message": "تقرير ROI - قيد التطوير",
        })



