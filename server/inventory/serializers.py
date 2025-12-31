from rest_framework import serializers

from inventory.models import InventoryItem, InventoryLog, ReorderRequest


class InventoryItemSerializer(serializers.ModelSerializer):
    status = serializers.CharField(read_only=True)

    class Meta:
        model = InventoryItem
        fields = [
            "id",
            "name",
            "sku",
            "category",
            "unit",
            "current_quantity",
            "minimum_threshold",
            "min_quantity",
            "maximum_threshold",
            "reorder_point",
            "last_restocked_at",
            "last_usage_at",
            "notes",
            "status",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "status", "created_at", "updated_at"]


class InventoryLogSerializer(serializers.ModelSerializer):
    item = serializers.PrimaryKeyRelatedField(
        queryset=InventoryItem.objects.all(),
        required=False,
        allow_null=True
    )
    
    class Meta:
        model = InventoryLog
        fields = [
            "id",
            "item",
            "operation",
            "quantity",
            "balance_after",
            "reference_order",
            "note",
            "created_at",
        ]
        read_only_fields = ["id", "created_at", "balance_after"]


class ReorderRequestSerializer(serializers.ModelSerializer):
    class Meta:
        model = ReorderRequest
        fields = [
            "id",
            "item",
            "quantity",
            "status",
            "requested_by",
            "approved_by",
            "requested_at",
            "approved_at",
            "received_at",
            "notes",
        ]
        read_only_fields = [
            "id",
            "requested_by",
            "approved_by",
            "requested_at",
            "approved_at",
            "received_at",
        ]


