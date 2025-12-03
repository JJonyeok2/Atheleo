// app/utils/exerciseRoutines.js
// 체형별 맞춤 운동 루틴 데이터

/**
 * 체형별 운동 난이도 분류
 * - HIGH_MUSCLE: 근육량이 많아 보이는 체형 (역삼각형, 사각체형)
 * - LOW_MUSCLE: 근육량이 적은 체형 (삼각형, 이상체형, 둥근체형, 튜브체형, 마름모형)
 * - MEDIUM: 중간 체형 (모래시계형)
 */
const BODY_SHAPE_CATEGORIES = {
  HIGH_MUSCLE: ['역삼각형', '사각체형'],
  LOW_MUSCLE: ['삼각형', '이상체형', '둥근체형', '튜브체형', '마름모형'],
  MEDIUM: ['모래시계형'],
};

/**
 * 체형에 따른 운동 루틴 설정
 * @param {string} bodyShape - 체형 이름 (예: '역삼각형', '모래시계형')
 * @returns {Object} 운동 루틴 설정
 */
export const getExerciseRoutineByBodyShape = (bodyShape) => {
  if (!bodyShape) {
    // 기본값: 중간 난이도
    return getRoutineConfig('MEDIUM');
  }

  const normalizedShape = bodyShape.trim();
  
  // 근육량이 많은 체형
  if (BODY_SHAPE_CATEGORIES.HIGH_MUSCLE.includes(normalizedShape)) {
    return getRoutineConfig('HIGH_MUSCLE');
  }
  
  // 근육량이 적은 체형
  if (BODY_SHAPE_CATEGORIES.LOW_MUSCLE.includes(normalizedShape)) {
    return getRoutineConfig('LOW_MUSCLE');
  }
  
  // 중간 체형 (기본값)
  return getRoutineConfig('MEDIUM');
};

/**
 * 난이도별 운동 루틴 설정 반환
 * @param {string} level - 'HIGH_MUSCLE', 'LOW_MUSCLE', 'MEDIUM'
 * @returns {Object} 운동 루틴 설정
 */
export const getRoutineConfig = (level) => {
  const routines = {
    HIGH_MUSCLE: {
      level: 'HIGH_MUSCLE',
      levelName: '고강도',
      description: '근육량이 많은 체형에 맞춘 고강도 루틴',
      squat: {
        targetReps: 20, // 목표 횟수
        sets: 3, // 세트 수
        restTime: 30, // 쉬는 시간 (초)
        minScore: 70, // 최소 점수 기준 (자세에 엄격)
        feedback: {
          strict: true, // 자세에 엄격
          encouragement: '좋아요! 더 깊이 내려가세요.',
        },
      },
      push_up: {
        targetReps: 15,
        sets: 3,
        restTime: 30,
        minScore: 70,
        feedback: {
          strict: true,
          encouragement: '팔꿈치 각도를 조절하세요.',
        },
      },
    },
    LOW_MUSCLE: {
      level: 'LOW_MUSCLE',
      levelName: '초보자',
      description: '근육량이 적은 체형에 맞춘 초보자 루틴',
      squat: {
        targetReps: 10, // 목표 횟수 (적음)
        sets: 2, // 세트 수 (적음)
        restTime: 60, // 쉬는 시간 (길게)
        minScore: 50, // 최소 점수 기준 (자세에 관대)
        feedback: {
          strict: false, // 자세에 관대
          encouragement: '천천히, 무리하지 마세요. 조금씩 개선해 나가요.',
        },
      },
      push_up: {
        targetReps: 8,
        sets: 2,
        restTime: 60,
        minScore: 50,
        feedback: {
          strict: false,
          encouragement: '무릎을 꿇고 해도 괜찮아요. 천천히 시작하세요.',
        },
      },
    },
    MEDIUM: {
      level: 'MEDIUM',
      levelName: '중급',
      description: '균형잡힌 체형에 맞춘 중급 루틴',
      squat: {
        targetReps: 15,
        sets: 3,
        restTime: 45,
        minScore: 60,
        feedback: {
          strict: true,
          encouragement: '좋은 자세를 유지하세요.',
        },
      },
      push_up: {
        targetReps: 12,
        sets: 3,
        restTime: 45,
        minScore: 60,
        feedback: {
          strict: true,
          encouragement: '균형잡힌 자세를 유지하세요.',
        },
      },
    },
  };

  return routines[level] || routines.MEDIUM;
};

/**
 * 운동별 루틴 정보 가져오기
 * @param {string} bodyShape - 체형 이름
 * @param {string} exerciseType - 'squat' 또는 'push_up'
 * @returns {Object} 해당 운동의 루틴 정보
 */
export const getExerciseRoutine = (bodyShape, exerciseType) => {
  const routine = getExerciseRoutineByBodyShape(bodyShape);
  return routine[exerciseType] || routine.squat; // 기본값: squat
};

/**
 * 체형별 루틴 설명 텍스트 생성
 * @param {string} bodyShape - 체형 이름
 * @returns {string} 루틴 설명
 */
export const getRoutineDescription = (bodyShape) => {
  const routine = getExerciseRoutineByBodyShape(bodyShape);
  return `${routine.description}\n${routine.levelName} 난이도로 설정되었습니다.`;
};

/**
 * 목표 달성 여부 확인
 * @param {string} bodyShape - 체형 이름
 * @param {string} exerciseType - 'squat' 또는 'push_up'
 * @param {number} currentReps - 현재 횟수
 * @param {number} currentSet - 현재 세트
 * @returns {Object} 목표 달성 정보
 */
export const checkGoalAchievement = (bodyShape, exerciseType, currentReps, currentSet) => {
  const exerciseRoutine = getExerciseRoutine(bodyShape, exerciseType);
  
  const isRepGoalReached = currentReps >= exerciseRoutine.targetReps;
  const isSetGoalReached = currentSet >= exerciseRoutine.sets;
  const isComplete = isRepGoalReached && isSetGoalReached;
  
  return {
    isRepGoalReached,
    isSetGoalReached,
    isComplete,
    targetReps: exerciseRoutine.targetReps,
    targetSets: exerciseRoutine.sets,
    progress: {
      reps: Math.min((currentReps / exerciseRoutine.targetReps) * 100, 100),
      sets: Math.min((currentSet / exerciseRoutine.sets) * 100, 100),
    },
  };
};

/**
 * 쉬는 시간이 필요한지 확인
 * @param {string} bodyShape - 체형 이름
 * @param {string} exerciseType - 'squat' 또는 'push_up'
 * @param {number} lastRestTime - 마지막 쉬는 시간 (타임스탬프)
 * @returns {Object} 쉬는 시간 정보
 */
export const shouldRest = (bodyShape, exerciseType, lastRestTime) => {
  const exerciseRoutine = getExerciseRoutine(bodyShape, exerciseType);
  const now = Date.now();
  const timeSinceLastRest = (now - lastRestTime) / 1000; // 초 단위
  
  const needsRest = timeSinceLastRest < exerciseRoutine.restTime;
  const remainingRestTime = Math.max(0, exerciseRoutine.restTime - timeSinceLastRest);
  
  return {
    needsRest,
    remainingRestTime: Math.ceil(remainingRestTime),
    totalRestTime: exerciseRoutine.restTime,
  };
};

