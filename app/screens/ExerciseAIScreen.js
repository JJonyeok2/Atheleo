
import React, { useEffect, useState, useRef } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Alert, InteractionManager } from 'react-native';
import { Camera } from 'expo-camera';
import axios from 'axios';
import { useIsFocused } from '@react-navigation/native';

// 운동 목록 (백엔드의 EXERCISE_ANALYZERS와 키를 일치시켜야 함)
const EXERCISES = {
  BICEP_CURL: 'Bicep Curl',
  OVERHEAD_EXTENSION: 'Overhead Extension',
  SHOULDER_PRESS: 'Shoulder Press',
  CHEST_PRESS: 'Chest Press',
};

// 백엔드 API 주소
const API_URL = 'http://127.0.0.1:8000/api/exercise/analyze-exercise/';

export default function ExerciseAIScreen() {
  const [hasPermission, setHasPermission] = useState(null);
  const [currentExercise, setCurrentExercise] = useState('BICEP_CURL');
  const [feedback, setFeedback] = useState('자세를 잡아주세요...');
  const [score, setScore] = useState(0);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isCameraReady, setIsCameraReady] = useState(false);
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

  // 2. 2초마다 자세 분석을 요청하는 루프
  useEffect(() => {
    const analysisInterval = setInterval(() => {
      if (!isAnalyzing) {
        analyzePose();
      }
    }, 2000); // 2초 간격

    return () => clearInterval(analysisInterval);
  }, [currentExercise, isAnalyzing]); // 운동이 변경되거나 분석 상태가 바뀔 때마다 재설정

  // 3. 백엔드에 자세 분석을 요청하는 함수
  const analyzePose = async () => {
    if (cameraRef.current) {
      setIsAnalyzing(true);
      try {
        const photo = await cameraRef.current.takePictureAsync({
          quality: 0.5,
          base64: true,
        });

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

  // 운동 선택 메뉴 렌더링
  const renderExerciseMenu = () => {
    return (
      <View style={styles.menuContainer}>
        {Object.entries(EXERCISES).map(([key, name]) => (
          <TouchableOpacity
            key={key}
            style={[styles.menuButton, currentExercise === key && styles.menuButtonActive]}
            onPress={() => handleExerciseChange(key)}
          >
            <Text style={styles.menuButtonText}>{name}</Text>
          </TouchableOpacity>
        ))}
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
          type={Camera.Constants.Type.front}
          onCameraReady={onCameraReady}
        />
      ) : (
        <View style={styles.camera}><Text>카메라 준비 중...</Text></View>
      )}
      {renderExerciseMenu()}
      <View style={styles.statsContainer}>
        <Text style={styles.statsText}>Exercise: {EXERCISES[currentExercise]}</Text>
        <Text style={styles.statsText}>Score: {score}</Text>
      </View>
      <View style={styles.feedbackContainer}>
        <Text style={styles.feedbackText}>{feedback}</Text>
      </View>
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
  },
  menuButtonActive: {
    backgroundColor: '#007bff',
    borderColor: '#007bff',
  },
  menuButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
});
