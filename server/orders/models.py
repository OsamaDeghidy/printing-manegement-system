import uuid
from datetime import datetime

from django.conf import settings
from django.db import models
from django.utils import timezone

from catalog.models import Service, ServiceField

User = settings.AUTH_USER_MODEL


def order_attachment_upload_path(instance, filename):
    return f"orders/{instance.order.order_code}/{filename}"


class Order(models.Model):
    class Status(models.TextChoices):
        DRAFT = "draft", "مسودة"
        PENDING = "pending", "بانتظار المراجعة"
        IN_REVIEW = "in_review", "قيد الاعتماد"
        APPROVED = "approved", "تم الاعتماد"
        IN_PRODUCTION = "in_production", "قيد الإنتاج"
        READY = "ready", "جاهز للتسليم"
        REJECTED = "rejected", "مرفوض"
        CANCELLED = "cancelled", "ملغي"

    class Priority(models.TextChoices):
        LOW = "low", "عادية"
        MEDIUM = "medium", "متوسطة"
        HIGH = "high", "عاجلة"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    order_code = models.CharField(
        "رقم الطلب",
        max_length=20,
        unique=True,
        editable=False,
        blank=True,
    )
    service = models.ForeignKey(
        Service, on_delete=models.PROTECT, related_name="orders", verbose_name="الخدمة"
    )
    requester = models.ForeignKey(
        User, on_delete=models.PROTECT, related_name="submitted_orders", verbose_name="مقدم الطلب"
    )
    department = models.CharField("القسم/الجهة", max_length=255, blank=True)  # Deprecated - استخدام entity
    entity = models.ForeignKey(
        "entities.Entity",
        on_delete=models.PROTECT,
        related_name="orders",
        null=True,
        blank=True,
        verbose_name="الجهة",
        help_text="الجهة المسجلة عليها الطلب (تُسجل آلياً من جهة المستخدم)",
    )
    status = models.CharField(
        "الحالة الحالية", max_length=20, choices=Status.choices, default=Status.PENDING
    )
    priority = models.CharField(
        "الأولوية", max_length=20, choices=Priority.choices, default=Priority.MEDIUM
    )
    requires_approval = models.BooleanField("يحتاج اعتماد", default=False)
    current_approver = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        related_name="pending_approvals",
        null=True,
        blank=True,
        verbose_name="المعتمد الحالي",
    )
    submitted_at = models.DateTimeField(default=timezone.now)
    approved_at = models.DateTimeField(null=True, blank=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    metadata = models.JSONField("بيانات إضافية", blank=True, default=dict)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "طلب"
        verbose_name_plural = "الطلبات"
        ordering = ["-created_at"]

    def __str__(self) -> str:
        return self.order_code

    def save(self, *args, **kwargs):
        if not self.order_code:
            self.order_code = self._generate_order_code()
        # ربط الطلب بالجهة تلقائياً من جهة المستخدم
        if not self.entity and self.requester and self.requester.entity:
            self.entity = self.requester.entity
        super().save(*args, **kwargs)

    @staticmethod
    def _generate_order_code() -> str:
        today = datetime.utcnow()
        prefix = f"TP-{today.strftime('%y%m%d')}"
        last_order = (
            Order.objects.filter(order_code__startswith=prefix)
            .order_by("-order_code")
            .first()
        )
        sequence = 1
        if last_order:
            last_sequence = int(last_order.order_code.split("-")[-1])
            sequence = last_sequence + 1
        return f"{prefix}-{sequence:04d}"


class OrderFieldValue(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    order = models.ForeignKey(
        Order, on_delete=models.CASCADE, related_name="field_values", verbose_name="الطلب"
    )
    field = models.ForeignKey(
        ServiceField,
        on_delete=models.PROTECT,
        related_name="order_values",
        verbose_name="الحقل",
    )
    value = models.JSONField("القيمة", blank=True, null=True)

    class Meta:
        verbose_name = "قيمة حقل"
        verbose_name_plural = "قيم الحقول"
        unique_together = ("order", "field")

    def __str__(self):
        return f"{self.order.order_code} • {self.field.label}"


class OrderAttachment(models.Model):
    class AttachmentType(models.TextChoices):
        FILE = "file", "ملف"
        LINK = "link", "رابط"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    order = models.ForeignKey(
        Order, on_delete=models.CASCADE, related_name="attachments", verbose_name="الطلب"
    )
    attachment_type = models.CharField(
        "نوع المرفق", max_length=10, choices=AttachmentType.choices
    )
    file = models.FileField("ملف", upload_to=order_attachment_upload_path, blank=True)
    link_url = models.URLField("رابط خارجي", blank=True)
    name = models.CharField("الاسم الظاهر", max_length=255, blank=True)
    size_bytes = models.PositiveIntegerField("الحجم بالبايت", null=True, blank=True)
    uploaded_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        related_name="uploaded_attachments",
        null=True,
        blank=True,
    )
    uploaded_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "مرفق طلب"
        verbose_name_plural = "مرفقات الطلبات"

    def __str__(self):
        return self.name or self.file.name if self.file else self.link_url


class OrderApproval(models.Model):
    class Decision(models.TextChoices):
        PENDING = "pending", "بانتظار القرار"
        APPROVED = "approved", "موافق عليه"
        REJECTED = "rejected", "مرفوض"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    order = models.ForeignKey(
        Order, on_delete=models.CASCADE, related_name="approvals", verbose_name="الطلب"
    )
    approver = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        related_name="approvals",
        null=True,
        verbose_name="المعتمد",
    )
    step = models.PositiveIntegerField("خطوة الاعتماد", default=1)
    decision = models.CharField(
        "القرار", max_length=20, choices=Decision.choices, default=Decision.PENDING
    )
    comment = models.TextField("ملاحظات المعتمد", blank=True)
    decided_at = models.DateTimeField("تاريخ القرار", null=True, blank=True)

    class Meta:
        verbose_name = "اعتماد طلب"
        verbose_name_plural = "اعتمادات الطلبات"
        ordering = ["order", "step"]

    def __str__(self):
        return f"{self.order.order_code} - {self.get_decision_display()}"


