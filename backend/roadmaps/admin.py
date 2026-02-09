from django.contrib import admin

from .models import Checklist, Progress, Roadmap, Week


@admin.register(Roadmap)
class RoadmapAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "title",
        "user",
        "category",
        "status",
        "duration_weeks",
        "daily_hours",
        "created_at",
        "updated_at",
    )
    list_filter = ("status", "category", "created_at", "updated_at")
    search_fields = ("title", "user__username", "goal", "category", "current_level")


@admin.register(Week)
class WeekAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "roadmap",
        "week_number",
        "title",
        "estimated_hours",
    )
    list_filter = ("week_number", "roadmap__title")
    search_fields = ("title", "description", "roadmap__title")


@admin.register(Checklist)
class ChecklistAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "week",
        "content",
        "is_completed",
        "completed_at",
    )
    list_filter = ("is_completed", "completed_at")
    search_fields = ("content", "week__title", "week__roadmap__title")


@admin.register(Progress)
class ProgressAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "roadmap",
        "date",
        "hours_studied",
        "notes",
    )
    list_filter = ("date", "roadmap__title")
    search_fields = ("notes", "roadmap__title")
