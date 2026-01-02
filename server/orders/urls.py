from rest_framework.routers import DefaultRouter

from orders.views import DesignOrderViewSet, OrderViewSet, PrintOrderViewSet

router = DefaultRouter()
# Main orders endpoint - accessible at /api/orders/ (via include in project/urls.py line 15)
router.register(r"orders", OrderViewSet, basename="order")
# Design orders endpoint - accessible at /api/design-orders/
router.register(r"design-orders", DesignOrderViewSet, basename="design-order")
# Print orders endpoint - accessible at /api/print-orders/
router.register(r"print-orders", PrintOrderViewSet, basename="print-order")

urlpatterns = router.urls

