# users/models.py
from django.contrib.auth.models import AbstractUser
from django.db import models

class CustomUser(AbstractUser):
    SUBSCRIPTION_CHOICES = [
        ('FREE', 'Free'),
        ('STANDARD', 'Standard'),
        ('PRO', 'Pro'),
    ]
    is_subscribed = models.BooleanField(default=False)
    subscription_type = models.CharField(max_length=10, choices=SUBSCRIPTION_CHOICES, default='FREE') # 구독 타입 추가
    name = models.CharField(max_length=100, blank=True, null=True)
    phone = models.CharField(max_length=20, blank=True, null=True)
    profile_image = models.ImageField(upload_to='profile_images/', null=True, blank=True)

    def __str__(self):
        return self.username
