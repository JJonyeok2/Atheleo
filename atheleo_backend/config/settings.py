"""
Django settings for config project.
"""

from pathlib import Path
import os

# Build paths inside the project like this: BASE_DIR / 'subdir'.
BASE_DIR = Path(__file__).resolve().parent.parent

# SECURITY WARNING: keep the secret key used in production secret!
SECRET_KEY = 'django-insecure-br8@g033ij=4927w6vnrrj2+f74qxglqgka72w15ut893u*tld'

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = True

# 외부 접근 허용 (개발용 IP 포함)
ALLOWED_HOSTS = ['localhost', '127.0.0.1', '172.30.1.9', '172.30.1.13', '10.0.2.2']

# Application definition
INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',

    # 🔗 CORS, REST API
    'corsheaders',
    'rest_framework',

    # 🧩 Custom apps
    'users',
    'exercise',

    'rest_framework.authtoken', # Add this line for token authentication
]

REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'rest_framework.authentication.TokenAuthentication',
    ],
    'DEFAULT_PERMISSION_CLASSES': [
        # 'rest_framework.permissions.IsAuthenticated', # Temporarily commented out for testing
    ]
}

AUTH_USER_MODEL = 'users.CustomUser'

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',  # CORS가 가장 위에 와야 함
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'config.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],  # 템플릿 경로 (필요 시 수정)
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'config.wsgi.application'

# Database
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': BASE_DIR / 'db.sqlite3',
    }
}

# Password validation
AUTH_PASSWORD_VALIDATORS = [
    {
        'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator',
    },
]

# Internationalization
LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'Asia/Seoul'  # 한국 시간으로 설정
USE_I18N = True
USE_TZ = True

# Static files (CSS, JS, Images)
STATIC_URL = 'static/'

MEDIA_URL = '/media/'
MEDIA_ROOT = os.path.join(BASE_DIR, 'media')

# 기본 기본 키 필드 유형
DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# ✅ CORS 설정
CORS_ALLOW_ALL_ORIGINS = False # 개발 초기엔 True로 설정하여 모든 요청을 허용할 수 있음

# 특정 출처만 허용하도록 설정 (보안상 권장)
CORS_ALLOWED_ORIGINS = [
    "http://localhost:8081", # Expo Web
    "http://localhost:8082", # Expo Web (current)
    "http://localhost:19006", # Expo Web (alternative)
    "http://127.0.0.1:8081",
    "http://127.0.0.1:8082", # Expo Web (current)
    "http://127.0.0.1:19006",
    "http://172.30.1.13:8081",
]

# 환경 변수에서 IP 주소를 가져와 동적으로 추가
ip_address = os.environ.get('IP_ADDRESS')
if ip_address:
    CORS_ALLOWED_ORIGINS.extend([
        f"http://{ip_address}:8081",
        f"http://{ip_address}:19006",
    ])
else:
    print("Warning: IP_ADDRESS environment variable not set. CORS might not work with dynamic IP.")