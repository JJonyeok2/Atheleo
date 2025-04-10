from django.views.decorators.csrf import csrf_exempt
from django.contrib.auth import get_user_model, authenticate
from django.http import JsonResponse
import json

@csrf_exempt
def signup_view(request):
    if request.method == 'POST':
        data = json.loads(request.body)
        print("📩 받은 데이터:", data)

        username = data.get('username')
        password = data.get('password')
        name = data.get('name')
        email = data.get('email')
        phone = data.get('phone')
        birthdate = data.get('birthdate')
        privacy_consent = data.get('privacy_consent', False)
        sms_consent = data.get('sms_consent', False)
        email_consent = data.get('email_consent', False)

        User = get_user_model()

        # 이미 존재하는 사용자 체크
        if User.objects.filter(username=username).exists():
            return JsonResponse({'message': '이미 존재하는 사용자입니다'}, status=400)

        # 사용자 생성
        user = User.objects.create_user(
            username=username,
            password=password,
            name=name,
            email=email,
            phone=phone,
            birthdate=birthdate,
            privacy_consent=privacy_consent,
            sms_consent=sms_consent,
            email_consent=email_consent
        )

        return JsonResponse({'message': '회원가입 성공'}, status=201)

    return JsonResponse({'error': '허용되지 않은 요청 방식입니다'}, status=405)

@csrf_exempt
def login_view(request):
    if request.method == 'POST':
        data = json.loads(request.body)
        username = data.get('username')
        password = data.get('password')

        user = authenticate(request, username=username, password=password)

        if user is not None:
            return JsonResponse({'message': '로그인 성공'}, status=200)
        else:
            return JsonResponse({'message': '아이디 또는 비밀번호가 틀렸습니다'}, status=401)

    return JsonResponse({'error': '허용되지 않은 요청 방식입니다'}, status=405)
