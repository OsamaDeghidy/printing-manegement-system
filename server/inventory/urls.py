from rest_framework.routers import DefaultRouter

from inventory.views import (
    InventoryItemViewSet,
    InventoryLogViewSet,
    ReorderRequestViewSet,
)

router = DefaultRouter()
router.register(r"inventory/items", InventoryItemViewSet, basename="inventory-item")
router.register(r"inventory/logs", InventoryLogViewSet, basename="inventory-log")
router.register(r"inventory/reorders", ReorderRequestViewSet, basename="inventory-reorder")

urlpatterns = router.urls

