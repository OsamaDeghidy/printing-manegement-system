import uuid
from datetime import datetime, time as dt_time

from django.conf import settings
from django.core.exceptions import ValidationError
from django.db import models
from django.utils import timezone

User = settings.AUTH_USER_MODEL


def visit_permit_upload_path(instance, filename):
    return f"visits/permits/{instance.id}/{filename}"


class VisitRequest(models.Model):
    """
    نموذج طلب زيارة
    """
    
    class VisitType(models.TextChoices):
        INTERNAL = "internal", "زيارة داخلية"
        EXTERNAL = "external", "زيارة خارجية"
    
    class Status(models.TextChoices):
        PENDING = "pending", "بانتظار المراجعة"
        APPROVED = "approved", "موافق عليه"
        REJECTED = "rejected", "مرفوض"
        POSTPONED = "postponed", "مؤجل"
        CANCELLED = "cancelled", "ملغي"
        COMPLETED = "completed", "مكتمل"
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    requester = models.ForeignKey(
        User,
        on_delete=models.PROTECT,
        related_name="visit_requests",
        verbose_name="طالب الزيارة",
    )
    entity = models.ForeignKey(
        "entities.Entity",
        on_delete=models.PROTECT,
        related_name="visit_requests",
        null=True,
        blank=True,
        verbose_name="الجهة",
    )
    visit_type = models.CharField(
        "نوع الزيارة",
        max_length=20,
        choices=VisitType.choices,
    )
    purpose = models.TextField("الغرض من الزيارة")
    requested_date = models.DateField("التاريخ المطلوب")
    requested_time = models.TimeField("الوقت المطلوب")
    permit_file = models.FileField(
        "تصريح موقع ومختوم",
        upload_to=visit_permit_upload_path,
        blank=True,
        null=True,
        help_text="إلزامي للزيارات الخارجية",
    )
    status = models.CharField(
        "الحالة",
        max_length=20,
        choices=Status.choices,
        default=Status.PENDING,
    )
    manager_comment = models.TextField("ملاحظات المدير", blank=True)
    security_comment = models.TextField("ملاحظات الأمن", blank=True)
    submitted_at = models.DateTimeField("تاريخ التقديم", default=timezone.now)
    approved_at = models.DateTimeField("تاريخ الموافقة", null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = "طلب زيارة"
        verbose_name_plural = "طلبات الزيارات"
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["status", "requested_date"]),
            models.Index(fields=["visit_type", "status"]),
        ]
    
    def __str__(self):
        return f"{self.requester.full_name} - {self.requested_date}"
    
    def clean(self):
        """التحقق من صحة البيانات"""
        # التحقق من أن الزيارات الخارجية تتطلب تصريح
        if self.visit_type == self.VisitType.EXTERNAL and not self.permit_file:
            raise ValidationError("الزيارات الخارجية تتطلب إرفاق تصريح موقع ومختوم")
        
        # التحقق من أن التاريخ ليس في الماضي
        if self.requested_date and self.requested_date < timezone.now().date():
            raise ValidationError("لا يمكن حجز موعد في الماضي")
    
    def save(self, *args, **kwargs):
        # ربط الطلب بالجهة تلقائياً
        if not self.entity and self.requester and self.requester.entity:
            self.entity = self.requester.entity
        self.full_clean()
        super().save(*args, **kwargs)


