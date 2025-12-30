from rest_framework.routers import DefaultRouter

from orders.views import DesignOrderViewSet, OrderViewSet, PrintOrderViewSet

router = DefaultRouter()
# Register under "orders/" prefix to match frontend expectations
router.register(r"orders/orders", OrderViewSet, basename="order")
router.register(r"orders/design-orders", DesignOrderViewSet, basename="design-order")
router.register(r"orders/print-orders", PrintOrderViewSet, basename="print-order")

urlpatterns = router.urls

