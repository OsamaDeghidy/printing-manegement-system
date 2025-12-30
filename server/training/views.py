from django.db import transaction
from django.utils import timezone
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from accounts.permissions import IsTrainingSupervisor
from .models import TrainingEvaluation, TrainingRequest
from .serializers import (
    TrainingEvaluationSerializer,
    TrainingRequestCreateSerializer,
    TrainingRequestDetailSerializer,
    TrainingRequestListSerializer,
)


class TrainingRequestViewSet(viewsets.ModelViewSet):
    """
    ViewSet لإدارة طلبات التدريب
    """
    queryset = TrainingRequest.objects.select_related(
        "requester", "entity", "supervisor"
    ).prefetch_related("evaluations").all()
    permission_classes = [IsAuthenticated]
    
    def get_serializer_class(self):
        if self.action == "list":
            return TrainingRequestListSerializer
        if self.action == "create":
            return TrainingRequestCreateSerializer
        return TrainingRequestDetailSerializer
    
    def get_queryset(self):
        user = self.request.user
        qs = super().get_queryset()
        if user.is_training_supervisor or user.is_print_manager:
            return qs
        return qs.filter(requester=user)
    
    def perform_create(self, serializer):
        serializer.save(requester=self.request.user)
    
    @transaction.atomic
    @action(
        detail=True,
        methods=["post"],
        permission_classes=[IsAuthenticated & IsTrainingSupervisor],
    )
    def approve(self, request, pk=None):
        """موافقة المشرف على طلب التدريب"""
        training_request = self.get_object()
        if training_request.status != TrainingRequest.Status.PENDING:
            return Response(
                {"detail": "الطلب ليس في حالة انتظار المراجعة."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        training_request.status = TrainingRequest.Status.APPROVED
        training_request.approved_at = timezone.now()
        training_request.supervisor = request.user
        training_request.supervisor_comment = request.data.get("comment", "")
        training_request.save(update_fields=["status", "approved_at", "supervisor", "supervisor_comment", "updated_at"])
        return Response(TrainingRequestDetailSerializer(training_request).data)
    
    @transaction.atomic
    @action(
        detail=True,
        methods=["post"],
        permission_classes=[IsAuthenticated & IsTrainingSupervisor],
    )
    def reject(self, request, pk=None):
        """رفض طلب التدريب"""
        training_request = self.get_object()
        training_request.status = TrainingRequest.Status.REJECTED
        training_request.supervisor = request.user
        training_request.supervisor_comment = request.data.get("comment", "")
        training_request.save(update_fields=["status", "supervisor", "supervisor_comment", "updated_at"])
        return Response(TrainingRequestDetailSerializer(training_request).data)


class TrainingEvaluationViewSet(viewsets.ModelViewSet):
    """
    ViewSet لإدارة تقييمات التدريب
    """
    queryset = TrainingEvaluation.objects.select_related(
        "training_request", "evaluated_by"
    ).all()
    permission_classes = [IsAuthenticated & IsTrainingSupervisor]
    serializer_class = TrainingEvaluationSerializer
    
    def get_queryset(self):
        training_request_id = self.request.query_params.get("training_request")
        if training_request_id:
            return self.queryset.filter(training_request_id=training_request_id)
        return self.queryset
    
    def perform_create(self, serializer):
        serializer.save(evaluated_by=self.request.user)
