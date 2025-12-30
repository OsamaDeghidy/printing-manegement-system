import uuid

from django.conf import settings
from django.db import models
from django.utils import timezone

User = settings.AUTH_USER_MODEL


class TrainingRequest(models.Model):
    """
    نموذج طلب التدريب التعاوني
    """
    
    class Status(models.TextChoices):
        PENDING = "pending", "بانتظار المراجعة"
        APPROVED = "approved", "موافق عليه"
        REJECTED = "rejected", "مرفوض"
        IN_PROGRESS = "in_progress", "قيد التنفيذ"
        COMPLETED = "completed", "مكتمل"
        CANCELLED = "cancelled", "ملغي"
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    requester = models.ForeignKey(
        User,
        on_delete=models.PROTECT,
        related_name="training_requests",
        verbose_name="طالب التدريب",
    )
    entity = models.ForeignKey(
        "entities.Entity",
        on_delete=models.PROTECT,
        related_name="training_requests",
        null=True,
        blank=True,
        verbose_name="الجهة",
    )
    trainee_name = models.CharField("اسم المتدرب", max_length=255)
    trainee_id = models.CharField("رقم الهوية/الجامعي", max_length=50)
    trainee_phone = models.CharField("رقم الجوال", max_length=25)
    trainee_email = models.EmailField("البريد الإلكتروني")
    university = models.CharField("الجامعة/المؤسسة", max_length=255)
    major = models.CharField("التخصص", max_length=255)
    training_period_start = models.DateField("بداية فترة التدريب")
    training_period_end = models.DateField("نهاية فترة التدريب")
    department = models.CharField(
        "القسم المطلوب",
        max_length=100,
        help_text="قسم التصميم، قسم الطباعة، إلخ",
    )
    purpose = models.TextField("الغرض من التدريب")
    status = models.CharField(
        "الحالة",
        max_length=20,
        choices=Status.choices,
        default=Status.PENDING,
    )
    supervisor = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="supervised_trainings",
        verbose_name="مشرف التدريب",
        limit_choices_to={"role": "training_supervisor"},
    )
    supervisor_comment = models.TextField("ملاحظات المشرف", blank=True)
    submitted_at = models.DateTimeField("تاريخ التقديم", default=timezone.now)
    approved_at = models.DateTimeField("تاريخ الموافقة", null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = "طلب تدريب"
        verbose_name_plural = "طلبات التدريب"
        ordering = ["-created_at"]
    
    def __str__(self):
        return f"{self.trainee_name} - {self.training_period_start}"
    
    def save(self, *args, **kwargs):
        # ربط الطلب بالجهة تلقائياً
        if not self.entity and self.requester and self.requester.entity:
            self.entity = self.requester.entity
        super().save(*args, **kwargs)


class TrainingEvaluation(models.Model):
    """
    تقييم التدريب (أسبوعي ونهائي)
    """
    
    class EvaluationType(models.TextChoices):
        WEEKLY = "weekly", "تقييم أسبوعي"
        FINAL = "final", "تقييم نهائي"
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    training_request = models.ForeignKey(
        TrainingRequest,
        on_delete=models.CASCADE,
        related_name="evaluations",
        verbose_name="طلب التدريب",
    )
    evaluation_type = models.CharField(
        "نوع التقييم",
        max_length=20,
        choices=EvaluationType.choices,
    )
    week_number = models.PositiveIntegerField(
        "رقم الأسبوع",
        null=True,
        blank=True,
        help_text="للتقييم الأسبوعي فقط",
    )
    attendance_score = models.PositiveIntegerField(
        "درجة الحضور",
        default=0,
        help_text="من 0 إلى 100",
    )
    performance_score = models.PositiveIntegerField(
        "درجة الأداء",
        default=0,
        help_text="من 0 إلى 100",
    )
    behavior_score = models.PositiveIntegerField(
        "درجة السلوك",
        default=0,
        help_text="من 0 إلى 100",
    )
    comments = models.TextField("ملاحظات", blank=True)
    evaluated_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="training_evaluations",
        verbose_name="المقيّم",
    )
    evaluated_at = models.DateTimeField("تاريخ التقييم", default=timezone.now)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = "تقييم تدريب"
        verbose_name_plural = "تقييمات التدريب"
        ordering = ["-evaluated_at"]
        unique_together = ("training_request", "evaluation_type", "week_number")
    
    def __str__(self):
        return f"{self.training_request.trainee_name} - {self.get_evaluation_type_display()}"
    
    @property
    def total_score(self):
        """إجمالي الدرجة"""
        return (self.attendance_score + self.performance_score + self.behavior_score) / 3
