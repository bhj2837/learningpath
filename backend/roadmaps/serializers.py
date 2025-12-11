from rest_framework import serializers

from .models import Checklist, Progress, Roadmap, Week


class ChecklistSerializer(serializers.ModelSerializer):
    class Meta:
        model = Checklist
        fields = "__all__"
        read_only_fields = ("id", "completed_at")


class WeekSerializer(serializers.ModelSerializer):
    checklists = ChecklistSerializer(many=True, read_only=True)

    class Meta:
        model = Week
        fields = "__all__"
        read_only_fields = ("id",)


class ProgressSerializer(serializers.ModelSerializer):
    class Meta:
        model = Progress
        fields = "__all__"
        read_only_fields = ("id",)


class RoadmapSerializer(serializers.ModelSerializer):
    weeks = WeekSerializer(many=True, read_only=True)
    progress = ProgressSerializer(many=True, read_only=True)

    class Meta:
        model = Roadmap
        fields = "__all__"
        read_only_fields = ("id", "created_at", "updated_at", "user")

    def create(self, validated_data):
        request = self.context.get("request")
        if request and request.user and request.user.is_authenticated:
            validated_data["user"] = request.user
        return super().create(validated_data)

