from rest_framework.routers import DefaultRouter

from notifications.views import NotificationPreferenceViewSet, NotificationViewSet

router = DefaultRouter()
router.register(r"notifications", NotificationViewSet, basename="notification")
router.register(
    r"notification-preferences",
    NotificationPreferenceViewSet,
    basename="notification-preferences",
)

urlpatterns = router.urls

