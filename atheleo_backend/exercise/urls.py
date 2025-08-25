from django.urls import path
from .views import exercise_score 

urlpatterns = [
    path('exercise/', exercise_score),
]
