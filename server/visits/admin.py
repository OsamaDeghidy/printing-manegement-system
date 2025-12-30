from django.contrib import admin
from .models import VisitBooking, VisitRequest, VisitSchedule


@admin.register(VisitRequest)
class VisitRequestAdmin(admin.ModelAdmin):
    list_display = ["requester", "visit_type", "requested_date", "requested_time", "status"]
    list_filter = ["visit_type", "status", "requested_date"]
    search_fields = ["requester__full_name", "purpose"]
    readonly_fields = ["created_at", "updated_at"]


@admin.register(VisitSchedule)
class VisitScheduleAdmin(admin.ModelAdmin):
    list_display = ["date", "is_blocked", "visit_type_restriction", "created_by"]
    list_filter = ["is_blocked", "visit_type_restriction"]
    search_fields = ["date"]


@admin.register(VisitBooking)
class VisitBookingAdmin(admin.ModelAdmin):
    list_display = ["visit_request", "schedule", "requested_time", "status"]
    list_filter = ["status", "schedule__date"]
    search_fields = ["visit_request__requester__full_name"]
