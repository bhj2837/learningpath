from django.contrib.auth.models import User
from django.core.validators import MaxValueValidator, MinValueValidator
from django.db import models


class Roadmap(models.Model):
    STATUS_CHOICES = [
        ("in_progress", "진행중"),
        ("completed", "완료"),
        ("paused", "일시중지"),
    ]
    # ⚠️ 아래 두 목록은 frontend/lib/constants.js와 반드시 일치시킬 것.
    CATEGORY_CHOICES = [
        ("개발", "개발"),
        ("디자인", "디자인"),
        ("언어", "언어"),
        ("비즈니스", "비즈니스"),
        ("기타", "기타"),
    ]
    LEVEL_CHOICES = [
        ("입문", "입문"),
        ("초급", "초급"),
        ("중급", "중급"),
        ("고급", "고급"),
    ]

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="roadmaps")
    title = models.CharField(max_length=200)
    goal = models.TextField()
    category = models.CharField(max_length=50, choices=CATEGORY_CHOICES)
    duration_weeks = models.IntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(52)]
    )
    daily_hours = models.DecimalField(
        max_digits=4,
        decimal_places=2,
        validators=[MinValueValidator(0), MaxValueValidator(24)],
    )
    current_level = models.CharField(max_length=50, choices=LEVEL_CHOICES)
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
