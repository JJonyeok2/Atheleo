from django.urls import path
from .views import analyze_pushup

urlpatterns = [
    path('analyze/pushup/', analyze_pushup, name='analyze_pushup'),
]
