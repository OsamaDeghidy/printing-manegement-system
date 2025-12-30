from rest_framework.permissions import BasePermission, SAFE_METHODS


class IsSystemAdmin(BasePermission):
    """للتوافق مع الكود القديم"""
    def has_permission(self, request, view):
        user = request.user
        return bool(user and user.is_authenticated and user.is_admin)


class IsPrintManager(BasePermission):
    """مدير المطبعة - صلاحيات كاملة"""
    def has_permission(self, request, view):
        user = request.user
        return bool(user and user.is_authenticated and user.is_print_manager)


class IsDeptManager(BasePermission):
    """مدير القسم - صلاحيات محدودة"""
    def has_permission(self, request, view):
        user = request.user
        return bool(user and user.is_authenticated and user.is_dept_manager)


class IsDeptEmployee(BasePermission):
    """موظف القسم - صلاحيات تنفيذية"""
    def has_permission(self, request, view):
        user = request.user
        return bool(user and user.is_authenticated and user.is_dept_employee)


class IsTrainingSupervisor(BasePermission):
    """مشرف التدريب"""
    def has_permission(self, request, view):
        user = request.user
        return bool(user and user.is_authenticated and user.is_training_supervisor)


class IsApprover(BasePermission):
    """للتوافق مع الكود القديم"""
    def has_permission(self, request, view):
        user = request.user
        return bool(user and user.is_authenticated and user.is_approver)


class ReadOnly(BasePermission):
    def has_permission(self, request, view):
        return request.method in SAFE_METHODS


