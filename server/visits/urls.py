from django.urls import path
from rest_framework.routers import DefaultRouter
from .views import VisitBookingViewSet, VisitRequestViewSet, VisitScheduleViewSet

router = DefaultRouter()
router.register(r"visit-requests", VisitRequestViewSet, basename="visit-request")
router.register(r"visit-schedules", VisitScheduleViewSet, basename="visit-schedule")
router.register(r"visit-bookings", VisitBookingViewSet, basename="visit-booking")

urlpatterns = router.urls

