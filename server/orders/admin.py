from django.contrib import admin

from orders.models import (
    Order,
    OrderApproval,
    OrderAttachment,
    OrderFieldValue,
    OrderStatusLog,
)


class OrderFieldValueInline(admin.TabularInline):
    model = OrderFieldValue
    extra = 0
    readonly_fields = ("field", "value")


class OrderAttachmentInline(admin.TabularInline):
    model = OrderAttachment
    extra = 0
    readonly_fields = ("attachment_type", "file", "link_url", "uploaded_at")


class OrderApprovalInline(admin.TabularInline):
    model = OrderApproval
    extra = 0
    readonly_fields = ("approver", "decision", "comment", "decided_at")


@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = ("order_code", "service", "requester", "status", "priority", "submitted_at")
    list_filter = ("status", "priority", "service", "requires_approval")
    search_fields = ("order_code", "requester__full_name", "department")
    inlines = [OrderFieldValueInline, OrderAttachmentInline, OrderApprovalInline]
    readonly_fields = ("order_code", "submitted_at", "approved_at", "completed_at")


@admin.register(OrderStatusLog)
class OrderStatusLogAdmin(admin.ModelAdmin):
    list_display = ("order", "status", "changed_by", "changed_at")
    list_filter = ("status",)
    search_fields = ("order__order_code", "changed_by__full_name")


