from django.db import transaction
from django.utils import timezone
from rest_framework import filters, status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from accounts.permissions import IsSystemAdmin
from inventory.models import InventoryItem, InventoryLog, ReorderRequest
from inventory.serializers import (
    InventoryItemSerializer,
    InventoryLogSerializer,
    ReorderRequestSerializer,
)


class InventoryItemViewSet(viewsets.ModelViewSet):
    queryset = InventoryItem.objects.all()
    serializer_class = InventoryItemSerializer
    permission_classes = [IsAuthenticated & IsSystemAdmin]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ["name", "sku", "category"]
    ordering_fields = ["name", "current_quantity", "updated_at"]

    @transaction.atomic
    @action(detail=True, methods=["post"])
    def adjust(self, request, pk=None):
        item = self.get_object()
        serializer = InventoryLogSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        quantity = serializer.validated_data["quantity"]
        operation = serializer.validated_data["operation"]

        if operation == InventoryLog.Operation.IN:
            item.current_quantity += quantity
            item.last_restocked_at = timezone.now()
        elif operation == InventoryLog.Operation.OUT:
            item.current_quantity = max(0, item.current_quantity - quantity)
            item.last_usage_at = timezone.now()
        else:
            item.current_quantity = quantity  # absolute adjustment

        item.save(update_fields=["current_quantity", "last_restocked_at", "last_usage_at", "updated_at"])
        log = InventoryLog.objects.create(
            item=item,
            operation=operation,
            quantity=quantity,
            balance_after=item.current_quantity,
            reference_order=serializer.validated_data.get("reference_order", ""),
            performed_by=request.user,
            note=serializer.validated_data.get("note", ""),
        )
        return Response(InventoryLogSerializer(log).data, status=status.HTTP_201_CREATED)


class InventoryLogViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = InventoryLog.objects.select_related("item").all()
    serializer_class = InventoryLogSerializer
    permission_classes = [IsAuthenticated & IsSystemAdmin]
    filter_backends = [filters.OrderingFilter]
    ordering_fields = ["created_at"]


class ReorderRequestViewSet(viewsets.ModelViewSet):
    queryset = ReorderRequest.objects.select_related("item", "requested_by", "approved_by")
    serializer_class = ReorderRequestSerializer
    permission_classes = [IsAuthenticated & IsSystemAdmin]

    def perform_create(self, serializer):
        serializer.save(requested_by=self.request.user)

    @transaction.atomic
    @action(detail=True, methods=["post"])
    def approve(self, request, pk=None):
        reorder = self.get_object()
        reorder.status = ReorderRequest.Status.ORDERED
        reorder.approved_by = request.user
        reorder.approved_at = timezone.now()
        reorder.save(update_fields=["status", "approved_by", "approved_at"])
        return Response(ReorderRequestSerializer(reorder).data)

    @transaction.atomic
    @action(detail=True, methods=["post"])
    def mark_received(self, request, pk=None):
        reorder = self.get_object()
        item = reorder.item
        item.current_quantity += reorder.quantity
        item.last_restocked_at = timezone.now()
        item.save(update_fields=["current_quantity", "last_restocked_at", "updated_at"])
        reorder.status = ReorderRequest.Status.RECEIVED
        reorder.received_at = timezone.now()
        reorder.save(update_fields=["status", "received_at"])
        InventoryLog.objects.create(
            item=item,
            operation=InventoryLog.Operation.IN,
            quantity=reorder.quantity,
            balance_after=item.current_quantity,
            performed_by=request.user,
            note="استلام طلب تزويد.",
        )
        return Response(ReorderRequestSerializer(reorder).data)


