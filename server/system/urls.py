from django.urls import path
from rest_framework.routers import DefaultRouter

from system.views import (
    AdminOverviewViewSet,
    ApprovalPolicyViewSet,
    AuditLogViewSet,
    FieldSettingsViewSet,
    ReportsViewSet,
    ServiceSettingsViewSet,
    SystemSettingViewSet,
)

router = DefaultRouter()
router.register(r"system/settings", SystemSettingViewSet, basename="system-setting")
router.register(r"system/approval-policy", ApprovalPolicyViewSet, basename="approval-policy")
router.register(r"system/audit-log", AuditLogViewSet, basename="audit-log")
router.register(r"system/field-settings", FieldSettingsViewSet, basename="field-settings")
router.register(r"system/service-settings", ServiceSettingsViewSet, basename="service-settings")
router.register(r"admin/reports", ReportsViewSet, basename="reports")
router.register(r"admin/overview", AdminOverviewViewSet, basename="admin-overview")

urlpatterns = router.urls

