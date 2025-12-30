from rest_framework import filters, viewsets
from rest_framework.permissions import IsAuthenticated, BasePermission

from accounts.permissions import IsSystemAdmin
from catalog.models import Service, ServiceField, ServicePricing
from catalog.serializers import (
    ServiceFieldSerializer,
    ServicePricingSerializer,
    ServiceSerializer,
)


class ServiceViewSet(viewsets.ModelViewSet):
    queryset = Service.objects.prefetch_related("fields__options").all()
    serializer_class = ServiceSerializer
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ["name", "description", "category"]
    ordering_fields = ["name", "created_at"]
    
    def get_permissions(self):
        """
        Allow all authenticated users to read services (list, retrieve),
        but only admins can create, update, or delete.
        """
        if self.action in ['list', 'retrieve']:
            permission_classes = [IsAuthenticated]
        else:
            permission_classes = [IsAuthenticated, IsSystemAdmin]
        return [permission() for permission in permission_classes]


class ServiceFieldViewSet(viewsets.ModelViewSet):
    serializer_class = ServiceFieldSerializer
    permission_classes = [IsAuthenticated & IsSystemAdmin]

    def get_queryset(self):
        qs = ServiceField.objects.select_related("service").prefetch_related("options")
        service_id = self.request.query_params.get("service")
        if service_id:
            qs = qs.filter(service_id=service_id)
        return qs


class ServicePricingViewSet(viewsets.ModelViewSet):
    serializer_class = ServicePricingSerializer
    permission_classes = [IsAuthenticated & IsSystemAdmin]

    def get_queryset(self):
        qs = ServicePricing.objects.select_related("service")
        service_id = self.request.query_params.get("service")
        if service_id:
            qs = qs.filter(service_id=service_id)
        return qs


