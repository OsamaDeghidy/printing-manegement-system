import uuid

from django.db import models
from django.utils.text import slugify


class Service(models.Model):
    class Category(models.TextChoices):
        DOCUMENTS = "documents", "المستندات الرسمية"
        DESIGN = "design", "التصميم والإبداع"
        MARKETING = "marketing", "الترويج والفعاليات"
        MEDICAL = "medical", "الخدمات الطبية"
        GENERAL = "general", "خدمات عامة"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField("اسم الخدمة", max_length=150, unique=True)
    slug = models.SlugField("المُعرف", max_length=160, unique=True, blank=True)
    description = models.TextField("الوصف", blank=True)
    icon = models.CharField("الأيقونة", max_length=10, blank=True)
    category = models.CharField(
        "التصنيف", max_length=32, choices=Category.choices, default=Category.GENERAL
    )
    is_active = models.BooleanField("مفعلة", default=True)
    requires_approval = models.BooleanField("يتطلب اعتماد", default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "خدمة"
        verbose_name_plural = "الخدمات"
        ordering = ["name"]

    def __str__(self):
        return self.name

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name, allow_unicode=True)
        super().save(*args, **kwargs)


class ServiceField(models.Model):
    class FieldType(models.TextChoices):
        TEXT = "text", "نص"
        NUMBER = "number", "عدد"
        RADIO = "radio", "اختيار واحد"
        TEXTAREA = "textarea", "نص متعدد"
        FILE = "file", "ملف"
        LINK = "link", "رابط"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    service = models.ForeignKey(
        Service, on_delete=models.CASCADE, related_name="fields", verbose_name="الخدمة"
    )
    key = models.CharField("المفتاح البرمجي", max_length=120)
    label = models.CharField("العنوان الظاهر", max_length=200)
    field_type = models.CharField(
        "نوع الحقل", max_length=20, choices=FieldType.choices, default=FieldType.TEXT
    )
    order = models.PositiveIntegerField("الترتيب", default=1)
    is_required = models.BooleanField("إلزامي", default=False)
    is_visible = models.BooleanField("ظاهر", default=True)
    placeholder = models.CharField("نص إرشادي", max_length=255, blank=True)
    help_text = models.CharField("وصف مختصر", max_length=255, blank=True)
    config = models.JSONField("إعدادات إضافية", blank=True, default=dict)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "حقل خدمة"
        verbose_name_plural = "حقول الخدمات"
        unique_together = ("service", "key")
        ordering = ["service", "order"]

    def __str__(self):
        return f"{self.service.name} • {self.label}"


class ServiceFieldOption(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    field = models.ForeignKey(
        ServiceField,
        on_delete=models.CASCADE,
        related_name="options",
        verbose_name="الحقل",
    )
    label = models.CharField("الخيار", max_length=150)
    value = models.CharField("القيمة البرمجية", max_length=150)
    is_active = models.BooleanField("مفعل", default=True)
    order = models.PositiveIntegerField("الترتيب", default=1)

    class Meta:
        verbose_name = "خيار حقل"
        verbose_name_plural = "خيارات الحقول"
        ordering = ["field", "order"]
        unique_together = ("field", "value")

    def __str__(self):
        return f"{self.field.label} → {self.label}"


class ServicePricing(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    service = models.ForeignKey(
        Service, on_delete=models.CASCADE, related_name="pricing", verbose_name="الخدمة"
    )
    internal_cost = models.DecimalField("التكلفة الداخلية", max_digits=8, decimal_places=2)
    external_cost = models.DecimalField("تكلفة السوق", max_digits=8, decimal_places=2)
    notes = models.CharField("ملاحظات", max_length=255, blank=True)
    effective_from = models.DateField("تاريخ السريان", null=True, blank=True)
    effective_to = models.DateField("تاريخ الانتهاء", null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "تسعيرة خدمة"
        verbose_name_plural = "تسعيرات الخدمات"
        ordering = ["-effective_from"]

    def __str__(self):
        return f"{self.service.name} - {self.internal_cost} ريال"


