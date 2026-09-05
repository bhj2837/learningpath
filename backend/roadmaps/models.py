from django.contrib.auth.models import User
from django.core.validators import MinValueValidator
from django.db import models


class Roadmap(models.Model):
    STATUS_CHOICES = [
        ("in_progress", "진행중"),
        ("completed", "완료"),
        ("paused", "일시중지"),
    ]

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="roadmaps")
    title = models.CharField(max_length=200)
    goal = models.TextField()
    category = models.CharField(max_length=50)
    duration_weeks = models.IntegerField(validators=[MinValueValidator(1)])
    daily_hours = models.DecimalField(
        max_digits=4, decimal_places=2, validators=[MinValueValidator(0)]
    )
    current_level = models.CharField(max_length=50)
    status = models.CharField(
        max_length=20, choices=STATUS_CHOICES, default="in_progress"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [models.Index(fields=["user", "-created_at"])]

    def __str__(self) -> str:
        return f"{self.title} ({self.user.username})"


class Week(models.Model):
    roadmap = models.ForeignKey(
        Roadmap, on_delete=models.CASCADE, related_name="weeks"
    )
    week_number = models.IntegerField(validators=[MinValueValidator(1)])
    title = models.CharField(max_length=200)
    description = models.TextField()
    estimated_hours = models.IntegerField(validators=[MinValueValidator(0)])
    resources = models.JSONField(default=list)
    project_suggestion = models.TextField(blank=True)

    class Meta:
        ordering = ["week_number"]
        constraints = [
            models.UniqueConstraint(
                fields=["roadmap", "week_number"], name="unique_week_per_roadmap"
            )
        ]

    def __str__(self) -> str:
        return f"{self.roadmap.title} - Week {self.week_number}: {self.title}"


class Checklist(models.Model):
    week = models.ForeignKey(Week, on_delete=models.CASCADE, related_name="checklists")
    content = models.CharField(max_length=500)
    is_completed = models.BooleanField(default=False)
    completed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ["id"]

    def __str__(self) -> str:
        return self.content


class Progress(models.Model):
    roadmap = models.ForeignKey(
        Roadmap, on_delete=models.CASCADE, related_name="progress"
    )
    date = models.DateField()
    hours_studied = models.DecimalField(
        max_digits=4, decimal_places=2, validators=[MinValueValidator(0)]
    )
    notes = models.TextField(blank=True)

    class Meta:
        ordering = ["-date"]
        constraints = [
            models.UniqueConstraint(
                fields=["roadmap", "date"], name="unique_progress_per_day"
            )
        ]

    def __str__(self) -> str:
        return f"{self.roadmap.title} - {self.date}"