class VisitSchedule(models.Model):
    """
    جدول المواعيد المتاحة (يديره مدير المطبعة)
    """
    
    class DayOfWeek(models.IntegerChoices):
        MONDAY = 0, "الإثنين"
        TUESDAY = 1, "الثلاثاء"
        WEDNESDAY = 2, "الأربعاء"
        THURSDAY = 3, "الخميس"
        FRIDAY = 4, "الجمعة"
        SATURDAY = 5, "السبت"
        SUNDAY = 6, "الأحد"
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    date = models.DateField("التاريخ", unique=True)
    is_blocked = models.BooleanField(
        "محجوز بالكامل",
        default=False,
        help_text="صيانة، إجازات، إلخ",
    )
    blocked_reason = models.CharField("سبب الحجب", max_length=255, blank=True)
    available_slots = models.JSONField(
        "المواعيد المتاحة",
        default=list,
        help_text="قائمة بأوقات المواعيد المتاحة (مثل: ['09:00', '10:00', '11:00'])",
    )
    visit_type_restriction = models.CharField(
        "تقييد نوع الزيارة",
        max_length=20,
        choices=VisitRequest.VisitType.choices,
        blank=True,
        null=True,
        help_text="تخصيص اليوم لنوع معين من الزيارات",
    )
    created_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="created_schedules",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = "جدول مواعيد"
        verbose_name_plural = "جداول المواعيد"
        ordering = ["date"]
    
    def __str__(self):
        return f"{self.date} - {'محجوز' if self.is_blocked else 'متاح'}"
    
    def is_available(self, time_slot: str, visit_type: str = None) -> bool:
        """التحقق من توفر موعد معين"""
        if self.is_blocked:
            return False
        
        if self.visit_type_restriction and visit_type != self.visit_type_restriction:
            return False
        
        if time_slot not in self.available_slots:
            return False
        
        # التحقق من عدم وجود حجز متضارب
        conflicting_booking = VisitBooking.objects.filter(
            schedule=self,
            requested_time=time_slot,
            status__in=[
                VisitBooking.Status.CONFIRMED,
                VisitBooking.Status.PENDING,
            ],
        ).exists()
        
        return not conflicting_booking


class VisitBooking(models.Model):
    """
    حجز موعد زيارة
    """
    
    class Status(models.TextChoices):
        PENDING = "pending", "بانتظار التأكيد"
        CONFIRMED = "confirmed", "مؤكد"
        CANCELLED = "cancelled", "ملغي"
        COMPLETED = "completed", "مكتمل"
        NO_SHOW = "no_show", "لم يحضر"
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    visit_request = models.OneToOneField(
        VisitRequest,
        on_delete=models.CASCADE,
        related_name="booking",
        verbose_name="طلب الزيارة",
    )
    schedule = models.ForeignKey(
        VisitSchedule,
        on_delete=models.PROTECT,
        related_name="bookings",
        verbose_name="الجدول",
    )
    requested_time = models.TimeField("الوقت المحجوز")
    status = models.CharField(
        "الحالة",
        max_length=20,
        choices=Status.choices,
        default=Status.PENDING,
    )
    checked_in_at = models.DateTimeField("وقت الحضور", null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = "حجز موعد"
        verbose_name_plural = "حجوزات المواعيد"
        ordering = ["schedule__date", "requested_time"]
        unique_together = ("schedule", "requested_time", "status")
    
    def __str__(self):
        return f"{self.visit_request.requester.full_name} - {self.schedule.date} {self.requested_time}"
    
    def clean(self):
        """التحقق من صحة الحجز"""
        if not self.schedule.is_available(self.requested_time.strftime("%H:%M"), self.visit_request.visit_type):
            raise ValidationError("الموعد غير متاح أو محجوز")
    
    def save(self, *args, **kwargs):
        self.full_clean()
        super().save(*args, **kwargs)
    
    @property
    def is_overdue(self) -> bool:
        """التحقق من تأخر الموعد (10 دقائق)"""
        if self.status != self.Status.CONFIRMED:
            return False
        
        visit_datetime = timezone.make_aware(
            datetime.combine(self.schedule.date, self.requested_time)
        )
        now = timezone.now()
        
        # إذا تجاوز الموعد بـ 10 دقائق ولم يتم الحضور
        if now > visit_datetime and (now - visit_datetime).total_seconds() > 600:
            if not self.checked_in_at:
                return True
        
        return False
