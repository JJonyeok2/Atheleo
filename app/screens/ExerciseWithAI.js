// app/screens/ExerciseWithAI.js
import { useCallback, useEffect, useState, useRef, useMemo } from 'react';
import {
  ActivityIndicator,
  Alert,
  AppState,
  Button,
  Dimensions,
  Linking,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Worklets } from 'react-native-worklets-core';
import {
  Camera,
  useCameraDevice,
  useCameraFormat,
  useFrameProcessor,
  VisionCameraProxy,
} from 'react-native-vision-camera';

import { BASE_API_URL } from '../config';
import { useAuth } from './Authcontext';
import Tts from 'react-native-tts';

export default function ExerciseWithAI() {
  const { user } = useAuth();

  // ─────────────────────────────────────────────────────────────
  // Camera device & format
  // ─────────────────────────────────────────────────────────────
  const device = useCameraDevice('front');
  const format = useCameraFormat(device, [
    { videoResolution: { width: 1280, height: 720 } },
    { fps: 30 },
  ]);

  // ─────────────────────────────────────────────────────────────
  // UI & runtime states
  // ─────────────────────────────────────────────────────────────
  const [hasPermission, setHasPermission] = useState(null);
  const [isRunning, setIsRunning] = useState(false);
  const [isForeground, setIsForeground] = useState(true);
  const [selectedExercise, setSelectedExercise] = useState(null);
  const [feedback, setFeedback] = useState('운동을 선택하고 시작 버튼을 누르세요.');
  const [score, setScore] = useState(0);
  const [exerciseCount, setExerciseCount] = useState(0);
  const [exerciseStage, setExerciseStage] = useState('UP');
  const [backendOk, setBackendOk] = useState(null);
  const [lastLatency, setLastLatency] = useState(null);
  const [lastResultAt, setLastResultAt] = useState(null);
  const [personDetected, setPersonDetected] = useState(null);
  const [lastPose, setLastPose] = useState(null);
  const [fpTicks, setFpTicks] = useState(0);
  const [pluginOk, setPluginOk] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const [flashColor, setFlashColor] = useState(null); // 섬광 효과: 'green', 'red', null
  const [lastValidPose, setLastValidPose] = useState('UP'); // 🔥 State로 관리: 서버 전송용 최신 pose

  // Refs (worklet↔JS 브리지에서 최신값 보장)
  const exerciseStageRef = useRef(exerciseStage);
  const exerciseCountRef = useRef(exerciseCount);
  const selectedExerciseRef = useRef(selectedExercise);
  const fpTicksRef = useRef(0);
  const fpDebugCountRef = useRef(0);
  const lastServerSendTimeRef = useRef(0); // 마지막 서버 전송 시간 (ms)
  const lastTtsTimeRef = useRef(0); // 마지막 음성 안내 시간 (ms)
  const lastTtsTextRef = useRef(''); // 마지막 음성 안내 텍스트 (중복 방지)

  // 🔊 TTS 초기화
  useEffect(() => {
    Tts.setDefaultLanguage('ko-KR'); // 한국어 설정
    Tts.setDefaultRate(0.5); // 말하기 속도 (0.0 ~ 1.0)
    Tts.setDefaultPitch(1.0); // 음성 높이
    
    // 경고 제거를 위한 이벤트 리스너 (선택적)
    Tts.addEventListener('tts-start', () => {});
    Tts.addEventListener('tts-finish', () => {});
    Tts.addEventListener('tts-progress', () => {});
    
    return () => {
      Tts.removeAllListeners('tts-start');
      Tts.removeAllListeners('tts-finish');
      Tts.removeAllListeners('tts-progress');
      Tts.stop(); // 컴포넌트 언마운트 시 정리
    };
  }, []);

  useEffect(() => { 
    // isRunning 상태 변경 로그
    console.log('[EWAI] 🔄 isRunning state changed:', isRunning);
    if (isRunning) {
      console.log('[EWAI] ⚡ Worklet will be regenerated with new isRunning value');
    }
  }, [isRunning]);
  
  useEffect(() => { 
    console.log('[EWAI] 🔄 isForeground state changed:', isForeground);
  }, [isForeground]);
  
  // 🔍 개수 체크를 위한 Ref 동기화
  useEffect(() => {
    exerciseStageRef.current = exerciseStage;
    // 로그 줄이기: exerciseStage는 자주 변경되므로 중요할 때만 출력
    if (exerciseStage === 'UP' || exerciseStage === 'DOWN') {
      console.log(`[EWAI] 🔄 exerciseStage: ${exerciseStage}`);
    }
  }, [exerciseStage]);
  
  useEffect(() => {
    exerciseCountRef.current = exerciseCount;
    // 횟수 변경은 중요하므로 항상 출력
    console.log(`[EWAI] 🔢 횟수: ${exerciseCount}`);
  }, [exerciseCount]);
  
  useEffect(() => { selectedExerciseRef.current = selectedExercise; }, [selectedExercise]);
  useEffect(() => { fpTicksRef.current = fpTicks; }, [fpTicks]);

  // 🔊 음성 안내: 피드백 변경 시
  useEffect(() => {
    if (!isRunning || !feedback) return;
    
    // 중복 방지: 같은 텍스트는 3초 이내에 다시 말하지 않음
    const now = Date.now();
    const timeSinceLastTts = now - lastTtsTimeRef.current;
    const MIN_TTS_INTERVAL = 3000; // 3초
    
    if (feedback === lastTtsTextRef.current && timeSinceLastTts < MIN_TTS_INTERVAL) {
      return; // 중복 방지
    }
    
    // 중요한 피드백만 음성으로 안내
    const importantKeywords = ['완벽', '좋아', '교정', '무릎', '깊이', '각도', '자세'];
    const isImportant = importantKeywords.some(keyword => feedback.includes(keyword));
    
    if (isImportant || feedback.length < 30) { // 짧은 피드백은 항상 읽기
      // 발음이 명확한 문장으로 변환
      let ttsText = feedback;
      
      // "사람을 감지할 수 없습니다" → "카메라 앞에 서주세요"
      if (feedback.includes('사람을 감지') || feedback.includes('사람을 인식')) {
        ttsText = '카메라 앞에 서주세요.';
      } else if (feedback.includes('감지할 수 없습니다')) {
        ttsText = '자세를 확인할 수 없습니다.';
      }
      
      lastTtsTimeRef.current = now;
      lastTtsTextRef.current = feedback;
      Tts.speak(ttsText, {
        androidParams: {
          KEY_PARAM_PAN: -1,
          KEY_PARAM_VOLUME: 0.8,
          KEY_PARAM_STREAM: 'STREAM_MUSIC',
        },
      });
      console.log(`[TTS] 🔊 "${ttsText}"`);
    }
  }, [feedback, isRunning]);

  // 🔊 음성 안내: 횟수 증가 시
  useEffect(() => {
    if (!isRunning || exerciseCount === 0) return;
    
    const now = Date.now();
    const timeSinceLastTts = now - lastTtsTimeRef.current;
    const MIN_TTS_INTERVAL = 2000; // 2초
    
    if (timeSinceLastTts < MIN_TTS_INTERVAL) {
      return; // 너무 자주 말하지 않음
    }
    
    lastTtsTimeRef.current = now;
    const countText = `${exerciseCount}회 완료`;
    Tts.speak(countText, {
      androidParams: {
        KEY_PARAM_PAN: -1,
        KEY_PARAM_VOLUME: 0.9,
        KEY_PARAM_STREAM: 'STREAM_MUSIC',
      },
    });
    console.log(`[TTS] 🔊 "${countText}"`);
  }, [exerciseCount, isRunning]);

  // Layout sizes
  const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
  const tileSize = Math.min(Math.floor(screenWidth * 0.38), 150);

  // ─────────────────────────────────────────────────────────────
  // Permissions
  // ─────────────────────────────────────────────────────────────
  const requestPermissions = useCallback(async () => {
    const status = await Camera.getCameraPermissionStatus();
    console.log('[EWAI] Camera permission status:', status);

    if (status === 'granted') {
      setHasPermission(true);
      return;
    }
    if (status === 'not-determined') {
      const granted = await Camera.requestCameraPermission();
      setHasPermission(granted === 'granted');
      return;
    }
    if (status === 'denied') {
      Alert.alert(
        '카메라 권한 필요',
        'AI 운동 분석을 위해 카메라 권한이 필요합니다.',
        [
          { text: '나중에', style: 'cancel', onPress: () => setHasPermission(false) },
          { text: '설정으로 이동', onPress: () => Linking.openSettings() },
        ]
      );
      setHasPermission(false);
    }
  }, []);
  useEffect(() => { requestPermissions(); }, [requestPermissions]);

  // ─────────────────────────────────────────────────────────────
  // AppState
  // ─────────────────────────────────────────────────────────────
  useEffect(() => {
    // 현재 AppState를 즉시 확인
    const currentState = AppState.currentState;
    const foreground = currentState === 'active';
    setIsForeground(foreground);
    console.log('[EWAI] AppState initialized:', foreground ? '📱 Foreground' : '⏸️  Background', `(${currentState})`);
    
    const subscription = AppState.addEventListener('change', (state) => {
      const foreground = state === 'active';
      setIsForeground(foreground);
      console.log('[EWAI] AppState changed:', foreground ? '📱 Foreground' : '⏸️  Background', `(${state})`);
    });
    return () => subscription.remove();
  }, []);

  // ─────────────────────────────────────────────────────────────
  // Helpers
  // ─────────────────────────────────────────────────────────────
  const handleApiError = useCallback((error) => {
    console.error('🚨 API Error:', error);
    setFeedback(`[API 오류] ${error?.message ?? '알 수 없는 오류'}`);
  }, []);

  const processRepetitionExerciseResult = useCallback((result, currentStage, currentExercise) => {
    const pose = result?.pose;
    setLastPose(pose || null);
    setPersonDetected(!!pose && pose !== 'NO_PERSON');

    if (result?.error || result?.pose === 'NO_PERSON') {
      // 발음이 명확한 문장으로 변경
      const noPersonMessage = result?.feedback || '카메라 앞에 서주세요.';
      setFeedback(noPersonMessage);
      return;
    }

    setFeedback(result?.feedback ?? '');

    // 🔍 개수 증가 로직
    const newPose = result?.pose;
    
    // TRANSITION 상태는 무시 (중간 상태)
    if (newPose === 'TRANSITION') {
      console.log(`[COUNT] pose=TRANSITION → 무시`);
      return;
    }
    
    console.log(`[COUNT] pose=${newPose}, stage=${currentStage}`);
    
    // UP으로 올라올 때만 카운트 (DOWN에서 UP으로 전환)
    if (newPose === 'UP' && currentStage === 'DOWN') {
      setExerciseCount((prev) => {
        const newCount = prev + 1;
        console.log(`[COUNT] 🎉 ${prev} → ${newCount}`);
        return newCount;
      });
    }
    
    // exerciseStage 업데이트 (UP 또는 DOWN만)
    if (newPose === 'UP' || newPose === 'DOWN') {
      setExerciseStage(newPose);
      exerciseStageRef.current = newPose; // State용 ref 동기화
      setLastValidPose(newPose); // 🔥 State 업데이트: worklet이 감지 가능!
      console.log(`[STAGE] ${currentStage} → ${newPose} (lastValidPose 업데이트)`);
    } else if (!newPose) {
      console.log(`[STAGE] ❌ pose 값 없음!`);
    }

    // 간단 점수 로직 (서버 각도 활용)
    let newScore = 0;
    if (currentExercise === 'squat' && result?.angles) {
      const kneeAngle = (result.angles.left_knee + result.angles.right_knee) / 2;
      newScore = Math.max(0, Math.round(100 - Math.abs(90 - kneeAngle) * 2));
      setScore(newScore);
    } else if (currentExercise === 'push_up' && result?.angles) {
      const elbowAngle = (result.angles.left_elbow + result.angles.right_elbow) / 2;
      newScore = Math.max(0, Math.round(100 - Math.abs(90 - elbowAngle) * 1.5));
      setScore(newScore);
    }

    // ⚡ 섬광 효과: 점수에 따라 3단계 색상 결정
    if (newScore > 0) {
      let color;
      if (newScore >= 85) {
        color = 'green';  // 완벽! (85~100점)
      } else if (newScore >= 60) {
        color = 'yellow'; // 아쉬움 (60~84점)
      } else {
        color = 'red';    // 엉망 (0~59점)
      }
      setFlashColor(color);
      // 로그 줄이기: 섬광은 로그 없이 시각적으로만
      // 500ms 후 섬광 효과 제거
      setTimeout(() => setFlashColor(null), 500);
    }
  }, []);

  const sendFrameToServer = useCallback(
    async (base64, stage, count, exercise) => {
      if (!user?.token || !exercise) return;

      try {
        const t0 = Date.now();
        const endpoint = `${BASE_API_URL}exercise/${exercise}/`;

        const response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Token ${user.token}`,
          },
          body: JSON.stringify({
            image: base64,      // ✅ 순수 base64 (data URL prefix 없음)
            last_pose: stage,
            count: count,
          }),
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`HTTP ${response.status}: ${errorText}`);
        }

        const result = await response.json();
        const t1 = Date.now();

        // 🔍 서버 응답 로그 (개수 디버깅) - 간략하게
        console.log(`[SERVER] 📥 pose=${result?.pose}, 전달stage=${stage}`);

        setBackendOk(true);
        setLastLatency(t1 - t0);
        setLastResultAt(new Date().toLocaleTimeString());
        processRepetitionExerciseResult(result, stage, exercise);
      } catch (err) {
        setBackendOk(false);
        handleApiError(err);
      }
    },
    [user, processRepetitionExerciseResult, handleApiError]
  );

  // ─────────────────────────────────────────────────────────────
  // Frame Processor (with robust fallback)
  // ─────────────────────────────────────────────────────────────
  // Vision Camera에서는 Worklets.createRunOnJS를 사용해야 함 (Reanimated의 runOnJS와 충돌 방지)
  // setState 함수는 직접 값을 받아야 하므로, 람다 함수 대신 ref를 사용하거나 직접 값을 전달
  const incrementFpTicks = useCallback(() => {
    setFpTicks((prev) => prev + 1);
  }, []);
  
  const debugLog = useCallback((message) => {
    console.log(message);
  }, []);
  
  const setPluginOkJS = useMemo(() => Worklets.createRunOnJS(setPluginOk), []);
  const sendFrameToServerJS = useMemo(() => Worklets.createRunOnJS(sendFrameToServer), [sendFrameToServer]);
  const incrementFpTicksJS = useMemo(() => Worklets.createRunOnJS(incrementFpTicks), [incrementFpTicks]);
  const debugLogJS = useMemo(() => Worklets.createRunOnJS(debugLog), [debugLog]);
  
  // 플러그인을 useMemo로 컴포넌트 내에서 초기화 (Worklet로 전달하기 위해)
  const plugin = useMemo(() => {
    const p = VisionCameraProxy.initFrameProcessorPlugin('toBase64');
    if (__DEV__) {
      console.log('[EWAI] Plugin initialized:', p ? 'OK' : 'NULL');
      if (p) {
        console.log('[EWAI] Plugin.call exists:', typeof p.call);
      }
    }
    return p;
  }, []);

  const frameProcessor = useFrameProcessor((frame) => {
    'worklet';

    // ⚡ 최적화: 운동 시작 전에는 프레임 처리 안 함 (미리보기만)
    if (!isRunning || !isForeground) {
      return; // 조기 종료 - 로그 없이 조용히
    }

    // 디버그 틱 (운동 시작 후에만)
    incrementFpTicksJS();
    
    // 로그 최소화: 처음 5번만 출력
    // if (fpTicksRef.current <= 5) {
    //   debugLogJS(`[EWAI] 📹 Frame processor running - fpTicks=${fpTicksRef.current}`);
    // }

    try {
      // 플러그인이 없으면 실패
      if (!plugin || typeof plugin.call !== 'function') {
        if (fpTicksRef.current < 10 || (isRunning && fpTicksRef.current % 30 === 0)) {
          debugLogJS(`[EWAI] ❌ Condition 1: Plugin missing or call not a function - plugin=${!!plugin}, call=${typeof plugin?.call}`);
        }
        setPluginOkJS(false);
        return;
      }

      // Vision Camera v4 플러그인 직접 호출
      // plugin 객체는 useFrameProcessor의 의존성 배열을 통해 Worklet으로 전달됨
      const result = plugin.call(frame, { quality: 0.6 });
      
      // NSNull 처리: iOS 네이티브에서 [NSNull null]을 반환하면
      // JavaScript에서 특정 객체로 전달될 수 있음
      if (result === null || result === undefined) {
        if (fpTicksRef.current < 10 || (isRunning && fpTicksRef.current % 30 === 0)) {
          debugLogJS(`[EWAI] ❌ Condition 2: Result is null/undefined - result=${result}`);
        }
        setPluginOkJS(false);
        return;
      }
      
      // NSNull 체크: [NSNull null]은 JavaScript에서 객체로 나타날 수 있음
      // @ts-ignore
      if (result && typeof result === 'object' && result.constructor && result.constructor.name === 'NSNull') {
        if (fpTicksRef.current < 10 || (isRunning && fpTicksRef.current % 30 === 0)) {
          debugLogJS(`[EWAI] ❌ Condition 3: Result is NSNull object`);
        }
        setPluginOkJS(false);
        return;
      }
      
      // 문자열 검증
      if (typeof result !== 'string') {
        if (fpTicksRef.current < 10 || (isRunning && fpTicksRef.current % 30 === 0)) {
          debugLogJS(`[EWAI] ❌ Condition 4: Result is not string - type=${typeof result}, constructor=${result?.constructor?.name || 'N/A'}`);
        }
        setPluginOkJS(false);
        return;
      }
      
      // base64 문자열 최소 길이 확인 (너무 짧으면 실패)
      if (result.length < 100) {
        if (fpTicksRef.current < 10 || (isRunning && fpTicksRef.current % 30 === 0)) {
          debugLogJS(`[EWAI] ❌ Condition 5: Result string too short - length=${result.length}`);
        }
        setPluginOkJS(false);
        return;
      }
      
      // 성공: 플러그인이 정상적으로 작동하고 있음
      setPluginOkJS(true);

      // ⏱️ Throttle: 5초마다만 서버로 전송 (점수 안정화 + 섬광 효과를 위한 여유)
      const now = Date.now();
      const timeSinceLastSend = now - lastServerSendTimeRef.current;
      const SEND_INTERVAL_MS = 5000; // 5초 간격
      
      if (timeSinceLastSend >= SEND_INTERVAL_MS) {
        lastServerSendTimeRef.current = now;
        // ⚡ lastValidPose State 사용: worklet이 최신 값 감지!
        debugLogJS(`[EWAI] 📤 서버 전송 중... (pose=${lastValidPose})`);
        sendFrameToServerJS(
          result,
          lastValidPose, // State 직접 사용!
          exerciseCountRef.current,
          selectedExerciseRef.current
        );
      }
      // 대기 중 로그 제거 - 조용히
    } catch (e) {
      // 프레임 드롭 방지: 조용히 무시
      if (fpTicksRef.current < 10 || (isRunning && fpTicksRef.current % 30 === 0)) {
        debugLogJS(`[EWAI] ❌ Exception: ${e.message || e}`);
      }
      setPluginOkJS(false);
    }
  }, [plugin, isRunning, isForeground, lastValidPose, incrementFpTicksJS, setPluginOkJS, sendFrameToServerJS, debugLogJS]);

  // ─────────────────────────────────────────────────────────────
  // Controls
  // ─────────────────────────────────────────────────────────────
  const resetAllState = useCallback(() => {
    setSelectedExercise(null);
    setScore(0);
    setFeedback('운동을 선택하고 시작 버튼을 누르세요.');
    setExerciseCount(0);
    setExerciseStage('UP');
    setLastValidPose('UP'); // 리셋
    setBackendOk(null);
    setLastLatency(null);
    setLastResultAt(null);
    setPersonDetected(null);
    setLastPose(null);
    setFpTicks(0);
  }, []);

  const handleStartStop = useCallback(() => {
    console.log('[EWAI] 🔘 handleStartStop called - isRunning:', isRunning, 'selectedExercise:', selectedExercise);
    if (isRunning) {
      console.log('[EWAI] 🛑 Stopping exercise');
      setIsRunning(false);
      resetAllState();
    } else if (selectedExercise) {
      console.log('[EWAI] ▶️ Starting exercise:', selectedExercise);
      setExerciseCount(0);
      setExerciseStage('UP');
      setScore(0);
      setIsRunning(true);
      setFeedback('AI 분석을 시작합니다...');
      lastServerSendTimeRef.current = 0; // ⏱️ 리셋: 즉시 첫 프레임 전송 가능
      setLastValidPose('UP'); // 초기 pose 설정
      console.log('[EWAI] ✅ setIsRunning(true) called - throttle reset');
    } else {
      console.log('[EWAI] ⚠️ No exercise selected');
    }
  }, [isRunning, selectedExercise, resetAllState]);

  const exerciseNameMap = {
    squat: '스쿼트',
    push_up: '푸쉬업',
  };

  // ─────────────────────────────────────────────────────────────
  // Rendering guards
  // ─────────────────────────────────────────────────────────────
  if (!device || hasPermission === null) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" />
        <Text style={[styles.permissionText, { marginTop: 20 }]}>
          카메라 초기화 중...
        </Text>
      </View>
    );
  }

  if (hasPermission === false) {
    return (
      <View style={[styles.centered, { padding: 20 }]}>
        <Text style={styles.permissionText}>🚫 카메라 접근 권한이 거부되었습니다.</Text>
        <Text style={[styles.permissionText, { fontSize: 14, fontWeight: 'normal', marginBottom: 20 }]}>
          AI 운동 분석을 위해 카메라 권한이 필요합니다.
        </Text>
        <Button title="설정에서 권한 변경하기" onPress={() => Linking.openSettings()} />
      </View>
    );
  }

  // ─────────────────────────────────────────────────────────────
  // UI
  // ─────────────────────────────────────────────────────────────
  return (
    <View style={styles.container}>
      {/* Camera */}
      {device && hasPermission === true && (
        <Camera
          style={StyleSheet.absoluteFill}
          device={device}
          isActive={isForeground && cameraActive}
          format={format}
          frameProcessor={frameProcessor}
          frameProcessorFps={2}
          pixelFormat="yuv"
          onInitialized={() => {
            console.log('[Camera] ✅ Initialized');
            setCameraActive(true);
          }}
          onError={(error) => {
            console.error('[Camera] ❌ Error:', error?.message);
            setCameraActive(false);
            Alert.alert('카메라 오류', error?.message ?? '알 수 없는 오류');
          }}
        />
      )}

      {/* 📏 Guideline Overlay - 운동 선택했지만 시작 전 */}
      {selectedExercise && !isRunning && cameraActive && (
        <View style={styles.guidelineContainer}>
          {/* 가이드라인 테두리 */}
          <View style={[
            styles.guideFrame,
            selectedExercise === 'squat' ? styles.guideFrameFullBody : styles.guideFrameUpperBody
          ]}>
            {/* 코너 마크 (4개 모서리) */}
            <View style={[styles.corner, styles.cornerTopLeft]} />
            <View style={[styles.corner, styles.cornerTopRight]} />
            <View style={[styles.corner, styles.cornerBottomLeft]} />
            <View style={[styles.corner, styles.cornerBottomRight]} />
          </View>
          
          {/* 안내 텍스트 */}
          <View style={styles.guideTextContainer}>
            <Text style={styles.guideText}>
              {selectedExercise === 'squat' ? '🧍 전신이 보이도록 서주세요' : '💪 상체가 보이도록 위치하세요'}
            </Text>
            <Text style={styles.guideSubText}>
              {exerciseNameMap[selectedExercise]} 준비
            </Text>
          </View>
        </View>
      )}

      {/* ⚡ 섬광 효과 (Flash Feedback) */}
      {flashColor && (
        <View 
          style={[
            styles.flashOverlay,
            flashColor === 'green' && styles.flashGreen,
            flashColor === 'yellow' && styles.flashYellow,
            flashColor === 'red' && styles.flashRed,
          ]} 
        />
      )}

      {/* Debug HUD */}
      <View style={styles.debugHud}>
        <Text style={styles.debugLine}>
          카메라:{' '}
          <Text style={{ color: isForeground && cameraActive ? '#4CAF50' : '#F44336' }}>
            {isForeground && cameraActive ? '활성' : '비활성'}
          </Text>
          {format && ` | ${format.videoWidth}x${format.videoHeight}@${format.maxFps}fps`}
          {` | FP: ${fpTicks}`}
        </Text>

        <Text style={styles.debugLine}>
          플러그인:{' '}
          <Text style={{ color: pluginOk ? '#4CAF50' : '#F44336' }}>
            {pluginOk ? 'OK' : 'MISSING'}
          </Text>
        </Text>

        <Text style={styles.debugLine}>
          백엔드:{' '}
          <Text style={{ color: backendOk == null ? '#FFD54F' : backendOk ? '#4CAF50' : '#F44336' }}>
            {backendOk == null ? '대기' : backendOk ? 'OK' : '오류'}
          </Text>
          {lastLatency != null && ` | ${lastLatency}ms`}
          {lastResultAt && ` | ${lastResultAt}`}
        </Text>

        <Text style={styles.debugLine}>
          인식:{' '}
          <Text style={{ color: personDetected == null ? '#FFD54F' : personDetected ? '#4CAF50' : '#F44336' }}>
            {personDetected == null ? '대기' : personDetected ? '인식중' : '사람없음'}
          </Text>
          {lastPose && ` | ${lastPose}`}
        </Text>
      </View>

      {/* Controls */}
      <View style={styles.controls}>
        {/* 운동 선택 버튼들 - 운동 시작 전에만 표시 */}
        {!isRunning && (
          <View style={styles.selectionRow}>
            {Object.entries(exerciseNameMap).map(([key, name], idx) => (
              <TouchableOpacity
                key={key}
                style={[
                  styles.exerciseTile,
                  { width: tileSize, height: tileSize },
                  selectedExercise === key && styles.exerciseTileSelected,
                  idx === 0 ? { marginRight: 12 } : { marginLeft: 12 },
                ]}
                onPress={() => setSelectedExercise(key)}
                activeOpacity={0.9}
              >
                <Text
                  style={[
                    styles.exerciseTileText,
                    selectedExercise === key && styles.exerciseTileTextSelected,
                  ]}
                >
                  {name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* 시작/중지 버튼 */}
        <TouchableOpacity
          style={[
            styles.startLongButton,
            {
              width: Math.min(screenWidth * 0.9, 420),
              height: Math.max(screenHeight * 0.065, 48),
            },
            (!selectedExercise || !cameraActive) && styles.startLongButtonDisabled,
            isRunning && styles.stopButton, // 운동 중일 때 스타일 변경
          ]}
          onPress={() => {
            console.log('[EWAI] 🔴 Button pressed - selectedExercise:', selectedExercise, 'cameraActive:', cameraActive, 'isRunning:', isRunning);
            handleStartStop();
          }}
          disabled={!isRunning && (!selectedExercise || !cameraActive)}
          activeOpacity={0.9}
        >
          <Text style={styles.startLongButtonText}>
            {isRunning ? '🛑 운동 중지' : '운동 시작'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Stats */}
      {isRunning && (
        <View style={styles.statsContainer}>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>횟수</Text>
            <Text style={styles.statValue}>{exerciseCount}</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>점수</Text>
            <Text style={[
              styles.statValue, 
              { color: score >= 85 ? '#4CAF50' : score >= 60 ? '#FFC107' : '#F44336' }
            ]}>
              {score}
            </Text>
          </View>
        </View>
      )}

      {/* Feedback - 운동 중일 때 크게 표시 */}
      <View style={[
        styles.feedbackContainer,
        isRunning && styles.feedbackContainerExpanded
      ]}>
        <Text style={[
          styles.feedback,
          isRunning && styles.feedbackExpanded
        ]}>
          💬 {feedback}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'black' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'black' },
  permissionText: { fontSize: 18, color: 'white', textAlign: 'center', fontWeight: 'bold', marginBottom: 10 },

  debugHud: {
    position: 'absolute',
    top: 10,
    left: 10,
    right: 10,
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  debugLine: { color: 'white', fontSize: 12, marginVertical: 2 },

  controls: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingTop: 12,
    paddingBottom: 18,
    backgroundColor: 'transparent',
    alignItems: 'center',
  },

  selectionRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'stretch',
    marginBottom: 12,
    width: '100%',
  },

  exerciseTile: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  exerciseTileSelected: {
    backgroundColor: 'rgba(10,132,255,0.9)',
  },
  exerciseTileText: {
    fontWeight: '800',
    color: '#fff',
    fontSize: 18,
  },
  exerciseTileTextSelected: {
    color: '#fff',
  },

  startLongButton: {
    marginTop: 6,
    borderRadius: 14,
    backgroundColor: '#0A84FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  startLongButtonDisabled: {
    backgroundColor: '#6b7280',
  },
  stopButton: {
    backgroundColor: '#F44336', // 빨간색 (중지 버튼)
  },
  startLongButtonText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 18,
  },

  statsContainer: {
    position: 'absolute',
    top: 80,
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 20,
  },
  statBox: {
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    minWidth: 100,
  },
  statLabel: { fontSize: 16, color: '#fff', fontWeight: '600' },
  statValue: { 
    fontSize: 48, // 더 크게 (32 → 48)
    color: '#fff', 
    fontWeight: 'bold', 
    marginTop: 5,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },

  feedbackContainer: {
    position: 'absolute',
    bottom: '35%',
    left: 20,
    right: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    padding: 15,
    borderRadius: 10,
  },
  feedbackContainerExpanded: {
    bottom: '30%', // 더 위로 올림
    left: 10,
    right: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.9)', // 더 진하게
    padding: 25, // 더 크게
    borderRadius: 15,
    borderWidth: 2,
    borderColor: '#0A84FF',
  },
  feedback: { 
    fontSize: 16, 
    color: 'white', 
    textAlign: 'center', 
    fontWeight: '600' 
  },
  feedbackExpanded: {
    fontSize: 22, // 더 크게 (16 → 22)
    fontWeight: '700', // 더 굵게
    lineHeight: 32, // 줄 간격 추가
  },

  // 📏 Guideline Styles
  guidelineContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  guideFrame: {
    borderWidth: 3,
    borderColor: 'rgba(255, 255, 255, 0.6)',
    borderStyle: 'dashed',
    borderRadius: 20,
    position: 'relative',
  },
  guideFrameFullBody: {
    // 전신 (스쿼트)
    width: '70%',
    aspectRatio: 9 / 16, // 세로로 긴 프레임
  },
  guideFrameUpperBody: {
    // 상체 (팔굽혀펴기)
    width: '80%',
    aspectRatio: 4 / 3, // 가로로 넓은 프레임
  },
  corner: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderColor: '#0A84FF',
    borderWidth: 4,
  },
  cornerTopLeft: {
    top: -2,
    left: -2,
    borderBottomWidth: 0,
    borderRightWidth: 0,
    borderTopLeftRadius: 20,
  },
  cornerTopRight: {
    top: -2,
    right: -2,
    borderBottomWidth: 0,
    borderLeftWidth: 0,
    borderTopRightRadius: 20,
  },
  cornerBottomLeft: {
    bottom: -2,
    left: -2,
    borderTopWidth: 0,
    borderRightWidth: 0,
    borderBottomLeftRadius: 20,
  },
  cornerBottomRight: {
    bottom: -2,
    right: -2,
    borderTopWidth: 0,
    borderLeftWidth: 0,
    borderBottomRightRadius: 20,
  },
  guideTextContainer: {
    position: 'absolute',
    bottom: 100,
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    paddingVertical: 15,
    paddingHorizontal: 25,
    borderRadius: 15,
  },
  guideText: {
    fontSize: 18,
    color: '#fff',
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 5,
  },
  guideSubText: {
    fontSize: 14,
    color: '#0A84FF',
    fontWeight: '600',
    textAlign: 'center',
  },
  
  // ⚡ 섬광 효과 (Flash Feedback)
  flashOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderWidth: 20,
    borderRadius: 0,
    pointerEvents: 'none', // 터치 이벤트 무시
  },
  flashGreen: {
    borderColor: 'rgba(76, 175, 80, 0.8)', // 초록색 (완벽한 자세)
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
  },
  flashYellow: {
    borderColor: 'rgba(255, 193, 7, 0.9)', // 노란색 (아쉬운 자세)
    backgroundColor: 'rgba(255, 193, 7, 0.15)',
  },
  flashRed: {
    borderColor: 'rgba(244, 67, 54, 0.8)', // 빨간색 (엉망인 자세)
    backgroundColor: 'rgba(244, 67, 54, 0.1)',
  },
});
