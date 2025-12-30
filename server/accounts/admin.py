from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin

from accounts.models import User


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    ordering = ("email",)
    list_display = ("email", "full_name", "role", "department", "is_active")
    list_filter = ("role", "is_active", "department")
    search_fields = ("email", "full_name", "department")
    fieldsets = (
        (None, {"fields": ("email", "password")}),
        ("المعلومات الشخصية", {"fields": ("full_name", "department", "phone_number")}),
        ("الصلاحيات", {"fields": ("role", "is_active", "is_staff", "is_superuser")}),
        ("التواريخ", {"fields": ("last_login", "date_joined")}),
    )
    add_fieldsets = (
        (
            None,
            {
                "classes": ("wide",),
                "fields": (
                    "email",
                    "full_name",
                    "department",
                    "phone_number",
                    "role",
                    "password1",
                    "password2",
                ),
            },
        ),
    )
    readonly_fields = ("date_joined", "last_login")
    filter_horizontal: tuple = ()
    ordering_fields: tuple = ()

