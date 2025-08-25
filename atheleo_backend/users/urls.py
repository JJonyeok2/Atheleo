from django.urls import path
from .views import SignupView, LoginView, ProfileView, SubscribeView

urlpatterns = [
    path('signup/', SignupView.as_view(), name='signup'),
    path('login/', LoginView.as_view(), name='login'),
    path('profile/', ProfileView.as_view(), name='profile'), # 프로필 API 추가
    path('subscribe/', SubscribeView.as_view(), name='subscribe'), # 구독 API 추가
]
