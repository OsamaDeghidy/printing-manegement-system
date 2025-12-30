from django.test import TestCase

from accounts.models import User
from catalog.models import Service
from orders.models import Order


class OrderModelTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            email="tester@taibahu.edu.sa",
            password="StrongPass123",
            full_name="Tester User",
            role=User.Role.ADMIN,
        )
        self.service = Service.objects.create(
            name="طباعة اختبارية",
            description="خدمة تجريبية للاختبار",
            icon="🧪",
        )

    def test_order_code_sequence_increments(self):
        first_order = Order.objects.create(
            service=self.service,
            requester=self.user,
            requires_approval=False,
        )
        second_order = Order.objects.create(
            service=self.service,
            requester=self.user,
            requires_approval=False,
        )

        self.assertTrue(first_order.order_code.endswith("0001"))
        self.assertTrue(second_order.order_code.endswith("0002"))
        self.assertNotEqual(first_order.order_code, second_order.order_code)


