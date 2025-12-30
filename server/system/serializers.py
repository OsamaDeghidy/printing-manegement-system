from rest_framework import serializers

from catalog.models import Service
from system.models import ApprovalPolicy, AuditLog, SystemSetting


class SystemSettingSerializer(serializers.ModelSerializer):
    class Meta:
        model = SystemSetting
        fields = ["key", "value", "description", "updated_at"]
        read_only_fields = ["updated_at"]


class ApprovalPolicySerializer(serializers.ModelSerializer):
    selective_services = serializers.PrimaryKeyRelatedField(
        many=True, queryset=Service.objects.all(), required=False
    )

    class Meta:
        model = ApprovalPolicy
        fields = ["id", "is_global_enabled", "selective_services", "updated_at"]
        read_only_fields = ["id", "updated_at"]


class AuditLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = AuditLog
        fields = ["id", "actor", "action", "metadata", "created_at"]
        read_only_fields = fields


