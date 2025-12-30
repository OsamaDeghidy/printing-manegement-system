from django.utils import timezone
from rest_framework import mixins, status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from notifications.models import Notification, NotificationPreference
from notifications.serializers import (
    NotificationPreferenceSerializer,
    NotificationSerializer,
)


class NotificationViewSet(
    mixins.ListModelMixin,
    mixins.UpdateModelMixin,
    viewsets.GenericViewSet,
):
    serializer_class = NotificationSerializer
    permission_classes = [IsAuthenticated]
    pagination_class = None  # Disable pagination for notifications

    def get_queryset(self):
        return Notification.objects.filter(recipient=self.request.user).order_by("-created_at")

    @action(detail=False, methods=["post"])
    def mark_all_as_read(self, request):
        notifications = self.get_queryset().filter(is_read=False)
        notifications.update(is_read=True, read_at=timezone.now())
        return Response({"count": notifications.count()}, status=status.HTTP_200_OK)

    @action(detail=True, methods=["post"])
    def mark_read(self, request, pk=None):
        notification = self.get_object()
        notification.is_read = True
        notification.read_at = timezone.now()
        notification.save(update_fields=["is_read", "read_at"])
        return Response(NotificationSerializer(notification).data)


class NotificationPreferenceViewSet(
    mixins.ListModelMixin,
    mixins.RetrieveModelMixin, 
    mixins.UpdateModelMixin, 
    viewsets.GenericViewSet
):
    serializer_class = NotificationPreferenceSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        preference, _ = NotificationPreference.objects.get_or_create(
            user=self.request.user
        )
        return preference
    
    def list(self, request, *args, **kwargs):
        """Override list to return current user's preference"""
        instance = self.get_object()
        serializer = self.get_serializer(instance)
        return Response(serializer.data)
    
    @action(detail=False, methods=["put", "patch"], url_path="")
    def update_preferences(self, request):
        """Custom action to handle PUT/PATCH /notification-preferences/ without pk"""
        instance = self.get_object()
        partial = request.method == "PATCH"
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)
    
    def update(self, request, *args, **kwargs):
        """Override update to handle PUT /notification-preferences/{pk}/"""
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)
    
    def partial_update(self, request, *args, **kwargs):
        """Override partial_update to handle PATCH /notification-preferences/{pk}/"""
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)

