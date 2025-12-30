"""
Django signals لإرسال الإشعارات عند إنشاء وتحديث الطلبات
"""
from django.db.models.signals import post_save
from django.dispatch import receiver
from django.contrib.auth import get_user_model

from notifications.models import Notification, NotificationPreference
from orders.models import Order, DesignOrder, PrintOrder

User = get_user_model()


def get_users_with_update_permissions():
    """
    الحصول على المستخدمين الذين لديهم صلاحيات تحديث حالة الطلب
    """
    return User.objects.filter(
        role__in=[
            User.Role.PRINT_MANAGER,
            User.Role.DEPT_MANAGER,
            User.Role.DEPT_EMPLOYEE,
            User.Role.ADMIN,  # للتوافق
            User.Role.APPROVER,  # للتوافق
        ],
        is_active=True,
    )


@receiver(post_save, sender=Order)
def notify_on_order_created(sender, instance, created, **kwargs):
    """
    إرسال إشعار عند إنشاء طلب جديد للمستخدمين الذين لديهم صلاحيات تحديث الحالة
    """
    if created and instance.status == Order.Status.PENDING:
        # الحصول على المستخدمين الذين لديهم صلاحيات تحديث الحالة
        managers = get_users_with_update_permissions()
        
        for manager in managers:
            # التحقق من تفضيلات المستخدم
            prefs, _ = NotificationPreference.objects.get_or_create(user=manager)
            if not prefs.order_updates:
                continue
            
            Notification.objects.create(
                recipient=manager,
                title="طلب جديد يحتاج مراجعة",
                message=f"تم إنشاء طلب جديد {instance.order_code} من {instance.requester.full_name}",
                type=Notification.Type.ORDER_STATUS,
                data={
                    "order_id": str(instance.id),
                    "order_code": instance.order_code,
                    "order_type": "order",
                    "requester_name": instance.requester.full_name,
                    "service_name": instance.service.name,
                },
            )


@receiver(post_save, sender=DesignOrder)
def notify_on_design_order_created(sender, instance, created, **kwargs):
    """
    إرسال إشعار عند إنشاء طلب تصميم جديد للمستخدمين الذين لديهم صلاحيات تحديث الحالة
    """
    if created and instance.status == DesignOrder.Status.PENDING_REVIEW:
        managers = get_users_with_update_permissions()
        
        for manager in managers:
            prefs, _ = NotificationPreference.objects.get_or_create(user=manager)
            if not prefs.order_updates:
                continue
            
            Notification.objects.create(
                recipient=manager,
                title="طلب تصميم جديد يحتاج مراجعة",
                message=f"تم إنشاء طلب تصميم جديد {instance.order_code} من {instance.requester.full_name}",
                type=Notification.Type.ORDER_STATUS,
                data={
                    "order_id": str(instance.id),
                    "order_code": instance.order_code,
                    "order_type": "design",
                    "requester_name": instance.requester.full_name,
                    "title": instance.title,
                },
            )


@receiver(post_save, sender=PrintOrder)
def notify_on_print_order_created(sender, instance, created, **kwargs):
    """
    إرسال إشعار عند إنشاء طلب طباعة جديد للمستخدمين الذين لديهم صلاحيات تحديث الحالة
    """
    if created and instance.status == PrintOrder.Status.PENDING_REVIEW:
        managers = get_users_with_update_permissions()
        
        for manager in managers:
            prefs, _ = NotificationPreference.objects.get_or_create(user=manager)
            if not prefs.order_updates:
                continue
            
            Notification.objects.create(
                recipient=manager,
                title="طلب طباعة جديد يحتاج مراجعة",
                message=f"تم إنشاء طلب طباعة جديد {instance.order_code} من {instance.requester.full_name}",
                type=Notification.Type.ORDER_STATUS,
                data={
                    "order_id": str(instance.id),
                    "order_code": instance.order_code,
                    "order_type": "print",
                    "requester_name": instance.requester.full_name,
                    "print_type": instance.print_type,
                },
            )

