# apiapp/serializers.py
from rest_framework import serializers
from .models import CustomUser


class CustomUserSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomUser
        fields = ['username', 'password', 'email', 'birthdate', 'phone',
                  'privacy_consent', 'sms_consent', 'email_consent']
        extra_kwargs = {'password': {'write_only': True}}  # 비밀번호는 쓰기 전용으로 설정

    def create(self, validated_data):
        user = CustomUser.objects.create_user(
            username=validated_data['username'],
            password=validated_data['password'],
            email=validated_data.get('email'),
            birthdate=validated_data.get('birthdate'),
            phone=validated_data.get('phone'),
            privacy_consent=validated_data.get('privacy_consent', False),
            sms_consent=validated_data.get('sms_consent', False),
            email_consent=validated_data.get('email_consent', False)
        )
        return user
