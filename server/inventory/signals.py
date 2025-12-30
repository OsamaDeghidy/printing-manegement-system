"""
Django signals للخصم الآلي من المخزون
"""
from django.db.models.signals import post_save
from django.dispatch import receiver
from django.utils import timezone

from inventory.models import InventoryItem, InventoryLog
from orders.models import PrintOrder


@receiver(post_save, sender=PrintOrder)
def auto_deduct_inventory(sender, instance, created, **kwargs):
    """
    خصم تلقائي من المخزون عند تحديث actual_quantity في PrintOrder
    """
    # فقط عند تحديث actual_quantity (ليس عند الإنشاء)
    if created:
        return
    
    # التحقق من أن الطلب في حالة PENDING_CONFIRM أو أعلى
    if instance.status not in [
        PrintOrder.Status.PENDING_CONFIRM,
        PrintOrder.Status.IN_WAREHOUSE,
        PrintOrder.Status.DELIVERY_SCHEDULED,
        PrintOrder.Status.ARCHIVED,
    ]:
        return
    
    # التحقق من وجود actual_quantity
    if not instance.actual_quantity:
        return
    
    # حساب كمية الأوراق المستهلكة
    paper_consumption = instance.calculate_paper_consumption()
    if paper_consumption <= 0:
        return
    
    # البحث عن مادة الورق المناسبة حسب نوع الورق والحجم
    # TODO: تحسين البحث - قد نحتاج إلى ربط مباشر بين PrintOrder و InventoryItem
    paper_items = InventoryItem.objects.filter(
        category=InventoryItem.Category.PAPER,
    )
    
    # محاولة العثور على مادة ورق مطابقة
    paper_item = None
    for item in paper_items:
        # البحث في الاسم أو SKU
        if (
            instance.paper_type.lower() in item.name.lower()
            or str(instance.paper_weight) in item.name
        ):
            paper_item = item
            break
    
    # إذا لم نجد مادة ورق مطابقة، نستخدم أول مادة ورق متاحة
    if not paper_item and paper_items.exists():
        paper_item = paper_items.first()
    
    if paper_item:
        # خصم الكمية
        old_quantity = paper_item.current_quantity
        paper_item.current_quantity = max(0, paper_item.current_quantity - paper_consumption)
        paper_item.last_usage_at = timezone.now()
        paper_item.save(update_fields=["current_quantity", "last_usage_at", "updated_at"])
        
        # إنشاء سجل المخزون
        InventoryLog.objects.create(
            item=paper_item,
            operation=InventoryLog.Operation.OUT,
            quantity=-paper_consumption,
            balance_after=paper_item.current_quantity,
            reference_order=instance.order_code,
            print_order=instance,
            note=f"خصم تلقائي من طلب الطباعة {instance.order_code}",
        )

