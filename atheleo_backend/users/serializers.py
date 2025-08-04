from rest_framework import serializers
from .models import CustomUser

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomUser
        fields = ['id', 'username', 'email', 'name', 'phone', 'subscription_type', 'is_subscribed', 'profile_image', 'password']
        read_only_fields = ['id', 'username', 'is_subscribed', 'subscription_type']
        extra_kwargs = {
            'password': {'write_only': True, 'required': False},
            'profile_image': {'required': False, 'allow_null': True}
        }

    def create(self, validated_data):
        return CustomUser.objects.create_user(**validated_data)

    def update(self, instance, validated_data):
        # password는 별도로 처리
        password = validated_data.pop('password', None)
        if password:
            instance.set_password(password)

        # profile_image가 데이터에 없으면 기존 값을 유지
        # validated_data에 profile_image가 있고 값이 None이면 이미지 삭제
        if 'profile_image' not in validated_data:
            pass # 이미지 변경 없음
        else:
            instance.profile_image = validated_data['profile_image']

        # 나머지 필드 업데이트
        instance.email = validated_data.get('email', instance.email)
        instance.name = validated_data.get('name', instance.name)
        instance.phone = validated_data.get('phone', instance.phone)
        
        instance.save()
        return instance