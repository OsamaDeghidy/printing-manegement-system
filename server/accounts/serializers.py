from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

from accounts.models import User
from entities.models import Entity
from entities.serializers import EntityListSerializer


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    """Custom token serializer that uses email instead of username"""
    
    username_field = "email"
    
    def validate(self, attrs):
        # When username_field = "email", the field name in attrs is "email", not "username"
        # The parent class will automatically use attrs[self.username_field] as the username
        email = attrs.get(self.username_field)  # This will be "email"
        password = attrs.get("password")
        
        if not email:
            raise serializers.ValidationError(
                {"email": "البريد الإلكتروني مطلوب."}
            )
        
        if not password:
            raise serializers.ValidationError(
                {"password": "كلمة المرور مطلوبة."}
            )
        
        # Authenticate using email as username (since USERNAME_FIELD = "email" in User model)
        from django.contrib.auth import authenticate
        
        user = authenticate(username=email, password=password)
        
        if not user:
            raise serializers.ValidationError(
                {"email": "البريد الإلكتروني أو كلمة المرور غير صحيحة."}
            )
        
        if not user.is_active:
            raise serializers.ValidationError(
                {"email": "هذا الحساب غير مفعّل."}
            )
        
        # The parent class's validate method will use attrs[self.username_field] internally
        # So we don't need to set attrs["username"] - the parent handles it
        # Call parent validate to get tokens
        data = super().validate(attrs)
        
        return data


class UserSerializer(serializers.ModelSerializer):
    entity = EntityListSerializer(read_only=True)
    
    class Meta:
        model = User
        fields = [
            "id",
            "email",
            "full_name",
            "department",
            "entity",
            "phone_number",
            "role",
            "is_active",
            "date_joined",
            "last_login",
        ]
        read_only_fields = ["id", "date_joined", "last_login"]


class UserCreateSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)
    entity = serializers.PrimaryKeyRelatedField(
        queryset=Entity.objects.all(), allow_null=True, required=False
    )

    class Meta:
        model = User
        fields = [
            "id",
            "email",
            "full_name",
            "department",
            "phone_number",
            "role",
            "entity",
            "is_active",
            "password",
        ]
        read_only_fields = ["id"]

    def create(self, validated_data):
        password = validated_data.pop("password")
        user = User.objects.create(**validated_data)
        user.set_password(password)
        user.save(update_fields=["password"])
        return user
