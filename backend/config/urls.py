"""URL configuration for config project."""

from django.contrib import admin
from django.db import connection
from django.http import JsonResponse
from django.urls import include, path
from django.views.decorators.csrf import csrf_exempt


@csrf_exempt
def healthz(request):
    """
    배포 플랫폼용 헬스체크. 인증이 필요 없어야 한다.

    ⚠️ 인증이 걸린 API 경로를 헬스체크로 지정하면 항상 401이 떨어져
       배포가 영구히 unhealthy 상태가 된다.
    """
    try:
        connection.ensure_connection()
    except Exception:
        return JsonResponse({"status": "error", "database": "unavailable"}, status=503)
    return JsonResponse({"status": "ok"})


urlpatterns = [
    path('healthz/', healthz, name='healthz'),
    path('admin/', admin.site.urls),
    path('api/roadmaps/', include('roadmaps.urls')),
    path('api/users/', include('users.urls')),
]
