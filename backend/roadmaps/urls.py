from rest_framework.routers import DefaultRouter

from .views import (
    ChecklistViewSet,
    ProgressViewSet,
    RoadmapViewSet,
    WeekViewSet,
)

router = DefaultRouter()
router.register(r"roadmaps", RoadmapViewSet, basename="roadmap")
router.register(r"weeks", WeekViewSet, basename="week")
router.register(r"checklists", ChecklistViewSet, basename="checklist")
router.register(r"progress", ProgressViewSet, basename="progress")

urlpatterns = router.urls

