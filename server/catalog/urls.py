from rest_framework.routers import DefaultRouter

from catalog.views import ServiceFieldViewSet, ServicePricingViewSet, ServiceViewSet

router = DefaultRouter()
router.register(r"services", ServiceViewSet, basename="service")
router.register(r"service-fields", ServiceFieldViewSet, basename="service-field")
router.register(r"service-pricing", ServicePricingViewSet, basename="service-pricing")

urlpatterns = router.urls

