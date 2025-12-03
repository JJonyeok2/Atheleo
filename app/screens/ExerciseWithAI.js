// app/screens/ExerciseWithAI.js
import { useCallback, useEffect, useState, useRef, useMemo } from 'react';
import {
  ActivityIndicator,
  Alert,
  AppState,
  Button,
  Dimensions,
  Linking,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Worklets } from 'react-native-worklets-core';
import {
  Camera,
  useCameraDevice,
  useCameraFormat,
  useFrameProcessor,
  VisionCameraProxy,
} from 'react-native-vision-camera';

import axios from 'axios';
import { BASE_API_URL } from '../config';
import { useAuth } from './Authcontext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Tts from 'react-native-tts';
import { 
  getExerciseRoutine, 
  getExerciseRoutineByBodyShape,
  checkGoalAchievement,
  shouldRest 
} from '../utils/exerciseRoutines';
import { savePendingHistory, syncAllPendingHistory } from '../utils/historySync';

export default function ExerciseWithAI() {
  const navigation = useNavigation();
  const { user } = useAuth();
  const [hasAccess, setHasAccess] = useState(false);

  useEffect(() => {
    if (!user) {
      setHasAccess(false);
      Alert.alert(
        '로그인이 필요합니다',
        'AI 운동 기능을 이용하려면 로그인해 주세요.',
        [
          { text: '로그인하기', onPress: () => navigation.replace('Login') },
          { text: '돌아가기', style: 'cancel', onPress: () => navigation.goBack() },
        ],
      );
      return;
    }

    const tier = (user.subscription_type || '').toUpperCase();
    if (tier !== 'STANDARD' && tier !== 'PRO') {
      setHasAccess(false);
      Alert.alert(
        '구독이 필요합니다',
        'Standard 이상 구독 회원만 AI 운동 기능을 사용할 수 있어요.',
        [
          { text: '구독 화면으로 이동', onPress: () => navigation.replace('Subscribe') },
          { text: '돌아가기', style: 'cancel', onPress: () => navigation.goBack() },
        ],
      );
      return;
    }

    setHasAccess(true);
  }, [navigation, user]);

  // 체형 정보 불러오기 및 루틴 추천 알림
  useEffect(() => {
    const loadBodyShapeAndRecommend = async () => {
      try {
        const storedBodyShape = await AsyncStorage.getItem('userBodyShape');
        if (storedBodyShape) {
          setBodyShape(storedBodyShape);
          console.log('[EWAI] 체형 정보 로드:', storedBodyShape);
          
          // 운동 화면 진입 시 루틴 추천 알림 (한 번만 표시)
          const hasShownRecommendation = await AsyncStorage.getItem('hasShownRoutineRecommendation');
          if (!hasShownRecommendation) {
            const routine = getExerciseRoutineByBodyShape(storedBodyShape);
            const exerciseRoutine = getExerciseRoutine(storedBodyShape, 'squat'); // 기본값: 스쿼트
            
            Alert.alert(
              '💪 추천 루틴',
              `당신의 체형(${storedBodyShape})에 맞는 ${routine.levelName} 난이도 루틴이 준비되었습니다.\n\n` +
              `📋 추천 루틴:\n` +
              `• 스쿼트: ${exerciseRoutine.targetReps}회 × ${exerciseRoutine.sets}세트\n` +
              `• 쉬는 시간: ${exerciseRoutine.restTime}초\n` +
              `• 최소 점수: ${exerciseRoutine.minScore}점 이상\n\n` +
              `이 루틴으로 진행하시겠습니까?`,
              [
                {
                  text: '추천 루틴으로 시작',
                  onPress: () => {
                    console.log('[EWAI] 추천 루틴으로 시작');
                    // 루틴 정보는 이미 bodyShape state에 저장되어 있음
                  },
                  style: 'default',
                },
                {
                  text: '직접 설정',
                  onPress: () => {
                    console.log('[EWAI] 직접 설정 선택');
                  },
                  style: 'cancel',
                },
              ],
              { cancelable: true }
            );
            
            // 알림 표시 플래그 저장
            await AsyncStorage.setItem('hasShownRoutineRecommendation', 'true');
          }
        }
      } catch (error) {
        console.error('[EWAI] 체형 정보 로드 실패:', error);
      }
    };
    
    if (hasAccess) {
      loadBodyShapeAndRecommend();
    }
  }, [hasAccess]);

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
  const [score, setScore] = useState(50); // 초기 점수 50점
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
  const [bodyShape, setBodyShape] = useState(null); // 체형 정보
  const [currentSet, setCurrentSet] = useState(1); // 현재 세트
  const [lastRestTime, setLastRestTime] = useState(0); // 마지막 쉬는 시간
  const [isResting, setIsResting] = useState(false); // 쉬는 중 여부
  const [restCountdown, setRestCountdown] = useState(0); // 쉬는 시간 카운트다운
  const [scoreHistory, setScoreHistory] = useState([]); // 점수 기록 (평균 계산용)
  const [startTime, setStartTime] = useState(null); // 운동 시작 시간
  const [downStateStartTime, setDownStateStartTime] = useState(null); // DOWN 상태 시작 시간
  const downStateStartTimeRef = useRef(null); // DOWN 상태 시작 시간 ref

  // Refs (worklet↔JS 브리지에서 최신값 보장)
  const exerciseStageRef = useRef(exerciseStage);
  const exerciseCountRef = useRef(exerciseCount);
  const selectedExerciseRef = useRef(selectedExercise);
  const fpTicksRef = useRef(0);
  const fpDebugCountRef = useRef(0);
  const lastServerSendTimeRef = useRef(0); // 마지막 서버 전송 시간 (ms)
  const lastTtsTimeRef = useRef(0); // 마지막 음성 안내 시간 (ms)
  const lastTtsTextRef = useRef(''); // 마지막 음성 안내 텍스트
  const isTtsSpeakingRef = useRef(false); // TTS 재생 중 여부 추적 (겹침 방지)
  const previousAngleRef = useRef(null); // 이전 각도 (점수 증감 계산용)
  const scoreRef = useRef(50); // 현재 점수 (ref로 관리하여 최신 값 보장) (중복 방지)

  // 🔊 TTS 초기화
  useEffect(() => {
    Tts.setDefaultLanguage('ko-KR'); // 한국어 설정
    Tts.setDefaultRate(0.5); // 말하기 속도 (0.0 ~ 1.0) - 더 느린 속도
    Tts.setDefaultPitch(1.0); // 음성 높이
    
    // iOS에서 사용 가능한 한국어 음성 자동 선택
    if (Platform.OS === 'ios') {
      Tts.voices().then((voices) => {
        const koreanVoice = voices.find(
          (voice) => voice.language.startsWith('ko') && !voice.name.includes('enhanced')
        );
        if (koreanVoice) {
          Tts.setDefaultVoice(koreanVoice.id);
        }
      }).catch(() => {
        // 음성 목록을 가져올 수 없으면 기본 음성 사용
      });
    }
    
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

  // score state와 ref 동기화
  useEffect(() => {
    scoreRef.current = score;
  }, [score]);
  
  useEffect(() => {
    exerciseCountRef.current = exerciseCount;
    // 횟수 변경은 중요하므로 항상 출력
    console.log(`[EWAI] 🔢 횟수: ${exerciseCount}`);
  }, [exerciseCount]);
  
  useEffect(() => { selectedExerciseRef.current = selectedExercise; }, [selectedExercise]);
  useEffect(() => { fpTicksRef.current = fpTicks; }, [fpTicks]);

  // 🔊 음성 안내: 피드백 변경 시
  useEffect(() => {
    if (!isRunning || !feedback || isResting) return; // 쉬는 시간 중에는 TTS 비활성화
    
    // TTS 재생 중이면 새 TTS 재생하지 않음 (겹침 방지)
    if (isTtsSpeakingRef.current) {
      return;
    }
    
    // 중복 방지: 같은 텍스트는 2초 이내에 다시 말하지 않음 (프레임 전송 간격과 동일)
    const now = Date.now();
    const timeSinceLastTts = now - lastTtsTimeRef.current;
    const MIN_TTS_INTERVAL = 2000; // 2초 (프레임 전송 간격과 동일)
    
    if (feedback === lastTtsTextRef.current && timeSinceLastTts < MIN_TTS_INTERVAL) {
      return; // 중복 방지
    }
    
    // 중요한 피드백만 음성으로 안내
    const importantKeywords = ['완벽', '좋아', '교정', '무릎', '깊이', '각도', '자세'];
    const isImportant = importantKeywords.some(keyword => feedback.includes(keyword));
    
    // 긴 피드백은 요약하거나 생략 (30자 이상은 요약)
    let ttsText = feedback;
    if (feedback.length > 30) {
      // 긴 피드백은 핵심만 추출
      if (feedback.includes('무릎')) {
        ttsText = '무릎 각도를 조정하세요.';
      } else if (feedback.includes('팔꿈치')) {
        ttsText = '팔꿈치 각도를 조정하세요.';
      } else if (feedback.includes('깊이')) {
        ttsText = '더 깊이 내려가세요.';
      } else if (feedback.includes('완벽') || feedback.includes('좋아')) {
        ttsText = '완벽해요';
      } else {
        // 너무 길면 생략
        return;
      }
    }
    
    // "사람을 감지할 수 없습니다" → "카메라 앞에 서주세요"
    if (feedback.includes('사람을 감지') || feedback.includes('사람을 인식')) {
      ttsText = '카메라 앞에 서주세요.';
    } else if (feedback.includes('감지할 수 없습니다')) {
      ttsText = '자세를 확인할 수 없습니다.';
    }
    
    // 중요한 피드백이거나 짧은 피드백만 읽기
    if (isImportant || feedback.length < 30) {
      isTtsSpeakingRef.current = true;
      lastTtsTimeRef.current = now;
      lastTtsTextRef.current = feedback;
      
      Tts.speak(ttsText, {
        androidParams: {
          KEY_PARAM_PAN: -1,
          KEY_PARAM_VOLUME: 0.9,
          KEY_PARAM_STREAM: 'STREAM_MUSIC',
          KEY_PARAM_ENGINE: 'com.google.android.tts',
        },
      });
      
      // TTS 재생 완료 추정 시간 후 플래그 해제 (메시지 길이에 따라 조정)
      const estimatedDuration = Math.max(1000, ttsText.length * 100); // 글자당 100ms 추정
      setTimeout(() => {
        isTtsSpeakingRef.current = false;
      }, estimatedDuration);
      
      console.log(`[TTS] 🔊 "${ttsText}"`);
    }
  }, [feedback, isRunning, isResting]);

  // 🔊 음성 안내: 횟수 증가 시
  useEffect(() => {
    if (!isRunning || exerciseCount === 0 || isResting) return; // 쉬는 시간 중에는 TTS 비활성화
    
    // TTS 재생 중이면 새 TTS 재생하지 않음 (겹침 방지)
    if (isTtsSpeakingRef.current) {
      return;
    }
    
    const now = Date.now();
    const timeSinceLastTts = now - lastTtsTimeRef.current;
    const MIN_TTS_INTERVAL = 2000; // 2초 (프레임 전송 간격과 동일)
    
    if (timeSinceLastTts < MIN_TTS_INTERVAL) {
      return; // 너무 자주 말하지 않음
    }
    
    isTtsSpeakingRef.current = true;
    lastTtsTimeRef.current = now;
    const countText = `${exerciseCount}회 완료`;
    
    Tts.speak(countText, {
      androidParams: {
        KEY_PARAM_PAN: -1,
        KEY_PARAM_VOLUME: 0.9,
        KEY_PARAM_STREAM: 'STREAM_MUSIC',
        KEY_PARAM_ENGINE: 'com.google.android.tts',
      },
    });
    
    // TTS 재생 완료 추정 시간 후 플래그 해제
    const estimatedDuration = 1500; // "N회 완료"는 약 1.5초
    setTimeout(() => {
      isTtsSpeakingRef.current = false;
    }, estimatedDuration);
    
    console.log(`[TTS] 🔊 "${countText}"`);
  }, [exerciseCount, isRunning, isResting]);

  // 쉬는 시간 카운트다운
  useEffect(() => {
    if (!isResting || restCountdown <= 0) {
      if (isResting && restCountdown <= 0) {
        setIsResting(false);
        Tts.speak('쉬는 시간 종료. 다음 세트를 시작하세요.');
      }
      return;
    }

    const timer = setInterval(() => {
      setRestCountdown((prev) => {
        if (prev <= 1) {
          setIsResting(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isResting, restCountdown]);

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
  useEffect(() => {
    if (!hasAccess) {
      setHasPermission(null);
      return;
    }
    requestPermissions();
  }, [hasAccess, requestPermissions]);

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
    
    // 🔥 중요: 카운트 체크를 stage 업데이트 전에 실행!
    // exerciseStageRef.current를 사용하여 이전 stage 확인 (즉시 반영)
    const previousStage = exerciseStageRef.current;
    
    // TRANSITION 상태 처리 개선
    // TRANSITION은 DOWN → UP 또는 UP → DOWN 중간 상태
    // 이전 stage가 DOWN이고 TRANSITION이면, DOWN 상태로 간주하여 시간 추적
    // UP → TRANSITION → UP 전환도 카운트 (빠른 운동 감지)
    if (newPose === 'TRANSITION') {
      // DOWN → TRANSITION: DOWN 상태 시간 계속 추적
      if (previousStage === 'DOWN') {
        // DOWN 상태 시간이 없으면 지금 시작
        if (!downStateStartTimeRef.current) {
          const now = Date.now();
          downStateStartTimeRef.current = now;
          setDownStateStartTime(now);
          console.log(`[COUNT] ⬇️ DOWN → TRANSITION: DOWN 시간 추적 시작`);
        }
        console.log(`[COUNT] pose=TRANSITION (DOWN 상태 유지 중, 경과: ${Date.now() - downStateStartTimeRef.current}ms)`);
      } 
      // UP → TRANSITION: DOWN 시간 추적하지 않음 (UP 상태는 DOWN이 아님)
      else if (previousStage === 'UP') {
        // UP에서 TRANSITION으로 전환되면 DOWN 시간 추적 초기화
        if (downStateStartTimeRef.current) {
          downStateStartTimeRef.current = null;
          setDownStateStartTime(null);
          console.log(`[COUNT] ⬆️ UP → TRANSITION: DOWN 시간 추적 초기화 (UP 상태 유지)`);
        }
        console.log(`[COUNT] pose=TRANSITION (UP → TRANSITION, stage 유지: ${previousStage})`);
      } else {
        console.log(`[COUNT] pose=TRANSITION → stage 유지 (${previousStage})`);
      }
      // TRANSITION 상태에서는 stage를 변경하지 않음
      return;
    }
    
    console.log(`[COUNT] pose=${newPose}, currentStage=${currentStage}, previousStage(ref)=${previousStage}`);
    
    // DOWN 상태 시작 시간 추적
    if (newPose === 'DOWN' && previousStage !== 'DOWN') {
      // DOWN 상태로 진입한 시점 기록
      const now = Date.now();
      downStateStartTimeRef.current = now;
      setDownStateStartTime(now);
      console.log(`[COUNT] ⬇️ DOWN 상태 진입 (시작 시간 기록)`);
    }
    // ⚠️ 중요: UP으로 전환될 때는 시간을 초기화하지 않음 (카운트 체크 후에 초기화)
    // TRANSITION에서 UP으로 전환될 때도 DOWN 시간이 유지되어야 함
    
    // UP으로 올라올 때만 카운트 (DOWN에서 UP으로 전환)
    // ref를 사용하여 이전 stage를 정확히 확인
    // 최소 DOWN 유지 시간을 0ms로 설정하여 즉시 카운트 (빠른 운동도 감지)
    const MIN_DOWN_DURATION = 0; // 최소 DOWN 유지 시간 (밀리초) - 0ms로 설정하여 즉시 카운트
    const downDuration = downStateStartTimeRef.current 
      ? Date.now() - downStateStartTimeRef.current 
      : 0;
    
    // DOWN → UP 전환만 카운트 (엄격한 조건)
    // previousStage가 'DOWN'이거나, currentStage가 'DOWN'일 때만 카운트
    // UP 상태에서는 절대 카운트하지 않음
    const wasDownState = previousStage === 'DOWN' || currentStage === 'DOWN';
    
    if (newPose === 'UP' && wasDownState) {
      // DOWN 상태였으면 즉시 카운트 (최소 시간 제한 없음)
      // TRANSITION을 거쳐서 UP으로 전환된 경우도 포함 (TRANSITION 중에도 DOWN 시간이 추적됨)
      console.log(`[COUNT] 🔍 DOWN → UP 전환 체크: previousStage=${previousStage}, currentStage=${currentStage}, downStateStartTimeRef=${downStateStartTimeRef.current}, downDuration=${downDuration}ms`);
      
      // TRANSITION에서 UP으로 전환된 경우, DOWN 시간이 없어도 카운트
      // DOWN 상태였으면 무조건 카운트 (TRANSITION은 DOWN → UP 중간 상태)
      // UP → TRANSITION → DOWN → UP 전환도 카운트 (빠른 운동 감지)
      let actualDownDuration = downDuration;
      if (downDuration === 0 && wasDownState) {
        // TRANSITION을 거쳤지만 시간이 초기화된 경우, DOWN 상태였으므로 카운트
        // 또는 UP → TRANSITION → DOWN → UP 전환 (빠른 운동)
        console.log(`[COUNT] ⚠️ TRANSITION에서 UP 전환: DOWN 시간이 0이지만 카운트 (previousStage=${previousStage}, currentStage=${currentStage}, wasDownState=${wasDownState})`);
        actualDownDuration = 1; // 0이 아닌 값으로 설정하여 카운트
      }
      
      // 최소 시간 제한 없이 즉시 카운트
      if (actualDownDuration >= MIN_DOWN_DURATION) {
      setExerciseCount((prev) => {
        const newCount = prev + 1;
        console.log(`[COUNT] 🎉 ${prev} → ${newCount} (DOWN → UP 전환 감지! previousStage=${previousStage}, currentStage=${currentStage}, newPose=${newPose}, downDuration=${actualDownDuration}ms)`);
        
        // 체형별 루틴에 따른 목표 달성 확인 및 세트 증가
        if (bodyShape && selectedExerciseRef.current) {
          const currentSetForCheck = currentSet; // 현재 세트 사용
          const goalInfo = checkGoalAchievement(
            bodyShape,
            selectedExerciseRef.current,
            newCount,
            currentSetForCheck
          );
          
          console.log(`[ROUTINE] 목표 달성 체크:`, {
            bodyShape,
            exercise: selectedExerciseRef.current,
            currentReps: newCount,
            currentSet: currentSetForCheck,
            targetReps: goalInfo.targetReps,
            targetSets: goalInfo.targetSets,
            isRepGoalReached: goalInfo.isRepGoalReached,
            isSetGoalReached: goalInfo.isSetGoalReached,
          });
          
          // 목표 횟수 달성 시 세트 증가 및 쉬는 시간 시작
          if (goalInfo.isRepGoalReached && !goalInfo.isSetGoalReached) {
            setCurrentSet((prevSet) => {
              const nextSet = prevSet + 1;
              console.log(`[ROUTINE] 세트 ${prevSet} 완료 → 세트 ${nextSet} 시작`);
              
              // 쉬는 시간 시작
              if (nextSet <= goalInfo.targetSets) {
                setIsResting(true);
                setLastRestTime(Date.now());
                const routine = getExerciseRoutine(bodyShape, selectedExerciseRef.current);
                setRestCountdown(routine.restTime);
                
                // 쉬는 시간 안내
                Tts.speak(`세트 완료. ${routine.restTime}초 쉬세요.`, {
                  androidParams: {
                    KEY_PARAM_VOLUME: 0.9,
                    KEY_PARAM_STREAM: 'STREAM_MUSIC',
                  },
                });
              }
              
              return nextSet;
            });
          }
        }
        
        return newCount;
      });
      } else {
        console.log(`[COUNT] ⚠️ DOWN → UP 전환 감지했지만 DOWN 유지 시간 부족 (${actualDownDuration}ms < ${MIN_DOWN_DURATION}ms) - 카운트 안 함`);
      }
    }
    
    // exerciseStage 업데이트 (UP 또는 DOWN만)
    // 카운트 체크 후에 stage를 업데이트하여 다음 프레임에서 올바르게 반영
    if (newPose === 'UP' || newPose === 'DOWN') {
      // stage가 변경되는 경우에만 업데이트
      if (previousStage !== newPose) {
        console.log(`[STAGE] ${previousStage} → ${newPose} (변경 감지, ref 업데이트)`);
        
        // UP 상태로 전환될 때 DOWN 시간 초기화
        if (newPose === 'UP') {
          // UP 상태로 전환되면 DOWN 시간 추적 초기화
          if (downStateStartTimeRef.current) {
            console.log(`[STAGE] ${previousStage} → UP: DOWN 시간 초기화`);
            downStateStartTimeRef.current = null;
            setDownStateStartTime(null);
          }
        }
        
        // 🔥 ref를 즉시 업데이트하여 다음 프레임에서 정확한 이전 stage 확인 가능
        exerciseStageRef.current = newPose; // ref 먼저 업데이트 (다음 프레임을 위해)
        setExerciseStage(newPose); // state 업데이트 (비동기)
        setLastValidPose(newPose); // 🔥 State 업데이트: worklet이 감지 가능!
      } else {
        console.log(`[STAGE] 유지: ${newPose} (변경 없음)`);
      }
    } else if (!newPose) {
      console.log(`[STAGE] ❌ pose 값 없음!`);
    }

    // 🔍 점수 계산 전 디버깅 로그
    console.log('[SCORE] result:', {
      pose: result?.pose,
      angles: result?.angles,
      exercise: currentExercise,
      hasLeftElbow: !!result?.angles?.left_elbow,
      hasRightElbow: !!result?.angles?.right_elbow,
      hasLeftKnee: !!result?.angles?.left_knee,
      hasRightKnee: !!result?.angles?.right_knee,
    });

    // 점수 증감 로직: 이전 각도와 비교하여 점수 조정
    // 목표: 초기 50점에서 시작, 자세가 개선되면 +, 나빠지면 -
    const TARGET_ANGLE = 90; // 목표 각도 (스쿼트, 푸쉬업 모두 90도)
    const MAX_SCORE_CHANGE = 3; // 한 번에 최대 변경 가능한 점수 (±3점)
    
    if (currentExercise === 'squat' && result?.angles) {
      const angles = result.angles;
      const kneeAngles = [angles.left_knee, angles.right_knee].filter(a => a != null && !isNaN(a));
      if (kneeAngles.length > 0) {
        const avgKneeAngle = kneeAngles.reduce((a, b) => a + b, 0) / kneeAngles.length;
        
        // 현재 각도와 목표 각도(90도)의 차이
        const currentDiff = Math.abs(TARGET_ANGLE - avgKneeAngle);
        
        // 이전 각도가 있으면 비교하여 점수 증감
        if (previousAngleRef.current !== null) {
          const previousDiff = Math.abs(TARGET_ANGLE - previousAngleRef.current);
          
          // 자세가 개선되었는지 확인 (목표 각도에 가까워졌는지)
          const improvement = previousDiff - currentDiff;
          
          // 점수 증감 계산 (개선되면 +, 나빠지면 -)
          // improvement가 양수면 개선, 음수면 악화
          let scoreChange = 0;
          if (improvement > 5) {
            // 크게 개선됨 (+3점)
            scoreChange = MAX_SCORE_CHANGE;
          } else if (improvement > 2) {
            // 조금 개선됨 (+2점)
            scoreChange = 2;
          } else if (improvement > 0.5) {
            // 약간 개선됨 (+1점)
            scoreChange = 1;
          } else if (improvement < -5) {
            // 크게 악화됨 (-3점)
            scoreChange = -MAX_SCORE_CHANGE;
          } else if (improvement < -2) {
            // 조금 악화됨 (-2점)
            scoreChange = -2;
          } else if (improvement < -0.5) {
            // 약간 악화됨 (-1점)
            scoreChange = -1;
          }
          // improvement가 -0.5 ~ 0.5 사이면 변화 없음 (0점)
          
          // 현재 점수에 증감 적용 (0~100 범위 제한)
          const currentScore = scoreRef.current;
          const newScore = Math.max(0, Math.min(100, currentScore + scoreChange));
          
          setScore(newScore);
          scoreRef.current = newScore; // ref 업데이트
          
          // 점수 기록에 추가 (평균 계산용)
          setScoreHistory((prev) => [...prev, newScore].slice(-100)); // 최근 100개만 유지
          
          if (scoreChange !== 0) {
            console.log(`[SCORE] ${scoreChange > 0 ? '+' : ''}${scoreChange}점 (${currentScore} → ${newScore}), 각도: ${previousAngleRef.current.toFixed(1)}° → ${avgKneeAngle.toFixed(1)}°`);
            
            // ⚡ 섬광 효과: 점수에 따라 3단계 색상 결정
            let color;
            if (newScore >= 85) {
              color = 'green';  // 완벽! (85~100점)
            } else if (newScore >= 60) {
              color = 'yellow'; // 아쉬움 (60~84점)
            } else {
              color = 'red';    // 엉망 (0~59점)
            }
            setFlashColor(color);
            // 500ms 후 섬광 효과 제거
            setTimeout(() => setFlashColor(null), 500);
          }
        } else {
          // 첫 번째 각도 측정: 이전 각도 저장만 (점수 변경 없음)
          console.log(`[SCORE] 첫 각도 측정: ${avgKneeAngle.toFixed(1)}° (점수: ${scoreRef.current}점 유지)`);
        }
        
        // 이전 각도 업데이트
        previousAngleRef.current = avgKneeAngle;
      }
    } else if (currentExercise === 'push_up' && result?.angles) {
      const angles = result.angles;
      const elbowAngles = [angles.left_elbow, angles.right_elbow].filter(a => a != null && !isNaN(a));
      if (elbowAngles.length > 0) {
        const avgElbowAngle = elbowAngles.reduce((a, b) => a + b, 0) / elbowAngles.length;
        
        // 현재 각도와 목표 각도(90도)의 차이
        const currentDiff = Math.abs(TARGET_ANGLE - avgElbowAngle);
        
        // 이전 각도가 있으면 비교하여 점수 증감
        if (previousAngleRef.current !== null) {
          const previousDiff = Math.abs(TARGET_ANGLE - previousAngleRef.current);
          
          // 자세가 개선되었는지 확인 (목표 각도에 가까워졌는지)
          const improvement = previousDiff - currentDiff;
          
          // 점수 증감 계산 (개선되면 +, 나빠지면 -)
          let scoreChange = 0;
          if (improvement > 5) {
            scoreChange = MAX_SCORE_CHANGE;
          } else if (improvement > 2) {
            scoreChange = 2;
          } else if (improvement > 0.5) {
            scoreChange = 1;
          } else if (improvement < -5) {
            scoreChange = -MAX_SCORE_CHANGE;
          } else if (improvement < -2) {
            scoreChange = -2;
          } else if (improvement < -0.5) {
            scoreChange = -1;
          }
          
          // 현재 점수에 증감 적용 (0~100 범위 제한)
          const currentScore = scoreRef.current;
          const newScore = Math.max(0, Math.min(100, currentScore + scoreChange));
          
          setScore(newScore);
          scoreRef.current = newScore; // ref 업데이트
          
          // 점수 기록에 추가 (평균 계산용)
          setScoreHistory((prev) => [...prev, newScore].slice(-100)); // 최근 100개만 유지
          
          if (scoreChange !== 0) {
            console.log(`[SCORE] ${scoreChange > 0 ? '+' : ''}${scoreChange}점 (${currentScore} → ${newScore}), 각도: ${previousAngleRef.current.toFixed(1)}° → ${avgElbowAngle.toFixed(1)}°`);
            
            // ⚡ 섬광 효과: 점수에 따라 3단계 색상 결정
            let color;
            if (newScore >= 85) {
              color = 'green';  // 완벽! (85~100점)
            } else if (newScore >= 60) {
              color = 'yellow'; // 아쉬움 (60~84점)
            } else {
              color = 'red';    // 엉망 (0~59점)
            }
            setFlashColor(color);
            // 500ms 후 섬광 효과 제거
            setTimeout(() => setFlashColor(null), 500);
          }
        } else {
          // 첫 번째 각도 측정: 이전 각도 저장만 (점수 변경 없음)
          console.log(`[SCORE] 첫 각도 측정: ${avgElbowAngle.toFixed(1)}° (점수: ${scoreRef.current}점 유지)`);
        }
        
        // 이전 각도 업데이트
        previousAngleRef.current = avgElbowAngle;
      }
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

        // 🔍 서버 응답 로그 (개수 디버깅) - angles 데이터 포함
        console.log(`[SERVER] 📥 pose=${result?.pose}, angles=${JSON.stringify(result?.angles)}, 전달stage=${stage}`);

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

      // ⏱️ Throttle: 2초마다 서버로 전송 (운동 동작 빠른 감지를 위해 간격 단축)
      const now = Date.now();
      const timeSinceLastSend = now - lastServerSendTimeRef.current;
      const SEND_INTERVAL_MS = 2000; // 2초 간격 (5초 → 2초로 단축)
      
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
    setScore(50); // 초기 점수 50점
    scoreRef.current = 50; // ref도 초기화
    previousAngleRef.current = null; // 이전 각도 초기화
    downStateStartTimeRef.current = null; // DOWN 시간 추적 초기화
    setDownStateStartTime(null); // DOWN 시간 state 초기화
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
    setCurrentSet(1);
    setIsResting(false);
    setRestCountdown(0);
    setLastRestTime(0);
    setScoreHistory([]);
    setStartTime(null);
  }, []);

  // 로컬 시간대를 포함한 ISO 문자열로 변환 (날짜 오류 방지)
  const toLocalISOString = (date) => {
    const tzOffset = -date.getTimezoneOffset(); // 분 단위 오프셋 (한국은 -540분, UTC+9)
    const offsetHours = Math.floor(Math.abs(tzOffset) / 60);
    const offsetMinutes = Math.abs(tzOffset) % 60;
    const offsetSign = tzOffset >= 0 ? '+' : '-';
    const offsetString = `${offsetSign}${String(offsetHours).padStart(2, '0')}:${String(offsetMinutes).padStart(2, '0')}`;
    
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    const milliseconds = String(date.getMilliseconds()).padStart(3, '0');
    
    return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}.${milliseconds}${offsetString}`;
  };

  // 운동 기록 저장 (오프라인 대응)
  const saveExerciseHistory = useCallback(async () => {
    if (!user?.token || !selectedExercise || exerciseCount === 0) {
      console.log('[EWAI] 운동 기록 저장 건너뜀:', { 
        hasToken: !!user?.token, 
        selectedExercise, 
        exerciseCount 
      });
      return;
    }

    const averageScore = scoreHistory.length > 0
      ? Math.round(scoreHistory.reduce((sum, s) => sum + s, 0) / scoreHistory.length)
      : score;

    // startTime이 없으면 현재 시간으로 설정
    const startTimeValue = startTime || new Date();
    const endTimeValue = new Date();

    const historyData = {
      exercise: selectedExercise,
      total_reps: exerciseCount,
      total_sets: currentSet || 1, // 최소 1세트
      average_score: averageScore || 0, // 최소 0점
      start_time: toLocalISOString(startTimeValue), // 로컬 시간대 포함
      end_time: toLocalISOString(endTimeValue), // 로컬 시간대 포함
    };

    console.log('[EWAI] 📤 운동 기록 저장 시도:', historyData);

    try {
      // 먼저 서버에 저장 시도
      await axios.post(
        `${BASE_API_URL}exercise/history/`,
        historyData,
        {
          headers: { Authorization: `Token ${user.token}` },
          timeout: 5000, // 5초 타임아웃
        }
      );

      console.log('[EWAI] ✅ 운동 기록 서버 저장 완료');
    } catch (error) {
      // 네트워크 오류 또는 서버 오류 시 로컬에 임시 저장
      console.warn('[EWAI] ⚠️ 서버 저장 실패, 로컬에 임시 저장:', error.message);
      if (error.response) {
        console.error('[EWAI] 서버 응답:', error.response.data);
        console.error('[EWAI] 서버 상태 코드:', error.response.status);
        console.error('[EWAI] 전송한 데이터:', historyData);
      }
      
      const saved = await savePendingHistory(historyData);
      if (saved) {
        console.log('[EWAI] ✅ 운동 기록 로컬 임시 저장 완료 (나중에 동기화됨)');
      } else {
        console.error('[EWAI] ❌ 로컬 저장도 실패');
      }
    }
  }, [user?.token, selectedExercise, exerciseCount, currentSet, scoreHistory, score, startTime]);

  const handleStartStop = useCallback(() => {
    console.log('[EWAI] 🔘 handleStartStop called - isRunning:', isRunning, 'selectedExercise:', selectedExercise);
    if (isRunning) {
      console.log('[EWAI] 🛑 Stopping exercise');
      // 운동 종료 시 기록 저장
      saveExerciseHistory();
      setIsRunning(false);
      resetAllState();
    } else if (selectedExercise) {
      console.log('[EWAI] ▶️ Starting exercise:', selectedExercise);
      setExerciseCount(0);
      setExerciseStage('UP');
      setScore(50); // 초기 점수 50점
      scoreRef.current = 50; // ref도 초기화
      previousAngleRef.current = null; // 이전 각도 초기화
      downStateStartTimeRef.current = null; // DOWN 시간 추적 초기화
      setDownStateStartTime(null); // DOWN 시간 state 초기화
      setIsRunning(true);
      setFeedback('AI 분석을 시작합니다...');
      setStartTime(new Date()); // 운동 시작 시간 기록
      lastServerSendTimeRef.current = 0; // ⏱️ 리셋: 즉시 첫 프레임 전송 가능
      setLastValidPose('UP'); // 초기 pose 설정
      console.log('[EWAI] ✅ setIsRunning(true) called - throttle reset');
    } else {
      console.log('[EWAI] ⚠️ No exercise selected');
    }
  }, [isRunning, selectedExercise, resetAllState, saveExerciseHistory]);

  const exerciseNameMap = {
    squat: '스쿼트',
    push_up: '푸쉬업',
  };

  // ─────────────────────────────────────────────────────────────
  // Rendering guards
  // ─────────────────────────────────────────────────────────────
  if (!hasAccess) {
    return (
      <View style={[styles.centered, { paddingHorizontal: 24 }]}>
        <Text style={styles.permissionText}>AI 운동 기능은 로그인 및 Standard 이상 구독 후 이용할 수 있어요.</Text>
        <Text style={[styles.permissionText, { fontSize: 14, fontWeight: 'normal' }]}>
          상단 메뉴에서 로그인 또는 구독을 완료한 뒤 다시 시도해 주세요.
        </Text>
      </View>
    );
  }

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
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" />
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
              {bodyShape && selectedExercise && (() => {
                const routine = getExerciseRoutine(bodyShape, selectedExercise);
                return (
                  <Text style={styles.statSubLabel}>
                    목표: {routine.targetReps}회
                  </Text>
                );
              })()}
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>점수</Text>
              <Text style={[
                styles.statValue, 
                { color: score >= 85 ? '#4CAF50' : score >= 60 ? '#FFC107' : '#F44336' }
              ]}>
                {score}
              </Text>
              {bodyShape && selectedExercise && (() => {
                const routine = getExerciseRoutine(bodyShape, selectedExercise);
                return (
                  <Text style={styles.statSubLabel}>
                    최소: {routine.minScore}점
                  </Text>
                );
              })()}
            </View>
            {bodyShape && selectedExercise && (
              <View style={styles.statBox}>
                <Text style={styles.statLabel}>세트</Text>
                <Text style={styles.statValue}>{currentSet}</Text>
                {(() => {
                  const routine = getExerciseRoutine(bodyShape, selectedExercise);
                  return (
                    <Text style={styles.statSubLabel}>
                      목표: {routine.sets}세트
                    </Text>
                  );
                })()}
              </View>
            )}
          </View>
        )}

        {/* 쉬는 시간 표시 */}
        {isResting && (
          <View style={styles.restContainer}>
            <Text style={styles.restTitle}>쉬는 시간</Text>
            <Text style={styles.restCountdown}>{restCountdown}초</Text>
            <Text style={styles.restSubtitle}>다음 세트 준비 중...</Text>
          </View>
        )}

        {/* 루틴 정보 표시 (운동 시작 전) */}
        {!isRunning && bodyShape && selectedExercise && (
          <View style={styles.routineInfoContainer}>
            <Text style={styles.routineInfoTitle}>💪 추천 루틴</Text>
            {(() => {
              const routine = getExerciseRoutineByBodyShape(bodyShape);
              const exerciseRoutine = getExerciseRoutine(bodyShape, selectedExercise);
              return (
                <>
                  <Text style={styles.routineInfoText}>
                    난이도: {routine.levelName}
                  </Text>
                  <Text style={styles.routineInfoText}>
                    목표: {exerciseRoutine.targetReps}회 × {exerciseRoutine.sets}세트
                  </Text>
                  <Text style={styles.routineInfoText}>
                    쉬는 시간: {exerciseRoutine.restTime}초
                  </Text>
                </>
              );
            })()}
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: 'black',
  },
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
    bottom: '27%',
    left: 20,
    right: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    padding: 15,
    borderRadius: 10,
  },
  feedbackContainerExpanded: {
    bottom: '22%',
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
  statSubLabel: {
    fontSize: 12,
    color: '#B0BEC5',
    marginTop: 4,
    fontWeight: '500',
  },
  restContainer: {
    position: 'absolute',
    top: '35%',
    left: 0,
    right: 0,
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    paddingVertical: 24,
    paddingHorizontal: 32,
    marginHorizontal: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#0A84FF',
  },
  restTitle: {
    fontSize: 18,
    color: '#FFFFFF',
    fontWeight: '700',
    marginBottom: 8,
  },
  restCountdown: {
    fontSize: 48,
    color: '#0A84FF',
    fontWeight: '800',
    marginBottom: 8,
  },
  restSubtitle: {
    fontSize: 14,
    color: '#B0BEC5',
  },
  routineInfoContainer: {
    position: 'absolute',
    top: 100,
    right: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(138, 184, 255, 0.4)',
    minWidth: 160,
  },
  routineInfoTitle: {
    fontSize: 14,
    color: '#8AB8FF',
    fontWeight: '700',
    marginBottom: 8,
  },
  routineInfoText: {
    fontSize: 12,
    color: '#E0E0E0',
    marginBottom: 4,
    lineHeight: 18,
  },
});
