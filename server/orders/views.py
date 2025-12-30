from django.db import transaction
from django.utils import timezone
from rest_framework import filters, status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from accounts.permissions import (
    IsApprover,
    IsDeptEmployee,
    IsPrintManager,
    IsSystemAdmin,
)
from notifications.models import Notification, NotificationPreference
from orders.models import (
    DesignOrder,
    Order,
    OrderApproval,
    OrderAttachment,
    OrderStatusLog,
    PrintOrder,
)
from orders.serializers import (
    DesignOrderCreateSerializer,
    DesignOrderDetailSerializer,
    DesignOrderListSerializer,
    OrderAttachmentSerializer,
    OrderCreateSerializer,
    OrderDetailSerializer,
    OrderListSerializer,
    PrintOrderCreateSerializer,
    PrintOrderDetailSerializer,
    PrintOrderListSerializer,
)


class OrderViewSet(viewsets.ModelViewSet):
    queryset = (
        Order.objects.select_related("service", "requester", "current_approver")
        .prefetch_related("field_values__field", "attachments", "approvals", "status_history")
        .all()
    )
    permission_classes = [IsAuthenticated]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ["order_code", "service__name", "requester__full_name", "department"]
    ordering_fields = ["submitted_at", "status", "priority"]
    ordering = ["-submitted_at"]  # Default ordering

    def get_serializer_class(self):
        if self.action == "list":
            return OrderListSerializer
        if self.action == "create":
            return OrderCreateSerializer
        return OrderDetailSerializer

    def get_queryset(self):
        user = self.request.user
        qs = super().get_queryset()
        if user.is_admin:
            base_qs = qs
        elif user.is_approver:
            base_qs = qs.filter(current_approver_id=user.id) | qs.filter(requester_id=user.id)
        else:
            # Filter by requester - use user ID for exact match
            base_qs = qs.filter(requester_id=user.id)
        
        # Apply status filter from query params
        status_filter = self.request.query_params.get("status")
        if status_filter:
            base_qs = base_qs.filter(status=status_filter)
        
        # Apply priority filter from query params
        priority_filter = self.request.query_params.get("priority")
        if priority_filter:
            base_qs = base_qs.filter(priority=priority_filter)
        
        # Apply service filter from query params
        service_filter = self.request.query_params.get("service")
        if service_filter:
            base_qs = base_qs.filter(service_id=service_filter)
        
        return base_qs

    @action(detail=False, methods=["get"], permission_classes=[IsAuthenticated])
    def stats(self, request):
        """إحصائيات الطلبات للمستخدم الحالي"""
        user = request.user
        qs = self.get_queryset()
        
        # حساب الإحصائيات
        total_orders = qs.count()
        # الطلبات النشطة: كل الطلبات ما عدا المرفوضة والملغاة
        active_orders = qs.exclude(
            status__in=[Order.Status.REJECTED, Order.Status.CANCELLED]
        ).count()
        pending_orders = qs.filter(status=Order.Status.PENDING).count()
        in_review_orders = qs.filter(status=Order.Status.IN_REVIEW).count()
        pending_approvals = pending_orders + in_review_orders
        # الطلبات المكتملة: جاهزة للتسليم
        completed_orders = qs.filter(status=Order.Status.READY).count()
        
        return Response({
            "total_orders": total_orders,
            "active_orders": active_orders,
            "pending_approvals": pending_approvals,
            "completed_orders": completed_orders,
            "pending_orders": pending_orders,
            "in_review_orders": in_review_orders,
        })

    @transaction.atomic
    @action(detail=True, methods=["post"], permission_classes=[IsAuthenticated])
    def submit(self, request, pk=None):
        order = self.get_object()
        if order.status != Order.Status.DRAFT:
            return Response(
                {"detail": "لا يمكن إرسال طلب خارج حالة المسودة."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        order.status = Order.Status.PENDING
        order.submitted_at = timezone.now()
        order.save(update_fields=["status", "submitted_at", "updated_at"])
        OrderStatusLog.objects.create(
            order=order,
            status=order.status,
            note="تم إرسال الطلب رسميًا.",
            changed_by=request.user,
        )
        return Response(OrderDetailSerializer(order).data)

    @transaction.atomic
    @action(
        detail=True,
        methods=["post"],
        permission_classes=[IsAuthenticated & IsApprover],
    )
    def approve(self, request, pk=None):
        order = self.get_object()
        approval = order.approvals.filter(approver=request.user, decision="pending").first()
        if not approval:
            return Response(
                {"detail": "لا يوجد اعتماد معلق لهذا المستخدم."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        approval.decision = OrderApproval.Decision.APPROVED
        approval.comment = request.data.get("comment", "")
        approval.decided_at = timezone.now()
        approval.save(update_fields=["decision", "comment", "decided_at"])

        order.status = Order.Status.APPROVED
        order.approved_at = timezone.now()
        order.save(update_fields=["status", "approved_at", "updated_at"])
        OrderStatusLog.objects.create(
            order=order,
            status=order.status,
            note=approval.comment or "تم الاعتماد.",
            changed_by=request.user,
        )
        
        # إرسال إشعار لصاحب الطلب
        prefs, _ = NotificationPreference.objects.get_or_create(user=order.requester)
        if prefs.order_updates:
            Notification.objects.create(
                recipient=order.requester,
                title="تم اعتماد الطلب",
                message=f"تم اعتماد طلبك {order.order_code}",
                type=Notification.Type.APPROVAL,
                data={
                    "order_id": str(order.id),
                    "order_code": order.order_code,
                    "order_type": "order",
                    "status": order.status,
                },
            )
        
        return Response(OrderDetailSerializer(order).data)

    @transaction.atomic
    @action(
        detail=True,
        methods=["post"],
        permission_classes=[IsAuthenticated & IsApprover],
    )
    def reject(self, request, pk=None):
        order = self.get_object()
        approval = order.approvals.filter(approver=request.user, decision="pending").first()
        if not approval:
            return Response(
                {"detail": "لا يوجد اعتماد معلق لهذا المستخدم."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        approval.decision = OrderApproval.Decision.REJECTED
        approval.comment = request.data.get("comment", "")
        approval.decided_at = timezone.now()
        approval.save(update_fields=["decision", "comment", "decided_at"])

        order.status = Order.Status.REJECTED
        order.save(update_fields=["status", "updated_at"])
        OrderStatusLog.objects.create(
            order=order,
            status=order.status,
            note=approval.comment or "تم رفض الطلب.",
            changed_by=request.user,
        )
        
        # إرسال إشعار لصاحب الطلب
        prefs, _ = NotificationPreference.objects.get_or_create(user=order.requester)
        if prefs.order_updates:
            Notification.objects.create(
                recipient=order.requester,
                title="تم رفض الطلب",
                message=f"تم رفض طلبك {order.order_code}",
                type=Notification.Type.APPROVAL,
                data={
                    "order_id": str(order.id),
                    "order_code": order.order_code,
                    "order_type": "order",
                    "status": order.status,
                },
            )
        
        return Response(OrderDetailSerializer(order).data)

    @transaction.atomic
    @action(
        detail=True,
        methods=["post"],
        permission_classes=[IsAuthenticated & (IsSystemAdmin | IsApprover | IsPrintManager)],
        url_path="update-status",
    )
    def update_status(self, request, pk=None):
        order = self.get_object()
        status_value = request.data.get("status")
        note = request.data.get("note", "")
        
        # Log the received data for debugging
        import logging
        logger = logging.getLogger(__name__)
        logger.info(f"Update status request - Order ID: {order.id}, Status value: '{status_value}', Type: {type(status_value)}")
        logger.info(f"Request data: {request.data}")
        
        # Get valid status values from choices
        valid_statuses = [choice[0] for choice in Order.Status.choices]
        logger.info(f"Valid statuses: {valid_statuses}")
        
        # Trim and normalize the status value
        if status_value:
            status_value = str(status_value).strip()
        
        if not status_value or status_value not in valid_statuses:
            logger.warning(f"Invalid status: '{status_value}' not in {valid_statuses}")
            return Response(
                {"detail": f"حالة غير معروفة. الحالة المرسلة: '{status_value}'. الحالات المتاحة: {', '.join(valid_statuses)}"}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        # حفظ الحالة القديمة قبل التغيير
        old_status = order.status
        order.status = status_value
        if status_value == Order.Status.IN_PRODUCTION:
            order.approved_at = order.approved_at or timezone.now()
        if status_value == Order.Status.READY:
            order.completed_at = timezone.now()
        order.save(update_fields=["status", "approved_at", "completed_at", "updated_at"])
        OrderStatusLog.objects.create(
            order=order,
            status=status_value,
            note=note,
            changed_by=request.user,
        )
        
        # إرسال إشعار لصاحب الطلب عند تحديث الحالة
        import logging
        logger = logging.getLogger(__name__)
        logger.info(f"Status update: old_status='{old_status}', new_status='{status_value}', requester_id={order.requester.id}")
        
        if old_status != status_value:
            logger.info(f"Status changed, creating notification for requester: {order.requester.id} ({order.requester.full_name})")
            prefs, _ = NotificationPreference.objects.get_or_create(user=order.requester)
            logger.info(f"Notification preferences for user {order.requester.id}: order_updates={prefs.order_updates}")
            
            if prefs.order_updates:
                status_labels = dict(Order.Status.choices)
                status_label = status_labels.get(status_value, status_value)
                notification = Notification.objects.create(
                    recipient=order.requester,
                    title="تم تحديث حالة الطلب",
                    message=f"تم تحديث حالة طلبك {order.order_code} إلى: {status_label}",
                    type=Notification.Type.ORDER_STATUS,
                    data={
                        "order_id": str(order.id),
                        "order_code": order.order_code,
                        "order_type": "order",
                        "old_status": old_status,
                        "new_status": status_value,
                        "note": note,
                    },
                )
                logger.info(f"Notification created successfully: id={notification.id}, recipient={notification.recipient.id}, title='{notification.title}'")
            else:
                logger.warning(f"Notification not created: order_updates is False for user {order.requester.id}")
        else:
            logger.info(f"Notification not created: status unchanged (old_status='{old_status}', new_status='{status_value}')")
        
        return Response(OrderDetailSerializer(order).data)

    @transaction.atomic
    @action(detail=True, methods=["post"], permission_classes=[IsAuthenticated], url_path="attach")
    def attach(self, request, pk=None):
        order = self.get_object()
        serializer = OrderAttachmentSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        attachment: OrderAttachment = serializer.save(order=order, uploaded_by=request.user)
        return Response(
            OrderAttachmentSerializer(attachment).data,
            status=status.HTTP_201_CREATED,
        )


class DesignOrderViewSet(viewsets.ModelViewSet):
    """
    ViewSet لإدارة طلبات التصميم
    """
    queryset = DesignOrder.objects.select_related("requester", "entity").prefetch_related("attachments").all()
    permission_classes = [IsAuthenticated]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ["order_code", "title", "requester__full_name"]
    ordering_fields = ["submitted_at", "status", "priority"]
    ordering = ["-submitted_at"]
    
    def get_serializer_class(self):
        if self.action == "list":
            return DesignOrderListSerializer
        if self.action == "create":
            return DesignOrderCreateSerializer
        return DesignOrderDetailSerializer
    
    def get_queryset(self):
        user = self.request.user
        qs = super().get_queryset()
        if user.is_print_manager:
            base_qs = qs
        else:
            base_qs = qs.filter(requester_id=user.id)
        
        # Apply status filter from query params
        status_filter = self.request.query_params.get("status")
        if status_filter:
            base_qs = base_qs.filter(status=status_filter)
        
        # Apply priority filter from query params
        priority_filter = self.request.query_params.get("priority")
        if priority_filter:
            base_qs = base_qs.filter(priority=priority_filter)
        
        return base_qs
    
    @transaction.atomic
    @action(
        detail=True,
        methods=["post"],
        permission_classes=[IsAuthenticated & IsPrintManager],
    )
    def approve(self, request, pk=None):
        """قبول الطلب وانتقاله إلى IN_DESIGN"""
        design_order = self.get_object()
        if design_order.status != DesignOrder.Status.PENDING_REVIEW:
            return Response(
                {"detail": "الطلب ليس في حالة انتظار المراجعة."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        design_order.status = DesignOrder.Status.IN_DESIGN
        design_order.save(update_fields=["status", "updated_at"])
        
        # إرسال إشعار لصاحب الطلب
        prefs, _ = NotificationPreference.objects.get_or_create(user=design_order.requester)
        if prefs.order_updates:
            Notification.objects.create(
                recipient=design_order.requester,
                title="تم قبول طلب التصميم",
                message=f"تم قبول طلب التصميم {design_order.order_code} وانتقاله إلى قيد التصميم",
                type=Notification.Type.ORDER_STATUS,
                data={
                    "order_id": str(design_order.id),
                    "order_code": design_order.order_code,
                    "order_type": "design",
                    "status": design_order.status,
                },
            )
        
        return Response(DesignOrderDetailSerializer(design_order).data)
    
    @transaction.atomic
    @action(
        detail=True,
        methods=["post"],
        permission_classes=[IsAuthenticated & IsPrintManager],
    )
    def reject(self, request, pk=None):
        """رفض الطلب"""
        design_order = self.get_object()
        if design_order.status != DesignOrder.Status.PENDING_REVIEW:
            return Response(
                {"detail": "الطلب ليس في حالة انتظار المراجعة."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        design_order.status = DesignOrder.Status.REJECTED
        design_order.save(update_fields=["status", "updated_at"])
        
        # إرسال إشعار لصاحب الطلب
        prefs, _ = NotificationPreference.objects.get_or_create(user=design_order.requester)
        if prefs.order_updates:
            Notification.objects.create(
                recipient=design_order.requester,
                title="تم رفض طلب التصميم",
                message=f"تم رفض طلب التصميم {design_order.order_code}",
                type=Notification.Type.ORDER_STATUS,
                data={
                    "order_id": str(design_order.id),
                    "order_code": design_order.order_code,
                    "order_type": "design",
                    "status": design_order.status,
                },
            )
        
        return Response(DesignOrderDetailSerializer(design_order).data)
    
    @transaction.atomic
    @action(
        detail=True,
        methods=["post"],
        permission_classes=[IsAuthenticated & IsPrintManager],
    )
    def return_to_requester(self, request, pk=None):
        """إرجاع الطلب للمستهلك"""
        design_order = self.get_object()
        design_order.status = DesignOrder.Status.RETURNED
        design_order.save(update_fields=["status", "updated_at"])
        
        # إرسال إشعار لصاحب الطلب
        prefs, _ = NotificationPreference.objects.get_or_create(user=design_order.requester)
        if prefs.order_updates:
            Notification.objects.create(
                recipient=design_order.requester,
                title="تم إرجاع طلب التصميم",
                message=f"تم إرجاع طلب التصميم {design_order.order_code} إليك للمراجعة",
                type=Notification.Type.ORDER_STATUS,
                data={
                    "order_id": str(design_order.id),
                    "order_code": design_order.order_code,
                    "order_type": "design",
                    "status": design_order.status,
                },
            )
        
        return Response(DesignOrderDetailSerializer(design_order).data)
    
    @transaction.atomic
    @action(
        detail=True,
        methods=["post"],
        permission_classes=[IsAuthenticated & IsPrintManager],
        url_path="update-status",
    )
    def update_status(self, request, pk=None):
        """تحديث حالة طلب التصميم"""
        design_order = self.get_object()
        status_value = request.data.get("status")
        note = request.data.get("note", "")
        # Get valid status values from choices
        valid_statuses = [choice[0] for choice in DesignOrder.Status.choices]
        if status_value not in valid_statuses:
            return Response(
                {"detail": f"حالة غير معروفة. الحالات المتاحة: {', '.join(valid_statuses)}"}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        design_order.status = status_value
        if status_value == DesignOrder.Status.COMPLETED:
            design_order.completed_at = timezone.now()
        design_order.save(update_fields=["status", "completed_at", "updated_at"])
        return Response(DesignOrderDetailSerializer(design_order).data)
    
    @transaction.atomic
    @action(
        detail=True,
        methods=["post"],
        permission_classes=[IsAuthenticated & IsDeptEmployee],
    )
    def mark_ready_for_confirm(self, request, pk=None):
        """تحديد الطلب كجاهز للتأكيد (من موظف التصميم)"""
        design_order = self.get_object()
        if design_order.status != DesignOrder.Status.IN_DESIGN:
            return Response(
                {"detail": "الطلب ليس في حالة التصميم."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        design_order.status = DesignOrder.Status.PENDING_CONFIRM
        design_order.save(update_fields=["status", "updated_at"])
        return Response(DesignOrderDetailSerializer(design_order).data)
    
    @transaction.atomic
    @action(
        detail=True,
        methods=["post"],
        permission_classes=[IsAuthenticated],
    )
    def confirm(self, request, pk=None):
        """تأكيد الطلب من المستهلك (قاعدة 72 ساعة)"""
        design_order = self.get_object()
        if design_order.status != DesignOrder.Status.PENDING_CONFIRM:
            return Response(
                {"detail": "الطلب ليس في حالة انتظار التأكيد."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if design_order.is_confirmation_expired:
            design_order.status = DesignOrder.Status.SUSPENDED
            design_order.save(update_fields=["status", "updated_at"])
            return Response(
                {"detail": "انتهت مهلة التأكيد (72 ساعة). تم تعليق الطلب."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        design_order.status = DesignOrder.Status.COMPLETED
        design_order.confirmed_at = timezone.now()
        design_order.completed_at = timezone.now()
        design_order.save(update_fields=["status", "confirmed_at", "completed_at", "updated_at"])
        return Response(DesignOrderDetailSerializer(design_order).data)


class PrintOrderViewSet(viewsets.ModelViewSet):
    """
    ViewSet لإدارة طلبات الطباعة
    """
    queryset = PrintOrder.objects.select_related("requester", "entity").prefetch_related("attachments").all()
    permission_classes = [IsAuthenticated]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ["order_code", "print_type", "requester__full_name"]
    ordering_fields = ["submitted_at", "status", "priority"]
    ordering = ["-submitted_at"]
    
    def get_serializer_class(self):
        if self.action == "list":
            return PrintOrderListSerializer
        if self.action == "create":
            return PrintOrderCreateSerializer
        return PrintOrderDetailSerializer
    
    def get_queryset(self):
        user = self.request.user
        qs = super().get_queryset()
        if user.is_print_manager or user.is_dept_manager or user.is_dept_employee:
            base_qs = qs
        else:
            base_qs = qs.filter(requester_id=user.id)
        
        # Apply status filter from query params
        status_filter = self.request.query_params.get("status")
        if status_filter:
            base_qs = base_qs.filter(status=status_filter)
        
        # Apply priority filter from query params
        priority_filter = self.request.query_params.get("priority")
        if priority_filter:
            base_qs = base_qs.filter(priority=priority_filter)
        
        return base_qs
    
    @transaction.atomic
    @action(
        detail=True,
        methods=["post"],
        permission_classes=[IsAuthenticated & IsPrintManager],
    )
    def approve(self, request, pk=None):
        """قبول الطلب وانتقاله إلى IN_PRODUCTION"""
        print_order = self.get_object()
        if print_order.status != PrintOrder.Status.PENDING_REVIEW:
            return Response(
                {"detail": "الطلب ليس في حالة انتظار المراجعة."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        print_order.status = PrintOrder.Status.IN_PRODUCTION
        print_order.save(update_fields=["status", "updated_at"])
        
        # إرسال إشعار لصاحب الطلب
        prefs, _ = NotificationPreference.objects.get_or_create(user=print_order.requester)
        if prefs.order_updates:
            Notification.objects.create(
                recipient=print_order.requester,
                title="تم قبول طلب الطباعة",
                message=f"تم قبول طلب الطباعة {print_order.order_code} وانتقاله إلى قيد الإنتاج",
                type=Notification.Type.ORDER_STATUS,
                data={
                    "order_id": str(print_order.id),
                    "order_code": print_order.order_code,
                    "order_type": "print",
                    "status": print_order.status,
                },
            )
        
        return Response(PrintOrderDetailSerializer(print_order).data)
    
    @transaction.atomic
    @action(
        detail=True,
        methods=["post"],
        permission_classes=[IsAuthenticated & IsDeptEmployee],
        url_path="update-actual-quantity",
    )
    def update_actual_quantity(self, request, pk=None):
        """تحديث الكمية الفعلية المنفذة (لخصم المخزون)"""
        print_order = self.get_object()
        if print_order.status != PrintOrder.Status.IN_PRODUCTION:
            return Response(
                {"detail": "الطلب ليس في حالة الإنتاج."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        actual_quantity = request.data.get("actual_quantity")
        if not actual_quantity or actual_quantity <= 0:
            return Response(
                {"detail": "يجب تحديد كمية فعلية صحيحة."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        print_order.actual_quantity = actual_quantity
        print_order.status = PrintOrder.Status.PENDING_CONFIRM
        print_order.save(update_fields=["actual_quantity", "status", "updated_at"])
        
        # TODO: خصم المخزون تلقائياً (سيتم إضافته في نظام المخزون)
        
        return Response(PrintOrderDetailSerializer(print_order).data)
    
    @transaction.atomic
    @action(
        detail=True,
        methods=["post"],
        permission_classes=[IsAuthenticated & IsPrintManager],
        url_path="update-status",
    )
    def update_status(self, request, pk=None):
        """تحديث حالة طلب الطباعة"""
        print_order = self.get_object()
        status_value = request.data.get("status")
        note = request.data.get("note", "")
        # Get valid status values from choices
        valid_statuses = [choice[0] for choice in PrintOrder.Status.choices]
        if status_value not in valid_statuses:
            return Response(
                {"detail": f"حالة غير معروفة. الحالات المتاحة: {', '.join(valid_statuses)}"}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        print_order.status = status_value
        if status_value == PrintOrder.Status.ARCHIVED:
            print_order.completed_at = timezone.now()
        print_order.save(update_fields=["status", "completed_at", "updated_at"])
        return Response(PrintOrderDetailSerializer(print_order).data)
    
    @transaction.atomic
    @action(
        detail=True,
        methods=["post"],
        permission_classes=[IsAuthenticated & IsPrintManager],
        url_path="update-status",
    )
    def update_status(self, request, pk=None):
        """تحديث حالة طلب الطباعة"""
        print_order = self.get_object()
        status_value = request.data.get("status")
        note = request.data.get("note", "")
        if status_value not in dict(PrintOrder.Status.choices):
            return Response({"detail": "حالة غير معروفة."}, status=status.HTTP_400_BAD_REQUEST)
        print_order.status = status_value
        if status_value == PrintOrder.Status.ARCHIVED:
            print_order.completed_at = timezone.now()
        print_order.save(update_fields=["status", "completed_at", "updated_at"])
        return Response(PrintOrderDetailSerializer(print_order).data)
    
    @transaction.atomic
    @action(
        detail=True,
        methods=["post"],
        permission_classes=[IsAuthenticated],
    )
    def confirm(self, request, pk=None):
        """تأكيد الطلب من المستهلك (قاعدة 72 ساعة)"""
        print_order = self.get_object()
        if print_order.status != PrintOrder.Status.PENDING_CONFIRM:
            return Response(
                {"detail": "الطلب ليس في حالة انتظار التأكيد."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if print_order.is_confirmation_expired:
            print_order.status = PrintOrder.Status.SUSPENDED
            print_order.save(update_fields=["status", "updated_at"])
            return Response(
                {"detail": "انتهت مهلة التأكيد (72 ساعة). تم تعليق الطلب."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        print_order.status = PrintOrder.Status.IN_WAREHOUSE
        print_order.confirmed_at = timezone.now()
        print_order.save(update_fields=["status", "confirmed_at", "updated_at"])
        return Response(PrintOrderDetailSerializer(print_order).data)
    
    @transaction.atomic
    @action(
        detail=True,
        methods=["post"],
        permission_classes=[IsAuthenticated],
        url_path="schedule-delivery",
    )
    def schedule_delivery(self, request, pk=None):
        """حجز موعد التسليم/التوصيل"""
        print_order = self.get_object()
        if print_order.status != PrintOrder.Status.IN_WAREHOUSE:
            return Response(
                {"detail": "الطلب ليس في المستودع."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        # TODO: ربط مع نظام الزيارات
        print_order.status = PrintOrder.Status.DELIVERY_SCHEDULED
        print_order.save(update_fields=["status", "updated_at"])
        return Response(PrintOrderDetailSerializer(print_order).data)


