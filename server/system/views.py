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


class AuditLogViewSet(mixins.ListModelMixin, viewsets.GenericViewSet):
    queryset = AuditLog.objects.select_related("actor").all()
    serializer_class = AuditLogSerializer
    permission_classes = [IsAuthenticated & IsSystemAdmin]


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


class ReportsViewSet(viewsets.ViewSet):
    """
    ViewSet للتقارير المحسّنة مع الفلاتر المتقدمة
    """
    permission_classes = [IsAuthenticated & IsPrintManager]
    
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
        
        # فلترة حسب التاريخ
        if start_date:
            filters &= Q(created_at__gte=start_date)
        if end_date:
            filters &= Q(created_at__lte=end_date)
        
        result = {
            "summary": {},
            "by_status": {},
            "by_entity": {},
        }
        
        # تقارير حسب النوع
        if order_type == "design" or not order_type:
            design_orders = DesignOrder.objects.filter(filters)
            result["design"] = {
                "total": design_orders.count(),
                "by_status": dict(design_orders.values("status").annotate(count=Count("id")).values_list("status", "count")),
            }
        
        if order_type == "print" or not order_type:
            print_orders = PrintOrder.objects.filter(filters)
            result["print"] = {
                "total": print_orders.count(),
                "by_status": dict(print_orders.values("status").annotate(count=Count("id")).values_list("status", "count")),
            }
        
        if order_type == "general" or not order_type:
            general_orders = Order.objects.filter(filters)
            result["general"] = {
                "total": general_orders.count(),
                "by_status": dict(general_orders.values("status").annotate(count=Count("id")).values_list("status", "count")),
            }
        
        return Response(result)
    
    @action(detail=False, methods=["get"])
    def productivity(self, request):
        """تقرير الإنتاجية اليومية"""
        from orders.models import DesignOrder, PrintOrder
        from django.db.models import Count
        from datetime import datetime, timedelta
        
        date = request.query_params.get("date")
        if not date:
            date = timezone.now().date()
        else:
            date = datetime.strptime(date, "%Y-%m-%d").date()
        
        # طلبات التصميم المكتملة في هذا اليوم
        design_completed = DesignOrder.objects.filter(
            completed_at__date=date,
            status=DesignOrder.Status.COMPLETED,
        ).count()
        
        # طلبات الطباعة المكتملة في هذا اليوم
        print_completed = PrintOrder.objects.filter(
            completed_at__date=date,
            status__in=[PrintOrder.Status.ARCHIVED, PrintOrder.Status.DELIVERY_SCHEDULED],
        ).count()
        
        return Response({
            "date": date.isoformat(),
            "design_completed": design_completed,
            "print_completed": print_completed,
            "total_completed": design_completed + print_completed,
        })
    
    @action(detail=False, methods=["get"])
    def inventory(self, request):
        """تقرير المخزون"""
        from inventory.models import InventoryItem, InventoryLog
        from django.db.models import Sum
        
        # العناصر منخفضة المخزون
        low_stock = InventoryItem.objects.filter(
            current_quantity__lte=models.F("min_quantity"),
            is_active=True,
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



