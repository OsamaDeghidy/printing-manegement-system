from django.db import transaction
from django.utils import timezone
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from accounts.permissions import IsPrintManager
from accounts.models import User
from .models import VisitBooking, VisitRequest, VisitSchedule
from .serializers import (
    VisitBookingSerializer,
    VisitRequestCreateSerializer,
    VisitRequestDetailSerializer,
    VisitRequestListSerializer,
    VisitScheduleSerializer,
)


class VisitRequestViewSet(viewsets.ModelViewSet):
    """
    ViewSet لإدارة طلبات الزيارات
    """
    queryset = VisitRequest.objects.select_related("requester", "entity").prefetch_related("booking").all()
    permission_classes = [IsAuthenticated]
    
    def get_serializer_class(self):
        if self.action == "list":
            return VisitRequestListSerializer
        if self.action == "create":
            return VisitRequestCreateSerializer
        return VisitRequestDetailSerializer
    
    def get_queryset(self):
        user = self.request.user
        qs = super().get_queryset()
        # المديرون وموظفو المطبعة يمكنهم متابعة جميع الزيارات
        if user.is_print_manager or user.is_dept_employee:
            return qs
        return qs.filter(requester=user)
    
    def perform_create(self, serializer):
        serializer.save(requester=self.request.user)
    
    @transaction.atomic
    @action(
        detail=True,
        methods=["post"],
        permission_classes=[IsAuthenticated & IsPrintManager],
    )
    def approve(self, request, pk=None):
        """موافقة المدير على طلب الزيارة"""
        visit_request = self.get_object()
        if visit_request.status != VisitRequest.Status.PENDING:
            return Response(
                {"detail": "الطلب ليس في حالة انتظار المراجعة."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        
        # للزيارات الخارجية، تحتاج موافقة الأمن أيضاً
        if visit_request.visit_type == VisitRequest.VisitType.EXTERNAL:
            visit_request.status = VisitRequest.Status.PENDING  # يبقى في انتظار الأمن
        else:
            visit_request.status = VisitRequest.Status.APPROVED
            visit_request.approved_at = timezone.now()
        
        visit_request.manager_comment = request.data.get("comment", "")
        visit_request.save(update_fields=["status", "approved_at", "manager_comment", "updated_at"])
        return Response(VisitRequestDetailSerializer(visit_request).data)
    
    @transaction.atomic
    @action(
        detail=True,
        methods=["post"],
        permission_classes=[IsAuthenticated & IsPrintManager],
    )
    def reject(self, request, pk=None):
        """رفض طلب الزيارة"""
        visit_request = self.get_object()
        visit_request.status = VisitRequest.Status.REJECTED
        visit_request.manager_comment = request.data.get("comment", "")
        visit_request.save(update_fields=["status", "manager_comment", "updated_at"])
        return Response(VisitRequestDetailSerializer(visit_request).data)
    
    @transaction.atomic
    @action(
        detail=True,
        methods=["post"],
        permission_classes=[IsAuthenticated & IsPrintManager],
    )
    def postpone(self, request, pk=None):
        """تأجيل طلب الزيارة"""
        visit_request = self.get_object()
        new_date = request.data.get("new_date")
        if not new_date:
            return Response(
                {"detail": "يجب تحديد تاريخ جديد."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        visit_request.requested_date = new_date
        visit_request.status = VisitRequest.Status.POSTPONED
        visit_request.manager_comment = request.data.get("comment", "")
        visit_request.save(update_fields=["requested_date", "status", "manager_comment", "updated_at"])
        return Response(VisitRequestDetailSerializer(visit_request).data)


class VisitScheduleViewSet(viewsets.ModelViewSet):
    """
    ViewSet لإدارة جداول المواعيد (للمدير فقط)
    """
    queryset = VisitSchedule.objects.all()
    permission_classes = [IsAuthenticated & IsPrintManager]
    serializer_class = VisitScheduleSerializer
    
    @action(detail=False, methods=["get"], permission_classes=[IsAuthenticated])
    def available(self, request):
        """إرجاع المواعيد المتاحة (متاح لجميع المستخدمين)"""
        date = request.query_params.get("date")
        visit_type = request.query_params.get("visit_type")
        
        if not date:
            return Response(
                {"detail": "يجب تحديد التاريخ."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        
        try:
            schedule = VisitSchedule.objects.get(date=date)
        except VisitSchedule.DoesNotExist:
            return Response({"available_slots": []})
        
        available_slots = []
        for slot in schedule.available_slots:
            if schedule.is_available(slot, visit_type):
                available_slots.append(slot)
        
        return Response({"available_slots": available_slots})
    
    @action(detail=False, methods=["get"], permission_classes=[IsAuthenticated])
    def available_dates(self, request):
        """إرجاع التواريخ المتاحة مع المواعيد المتاحة لكل تاريخ"""
        visit_type = request.query_params.get("visit_type", "internal")
        start_date = request.query_params.get("start_date")
        end_date = request.query_params.get("end_date")
        
        # Default: next 30 days
        from datetime import timedelta, datetime
        if not start_date:
            start_date = timezone.now().date()
        else:
            try:
                start_date = datetime.strptime(start_date, "%Y-%m-%d").date()
            except ValueError:
                start_date = timezone.now().date()
        
        if not end_date:
            end_date = start_date + timedelta(days=30)
        else:
            try:
                end_date = datetime.strptime(end_date, "%Y-%m-%d").date()
            except ValueError:
                end_date = start_date + timedelta(days=30)
        
        # Get all schedules in the date range
        schedules = VisitSchedule.objects.filter(
            date__gte=start_date,
            date__lte=end_date
        ).order_by("date")
        
        available_dates = []
        for schedule in schedules:
            if schedule.is_blocked:
                continue
            
            if schedule.visit_type_restriction and visit_type != schedule.visit_type_restriction:
                continue
            
            # Get available slots for this date
            available_slots = []
            for slot in schedule.available_slots:
                if schedule.is_available(slot, visit_type):
                    available_slots.append(slot)
            
            if available_slots:
                available_dates.append({
                    "date": schedule.date.strftime("%m/%d/%Y"),
                    "date_iso": schedule.date.isoformat(),
                    "available_slots": available_slots,
                })
        
        return Response({"available_dates": available_dates})


class VisitBookingViewSet(viewsets.ModelViewSet):
    """
    ViewSet لإدارة حجوزات المواعيد
    """
    queryset = VisitBooking.objects.select_related("visit_request", "schedule").all()
    permission_classes = [IsAuthenticated]
    serializer_class = VisitBookingSerializer
    
    def get_queryset(self):
        user = self.request.user
        qs = super().get_queryset()
        if user.is_print_manager:
            return qs
        return qs.filter(visit_request__requester=user)
    
    @transaction.atomic
    @action(
        detail=True,
        methods=["post"],
        permission_classes=[IsAuthenticated],
    )
    def check_in(self, request, pk=None):
        """تسجيل الحضور"""
        booking = self.get_object()
        if booking.checked_in_at:
            return Response(
                {"detail": "تم تسجيل الحضور مسبقاً."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        booking.checked_in_at = timezone.now()
        booking.status = VisitBooking.Status.COMPLETED
        booking.visit_request.status = VisitRequest.Status.COMPLETED
        booking.visit_request.save(update_fields=["status", "updated_at"])
        booking.save(update_fields=["checked_in_at", "status", "updated_at"])
        return Response(VisitBookingSerializer(booking).data)
