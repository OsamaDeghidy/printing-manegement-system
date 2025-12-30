import uuid

from django.contrib.auth.models import AbstractUser, BaseUserManager
from django.db import models
from django.conf import settings


class UserManager(BaseUserManager):
    use_in_migrations = True

    def _create_user(self, email: str, password: str, **extra_fields):
        if not email:
            raise ValueError("البريد الإلكتروني مطلوب لجميع المستخدمين.")
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_user(self, email: str, password: str | None = None, **extra_fields):
        extra_fields.setdefault("is_staff", False)
        extra_fields.setdefault("is_superuser", False)
        return self._create_user(email, password, **extra_fields)

    def create_superuser(self, email: str, password: str, **extra_fields):
        extra_fields.setdefault("is_staff", True)
        extra_fields.setdefault("is_superuser", True)
        extra_fields.setdefault("role", User.Role.ADMIN)

        if extra_fields.get("is_staff") is not True:
            raise ValueError("المشرف يجب أن يكون is_staff=True.")
        if extra_fields.get("is_superuser") is not True:
            raise ValueError("المشرف يجب أن يكون is_superuser=True.")

        return self._create_user(email, password, **extra_fields)


class User(AbstractUser):
    class Role(models.TextChoices):
        CONSUMER = "consumer", "مستهلك"
        PRINT_MANAGER = "print_manager", "مدير المطبعة"
        DEPT_MANAGER = "dept_manager", "مدير القسم"
        DEPT_EMPLOYEE = "dept_employee", "موظف القسم"
        TRAINING_SUPERVISOR = "training_supervisor", "مشرف التدريب"
        INVENTORY = "inventory", "مراقب مخزون"
        # الأدوار القديمة (للتوافق مع البيانات الموجودة)
        ADMIN = "admin", "مدير النظام"  # Deprecated - استخدام PRINT_MANAGER
        APPROVER = "approver", "معتمد"  # Deprecated
        STAFF = "staff", "موظف المطبعة"  # Deprecated - استخدام DEPT_EMPLOYEE
        REQUESTER = "requester", "مستخدم"  # Deprecated - استخدام CONSUMER

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    username = None  # نستخدم البريد كمعرف أساسي
    email = models.EmailField("البريد الإلكتروني", unique=True)
    full_name = models.CharField("الاسم الكامل", max_length=255)
    department = models.CharField("القسم / الجهة", max_length=255, blank=True)  # Deprecated - استخدام entity
    entity = models.ForeignKey(
        "entities.Entity",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="users",
        verbose_name="الجهة",
        help_text="الجهة التابعة لها المستخدم (يُحدد من Active Directory)",
    )
    phone_number = models.CharField("رقم التواصل", max_length=25, blank=True)
    role = models.CharField(
        "الدور",
        max_length=32,
        choices=Role.choices,
        default=Role.CONSUMER,
    )

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS: list[str] = []

    objects = UserManager()

    class Meta:
        verbose_name = "مستخدم"
        verbose_name_plural = "المستخدمون"
        ordering = ["full_name"]

    def __str__(self) -> str:
        return self.full_name or self.email

    @property
    def is_admin(self) -> bool:
        """للتوافق مع الكود القديم"""
        return (
            self.role in [self.Role.PRINT_MANAGER, self.Role.ADMIN]
            or self.is_superuser
        )
    
    @property
    def is_print_manager(self) -> bool:
        return self.role == self.Role.PRINT_MANAGER or self.is_superuser
    
    @property
    def is_dept_manager(self) -> bool:
        return self.role == self.Role.DEPT_MANAGER
    
    @property
    def is_dept_employee(self) -> bool:
        return self.role == self.Role.DEPT_EMPLOYEE
    
    @property
    def is_consumer(self) -> bool:
        return self.role == self.Role.CONSUMER
    
    @property
    def is_training_supervisor(self) -> bool:
        return self.role == self.Role.TRAINING_SUPERVISOR
    
    @property
    def is_approver(self) -> bool:
        """للتوافق مع الكود القديم"""
        return self.role in [self.Role.APPROVER, self.Role.PRINT_MANAGER]


