from django.contrib import admin
from .models import TrainingEvaluation, TrainingRequest


@admin.register(TrainingRequest)
class TrainingRequestAdmin(admin.ModelAdmin):
    list_display = ["trainee_name", "university", "training_period_start", "status", "supervisor"]
    list_filter = ["status", "department", "training_period_start"]
    search_fields = ["trainee_name", "trainee_id", "university"]
    readonly_fields = ["created_at", "updated_at"]


@admin.register(TrainingEvaluation)
class TrainingEvaluationAdmin(admin.ModelAdmin):
    list_display = ["training_request", "evaluation_type", "week_number", "total_score", "evaluated_at"]
    list_filter = ["evaluation_type", "evaluated_at"]
    search_fields = ["training_request__trainee_name"]
