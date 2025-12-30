import uuid

from django.db import models
from django.core.exceptions import ValidationError


class Entity(models.Model):
    """
    نموذج الجهة (Entity) مع هيكلية هرمية
    المستوى 1: الوكالة/القطاع (Vice-Rectorate)
    المستوى 2: الكلية/العمادة (College/Deanship)
    المستوى 3: القسم/الوحدة (Department/Unit)
    """
    
    class Level(models.TextChoices):
        VICE_RECTORATE = "vice_rectorate", "وكالة/قطاع"
        COLLEGE_DEANSHIP = "college_deanship", "كلية/عمادة"
        DEPARTMENT_UNIT = "department_unit", "قسم/وحدة"
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField("اسم الجهة", max_length=255)
    code = models.CharField("رمز الجهة", max_length=50, unique=True, blank=True, null=True)
    level = models.CharField(
        "المستوى الهرمي",
        max_length=20,
        choices=Level.choices,
        default=Level.DEPARTMENT_UNIT,
    )
    parent = models.ForeignKey(
        "self",
        on_delete=models.CASCADE,
        related_name="children",
        null=True,
        blank=True,
        verbose_name="الجهة الأم",
        help_text="الجهة الأعلى في الهيكل الهرمي",
    )
    is_active = models.BooleanField("نشط", default=True)
    description = models.TextField("الوصف", blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = "جهة"
        verbose_name_plural = "الجهات"
        ordering = ["level", "name"]
        indexes = [
            models.Index(fields=["level", "is_active"]),
            models.Index(fields=["parent"]),
        ]
    
    def __str__(self):
        return self.name
    
    def clean(self):
        """التحقق من صحة الهيكل الهرمي"""
        if self.parent:
            # المستوى 3 (قسم/وحدة) يجب أن يكون أبوه المستوى 2 (كلية/عمادة)
            if self.level == self.Level.DEPARTMENT_UNIT:
                if self.parent.level != self.Level.COLLEGE_DEANSHIP:
                    raise ValidationError(
                        "القسم/الوحدة يجب أن يكون تابعاً لكلية/عمادة"
                    )
            # المستوى 2 (كلية/عمادة) يجب أن يكون أبوه المستوى 1 (وكالة/قطاع)
            elif self.level == self.Level.COLLEGE_DEANSHIP:
                if self.parent.level != self.Level.VICE_RECTORATE:
                    raise ValidationError(
                        "الكلية/العمادة يجب أن تكون تابعة لوكالة/قطاع"
                    )
            # المستوى 1 (وكالة/قطاع) لا يجب أن يكون له أب
            elif self.level == self.Level.VICE_RECTORATE:
                if self.parent:
                    raise ValidationError("الوكالة/القطاع لا يمكن أن يكون له جهة أم")
        else:
            # فقط المستوى 1 يمكن أن يكون بدون أب
            if self.level != self.Level.VICE_RECTORATE:
                raise ValidationError(
                    "يجب تحديد الجهة الأم للكلية/العمادة والقسم/الوحدة"
                )
    
    def save(self, *args, **kwargs):
        self.full_clean()
        super().save(*args, **kwargs)
    
    @property
    def full_path(self):
        """إرجاع المسار الكامل للجهة في الهيكل الهرمي"""
        path = [self.name]
        current = self.parent
        while current:
            path.insert(0, current.name)
            current = current.parent
        return " / ".join(path)
    
    def get_all_children(self):
        """إرجاع جميع الأبناء (بما في ذلك الأحفاد)"""
        children = list(self.children.all())
        for child in self.children.all():
            children.extend(child.get_all_children())
        return children
    
    def get_vice_rectorate(self):
        """إرجاع الوكالة/القطاع الأعلى في الهيكل"""
        current = self
        while current.parent:
            current = current.parent
        return current if current.level == self.Level.VICE_RECTORATE else None
    
    def get_college_deanship(self):
        """إرجاع الكلية/العمادة التابعة لها"""
        if self.level == self.Level.COLLEGE_DEANSHIP:
            return self
        if self.level == self.Level.DEPARTMENT_UNIT and self.parent:
            return self.parent
        return None
