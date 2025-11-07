# 나사렛대학교 4학년 프로젝트 실무 과목 📚 졸업 프로젝트 
# Atheleo - AI 기반 피트니스 앱

Atheleo는 실시간 AI 운동 자세 분석과 체형 분석 기능을 제공하는 React Native 기반 모바일 애플리케이션입니다.
현재 final-main은 ios 환경을 중점으로 개발했습니다.

## 📱 주요 기능

### 1. AI 운동 보조 (ExerciseWithAI)
- **실시간 자세 분석**: Vision Camera를 활용한 실시간 운동 자세 인식
- **운동 종류**: 스쿼트, 푸쉬업 지원
- **실시간 피드백**: 점수, 자세 평가, 음성 안내 제공
- **운동 횟수 카운팅**: 자동으로 운동 횟수 추적
- - 사용자 친화적으로 화면이 보이지 않는 상황에서의 피드백을 위한 
- **시각적 피드백**: 
  - 점수에 따른 색상 섬광 효과 (초록/노랑/빨강)
  - 가이드라인 오버레이로 올바른 자세 안내
-  **음성 안내**: TTS를 통한 실시간 자세 교정 안내

### 2. AI 체형 분석 (BodyAnalysisAI)
- **전신 사진 분석**: MediaPipe를 활용한 체형 분석
- **8가지 체형 분류**: 
  - 역삼각형, 삼각형, 모래시계형, 사각체형
  - 이상체형, 둥근체형, 튜브체형, 마름모형
- **랜드마크 시각화**: 신체 주요 부위 랜드마크 표시
- **상세 분석 결과**: 체형 비율 및 상세 설명 제공

### 3. 사용자 인증
- 로그인/회원가입
- 프로필 관리
- 구독 관리 및 결제

## 🛠 기술 스택

### Frontend
- **React Native** 0.74.3
- **React Navigation** - 네비게이션 관리
- **Vision Camera** 4.2.0 - 실시간 카메라 처리
- **React Native Reanimated** 3.10.1 - 애니메이션
- **React Native Worklets Core** 1.3.3 - 고성능 워클릿
- **React Native TTS** 4.1.1 - 텍스트 음성 변환
- **Axios** 1.7.7 - HTTP 클라이언트
- **React Native SVG** 15.2.0 - SVG 렌더링

### Backend
- **Django REST Framework** - RESTful API
- **MediaPipe** - 포즈 인식 및 체형 분석

### Native Modules
- **ToBase64Plugin** - iOS 네이티브 프레임 프로세서 플러그인

## 📋 사전 요구사항

- **Node.js** >= 20
- **npm** 또는 **yarn**
- **Xcode** (iOS 개발용)
- **Android Studio** (Android 개발용)
- **CocoaPods** (iOS 의존성 관리)

## 🚀 설치 및 실행

### 1. 저장소 클론

```bash
git clone <repository-url>
cd AtheleoNew
```

### 2. 의존성 설치

```bash
# Node.js 의존성 설치
npm install

# iOS 의존성 설치 (macOS만)
cd ios && pod install && cd ..
```

### 3. 환경 설정

`app/config.js` 파일에서 백엔드 API URL을 설정하세요:

```javascript
export const BASE_API_URL = 'http://YOUR_SERVER_IP:8000/api/';
export const MEDIA_BASE_URL = 'http://YOUR_SERVER_IP:8000';
```

### 4. 앱 실행

#### iOS

```bash
# Metro Bundler 시작
npm start

# 별도 터미널에서 iOS 앱 실행
npm run ios
```

또는 Xcode에서 직접 실행:
1. `ios/AtheleoNew.xcworkspace` 열기
2. 시뮬레이터 또는 실제 기기 선택
3. Run (⌘ + R)

#### Android

```bash
# Metro Bundler 시작
npm start

# 별도 터미널에서 Android 앱 실행
npm run android
```

## 📁 프로젝트 구조

