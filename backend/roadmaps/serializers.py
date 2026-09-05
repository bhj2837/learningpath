from rest_framework import serializers

from .models import Checklist, Progress, Roadmap, Week


class OwnedRelationMixin:
    """
    관계 필드(roadmap/week)가 요청자 소유인지 검증한다.

    ViewSet의 get_queryset() 필터만으로는 쓰기 요청에서 남의 객체를 FK로
    지정하는 것을 막지 못하므로 여기서 한 번 더 확인한다.
    """

    owner_field = None  # 검증할 관계 필드명
    owner_path = None  # 해당 객체에서 User까지의 경로

    def validate(self, attrs):
        related = attrs.get(self.owner_field)
        if related is not None:
            request = self.context.get("request")
            owner = related
            for part in self.owner_path.split("__"):
                owner = getattr(owner, part)
            if not request or owner != request.user:
                raise serializers.ValidationError(
                    {self.owner_field: "접근 권한이 없습니다."}
                )
        return super().validate(attrs)


class ChecklistSerializer(OwnedRelationMixin, serializers.ModelSerializer):
    owner_field = "week"
    owner_path = "roadmap__user"

    class Meta:
        model = Checklist
        fields = "__all__"
        read_only_fields = ("id", "completed_at")


class WeekSerializer(OwnedRelationMixin, serializers.ModelSerializer):
    checklists = ChecklistSerializer(many=True, read_only=True)

    owner_field = "roadmap"
    owner_path = "user"

    class Meta:
        model = Week
        fields = "__all__"
        read_only_fields = ("id",)


class ProgressSerializer(OwnedRelationMixin, serializers.ModelSerializer):
    owner_field = "roadmap"
    owner_path = "user"

    class Meta:
        model = Progress
        fields = "__all__"
        read_only_fields = ("id",)


class RoadmapSerializer(serializers.ModelSerializer):
    weeks = WeekSerializer(many=True, read_only=True)
    progress = ProgressSerializer(many=True, read_only=True)
    total_checklists = serializers.SerializerMethodField()
    completed_checklists = serializers.SerializerMethodField()

    class Meta:
        model = Roadmap
        fields = "__all__"
        read_only_fields = ("id", "created_at", "updated_at", "user")

    def get_total_checklists(self, obj) -> int:
        return sum(len(week.checklists.all()) for week in obj.weeks.all())

    def get_completed_checklists(self, obj) -> int:
        return sum(
            1
            for week in obj.weeks.all()
            for item in week.checklists.all()
            if item.is_completed
        )

    def create(self, validated_data):
        request = self.context.get("request")
        if request and request.user and request.user.is_authenticated:
            validated_data["user"] = request.user
        return super().create(validated_data)
