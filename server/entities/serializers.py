from rest_framework import serializers
from .models import Entity


class EntitySerializer(serializers.ModelSerializer):
    """Serializer أساسي للجهة"""
    parent_name = serializers.CharField(source="parent.name", read_only=True)
    full_path = serializers.CharField(read_only=True)
    children_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Entity
        fields = [
            "id",
            "name",
            "code",
            "level",
            "parent",
            "parent_name",
            "is_active",
            "description",
            "full_path",
            "children_count",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]
    
    def get_children_count(self, obj):
        return obj.children.count()


class EntityTreeSerializer(serializers.ModelSerializer):
    """Serializer للهيكل الهرمي (شجري)"""
    children = serializers.SerializerMethodField()
    
    class Meta:
        model = Entity
        fields = [
            "id",
            "name",
            "code",
            "level",
            "parent",
            "is_active",
            "description",
            "children",
        ]
    
    def get_children(self, obj):
        children = obj.children.filter(is_active=True)
        return EntityTreeSerializer(children, many=True).data


class EntityListSerializer(serializers.ModelSerializer):
    """Serializer مبسط للقوائم"""
    full_path = serializers.CharField(read_only=True)
    
    class Meta:
        model = Entity
        fields = [
            "id",
            "name",
            "code",
            "level",
            "full_path",
            "is_active",
        ]

