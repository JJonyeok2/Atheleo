from django.contrib import admin
from django.urls import path, include


urlpatterns = [
    # Django Admin 경로
    path('admin/', admin.site.urls),

    # Django REST framework 기본 인증 URL
    path('api-auth/', include('rest_framework.urls')),

    # apiapp 앱의 URL 연결
    path('', include('apiapp.urls')),  # apiapp.urls 추가
]
