// components/AnalysisVisualization.js
import React from 'react'; // React 불러오기
import { View, Image, StyleSheet } from 'react-native';
import Svg, { Circle, Line } from 'react-native-svg';

// MediaPipe Pose 랜드마크 연결 정의
const POSE_CONNECTIONS = [
  [0, 1], [1, 2], [2, 3], [3, 7], [0, 4], [4, 5], [5, 6], [6, 8], [9, 10],
  [11, 12], [11, 13], [13, 15], [15, 17], [15, 19], [15, 21], [12, 14],
  [14, 16], [16, 18], [16, 20], [16, 22], [11, 23], [12, 24], [23, 24],
  [23, 25], [24, 26], [25, 27], [26, 28], [27, 29], [28, 30], [29, 31],
  [30, 32], [27, 31], [28, 32],
];

const AnalysisVisualization = React.memo(({ imageUri, landmarks, imageLayout }) => {
  if (!imageUri || !landmarks || !imageLayout) {
    return null;
  }

  const { width, height } = imageLayout;

  // 정규화된 좌표(0~1)를 실제 이미지 크기에 맞게 변환하는 함수
  const scaleX = (x) => x * width;
  const scaleY = (y) => y * height;

  // 🚨 추가된 방어 로직: landmarks 배열 길이 검사
  // 최소 33개 랜드마크가 없으면 뼈대/관절을 그리지 않음
  const hasValidLandmarks = landmarks.length >= 33;

  return (
    <View style={[styles.container, { width, height }]}>
      <Image source={{ uri: imageUri }} style={styles.image} />
      {hasValidLandmarks && ( // 유효한 랜드마크가 있을 때만 SVG 렌더링
        <Svg height={height} width={width} style={styles.svg}>
          {POSE_CONNECTIONS.map(([startId, endId], index) => {
            const start = landmarks[startId];
            const end = landmarks[endId];
            if (start && end && start.visibility > 0.5 && end.visibility > 0.5) {
              return (
                <Line
                  key={`line-${index}`}
                  x1={scaleX(start.x)}
                  y1={scaleY(start.y)}
                  x2={scaleX(end.x)}
                  y2={scaleY(end.y)}
                  stroke="lime"
                  strokeWidth="3"
                />
              );
            }
            return null;
          })}

          {landmarks.map((lm, index) => {
            if (lm && lm.visibility > 0.5) { // lm 존재 여부도 확인
              return (
                <Circle
                  key={`circle-${index}`}
                  cx={scaleX(lm.x)}
                  cy={scaleY(lm.y)}
                  r="5"
                  fill="red"
                />
              );
            }
            return null;
          })}
        </Svg>
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    width: '100%',
    height: '100%',
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'contain',
  },
  svg: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
});

export default AnalysisVisualization; // React.memo로 래핑된 컴포넌트 내보내기