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
    actor_name = serializers.CharField(source="actor.full_name", read_only=True)
    actor_email = serializers.CharField(source="actor.email", read_only=True)
    severity = serializers.SerializerMethodField()
    
    class Meta:
        model = AuditLog
        fields = ["id", "actor", "actor_name", "actor_email", "action", "metadata", "severity", "created_at"]
        read_only_fields = fields
    
    def get_severity(self, obj):
        """استخراج severity من metadata أو تحديده بناءً على action"""
        if obj.metadata and "severity" in obj.metadata:
            return obj.metadata["severity"]
        # تحديد severity بناءً على نوع action
        action_lower = obj.action.lower()
        if any(keyword in action_lower for keyword in ["حذف", "رفض", "خطأ", "error", "delete", "reject"]):
            return "danger"
        elif any(keyword in action_lower for keyword in ["تحذير", "warning", "تنبيه"]):
            return "warning"
        elif any(keyword in action_lower for keyword in ["نجاح", "success", "موافقة", "approve", "إنشاء", "create"]):
            return "success"
        else:
            return "info"


