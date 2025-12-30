"""
Celery tasks لإدارة الإشعارات
"""
from celery import shared_task
from django.utils import timezone
from datetime import timedelta

from notifications.models import Notification, NotificationPreference
from orders.models import DesignOrder, PrintOrder
from accounts.models import User


@shared_task
def check_confirmation_deadlines():
    """
    إرسال إشعار قبل 24 ساعة من انتهاء مهلة التأكيد (72 ساعة)
    """
    # الطلبات التي تبقى لها أقل من 24 ساعة للتأكيد
    deadline_threshold = timezone.now() + timedelta(hours=24)
    
    # طلبات التصميم
    design_orders = DesignOrder.objects.filter(
        status=DesignOrder.Status.PENDING_CONFIRM,
        confirmation_deadline__lte=deadline_threshold,
        confirmation_deadline__gt=timezone.now(),
    )
    
    for order in design_orders:
        # التحقق من تفضيلات المستخدم
        prefs, _ = NotificationPreference.objects.get_or_create(user=order.requester)
        if not prefs.order_updates:
            continue
        
        # التحقق من عدم إرسال إشعار سابق
        existing_notification = Notification.objects.filter(
            recipient=order.requester,
            type=Notification.Type.DEADLINE_WARNING,
            data__order_id=str(order.id),
            created_at__gte=timezone.now() - timedelta(hours=1),
        ).exists()
        
        if not existing_notification:
            Notification.objects.create(
                recipient=order.requester,
                title="تحذير: مهلة التأكيد تنتهي قريباً",
                message=f"طلب التصميم {order.order_code} يحتاج تأكيد خلال 24 ساعة",
                type=Notification.Type.DEADLINE_WARNING,
                data={
                    "order_id": str(order.id),
                    "order_code": order.order_code,
                    "order_type": "design",
                    "deadline": order.confirmation_deadline.isoformat(),
                },
            )
    
    # طلبات الطباعة
    print_orders = PrintOrder.objects.filter(
        status=PrintOrder.Status.PENDING_CONFIRM,
        confirmation_deadline__lte=deadline_threshold,
        confirmation_deadline__gt=timezone.now(),
    )
    
    for order in print_orders:
        prefs, _ = NotificationPreference.objects.get_or_create(user=order.requester)
        if not prefs.order_updates:
            continue
        
        existing_notification = Notification.objects.filter(
            recipient=order.requester,
            type=Notification.Type.DEADLINE_WARNING,
            data__order_id=str(order.id),
            created_at__gte=timezone.now() - timedelta(hours=1),
        ).exists()
        
        if not existing_notification:
            Notification.objects.create(
                recipient=order.requester,
                title="تحذير: مهلة التأكيد تنتهي قريباً",
                message=f"طلب الطباعة {order.order_code} يحتاج تأكيد خلال 24 ساعة",
                type=Notification.Type.DEADLINE_WARNING,
                data={
                    "order_id": str(order.id),
                    "order_code": order.order_code,
                    "order_type": "print",
                    "deadline": order.confirmation_deadline.isoformat(),
                },
            )


@shared_task
def check_expired_confirmations():
    """
    تعليق الطلبات التي تجاوزت مهلة التأكيد (72 ساعة)
    """
    now = timezone.now()
    
    # طلبات التصميم
    expired_design_orders = DesignOrder.objects.filter(
        status=DesignOrder.Status.PENDING_CONFIRM,
        confirmation_deadline__lt=now,
    )
    
    for order in expired_design_orders:
        order.status = DesignOrder.Status.SUSPENDED
        order.save(update_fields=["status", "updated_at"])
        
        # إرسال إشعار
        Notification.objects.create(
            recipient=order.requester,
            title="تم تعليق الطلب",
            message=f"تم تعليق طلب التصميم {order.order_code} بسبب تجاوز مهلة التأكيد",
            type=Notification.Type.ORDER_STATUS,
            data={
                "order_id": str(order.id),
                "order_code": order.order_code,
                "order_type": "design",
                "status": "suspended",
            },
        )
    
    # طلبات الطباعة
    expired_print_orders = PrintOrder.objects.filter(
        status=PrintOrder.Status.PENDING_CONFIRM,
        confirmation_deadline__lt=now,
    )
    
    for order in expired_print_orders:
        order.status = PrintOrder.Status.SUSPENDED
        order.save(update_fields=["status", "updated_at"])
        
        Notification.objects.create(
            recipient=order.requester,
            title="تم تعليق الطلب",
            message=f"تم تعليق طلب الطباعة {order.order_code} بسبب تجاوز مهلة التأكيد",
            type=Notification.Type.ORDER_STATUS,
            data={
                "order_id": str(order.id),
                "order_code": order.order_code,
                "order_type": "print",
                "status": "suspended",
            },
        )


