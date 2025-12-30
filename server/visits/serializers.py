from rest_framework import serializers
from .models import VisitBooking, VisitRequest, VisitSchedule
from accounts.serializers import UserSerializer
from entities.serializers import EntityListSerializer


class VisitRequestListSerializer(serializers.ModelSerializer):
    requester = UserSerializer(read_only=True)
    entity = EntityListSerializer(read_only=True)
    
    class Meta:
        model = VisitRequest
        fields = [
            "id",
            "requester",
            "entity",
            "visit_type",
            "purpose",
            "requested_date",
            "requested_time",
            "status",
            "submitted_at",
        ]


class VisitRequestCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = VisitRequest
        fields = [
            "id",
            "visit_type",
            "purpose",
            "requested_date",
            "requested_time",
            "permit_file",
        ]
        read_only_fields = ["id"]
    
    def validate(self, data):
        # التحقق من أن الزيارات الخارجية تتطلب تصريح
        if data.get("visit_type") == VisitRequest.VisitType.EXTERNAL:
            if not self.initial_data.get("permit_file"):
                raise serializers.ValidationError(
                    "الزيارات الخارجية تتطلب إرفاق تصريح موقع ومختوم"
                )
        return data


class VisitRequestDetailSerializer(serializers.ModelSerializer):
    requester = UserSerializer(read_only=True)
    entity = EntityListSerializer(read_only=True)
    booking = serializers.SerializerMethodField()
    
    class Meta:
        model = VisitRequest
        fields = [
            "id",
            "requester",
            "entity",
            "visit_type",
            "purpose",
            "requested_date",
            "requested_time",
            "permit_file",
            "status",
            "manager_comment",
            "security_comment",
            "submitted_at",
            "approved_at",
            "booking",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "requester",
            "entity",
            "submitted_at",
            "approved_at",
            "created_at",
            "updated_at",
        ]
    
    def get_booking(self, obj):
        if hasattr(obj, "booking"):
            return VisitBookingSerializer(obj.booking).data
        return None


class VisitScheduleSerializer(serializers.ModelSerializer):
    created_by_name = serializers.CharField(source="created_by.full_name", read_only=True)
    available_count = serializers.SerializerMethodField()
    
    class Meta:
        model = VisitSchedule
        fields = [
            "id",
            "date",
            "is_blocked",
            "blocked_reason",
            "available_slots",
            "visit_type_restriction",
            "created_by",
            "created_by_name",
            "available_count",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]
    
    def get_available_count(self, obj):
        if obj.is_blocked:
            return 0
        return len(obj.available_slots)


class VisitBookingSerializer(serializers.ModelSerializer):
    visit_request = VisitRequestListSerializer(read_only=True)
    schedule_date = serializers.DateField(source="schedule.date", read_only=True)
    is_overdue = serializers.BooleanField(read_only=True)
    
    class Meta:
        model = VisitBooking
        fields = [
            "id",
            "visit_request",
            "schedule",
            "schedule_date",
            "requested_time",
            "status",
            "checked_in_at",
            "is_overdue",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "checked_in_at",
            "created_at",
            "updated_at",
        ]