class OrderStatusLog(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    order = models.ForeignKey(
        Order, on_delete=models.CASCADE, related_name="status_history", verbose_name="الطلب"
    )
    status = models.CharField(
        "الحالة", max_length=20, choices=Order.Status.choices, default=Order.Status.PENDING
    )
    note = models.TextField("ملاحظة", blank=True)
    changed_by = models.ForeignKey(
        User, on_delete=models.SET_NULL, null=True, related_name="status_changes"
    )
    changed_at = models.DateTimeField("تاريخ التغيير", auto_now_add=True)

    class Meta:
        verbose_name = "سجل حالة"
        verbose_name_plural = "سجل الحالات"
        ordering = ["-changed_at"]

    def __str__(self):
        return f"{self.order.order_code} → {self.get_status_display()}"


def design_attachment_upload_path(instance, filename):
    return f"designs/{instance.design_order.order_code}/{filename}"


class DesignOrder(models.Model):
    """
    نموذج طلب التصميم (DES-01)
    سير العمل: PENDING_REVIEW → IN_DESIGN → PENDING_CONFIRM → COMPLETED
    """
    
    class DesignType(models.TextChoices):
        POSTER = "poster", "بوستر"
        BROCHURE = "brochure", "بروشور"
        CARD = "card", "كارت"
        CERTIFICATE = "certificate", "شهادة"
        LOGO = "logo", "شعار"
        OTHER = "other", "أخرى"
    
    class Status(models.TextChoices):
        PENDING_REVIEW = "pending_review", "بانتظار المراجعة"
        IN_DESIGN = "in_design", "قيد التصميم"
        PENDING_CONFIRM = "pending_confirm", "بانتظار التأكيد"
        COMPLETED = "completed", "مكتمل"
        SUSPENDED = "suspended", "معلق"
        REJECTED = "rejected", "مرفوض"
        RETURNED = "returned", "مرتجع"
    
    class Priority(models.TextChoices):
        NORMAL = "normal", "عادي"
        URGENT = "urgent", "عاجل"
        EMERGENCY = "emergency", "طارئ"
    
    class Size(models.TextChoices):
        A0 = "A0", "A0"
        A1 = "A1", "A1"
        A2 = "A2", "A2"
        A3 = "A3", "A3"
        A4 = "A4", "A4"
        A5 = "A5", "A5"
        A6 = "A6", "A6"
        CUSTOM = "custom", "مخصص"
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    order_code = models.CharField(
        "رقم الطلب",
        max_length=20,
        unique=True,
        editable=False,
        blank=True,
    )
    requester = models.ForeignKey(
        User,
        on_delete=models.PROTECT,
        related_name="design_orders",
        verbose_name="مقدم الطلب",
    )
    entity = models.ForeignKey(
        "entities.Entity",
        on_delete=models.PROTECT,
        related_name="design_orders",
        null=True,
        blank=True,
        verbose_name="الجهة",
    )
    design_type = models.CharField(
        "نوع التصميم",
        max_length=20,
        choices=DesignType.choices,
    )
    title = models.CharField("العنوان", max_length=200)
    size = models.CharField("الحجم", max_length=10, choices=Size.choices)
    custom_size = models.CharField("الحجم المخصص", max_length=100, blank=True)
    description = models.TextField("الوصف")
    priority = models.CharField(
        "الأولوية",
        max_length=20,
        choices=Priority.choices,
        default=Priority.NORMAL,
    )
    status = models.CharField(
        "الحالة",
        max_length=20,
        choices=Status.choices,
        default=Status.PENDING_REVIEW,
    )
    confirmed_at = models.DateTimeField("تاريخ التأكيد", null=True, blank=True)
    confirmation_deadline = models.DateTimeField("موعد انتهاء التأكيد", null=True, blank=True)
    submitted_at = models.DateTimeField("تاريخ التقديم", default=timezone.now)
    completed_at = models.DateTimeField("تاريخ الإكمال", null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = "طلب تصميم"
        verbose_name_plural = "طلبات التصميم"
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["status", "priority"]),
            models.Index(fields=["confirmation_deadline"]),
        ]
    
    def __str__(self):
        return self.order_code or f"DES-{self.id}"
    
    def save(self, *args, **kwargs):
        if not self.order_code:
            self.order_code = self._generate_order_code()
        # ربط الطلب بالجهة تلقائياً
        if not self.entity and self.requester and self.requester.entity:
            self.entity = self.requester.entity
        # تعيين موعد انتهاء التأكيد عند الانتقال إلى PENDING_CONFIRM
        if self.status == self.Status.PENDING_CONFIRM and not self.confirmation_deadline:
            from datetime import timedelta
            self.confirmation_deadline = timezone.now() + timedelta(hours=72)
        super().save(*args, **kwargs)
    
    @staticmethod
    def _generate_order_code() -> str:
        today = datetime.utcnow()
        prefix = f"DES-{today.strftime('%y%m%d')}"
        last_order = (
            DesignOrder.objects.filter(order_code__startswith=prefix)
            .order_by("-order_code")
            .first()
        )
        sequence = 1
        if last_order:
            last_sequence = int(last_order.order_code.split("-")[-1])
            sequence = last_sequence + 1
        return f"{prefix}-{sequence:04d}"
    
    @property
    def is_confirmation_expired(self):
        """التحقق من انتهاء مهلة التأكيد (72 ساعة)"""
        if self.status == self.Status.PENDING_CONFIRM and self.confirmation_deadline:
            return timezone.now() > self.confirmation_deadline
        return False


