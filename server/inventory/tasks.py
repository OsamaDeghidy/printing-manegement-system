"""
Celery tasks لإدارة المخزون
"""
from celery import shared_task
from django.db.models import F
from django.utils import timezone

from inventory.models import InventoryItem
from notifications.models import Notification
from accounts.models import User


@shared_task
def check_low_stock():
    """
    التحقق من انخفاض المخزون وإرسال تنبيهات
    """
    low_stock_items = InventoryItem.objects.filter(
        current_quantity__lte=F("min_quantity"),
        is_active=True,
    )
    
    if not low_stock_items.exists():
        return
    
    # إرسال إشعار لمدير المطبعة
    print_managers = User.objects.filter(
        role__in=[User.Role.PRINT_MANAGER, User.Role.ADMIN],
        is_active=True,
    )
    
    items_list = ", ".join([item.name for item in low_stock_items[:5]])
    message = f"انخفض المخزون للعناصر التالية: {items_list}"
    if low_stock_items.count() > 5:
        message += f" و{low_stock_items.count() - 5} عنصر آخر"
    
    for manager in print_managers:
        Notification.objects.create(
            recipient=manager,
            title="تنبيه انخفاض المخزون",
            message=message,
            type=Notification.Type.INVENTORY,
            data={
                "items_count": low_stock_items.count(),
                "items": [
                    {
                        "id": str(item.id),
                        "name": item.name,
                        "current_quantity": item.current_quantity,
                        "min_quantity": item.min_quantity,
                    }
                    for item in low_stock_items[:10]
                ],
            },
        )

