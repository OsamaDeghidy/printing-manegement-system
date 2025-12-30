import uuid

from django.conf import settings
from django.db import models

User = settings.AUTH_USER_MODEL


class Notification(models.Model):
    class Type(models.TextChoices):
        ORDER_STATUS = "order_status", "تحديث حالة الطلب"
        APPROVAL = "approval", "قرار اعتماد"
        INVENTORY = "inventory_alert", "تنبيه مخزون"
        SYSTEM = "system", "إشعار نظامي"
        DEADLINE_WARNING = "deadline_warning", "تحذير انتهاء مهلة"
        READY_FOR_DELIVERY = "ready_for_delivery", "جاهز للتسليم"
        INVENTORY_LOW = "inventory_low", "انخفاض المخزون"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    recipient = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name="notifications", verbose_name="المتلقي"
    )
    title = models.CharField("العنوان", max_length=200)
    message = models.TextField("الرسالة")
    type = models.CharField("النوع", max_length=30, choices=Type.choices)
    data = models.JSONField("بيانات إضافية", blank=True, default=dict)
    is_read = models.BooleanField("تمت القراءة", default=False)
    created_at = models.DateTimeField("تاريخ الإنشاء", auto_now_add=True)
    read_at = models.DateTimeField("تاريخ القراءة", null=True, blank=True)

    class Meta:
        verbose_name = "إشعار"
        verbose_name_plural = "الإشعارات"
        ordering = ["-created_at"]

    def __str__(self):
        return self.title


class NotificationPreference(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.OneToOneField(
        User, on_delete=models.CASCADE, related_name="notification_preferences"
    )
    order_updates = models.BooleanField(default=True)
    approvals = models.BooleanField(default=True)
    inventory_alerts = models.BooleanField(default=False)
    weekly_digest = models.BooleanField(default=True)
    email_subscription = models.BooleanField(default=True)

    class Meta:
        verbose_name = "تفضيلات الإشعارات"
        verbose_name_plural = "تفضيلات الإشعارات"

    def __str__(self):
        return f"تفضيلات {self.user}"


