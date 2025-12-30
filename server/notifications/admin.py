from django.contrib import admin

from notifications.models import Notification, NotificationPreference


@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = ("title", "recipient", "type", "is_read", "created_at")
    list_filter = ("type", "is_read")
    search_fields = ("title", "recipient__full_name")


@admin.register(NotificationPreference)
class NotificationPreferenceAdmin(admin.ModelAdmin):
    list_display = ("user", "order_updates", "approvals", "inventory_alerts")
    search_fields = ("user__full_name", "user__email")


