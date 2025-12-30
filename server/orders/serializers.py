from django.utils import timezone
from rest_framework import serializers

from accounts.serializers import UserSerializer
from catalog.models import ServiceField
from catalog.serializers import ServiceSerializer
from entities.serializers import EntityListSerializer
from orders.models import (
    DesignAttachment,
    DesignOrder,
    Order,
    OrderApproval,
    OrderAttachment,
    OrderFieldValue,
    OrderStatusLog,
    PrintAttachment,
    PrintOrder,
)


class OrderAttachmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = OrderAttachment
        fields = [
            "id",
            "attachment_type",
            "file",
            "link_url",
            "name",
            "size_bytes",
            "uploaded_at",
        ]
        read_only_fields = ["id", "uploaded_at"]


class OrderFieldValueSerializer(serializers.ModelSerializer):
    field = serializers.PrimaryKeyRelatedField(
        queryset=ServiceField.objects.all()
    )
    field_label = serializers.CharField(source="field.label", read_only=True)
    field_key = serializers.CharField(source="field.key", read_only=True)

    class Meta:
        model = OrderFieldValue
        fields = ["id", "field", "field_label", "field_key", "value"]
        read_only_fields = ["id", "field_label", "field_key"]


class OrderApprovalSerializer(serializers.ModelSerializer):
    approver = UserSerializer(read_only=True)

    class Meta:
        model = OrderApproval
        fields = ["id", "approver", "step", "decision", "comment", "decided_at"]
        read_only_fields = ["id", "approver", "decided_at"]


class OrderStatusLogSerializer(serializers.ModelSerializer):
    changed_by = UserSerializer(read_only=True)

    class Meta:
        model = OrderStatusLog
        fields = ["id", "status", "note", "changed_by", "changed_at"]
        read_only_fields = ["id", "status", "note", "changed_by", "changed_at"]


class OrderListSerializer(serializers.ModelSerializer):
    service = ServiceSerializer(read_only=True)
    requester = UserSerializer(read_only=True)
    entity = EntityListSerializer(read_only=True)

    class Meta:
        model = Order
        fields = [
            "id",
            "order_code",
            "service",
            "requester",
            "department",
            "entity",
            "status",
            "priority",
            "submitted_at",
            "requires_approval",
        ]


class OrderCreateSerializer(serializers.ModelSerializer):
    field_values = OrderFieldValueSerializer(many=True, write_only=True)

    class Meta:
        model = Order
        fields = [
            "id",
            "service",
            "department",
            "priority",
            "field_values",
            "requires_approval",
        ]
        read_only_fields = ["id", "requires_approval"]

    def validate_field_values(self, values):
        service = self.initial_data.get("service")
        if not service:
            raise serializers.ValidationError("يجب تحديد الخدمة.")
        expected_fields = ServiceField.objects.filter(service_id=service)
        provided_ids = {str(field.get("field")) for field in values}
        missing = {
            field.id
            for field in expected_fields
            if field.is_required and str(field.id) not in provided_ids
        }
        if missing:
            raise serializers.ValidationError("بعض الحقول الإلزامية لم يتم تعبئتها.")
        return values

    def create(self, validated_data):
        field_values = validated_data.pop("field_values", [])
        request = self.context["request"]
        
        # Extract department separately to avoid duplicate argument
        department = validated_data.pop("department", None) or (request.user.department if hasattr(request.user, 'department') else "")
        
        # Extract requires_approval from service
        requires_approval = validated_data["service"].requires_approval
        
        order = Order.objects.create(
            requester=request.user,
            department=department,
            requires_approval=requires_approval,
            **validated_data,
        )

        for value in field_values:
            field = value["field"]
            OrderFieldValue.objects.create(
                order=order,
                field=field,
                value=value.get("value"),
            )

        OrderStatusLog.objects.create(
            order=order,
            status=Order.Status.PENDING,
            note="تم إنشاء الطلب.",
            changed_by=request.user,
        )

        if order.requires_approval:
            OrderApproval.objects.create(
                order=order,
                approver=order.current_approver,
                step=1,
                decision=OrderApproval.Decision.PENDING,
            )

        return order


class OrderDetailSerializer(serializers.ModelSerializer):
    service = ServiceSerializer(read_only=True)
    requester = UserSerializer(read_only=True)
    entity = EntityListSerializer(read_only=True)
    field_values = OrderFieldValueSerializer(many=True, read_only=True)
    attachments = OrderAttachmentSerializer(many=True, read_only=True)
    approvals = OrderApprovalSerializer(many=True, read_only=True)
    status_history = OrderStatusLogSerializer(many=True, read_only=True)

    class Meta:
        model = Order
        fields = [
            "id",
            "order_code",
            "service",
            "requester",
            "department",
            "entity",
            "status",
            "priority",
            "requires_approval",
            "current_approver",
            "submitted_at",
            "approved_at",
            "completed_at",
            "field_values",
            "attachments",
            "approvals",
            "status_history",
        ]
        read_only_fields = fields


# Design Order Serializers
class DesignAttachmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = DesignAttachment
        fields = [
            "id",
            "attachment_type",
            "file",
            "link_url",
            "name",
            "size_bytes",
            "uploaded_at",
        ]
        read_only_fields = ["id", "uploaded_at"]


