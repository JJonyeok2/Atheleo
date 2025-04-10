from django.contrib.auth.models import AbstractUser, BaseUserManager
from django.db import models


class CustomUserManager(BaseUserManager):
    use_in_migrations = True

    def create_user(self, username, password=None, **extra_fields):
        if not username:
            raise ValueError('사용자 이름(username)은 필수입니다.')
        user = self.model(username=username, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, username, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)

        if extra_fields.get('is_staff') is not True:
            raise ValueError('슈퍼유저는 is_staff=True 여야 합니다.')
        if extra_fields.get('is_superuser') is not True:
            raise ValueError('슈퍼유저는 is_superuser=True 여야 합니다.')

        return self.create_user(username, password, **extra_fields)


class CustomUser(AbstractUser):
    name = models.CharField(max_length=100)
    birthdate = models.DateField(null=True, blank=True)
    phone = models.CharField(max_length=20, unique=True)
    privacy_consent = models.BooleanField(default=False)
    sms_consent = models.BooleanField(default=False)
    email_consent = models.BooleanField(default=False)

    objects = CustomUserManager()  # ✅ 여기서 매니저 연결

    def __str__(self):
        return self.username
