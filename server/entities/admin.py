from django.contrib import admin
from .models import Entity


@admin.register(Entity)
class EntityAdmin(admin.ModelAdmin):
    list_display = ["name", "code", "level", "parent", "is_active", "created_at"]
    list_filter = ["level", "is_active", "created_at"]
    search_fields = ["name", "code", "description"]
    list_editable = ["is_active"]
    raw_id_fields = ["parent"]
    readonly_fields = ["created_at", "updated_at"]
    
    fieldsets = (
        ("المعلومات الأساسية", {
            "fields": ("name", "code", "level", "parent", "description")
        }),
        ("الحالة", {
            "fields": ("is_active",)
        }),
        ("التواريخ", {
            "fields": ("created_at", "updated_at"),
            "classes": ("collapse",)
        }),
    )
