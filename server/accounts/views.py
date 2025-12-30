from rest_framework import mixins, status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework_simplejwt.views import TokenObtainPairView
from django.contrib.auth import update_session_auth_hash

from accounts.models import User
from accounts.permissions import IsSystemAdmin
from accounts.serializers import (
    CustomTokenObtainPairSerializer,
    UserCreateSerializer,
    UserSerializer,
)


class UserViewSet(
    mixins.ListModelMixin,
    mixins.RetrieveModelMixin,
    mixins.CreateModelMixin,
    mixins.UpdateModelMixin,
    viewsets.GenericViewSet,
):
    queryset = User.objects.all().order_by("full_name")
    permission_classes = [IsAuthenticated & IsSystemAdmin]

    def get_serializer_class(self):
        if self.action in {"create", "update", "partial_update"}:
            return UserCreateSerializer
        return UserSerializer

    @action(detail=False, methods=["get"], permission_classes=[IsAuthenticated])
    def me(self, request):
        """إرجاع بيانات المستخدم الحالي"""
        serializer = self.get_serializer(request.user)
        return Response(serializer.data)
    
    @action(detail=False, methods=["post"], permission_classes=[IsAuthenticated], url_path="change_password")
    def change_password(self, request):
        """تغيير كلمة مرور المستخدم الحالي"""
        user = request.user
        old_password = request.data.get("old_password")
        new_password = request.data.get("new_password")
        
        if not old_password or not new_password:
            return Response(
                {"detail": "يجب إدخال كلمة المرور الحالية والجديدة"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # التحقق من كلمة المرور الحالية
        if not user.check_password(old_password):
            return Response(
                {"detail": "كلمة المرور الحالية غير صحيحة"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # التحقق من طول كلمة المرور الجديدة
        if len(new_password) < 8:
            return Response(
                {"detail": "كلمة المرور الجديدة يجب أن تكون 8 أحرف على الأقل"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # تحديث كلمة المرور
        user.set_password(new_password)
        user.save(update_fields=["password"])
        
        # تحديث session hash لتجنب تسجيل الخروج
        update_session_auth_hash(request, user)
        
        return Response(
            {"detail": "تم تغيير كلمة المرور بنجاح"},
            status=status.HTTP_200_OK
        )


class CustomTokenObtainPairView(TokenObtainPairView):
    """Custom token view that uses email instead of username"""
    serializer_class = CustomTokenObtainPairSerializer
