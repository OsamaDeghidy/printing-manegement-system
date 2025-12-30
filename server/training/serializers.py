from rest_framework import serializers
from .models import TrainingEvaluation, TrainingRequest
from accounts.serializers import UserSerializer
from entities.serializers import EntityListSerializer


class TrainingRequestListSerializer(serializers.ModelSerializer):
    requester = UserSerializer(read_only=True)
    entity = EntityListSerializer(read_only=True)
    supervisor = UserSerializer(read_only=True)
    
    class Meta:
        model = TrainingRequest
        fields = [
            "id",
            "requester",
            "entity",
            "trainee_name",
            "university",
            "training_period_start",
            "training_period_end",
            "department",
            "status",
            "supervisor",
            "submitted_at",
        ]


class TrainingRequestCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = TrainingRequest
        fields = [
            "id",
            "trainee_name",
            "trainee_id",
            "trainee_phone",
            "trainee_email",
            "university",
            "major",
            "training_period_start",
            "training_period_end",
            "department",
            "purpose",
        ]
        read_only_fields = ["id"]


class TrainingRequestDetailSerializer(serializers.ModelSerializer):
    requester = UserSerializer(read_only=True)
    entity = EntityListSerializer(read_only=True)
    supervisor = UserSerializer(read_only=True)
    evaluations = serializers.SerializerMethodField()
    
    class Meta:
        model = TrainingRequest
        fields = [
            "id",
            "requester",
            "entity",
            "trainee_name",
            "trainee_id",
            "trainee_phone",
            "trainee_email",
            "university",
            "major",
            "training_period_start",
            "training_period_end",
            "department",
            "purpose",
            "status",
            "supervisor",
            "supervisor_comment",
            "submitted_at",
            "approved_at",
            "evaluations",
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
    
    def get_evaluations(self, obj):
        return TrainingEvaluationSerializer(obj.evaluations.all(), many=True).data


class TrainingEvaluationSerializer(serializers.ModelSerializer):
    evaluated_by = UserSerializer(read_only=True)
    total_score = serializers.FloatField(read_only=True)
    
    class Meta:
        model = TrainingEvaluation
        fields = [
            "id",
            "training_request",
            "evaluation_type",
            "week_number",
            "attendance_score",
            "performance_score",
            "behavior_score",
            "total_score",
            "comments",
            "evaluated_by",
            "evaluated_at",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "evaluated_by",
            "evaluated_at",
            "created_at",
            "updated_at",
        ]