class DesignAttachment(models.Model):
    """مرفقات طلب التصميم"""
    
    class AttachmentType(models.TextChoices):
        FILE = "file", "ملف"
        LINK = "link", "رابط"
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    design_order = models.ForeignKey(
        DesignOrder,
        on_delete=models.CASCADE,
        related_name="attachments",
        verbose_name="طلب التصميم",
    )
    attachment_type = models.CharField(
        "نوع المرفق",
        max_length=10,
        choices=AttachmentType.choices,
    )
    file = models.FileField(
        "ملف",
        upload_to=design_attachment_upload_path,
        blank=True,
        help_text="PDF, PNG, AI, PSD - بحد أقصى 25MB",
    )
    link_url = models.URLField("رابط خارجي", blank=True)
    name = models.CharField("الاسم الظاهر", max_length=255, blank=True)
    size_bytes = models.PositiveIntegerField("الحجم بالبايت", null=True, blank=True)
    uploaded_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="uploaded_design_attachments",
    )
    uploaded_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        verbose_name = "مرفق طلب تصميم"
        verbose_name_plural = "مرفقات طلبات التصميم"
    
    def __str__(self):
        return self.name or (self.file.name if self.file else self.link_url)


def print_attachment_upload_path(instance, filename):
    return f"prints/{instance.print_order.order_code}/{filename}"