```
AtheleoNew/
├── app/
│   ├── config.js              # API 설정
│   ├── plugins/
│   │   └── toBase64.js       # Base64 변환 플러그인 래퍼
│   └── screens/
│       ├── Authcontext.js    # 인증 컨텍스트
│       ├── BodyAnalysisAI.js # 체형 분석 화면
│       ├── ExerciseWithAI.js # 운동 보조 화면
│       ├── HomeScreen.js     # 홈 화면
│       ├── Login.js          # 로그인 화면
│       ├── Payment.js        # 결제 화면
│       ├── Profile.js        # 프로필 화면
│       ├── Signup.js         # 회원가입 화면
│       └── Subscribe.js      # 구독 화면
├── components/
│   ├── AnalysisVisualization.js # 체형 분석 시각화 컴포넌트
│   └── Navbar.js             # 네비게이션 바
├── ios/
│   ├── AtheleoNew/
│   │   └── ...
│   └── ToBase64Plugin.mm     # iOS 네이티브 프레임 프로세서 플러그인
├── App.js                     # 앱 진입점
├── index.js                   # 엔트리 포인트
└── package.json
```

## 🔧 주요 설정

### Babel 설정

`babel.config.js`에서 워클릿 플러그인 순서가 중요합니다:

```javascript
module.exports = {
  presets: ['@react-native/babel-preset'],
  plugins: [
    ['react-native-worklets-core/plugin'], // 반드시 먼저
    'react-native-reanimated/plugin',      // 반드시 마지막
  ],
};
```

### iOS 네이티브 플러그인

`ToBase64Plugin.mm`은 Vision Camera의 프레임 프로세서 플러그인으로, 카메라 프레임을 Base64로 변환합니다.

## 🎯 주요 기능 상세

### AI 운동 보조

1. **운동 시작 전**:
   - 가이드라인 오버레이로 올바른 자세 위치 안내
   - 플러그인 연결 상태 확인

2. **운동 중**:
   - 5초 간격으로 서버에 프레임 전송
   - 실시간 자세 분석 및 점수 계산
   - 점수에 따른 색상 피드백 (초록 ≥85, 노랑 ≥60, 빨강 <60)
   - 음성 안내로 자세 교정
   - 운동 횟수 자동 카운팅

3. **운동 완료 후**:
   - 총 운동 횟수 표시
   - 평균 점수 표시

### AI 체형 분석

1. **사진 업로드**: 라이브러리에서 선택 또는 카메라로 촬영
2. **분석 처리**: Django 백엔드에서 MediaPipe로 분석
3. **결과 표시**:
   - 체형 분류 (8가지 중 하나)
   - 신체 비율 정보
   - 상세 설명
   - 랜드마크 시각화

## 🐛 문제 해결

### Metro Bundler 캐시 문제

```bash
# 캐시 클리어 후 재시작
npx react-native start --reset-cache
```

### iOS 빌드 오류

```bash
# Pod 재설치
cd ios
rm -rf Pods Podfile.lock
pod install
cd ..
```

### Worklet 관련 오류

`App.js`와 `index.js`에서 `react-native-worklets-core`가 `react-native-reanimated`보다 먼저 import되어야 합니다:

```javascript
import 'react-native-worklets-core';
import 'react-native-reanimated';
```

## 📝 개발 가이드

### 새 화면 추가

1. `app/screens/`에 새 화면 컴포넌트 생성
2. `App.js`의 `Stack.Navigator`에 라우트 추가

### 프레임 프로세서 플러그인 사용

```javascript
import { VisionCameraProxy } from 'react-native-vision-camera';

const plugin = VisionCameraProxy.initFrameProcessorPlugin('toBase64');

const frameProcessor = useFrameProcessor((frame) => {
  'worklet';
  if (plugin) {
    const base64 = plugin.call(frame);
    // base64 처리
  }
}, [plugin]);
```

## 🔐 보안 고려사항

- API 토큰은 `AsyncStorage`에 안전하게 저장
- 민감한 정보는 환경 변수로 관리 권장
- HTTPS 사용 권장 (프로덕션 환경)

## 📄 라이선스

이 프로젝트는 비공개 프로젝트입니다.

## 👥 팀 구성

- 개발팀장 : 전종혁
- 개발팀원 : 김한수


## 📞 문의

프로젝트 관련 문의사항이 있으시면 이슈를 등록해주세요.

---

**Atheleo** - AI로 더 나은 운동 경험을 제공합니다. 💪
