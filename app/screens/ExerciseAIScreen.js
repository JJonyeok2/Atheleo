
import { Feather } from '@expo/vector-icons'; // Feather 아이콘 임포트
import { useIsFocused } from '@react-navigation/native';
import axios from 'axios';
import { Camera } from 'expo-camera';
import { useEffect, useRef, useState } from 'react';
import { InteractionManager, Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const CATEGORIZED_EXERCISES = {
  UPPER_BODY: {
    BICEP_CURL: 'Bicep Curl',
    OVERHEAD_EXTENSION: 'Overhead Extension',
    SHOULDER_PRESS: 'Shoulder Press',
    CHEST_PRESS: 'Chest Press',
  },
  LOWER_BODY: {
    SQUAT: 'Squat',
    LUNGE: 'Lunge',
  },
};

// 모든 운동 이름을 포함하는 단일 객체 생성
const ALL_EXERCISES_FLAT = Object.values(CATEGORIZED_EXERCISES).reduce((acc, category) => {
  return { ...acc, ...category };
}, {});

// 테스트용 더미 Base64 이미지 (1x1 픽셀 검은색 이미지)
// 실제 카메라가 작동하지 않을 때 AI 분석 로직 테스트용으로 사용됩니다.
// 실제 카메라 사용 시에는 이 부분을 제거하거나 주석 처리하세요.
const TEST_IMAGE_BASE64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';

// 백엔드 API 주소
const API_URL = 'http://10.0.2.2:8000/api/exercise/analyze-exercise/';

export default function ExerciseAIScreen() {
  const [hasPermission, setHasPermission] = useState(null);
  const [currentExercise, setCurrentExercise] = useState(
    Object.keys(CATEGORIZED_EXERCISES.UPPER_BODY).length > 0
      ? Object.keys(CATEGORIZED_EXERCISES.UPPER_BODY)[0]
      : null // 상체 운동이 없으면 null로 초기화
  ); // 첫 번째 상체 운동으로 초기화
  const [selectedCategory, setSelectedCategory] = useState(null); // 선택된 카테고리 상태 추가
  const [feedback, setFeedback] = useState('자세를 잡아주세요...');
  const [score, setScore] = useState(0);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [showExerciseModal, setShowExerciseModal] = useState(false); // 모달 표시 여부 상태 추가
  const isFocused = useIsFocused();
  
  const cameraRef = useRef(null);

  // 1. 카메라 권한 요청
  useEffect(() => {
    if (isFocused) {
      InteractionManager.runAfterInteractions(async () => {
        const { status } = await Camera.requestCameraPermissionsAsync();
        setHasPermission(status === 'granted');
      });
    }
  }, [isFocused]);

  const onCameraReady = () => {
    setIsCameraReady(true);
  };

  // 2. 자세 분석 루프 (setTimeout 재귀 사용)
  useEffect(() => {
    let timeoutId;

    const startAnalysisLoop = async () => {
      if (!isAnalyzing) { // 이미 분석 중이 아니라면
        await analyzePose(); // 분석 완료까지 기다림
      }
      timeoutId = setTimeout(startAnalysisLoop, 2000); // 2초 후 다시 호출
    };

    // 컴포넌트가 마운트될 때 루프 시작
    startAnalysisLoop();

    // 컴포넌트 언마운트 시 타이머 정리
    return () => clearTimeout(timeoutId);
  }, [currentExercise]); // isAnalyzing 의존성 제거

  // 3. 백엔드에 자세 분석을 요청하는 함수
  const analyzePose = async () => {
    if (cameraRef.current) {
      setIsAnalyzing(true);
      try {
        // 실제 카메라 대신 더미 이미지 사용 (AVD 카메라 문제 해결용)
        // const photo = await cameraRef.current.takePictureAsync({
        //   quality: 0.5,
        //   base64: true,
        // });
        const photo = { base64: TEST_IMAGE_BASE64 }; // 더미 이미지 할당

        // 백엔드로 데이터 전송
        const response = await axios.post(API_URL, {
          image: `data:image/jpeg;base64,${photo.base64}`,
          exercise_type: currentExercise,
        });

        // 결과 업데이트
        setFeedback(response.data.feedback);
        setScore(response.data.score);

      } catch (error) {
        console.error("An error occurred during analysis:", error);
        let errorMessage = '분석 중 오류가 발생했습니다.';
        if (error.response) {
            // 서버가 응답을 보냈지만, 상태 코드가 2xx가 아님
            console.error("Backend Error:", error.response.data);
            errorMessage = `서버 오류: ${error.response.data.error || '알 수 없는 오류'}`;
        } else if (error.request) {
            // 요청이 이루어졌으나 응답을 받지 못함
            console.error("No response from server:", error.request);
            errorMessage = '서버에 연결할 수 없습니다. 백엔드 서버가 실행 중인지 확인하세요.';
        }
        setFeedback(errorMessage);
      } finally {
        setIsAnalyzing(false);
      }
    }
  };

  // 운동 변경 핸들러
  const handleExerciseChange = (exerciseKey) => {
    setCurrentExercise(exerciseKey);
    setScore(0);
    setFeedback('Ready?');
  };

  // 운동 선택 메뉴 렌더링 (모달 내부에서 사용)
  const renderExerciseSelection = () => {
    console.log('renderExerciseSelection called. selectedCategory:', selectedCategory);
    return (
      <View style={styles.modalContent}>
        <Text style={styles.modalTitle}>운동 선택</Text>
        {/* Category selection */}
        <View style={styles.categoryButtonContainer}>
          {Object.entries(CATEGORIZED_EXERCISES).map(([categoryKey, exercises]) => (
            <TouchableOpacity
              key={categoryKey}
              style={[
                styles.menuButton,
                selectedCategory === categoryKey && styles.menuButtonActive,
              ]}
              onPress={() => setSelectedCategory(categoryKey)}
            >
              <Text style={styles.menuButtonText}>{categoryKey.replace('_', ' ')}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Exercise options based on selected category */}
        {selectedCategory && (
          <View style={styles.exerciseOptionContainer}>
            {Object.entries(CATEGORIZED_EXERCISES[selectedCategory]).map(([exerciseKey, exerciseName]) => (
              <TouchableOpacity
                key={exerciseKey}
                style={styles.menuButton}
                onPress={() => {
                  setCurrentExercise(exerciseKey);
                  setShowExerciseModal(false);
                }}
              >
                <Text style={styles.menuButtonText}>{exerciseName}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Close button */}
        <TouchableOpacity
          style={styles.closeButton}
          onPress={() => setShowExerciseModal(false)}
        >
          <Text style={styles.closeButtonText}>닫기</Text>
        </TouchableOpacity>
      </View>
    );
  };

  if (hasPermission === null) {
    return <View style={styles.loadingContainer}><Text>카메라 권한을 요청하는 중...</Text></View>;
  }
  if (hasPermission === false) {
    return <View style={styles.loadingContainer}><Text>카메라 접근 권한이 없습니다.</Text></View>;
  }

  return (
    <View style={styles.container}>
      {isFocused && hasPermission && isCameraReady ? (
        <Camera
          ref={cameraRef}
          style={styles.camera}
          facing="front" // type 대신 facing 사용
          onCameraReady={onCameraReady}
        />
      ) : (
        <View style={styles.camera}><Text>카메라 준비 중...</Text></View>
      )}
      <View style={styles.statsContainer}>
        <Text style={styles.statsText}>Exercise: {ALL_EXERCISES_FLAT[currentExercise] || currentExercise}</Text>
        <Text style={styles.statsText}>Score: {score}</Text>
      </View>
      <View style={styles.feedbackContainer}>
        <Text style={styles.feedbackText}>{feedback}</Text>
      </View>

      {/* 운동 선택 버튼 */}
      <TouchableOpacity
        style={styles.selectExerciseButton}
        onPress={() => setShowExerciseModal(true)}
      >
        <Text style={styles.selectExerciseButtonText}>운동 선택</Text>
      </TouchableOpacity>

      {/* 운동 선택 모달 */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={showExerciseModal}
        onRequestClose={() => setShowExerciseModal(false)}
      >
        <View style={styles.modalOverlay}>
          {renderExerciseSelection()}
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'black' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  camera: { width: '100%', height: '100%', position: 'absolute', zIndex: 1 },
  statsContainer: {
    position: 'absolute',
    top: 120,
    left: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    padding: 10,
    borderRadius: 5,
    zIndex: 10,
  },
  statsText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  feedbackContainer: {
    position: 'absolute',
    bottom: 50,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 10,
  },
  feedbackText: {
    color: 'yellow',
    fontSize: 24,
    fontWeight: 'bold',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
    textAlign: 'center',
  },
  menuContainer: {
    position: 'absolute',
    top: 40,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 10,
    backgroundColor: 'rgba(0,0,0,0.5)',
    zIndex: 20,
  },
  menuButton: {
    padding: 10,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: 'white',
    margin: 5, // 버튼 간 간격 추가
    minWidth: 120, // 최소 너비 지정
    alignItems: 'center', // 텍스트 중앙 정렬
  },
  menuButtonActive: {
    backgroundColor: '#007bff',
    borderColor: '#007bff',
  },
  menuButtonText: {
    color: 'black', // 색상 변경
    fontWeight: 'bold',
  },
  selectExerciseButton: {
    position: 'absolute',
    bottom: 100, // 피드백 컨테이너 위에 위치
    left: 20,
    right: 20,
    backgroundColor: '#007bff',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    zIndex: 10,
  },
  selectExerciseButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end', // 하단에서 올라오도록
    backgroundColor: 'rgba(0, 0, 0, 0.5)', // 반투명 배경
  },
  modalContent: {
    backgroundColor: 'white',
    padding: 20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    alignItems: 'center',
    flexDirection: 'column', // 'row'에서 'column'으로 변경
    // flexWrap: 'wrap',     // 'column'에서는 필요 없음
    // justifyContent: 'center', // 'column'에서는 필요 없음
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 20,
    color: 'black',
    textAlign: 'center', // 중앙 정렬 추가
  },
  closeButton: {
    marginTop: 20,
    backgroundColor: '#ccc',
    padding: 10,
    borderRadius: 5,
  },
  closeButtonText: {
    color: 'black',
    fontSize: 16,
  },
  modalCloseButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    padding: 5,
    zIndex: 1, // 다른 요소 위에 표시
  },
  categoryButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginBottom: 20,
  },
  exerciseOptionContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    width: '100%',
    marginBottom: 20,
  },
  backButton: {
    marginTop: 20,
    backgroundColor: '#6c757d', // 회색 배경
    padding: 10,
    borderRadius: 5,
    width: '80%', // 너비 조정
    alignItems: 'center',
  },
  backButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
