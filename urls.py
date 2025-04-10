from django.urls import path
from .views import signup_view, login_view
from rest_framework_simplejwt.views import ( # JWT 인증 관련 view import
    TokenObtainPairView, TokenRefreshView
)

urlpatterns = [
    path('api/signup/', signup_view, name='signup'),
    path('api/login/', login_view, name='login'),  # 회원가입 엔드포인트
    path('api/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),# JWT 토큰 발급 엔드포인트: /api/token/
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'), # JWT 토큰 갱신 엔드포인트: /api/token/refresh/
]
