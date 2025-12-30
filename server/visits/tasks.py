"""
Celery tasks لإدارة الزيارات
"""
from celery import shared_task
from django.utils import timezone
from datetime import timedelta

from .models import VisitBooking, VisitRequest


@shared_task
def cancel_overdue_bookings():
    """
    إلغاء المواعيد المتأخرة 10 دقائق (قاعدة التأخير)
    """
    now = timezone.now()
    overdue_bookings = VisitBooking.objects.filter(
        status=VisitBooking.Status.CONFIRMED,
        checked_in_at__isnull=True,
    )
    
    cancelled_count = 0
    for booking in overdue_bookings:
        if booking.is_overdue:
            booking.status = VisitBooking.Status.CANCELLED
            booking.visit_request.status = VisitRequest.Status.CANCELLED
            booking.visit_request.save(update_fields=["status", "updated_at"])
            booking.save(update_fields=["status", "updated_at"])
            cancelled_count += 1
    
    return f"Cancelled {cancelled_count} overdue bookings"

