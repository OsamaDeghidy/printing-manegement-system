from rest_framework.routers import DefaultRouter
from .views import TrainingEvaluationViewSet, TrainingRequestViewSet

router = DefaultRouter()
router.register(r"training-requests", TrainingRequestViewSet, basename="training-request")
router.register(r"training-evaluations", TrainingEvaluationViewSet, basename="training-evaluation")

urlpatterns = router.urls

