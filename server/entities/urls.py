from django.urls import path
from rest_framework.routers import DefaultRouter
from .views import EntityViewSet

router = DefaultRouter()
router.register(r"entities", EntityViewSet, basename="entity")

urlpatterns = router.urls