@shared_task
def notify_ready_for_delivery():
    """
    إرسال إشعار عند جاهزية الطلب للتسليم
    """
    # طلبات الطباعة الجاهزة في المستودع
    ready_orders = PrintOrder.objects.filter(
        status=PrintOrder.Status.IN_WAREHOUSE,
        confirmed_at__isnull=False,
    )
    
    for order in ready_orders:
        # التحقق من عدم إرسال إشعار سابق
        existing_notification = Notification.objects.filter(
            recipient=order.requester,
            type=Notification.Type.READY_FOR_DELIVERY,
            data__order_id=str(order.id),
        ).exists()
        
        if not existing_notification:
            prefs, _ = NotificationPreference.objects.get_or_create(user=order.requester)
            if prefs.order_updates:
                Notification.objects.create(
                    recipient=order.requester,
                    title="طلبك جاهز للتسليم",
                    message=f"طلب الطباعة {order.order_code} جاهز للتسليم. يمكنك حجز موعد التسليم الآن.",
                    type=Notification.Type.READY_FOR_DELIVERY,
                    data={
                        "order_id": str(order.id),
                        "order_code": order.order_code,
                        "order_type": "print",
                        "delivery_method": order.delivery_method,
                    },
                )


@shared_task
def check_overdue_orders():
    """
    إرسال إشعار عند تجاوز مهلة التنفيذ
    """
    # TODO: إضافة منطق لتحديد مهلة التنفيذ حسب الأولوية
    # حالياً نتحقق من الطلبات التي في الإنتاج لأكثر من 7 أيام
    overdue_threshold = timezone.now() - timedelta(days=7)
    
    # طلبات التصميم
    overdue_design = DesignOrder.objects.filter(
        status=DesignOrder.Status.IN_DESIGN,
        submitted_at__lt=overdue_threshold,
    )
    
    for order in overdue_design:
        # إرسال إشعار للمدير ومدير القسم
        managers = User.objects.filter(
            role__in=[User.Role.PRINT_MANAGER, User.Role.DEPT_MANAGER],
            is_active=True,
        )
        
        for manager in managers:
            Notification.objects.create(
                recipient=manager,
                title="تجاوز مهلة التنفيذ",
                message=f"طلب التصميم {order.order_code} تجاوز مهلة التنفيذ",
                type=Notification.Type.SYSTEM,
                data={
                    "order_id": str(order.id),
                    "order_code": order.order_code,
                    "order_type": "design",
                },
            )
    
    # طلبات الطباعة
    overdue_print = PrintOrder.objects.filter(
        status=PrintOrder.Status.IN_PRODUCTION,
        submitted_at__lt=overdue_threshold,
    )
    
    for order in overdue_print:
        managers = User.objects.filter(
            role__in=[User.Role.PRINT_MANAGER, User.Role.DEPT_MANAGER],
            is_active=True,
        )
        
        for manager in managers:
            Notification.objects.create(
                recipient=manager,
                title="تجاوز مهلة التنفيذ",
                message=f"طلب الطباعة {order.order_code} تجاوز مهلة التنفيذ",
                type=Notification.Type.SYSTEM,
                data={
                    "order_id": str(order.id),
                    "order_code": order.order_code,
                    "order_type": "print",
                },
            )