class PrintOrder(models.Model):
    """
    نموذج طلب الطباعة (PRT-01)
    سير العمل: PENDING_REVIEW → IN_PRODUCTION → PENDING_CONFIRM → IN_WAREHOUSE → DELIVERY_SCHEDULED → ARCHIVED
    """
    
    class PrintType(models.TextChoices):
        BOOKS = "books", "كتب"
        BUSINESS_CARDS = "business_cards", "كروت شخصية"
        BANNERS = "banners", "بانرات"
        POSTERS = "posters", "بوسترات"
        BROCHURES = "brochures", "بروشورات"
        FLYERS = "flyers", "منشورات"
        LETTERHEADS = "letterheads", "أوراق رسمية"
        ENVELOPES = "envelopes", "ظروف"
        LABELS = "labels", "ملصقات"
        STICKERS = "stickers", "ستيكر"
        CERTIFICATES = "certificates", "شهادات"
        FORMS = "forms", "نماذج"
        OTHER = "other", "أخرى"
    
    class ProductionDept(models.TextChoices):
        OFFSET = "offset", "أوفست"
        DIGITAL = "digital", "ديجيتال"
        GTO = "gto", "GTO"
    
    class Status(models.TextChoices):
        PENDING_REVIEW = "pending_review", "بانتظار المراجعة"
        IN_PRODUCTION = "in_production", "قيد الإنتاج"
        PENDING_CONFIRM = "pending_confirm", "بانتظار التأكيد"
        IN_WAREHOUSE = "in_warehouse", "في المستودع"
        DELIVERY_SCHEDULED = "delivery_scheduled", "تم حجز التسليم"
        ARCHIVED = "archived", "مؤرشف"
        REJECTED = "rejected", "مرفوض"
        CANCELLED = "cancelled", "ملغي"
    
    class Priority(models.TextChoices):
        NORMAL = "normal", "عادي"
        URGENT = "urgent", "عاجل"
        EMERGENCY = "emergency", "طارئ"
    
    class Size(models.TextChoices):
        A0 = "A0", "A0"
        A1 = "A1", "A1"
        A2 = "A2", "A2"
        A3 = "A3", "A3"
        A4 = "A4", "A4"
        A5 = "A5", "A5"
        A6 = "A6", "A6"
        A7 = "A7", "A7"
        CUSTOM = "custom", "مخصص"
    
    class PaperType(models.TextChoices):
        NORMAL = "normal", "عادي"
        COATED = "coated", "كوشيه"
        CARDBOARD = "cardboard", "كرتون"
        TRANSPARENT = "transparent", "شفاف"
        STICKER = "sticker", "ستيكر"
    
    class DeliveryMethod(models.TextChoices):
        SELF_PICKUP = "self_pickup", "استلام ذاتي"
        DELIVERY = "delivery", "توصيل"
        DELIVERY_INSTALL = "delivery_install", "توصيل + تركيب"
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    order_code = models.CharField(
        "رقم الطلب",
        max_length=20,
        unique=True,
        editable=False,
        blank=True,
    )
    requester = models.ForeignKey(
        User,
        on_delete=models.PROTECT,
        related_name="print_orders",
        verbose_name="مقدم الطلب",
    )
    entity = models.ForeignKey(
        "entities.Entity",
        on_delete=models.PROTECT,
        related_name="print_orders",
        null=True,
        blank=True,
        verbose_name="الجهة",
    )
    print_type = models.CharField(
        "نوع الطباعة",
        max_length=30,
        choices=PrintType.choices,
    )
    production_dept = models.CharField(
        "قسم الإنتاج",
        max_length=20,
        choices=ProductionDept.choices,
    )
    size = models.CharField("الحجم", max_length=10, choices=Size.choices)
    custom_size = models.CharField("الحجم المخصص", max_length=100, blank=True)
    paper_type = models.CharField(
        "نوع الورق",
        max_length=20,
        choices=PaperType.choices,
    )
    paper_weight = models.PositiveIntegerField(
        "وزن الورق (جرام)",
        help_text="70g - 350g",
    )
    quantity = models.PositiveIntegerField("الكمية المطلوبة")
    actual_quantity = models.PositiveIntegerField(
        "الكمية الفعلية المنفذة",
        null=True,
        blank=True,
        help_text="يُدخلها موظف القسم عند الإكمال (لخصم المخزون)",
    )
    sides = models.PositiveIntegerField(
        "عدد الأوجه",
        default=1,
        help_text="1 = وجه واحد، 2 = وجهين",
    )
    pages = models.PositiveIntegerField(
        "عدد الصفحات",
        default=1,
        help_text="عدد الصفحات في كل وجه",
    )
    delivery_method = models.CharField(
        "طريقة التسليم",
        max_length=20,
        choices=DeliveryMethod.choices,
    )
    status = models.CharField(
        "الحالة",
        max_length=20,
        choices=Status.choices,
        default=Status.PENDING_REVIEW,
    )
    priority = models.CharField(
        "الأولوية",
        max_length=20,
        choices=Priority.choices,
        default=Priority.NORMAL,
    )
    confirmed_at = models.DateTimeField("تاريخ التأكيد", null=True, blank=True)
    confirmation_deadline = models.DateTimeField("موعد انتهاء التأكيد", null=True, blank=True)
    submitted_at = models.DateTimeField("تاريخ التقديم", default=timezone.now)
    completed_at = models.DateTimeField("تاريخ الإكمال", null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = "طلب طباعة"
        verbose_name_plural = "طلبات الطباعة"
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["status", "priority"]),
            models.Index(fields=["production_dept", "status"]),
            models.Index(fields=["confirmation_deadline"]),
        ]
    
    def __str__(self):
        return self.order_code or f"PRT-{self.id}"
    
    def save(self, *args, **kwargs):
        if not self.order_code:
            self.order_code = self._generate_order_code()
        # ربط الطلب بالجهة تلقائياً
        if not self.entity and self.requester and self.requester.entity:
            self.entity = self.requester.entity
        # تعيين موعد انتهاء التأكيد عند الانتقال إلى PENDING_CONFIRM
        if self.status == self.Status.PENDING_CONFIRM and not self.confirmation_deadline:
            from datetime import timedelta
            self.confirmation_deadline = timezone.now() + timedelta(hours=72)
        super().save(*args, **kwargs)
    
    @staticmethod
    def _generate_order_code() -> str:
        today = datetime.utcnow()
        prefix = f"PRT-{today.strftime('%y%m%d')}"
        last_order = (
            PrintOrder.objects.filter(order_code__startswith=prefix)
            .order_by("-order_code")
            .first()
        )
        sequence = 1
        if last_order:
            last_sequence = int(last_order.order_code.split("-")[-1])
            sequence = last_sequence + 1
        return f"{prefix}-{sequence:04d}"
    
    @property
    def is_confirmation_expired(self):
        """التحقق من انتهاء مهلة التأكيد (72 ساعة)"""
        if self.status == self.Status.PENDING_CONFIRM and self.confirmation_deadline:
            return timezone.now() > self.confirmation_deadline
        return False
    
    def calculate_paper_consumption(self):
        """حساب كمية الأوراق المستهلكة"""
        if not self.actual_quantity:
            return 0
        return (self.sides * self.pages) * self.actual_quantity


class PrintAttachment(models.Model):
    """مرفقات طلب الطباعة"""
    
    class AttachmentType(models.TextChoices):
        FILE = "file", "ملف"
        LINK = "link", "رابط"
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    print_order = models.ForeignKey(
        PrintOrder,
        on_delete=models.CASCADE,
        related_name="attachments",
        verbose_name="طلب الطباعة",
    )
    attachment_type = models.CharField(
        "نوع المرفق",
        max_length=10,
        choices=AttachmentType.choices,
    )
    file = models.FileField(
        "ملف",
        upload_to=print_attachment_upload_path,
        blank=True,
    )
    link_url = models.URLField("رابط خارجي", blank=True)
    name = models.CharField("الاسم الظاهر", max_length=255, blank=True)
    size_bytes = models.PositiveIntegerField("الحجم بالبايت", null=True, blank=True)
    uploaded_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="uploaded_print_attachments",
    )
    uploaded_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        verbose_name = "مرفق طلب طباعة"
        verbose_name_plural = "مرفقات طلبات الطباعة"
    
    def __str__(self):
        return self.name or (self.file.name if self.file else self.link_url)