class DesignOrderListSerializer(serializers.ModelSerializer):
    requester = UserSerializer(read_only=True)
    entity = EntityListSerializer(read_only=True)
    is_confirmation_expired = serializers.BooleanField(read_only=True)
    
    class Meta:
        model = DesignOrder
        fields = [
            "id",
            "order_code",
            "requester",
            "entity",
            "design_type",
            "title",
            "size",
            "priority",
            "status",
            "submitted_at",
            "confirmation_deadline",
            "is_confirmation_expired",
        ]


class DesignOrderCreateSerializer(serializers.ModelSerializer):
    attachments = DesignAttachmentSerializer(many=True, required=False)
    
    class Meta:
        model = DesignOrder
        fields = [
            "id",
            "design_type",
            "title",
            "size",
            "custom_size",
            "description",
            "priority",
            "attachments",
        ]
        read_only_fields = ["id"]
    
    def create(self, validated_data):
        attachments_data = validated_data.pop("attachments", [])
        request = self.context["request"]
        design_order = DesignOrder.objects.create(
            requester=request.user,
            **validated_data,
        )
        
        for attachment_data in attachments_data:
            DesignAttachment.objects.create(
                design_order=design_order,
                uploaded_by=request.user,
                **attachment_data,
            )
        
        return design_order


class DesignOrderDetailSerializer(serializers.ModelSerializer):
    requester = UserSerializer(read_only=True)
    entity = EntityListSerializer(read_only=True)
    attachments = DesignAttachmentSerializer(many=True, read_only=True)
    is_confirmation_expired = serializers.BooleanField(read_only=True)
    
    class Meta:
        model = DesignOrder
        fields = [
            "id",
            "order_code",
            "requester",
            "entity",
            "design_type",
            "title",
            "size",
            "custom_size",
            "description",
            "priority",
            "status",
            "attachments",
            "submitted_at",
            "confirmed_at",
            "confirmation_deadline",
            "completed_at",
            "is_confirmation_expired",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "order_code",
            "requester",
            "entity",
            "submitted_at",
            "confirmed_at",
            "confirmation_deadline",
            "completed_at",
            "created_at",
            "updated_at",
        ]


# Print Order Serializers
class PrintAttachmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = PrintAttachment
        fields = [
            "id",
            "attachment_type",
            "file",
            "link_url",
            "name",
            "size_bytes",
            "uploaded_at",
        ]
        read_only_fields = ["id", "uploaded_at"]


class PrintOrderListSerializer(serializers.ModelSerializer):
    requester = UserSerializer(read_only=True)
    entity = EntityListSerializer(read_only=True)
    is_confirmation_expired = serializers.BooleanField(read_only=True)
    
    class Meta:
        model = PrintOrder
        fields = [
            "id",
            "order_code",
            "requester",
            "entity",
            "print_type",
            "production_dept",
            "quantity",
            "actual_quantity",
            "priority",
            "status",
            "submitted_at",
            "confirmation_deadline",
            "is_confirmation_expired",
        ]


class PrintOrderCreateSerializer(serializers.ModelSerializer):
    attachments = PrintAttachmentSerializer(many=True, required=False)
    
    class Meta:
        model = PrintOrder
        fields = [
            "id",
            "print_type",
            "production_dept",
            "size",
            "custom_size",
            "paper_type",
            "paper_weight",
            "quantity",
            "sides",
            "pages",
            "delivery_method",
            "priority",
            "attachments",
        ]
        read_only_fields = ["id"]
    
    def validate(self, data):
        # التحقق من أن الكروت الشخصية تتطلب ملف
        if data.get("print_type") == PrintOrder.PrintType.BUSINESS_CARDS:
            attachments = self.initial_data.get("attachments", [])
            if not attachments:
                raise serializers.ValidationError(
                    "الكروت الشخصية تتطلب إرفاق ملف"
                )
        return data
    
    def create(self, validated_data):
        attachments_data = validated_data.pop("attachments", [])
        request = self.context["request"]
        print_order = PrintOrder.objects.create(
            requester=request.user,
            **validated_data,
        )
        
        for attachment_data in attachments_data:
            PrintAttachment.objects.create(
                print_order=print_order,
                uploaded_by=request.user,
                **attachment_data,
            )
        
        return print_order


class PrintOrderDetailSerializer(serializers.ModelSerializer):
    requester = UserSerializer(read_only=True)
    entity = EntityListSerializer(read_only=True)
    attachments = PrintAttachmentSerializer(many=True, read_only=True)
    is_confirmation_expired = serializers.BooleanField(read_only=True)
    paper_consumption = serializers.IntegerField(read_only=True)
    
    class Meta:
        model = PrintOrder
        fields = [
            "id",
            "order_code",
            "requester",
            "entity",
            "print_type",
            "production_dept",
            "size",
            "custom_size",
            "paper_type",
            "paper_weight",
            "quantity",
            "actual_quantity",
            "sides",
            "pages",
            "delivery_method",
            "priority",
            "status",
            "attachments",
            "submitted_at",
            "confirmed_at",
            "confirmation_deadline",
            "completed_at",
            "is_confirmation_expired",
            "paper_consumption",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "order_code",
            "requester",
            "entity",
            "submitted_at",
            "confirmed_at",
            "confirmation_deadline",
            "completed_at",
            "created_at",
            "updated_at",
        ]


