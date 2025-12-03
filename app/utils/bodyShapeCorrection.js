// app/utils/bodyShapeCorrection.js
// 체형 분석 결과 보정 유틸리티

/**
 * 랜드마크 간 거리 계산 (픽셀 단위)
 */
const calculateDistance = (point1, point2) => {
  if (!point1 || !point2 || point1.visibility < 0.5 || point2.visibility < 0.5) {
    return null;
  }
  const dx = point1.x - point2.x;
  const dy = point1.y - point2.y;
  return Math.sqrt(dx * dx + dy * dy);
};

/**
 * 신체 전체 크기 추정 (어깨-골반 거리, 어깨 너비, 골반 너비 등을 종합)
 */
const estimateBodySize = (landmarks) => {
  if (!landmarks || landmarks.length < 33) {
    return null;
  }

  // 주요 랜드마크 인덱스 (MediaPipe Pose 33개 기준)
  const LEFT_SHOULDER = 11;
  const RIGHT_SHOULDER = 12;
  const LEFT_HIP = 23;
  const RIGHT_HIP = 24;
  const LEFT_ANKLE = 27;
  const RIGHT_ANKLE = 28;

  // 어깨 너비
  const shoulderWidth = calculateDistance(
    landmarks[LEFT_SHOULDER],
    landmarks[RIGHT_SHOULDER]
  );

  // 골반 너비
  const hipWidth = calculateDistance(
    landmarks[LEFT_HIP],
    landmarks[RIGHT_HIP]
  );

  // 어깨-골반 거리 (상체 길이)
  const shoulderToHipDistance = calculateDistance(
    landmarks[LEFT_SHOULDER],
    landmarks[LEFT_HIP]
  );

  // 골반-발목 거리 (하체 길이)
  const hipToAnkleDistance = calculateDistance(
    landmarks[LEFT_HIP],
    landmarks[LEFT_ANKLE]
  );

  // 전체 신체 높이 추정
  const estimatedHeight = shoulderToHipDistance && hipToAnkleDistance
    ? shoulderToHipDistance + hipToAnkleDistance
    : null;

  // 신체 크기 지표 (너비와 높이의 평균)
  const sizeIndicator = shoulderWidth && hipWidth && estimatedHeight
    ? (shoulderWidth + hipWidth + estimatedHeight) / 3
    : null;

  return {
    shoulderWidth,
    hipWidth,
    shoulderToHipDistance,
    hipToAnkleDistance,
    estimatedHeight,
    sizeIndicator,
  };
};

/**
 * 덩치가 큰 사람인지 판단
 * @param {Object} bodySize - estimateBodySize()의 결과
 * @param {Object} ratios - 백엔드에서 받은 비율 데이터
 * @returns {boolean} 덩치가 큰 사람 여부
 */
const isLargeBodyType = (bodySize, ratios) => {
  if (!bodySize || !bodySize.sizeIndicator) {
    return false;
  }

  // 신체 크기 지표가 평균보다 큰 경우 (임계값: 0.15 이상)
  // 정규화된 좌표(0~1) 기준으로, 평균적인 사람의 크기 지표는 약 0.3~0.4 정도
  // 덩치가 큰 사람은 0.5 이상일 가능성이 높음
  const LARGE_BODY_THRESHOLD = 0.5;

  // 비율이 정상 범위이지만 전체 크기가 큰 경우
  const isLargeSize = bodySize.sizeIndicator > LARGE_BODY_THRESHOLD;

  // 어깨와 골반이 모두 큰 경우 (덩치가 큰 사람의 특징)
  const hasLargeWidth = bodySize.shoulderWidth > 0.15 && bodySize.hipWidth > 0.15;

  // 높이도 큰 경우
  const hasLargeHeight = bodySize.estimatedHeight && bodySize.estimatedHeight > 0.4;

  return isLargeSize && (hasLargeWidth || hasLargeHeight);
};

/**
 * 체형 분류 보정
 * 덩치가 큰 사람이 일반 체형으로 잘못 분류되는 경우를 보정
 * @param {string} originalShape - 백엔드에서 받은 원본 체형
 * @param {Object} ratios - 신체 비율 데이터
 * @param {Array} landmarks - 랜드마크 배열 (33개)
 * @returns {string} 보정된 체형
 */
export const correctBodyShape = (originalShape, ratios, landmarks) => {
  if (!originalShape || !landmarks) {
    return originalShape;
  }

  const bodySize = estimateBodySize(landmarks);
  const isLarge = isLargeBodyType(bodySize, ratios);

  // 덩치가 큰 사람인데 일반 체형으로 분류된 경우
  // 백엔드에서 이미 보정을 수행하므로, 프론트엔드에서는 추가 보정만 수행
  if (isLarge) {
    // 원본 체형이 "모래시계형" (일반 체형)인 경우
    // 백엔드에서 이미 보정했지만, 혹시 모를 경우를 대비해 추가 보정
    if (originalShape === '모래시계형' || originalShape === '이상체형') {
      // 비율을 다시 확인하여 더 적절한 체형으로 보정
      if (ratios) {
        const shoulderToHip = ratios.shoulder_to_hip || 0;
        const waistToShoulder = ratios.waist_to_shoulder || 0;
        const waistToHip = ratios.waist_to_hip || 0;

        // 어깨가 골반보다 훨씬 큰 경우 (역삼각형)
        if (shoulderToHip > 1.10) {
          return '역삼각형';
        }
        // 골반이 어깨보다 훨씬 큰 경우 (삼각형)
        else if (shoulderToHip < 0.90) {
          return '삼각형';
        }
        // 허리가 상대적으로 큰 경우 (둥근체형 또는 튜브체형)
        else if (waistToShoulder > 0.85 || waistToHip > 0.90) {
          if (waistToHip > 0.95) {
            return '튜브체형';
          } else {
            return '둥근체형';
          }
        }
        // 어깨와 골반이 비슷하고 허리가 작은 경우 (사각체형)
        else if (shoulderToHip >= 0.95 && shoulderToHip <= 1.05 && waistToShoulder < 0.75) {
          return '사각체형';
        }
        // 그 외에는 사각체형으로 분류 (덩치가 큰 사람의 경우)
        else {
          return '사각체형';
        }
      }
    }
    // 원본 체형이 다른 체형인 경우는 그대로 유지
    // (덩치가 크더라도 비율이 특정 체형에 맞으면 그대로 유지)
  }

  return originalShape;
};

/**
 * 체형 분석 결과에 덩치 정보 추가
 * @param {Object} analysis - 백엔드에서 받은 분석 결과
 * @returns {Object} 보정된 분석 결과
 */
export const enhanceBodyAnalysis = (analysis) => {
  if (!analysis || !analysis.landmarks) {
    return analysis;
  }

  const bodySize = estimateBodySize(analysis.landmarks);
  const isLarge = isLargeBodyType(bodySize, analysis.ratios);

  // 원본 체형 보정
  const correctedShape = correctBodyShape(
    analysis.body_shape,
    analysis.ratios,
    analysis.landmarks
  );

  return {
    ...analysis,
    body_shape: correctedShape,
    body_size: {
      isLarge,
      sizeIndicator: bodySize?.sizeIndicator || null,
      shoulderWidth: bodySize?.shoulderWidth || null,
      hipWidth: bodySize?.hipWidth || null,
    },
    // 보정 여부 표시
    isCorrected: correctedShape !== analysis.body_shape,
    originalShape: analysis.body_shape, // 원본 체형 보존
  };
};

