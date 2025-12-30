from django.contrib import admin

from inventory.models import InventoryItem, InventoryLog, ReorderRequest


@admin.register(InventoryItem)
class InventoryItemAdmin(admin.ModelAdmin):
    list_display = ("name", "sku", "category", "current_quantity", "minimum_threshold")
    list_filter = ("category",)
    search_fields = ("name", "sku")


@admin.register(InventoryLog)
class InventoryLogAdmin(admin.ModelAdmin):
    list_display = ("item", "operation", "quantity", "balance_after", "created_at")
    list_filter = ("operation",)
    search_fields = ("item__name", "reference_order")


@admin.register(ReorderRequest)
class ReorderRequestAdmin(admin.ModelAdmin):
    list_display = ("item", "quantity", "status", "requested_by", "requested_at")
    list_filter = ("status",)
    search_fields = ("item__name",)


