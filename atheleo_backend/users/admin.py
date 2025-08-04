from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import CustomUser

class CustomUserAdmin(UserAdmin):
    # CustomUser 모델에 추가된 필드를 관리자 페이지에 표시
    fieldsets = UserAdmin.fieldsets + (
        (None, {'fields': ('name', 'phone', 'is_subscribed')}),
    )
    # list_display에 추가하여 목록에서 바로 볼 수 있도록 함
    list_display = ('username', 'email', 'name', 'phone', 'is_staff', 'is_subscribed')

admin.site.register(CustomUser, CustomUserAdmin)
