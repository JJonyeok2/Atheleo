from django.urls import path
from .views import analyze_exercise, body_analysis

urlpatterns = [
    path('analyze-exercise/', analyze_exercise),
    path('body-analysis/', body_analysis),
]