import uuid

from django.conf import settings
from django.db import models

User = settings.AUTH_USER_MODEL


class SystemSetting(models.Model):
    key = models.CharField("المفتاح", max_length=120, unique=True)
    value = models.JSONField("القيمة", default=dict, blank=True)
    description = models.CharField("الوصف", max_length=255, blank=True)
    updated_at = models.DateTimeField(auto_now=True)
    updated_by = models.ForeignKey(
        User, on_delete=models.SET_NULL, null=True, blank=True, verbose_name="المعدل"
    )

    class Meta:
        verbose_name = "إعداد نظام"
        verbose_name_plural = "إعدادات النظام"

    def __str__(self):
        return self.key


class ApprovalPolicy(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    is_global_enabled = models.BooleanField("تفعيل شامل", default=True)
    selective_services = models.ManyToManyField(
        "catalog.Service", blank=True, related_name="approval_policies"
    )
    updated_at = models.DateTimeField(auto_now=True)
    updated_by = models.ForeignKey(
        User, on_delete=models.SET_NULL, null=True, blank=True, related_name="+"
    )

    class Meta:
        verbose_name = "سياسة اعتماد"
        verbose_name_plural = "سياسات الاعتماد"

    def __str__(self):
        return "سياسة الاعتماد الحالية"


class AuditLog(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    actor = models.ForeignKey(
        User, on_delete=models.SET_NULL, null=True, blank=True, related_name="audit_logs"
    )
    action = models.CharField("الحدث", max_length=200)
    metadata = models.JSONField("بيانات إضافية", blank=True, default=dict)
    created_at = models.DateTimeField("التاريخ", auto_now_add=True)

    class Meta:
        verbose_name = "سجل تدقيق"
        verbose_name_plural = "سجل التدقيق"
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.action} - {self.created_at:%Y-%m-%d %H:%M}"


