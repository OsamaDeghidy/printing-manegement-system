from rest_framework import serializers

from catalog.models import Service, ServiceField, ServiceFieldOption, ServicePricing


class ServiceFieldOptionSerializer(serializers.ModelSerializer):
    class Meta:
        model = ServiceFieldOption
        fields = ["id", "label", "value", "is_active", "order"]


class ServiceFieldSerializer(serializers.ModelSerializer):
    options = ServiceFieldOptionSerializer(many=True, read_only=True)
    service = serializers.PrimaryKeyRelatedField(
        queryset=Service.objects.all(),
        write_only=True,
        required=True
    )

    class Meta:
        model = ServiceField
        fields = [
            "id",
            "service",
            "key",
            "label",
            "field_type",
            "order",
            "is_required",
            "is_visible",
            "placeholder",
            "help_text",
            "config",
            "options",
        ]


class ServicePricingSerializer(serializers.ModelSerializer):
    service = serializers.PrimaryKeyRelatedField(
        queryset=Service.objects.all(),
        write_only=True,
        required=True
    )
    service_name = serializers.CharField(source="service.name", read_only=True)
    
    class Meta:
        model = ServicePricing
        fields = [
            "id",
            "service",
            "service_name",
            "internal_cost",
            "external_cost",
            "notes",
            "effective_from",
            "effective_to",
            "created_at",
        ]
        read_only_fields = ["id", "created_at"]


class ServiceSerializer(serializers.ModelSerializer):
    fields = ServiceFieldSerializer(many=True, read_only=True)
    pricing = ServicePricingSerializer(many=True, read_only=True)

    class Meta:
        model = Service
        fields = [
            "id",
            "name",
            "slug",
            "description",
            "icon",
            "category",
            "is_active",
            "requires_approval",
            "fields",
            "pricing",
        ]


