from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.db.models import Q

from accounts.permissions import IsSystemAdmin
from .models import Entity
from .serializers import (
    EntitySerializer,
    EntityTreeSerializer,
    EntityListSerializer,
)


class EntityViewSet(viewsets.ModelViewSet):
    """
    ViewSet لإدارة الجهات
    """
    queryset = Entity.objects.select_related("parent").prefetch_related("children").all()
    
    def get_permissions(self):
        """
        Allow all authenticated users to read entities (list, retrieve),
        but only admins can create, update, or delete.
        """
        if self.action in ['list', 'retrieve', 'tree', 'children', 'hierarchy', 'by_level']:
            permission_classes = [IsAuthenticated]
        else:
            permission_classes = [IsAuthenticated & IsSystemAdmin]
        return [permission() for permission in permission_classes]
    
    def get_serializer_class(self):
        if self.action == "list":
            return EntityListSerializer
        if self.action == "tree":
            return EntityTreeSerializer
        return EntitySerializer
    
    def get_queryset(self):
        qs = super().get_queryset()
        
        # فلترة حسب المستوى
        level = self.request.query_params.get("level")
        if level:
            qs = qs.filter(level=level)
        
        # فلترة حسب النشاط - بشكل افتراضي إرجاع النشطة فقط
        is_active = self.request.query_params.get("is_active")
        if is_active is not None:
            qs = qs.filter(is_active=is_active.lower() == "true")
        else:
            # إذا لم يتم تحديد is_active، إرجاع النشطة فقط (للـ list action)
            if self.action == "list":
                qs = qs.filter(is_active=True)
        
        # فلترة حسب الجهة الأم
        parent_id = self.request.query_params.get("parent")
        if parent_id:
            qs = qs.filter(parent_id=parent_id)
        
        # البحث
        search = self.request.query_params.get("search")
        if search:
            qs = qs.filter(
                Q(name__icontains=search) |
                Q(code__icontains=search) |
                Q(description__icontains=search)
            )
        
        return qs.order_by("level", "name")
    
    @action(detail=False, methods=["get"])
    def tree(self, request):
        """
        إرجاع الهيكل الهرمي الكامل (شجري)
        """
        # إرجاع فقط الجهات من المستوى 1 (الوكالات/القطاعات)
        root_entities = self.get_queryset().filter(
            level=Entity.Level.VICE_RECTORATE,
            is_active=True
        )
        serializer = self.get_serializer(root_entities, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=["get"])
    def children(self, request, pk=None):
        """
        إرجاع جميع الأبناء المباشرين للجهة
        """
        entity = self.get_object()
        children = entity.children.filter(is_active=True)
        serializer = EntityListSerializer(children, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=["get"])
    def hierarchy(self, request, pk=None):
        """
        إرجاع التسلسل الهرمي الكامل للجهة (من الجذر إلى الجهة الحالية)
        """
        entity = self.get_object()
        hierarchy = []
        current = entity
        
        while current:
            hierarchy.insert(0, EntityListSerializer(current).data)
            current = current.parent
        
        return Response(hierarchy)
    
    @action(detail=False, methods=["get"], permission_classes=[IsAuthenticated & IsSystemAdmin])
    def by_level(self, request):
        """
        إرجاع الجهات مجمعة حسب المستوى
        """
        levels = {
            Entity.Level.VICE_RECTORATE: [],
            Entity.Level.COLLEGE_DEANSHIP: [],
            Entity.Level.DEPARTMENT_UNIT: [],
        }
        
        entities = self.get_queryset().filter(is_active=True)
        for entity in entities:
            levels[entity.level].append(EntityListSerializer(entity).data)
        
        return Response(levels)
