import uuid

from django.conf import settings
from django.db import models
from django.utils import timezone


User = settings.AUTH_USER_MODEL


class InventoryItem(models.Model):
    class Category(models.TextChoices):
        PAPER = "paper", "ورق"
        INK = "ink", "أحبار"
        BANNER = "banner", "بنرات"
        OTHER = "other", "مستهلكات أخرى"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField("اسم المادة", max_length=200, unique=True)
    sku = models.CharField("رمز المخزون", max_length=100, unique=True)
    category = models.CharField(
        "التصنيف", max_length=20, choices=Category.choices, default=Category.OTHER
    )
    unit = models.CharField("وحدة القياس", max_length=20, default="قطعة")
    current_quantity = models.PositiveIntegerField("الكمية الحالية", default=0)
    minimum_threshold = models.PositiveIntegerField("الحد الأدنى", default=0)
    min_quantity = models.PositiveIntegerField(
        "الحد الأدنى للتنبيه",
        default=0,
        help_text="عند وصول الكمية إلى هذا الحد، يتم إرسال تنبيه لمدير المطبعة",
    )
    maximum_threshold = models.PositiveIntegerField("الحد الأعلى", default=1000)
    reorder_point = models.PositiveIntegerField("نقطة إعادة الطلب", default=0)
    last_restocked_at = models.DateTimeField("آخر تزويد", null=True, blank=True)
    last_usage_at = models.DateTimeField("آخر استهلاك", null=True, blank=True)
    notes = models.TextField("ملاحظات", blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "مادة مخزون"
        verbose_name_plural = "مواد المخزون"
        ordering = ["name"]

    def __str__(self):
        return self.name

    @property
    def status(self) -> str:
        if self.current_quantity <= self.minimum_threshold:
            return "critical"
        if self.current_quantity <= max(self.minimum_threshold + 1, self.reorder_point):
            return "warning"
        return "ok"
    
    @property
    def is_low_stock(self) -> bool:
        """التحقق من انخفاض المخزون (أقل من الحد الأدنى للتنبيه)"""
        return self.current_quantity <= self.min_quantity


class InventoryLog(models.Model):
    class Operation(models.TextChoices):
        IN = "in", "إضافة"
        OUT = "out", "صرف"
        ADJUST = "adjust", "تعديل"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    item = models.ForeignKey(
        InventoryItem,
        on_delete=models.CASCADE,
        related_name="logs",
        verbose_name="المادة",
    )
    operation = models.CharField("العملية", max_length=10, choices=Operation.choices)
    quantity = models.IntegerField("الكمية")
    balance_after = models.IntegerField("الرصيد بعد العملية")
    reference_order = models.CharField("رقم الطلب المرجعي", max_length=50, blank=True)
    print_order = models.ForeignKey(
        "orders.PrintOrder",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="inventory_logs",
        verbose_name="طلب الطباعة",
        help_text="طلب الطباعة المرتبط بهذا الخصم",
    )
    performed_by = models.ForeignKey(
        User, on_delete=models.SET_NULL, null=True, blank=True, verbose_name="المستخدم"
    )
    note = models.CharField("ملاحظة", max_length=255, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "سجل مخزون"
        verbose_name_plural = "سجلات المخزون"
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.item.name} ({self.operation})"


class ReorderRequest(models.Model):
    class Status(models.TextChoices):
        PENDING = "pending", "قيد المراجعة"
        ORDERED = "ordered", "تم الطلب"
        RECEIVED = "received", "تم الاستلام"
        CANCELLED = "cancelled", "ملغي"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    item = models.ForeignKey(
        InventoryItem,
        on_delete=models.CASCADE,
        related_name="reorder_requests",
        verbose_name="المادة",
    )
    quantity = models.PositiveIntegerField("الكمية المطلوبة")
    status = models.CharField(
        "الحالة", max_length=20, choices=Status.choices, default=Status.PENDING
    )
    requested_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="inventory_requests",
        verbose_name="طالب التزويد",
    )
    approved_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="inventory_approvals",
        verbose_name="المعتمد",
    )
    requested_at = models.DateTimeField("تاريخ الطلب", default=timezone.now)
    approved_at = models.DateTimeField("تاريخ الاعتماد", null=True, blank=True)
    received_at = models.DateTimeField("تاريخ الاستلام", null=True, blank=True)
    notes = models.TextField("ملاحظات", blank=True)

    class Meta:
        verbose_name = "طلب تزويد مخزون"
        verbose_name_plural = "طلبات التزويد"
        ordering = ["-requested_at"]

    def __str__(self):
        return f"{self.item.name} × {self.quantity}"


