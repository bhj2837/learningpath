from django.utils import timezone
from rest_framework import permissions, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from .models import Checklist, Progress, Roadmap, Week
from .serializers import (
    ChecklistSerializer,
    ProgressSerializer,
    RoadmapSerializer,
    WeekSerializer,
)


class RoadmapViewSet(viewsets.ModelViewSet):
    queryset = Roadmap.objects.all()
    serializer_class = RoadmapSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return self.queryset.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class WeekViewSet(viewsets.ModelViewSet):
    queryset = Week.objects.all()
    serializer_class = WeekSerializer
    permission_classes = [permissions.IsAuthenticated]


class ChecklistViewSet(viewsets.ModelViewSet):
    queryset = Checklist.objects.all()
    serializer_class = ChecklistSerializer
    permission_classes = [permissions.IsAuthenticated]

    @action(detail=True, methods=["post"])
    def toggle_complete(self, request, pk=None):
        checklist = self.get_object()
        checklist.is_completed = not checklist.is_completed
        checklist.completed_at = timezone.now() if checklist.is_completed else None
        checklist.save()
        serializer = self.get_serializer(checklist)
        return Response(serializer.data)


class ProgressViewSet(viewsets.ModelViewSet):
    queryset = Progress.objects.all()
    serializer_class = ProgressSerializer
    permission_classes = [permissions.IsAuthenticated]
