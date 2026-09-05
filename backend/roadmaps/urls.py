from rest_framework.routers import DefaultRouter

from .views import ChecklistViewSet, RoadmapViewSet, WeekViewSet

router = DefaultRouter()
router.register(r"roadmaps", RoadmapViewSet, basename="roadmap")
router.register(r"weeks", WeekViewSet, basename="week")
router.register(r"checklists", ChecklistViewSet, basename="checklist")

urlpatterns = router.urls
