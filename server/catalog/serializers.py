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
    class Meta:
        model = ServicePricing
        fields = [
            "id",
            "internal_cost",
            "external_cost",
            "notes",
            "effective_from",
            "effective_to",
        ]


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


