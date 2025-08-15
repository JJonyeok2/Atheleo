import { Camera, CameraView } from 'expo-camera';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Button, StyleSheet, Text, View, InteractionManager } from 'react-native';
import { useIsFocused } from '@react-navigation/native';

export default function ExerciseWithAI() {
  const cameraRef = useRef(null);
  const [hasPermission, setHasPermission] = useState(null);
  const [score, setScore] = useState(null);
  const [feedback, setFeedback] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isCameraReady, setIsCameraReady] = useState(false);
  const isFocused = useIsFocused();

  // State for exercise selection
  const [selectedPart, setSelectedPart] = useState(null);
  const [selectedSubPart, setSelectedSubPart] = useState(null);
  const [selectedExercise, setSelectedExercise] = useState(null);

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

  useEffect(() => {
    let interval;
    if (isRunning && cameraRef.current) {
      const execute = () => {
        if (cameraRef.current) captureAndSend();
      };
      execute(); // Run immediately
      interval = setInterval(execute, 2000); // Then every 2 seconds
    }
    return () => clearInterval(interval);
  }, [isRunning]);

  const captureAndSend = async () => {
    if (!cameraRef.current || !selectedExercise) return;
    try {
      setIsLoading(true);
      const photo = await cameraRef.current.takePictureAsync({ base64: true, quality: 0.6 });

      const res = await fetch('http://172.30.1.9:8000/api/exercise-score/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image: photo.base64,
          exercise: selectedExercise, // 예: 'bicep_curl'
        }),
      });

      const result = await res.json();
      setScore(result.score);
      setFeedback(result.feedback);
    } catch (err) {
      console.error('🚨 전송 실패:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const resetSelection = () => {
    setSelectedPart(null);
    setSelectedSubPart(null);
    setSelectedExercise(null);
    setScore(null);
    setFeedback('');
  };

  const handleStartStop = () => {
    if (isRunning) {
      setIsRunning(false);
      resetSelection();
    } else if (selectedExercise) {
      setIsRunning(true);
    }
  };

  const renderSelectionControls = () => {
    if (isRunning) {
      return (
        <Button
          title="Stop AI Tracking"
          onPress={handleStartStop}
          disabled={isLoading}
          color="red"
        />
      );
    }

    if (!selectedPart) {
      return (
        <View style={styles.selectionContainer}>
          <Text style={styles.selectionText}>1. 운동 부위를 선택하세요.</Text>
          <View style={styles.buttonGroup}>
            <Button title="상체" onPress={() => setSelectedPart('upper')} />
            <Button title="하체" onPress={() => setSelectedPart('lower')} />
          </View>
        </View>
      );
    }

    if (!selectedSubPart) {
      if (selectedPart === 'upper') {
        return (
          <View style={styles.selectionContainer}>
            <Text style={styles.selectionText}>2. 세부 부위를 선택하세요.</Text>
            <View style={styles.buttonGroup}>
              <Button title="팔" onPress={() => setSelectedSubPart('arm')} />
              <Button title="어깨" onPress={() => setSelectedSubPart('shoulder')} />
              <Button title="가슴" onPress={() => setSelectedSubPart('chest')} />
            </View>
            <Button title="뒤로" onPress={() => setSelectedPart(null)} />
          </View>
        );
      }
      if (selectedPart === 'lower') {
        return (
            <View style={styles.selectionContainer}>
                <Text style={styles.selectionText}>2. 세부 부위를 선택하세요.</Text>
                <View style={styles.buttonGroup}>
                    <Button title="다리" onPress={() => setSelectedSubPart('leg')} />
                </View>
                <Button title="뒤로" onPress={() => setSelectedPart(null)} />
            </View>
        )
      }
    }

    if (!selectedExercise) {
      if (selectedSubPart === 'arm') {
        return (
          <View style={styles.selectionContainer}>
            <Text style={styles.selectionText}>3. 운동을 선택하세요.</Text>
            <View style={styles.buttonGroup}>
              <Button title="이두 컬" onPress={() => setSelectedExercise('bicep_curl')} />
              <Button title="삼두 익스텐션" onPress={() => setSelectedExercise('tricep_extension')} />
            </View>
            <Button title="뒤로" onPress={() => setSelectedSubPart(null)} />
          </View>
        );
      }
      if (selectedSubPart === 'leg') {
        return (
            <View style={styles.selectionContainer}>
                <Text style={styles.selectionText}>3. 운동을 선택하세요.</Text>
                <View style={styles.buttonGroup}>
                    <Button title="스쿼트" onPress={() => setSelectedExercise('squat')} />
                </View>
                <Button title="뒤로" onPress={() => setSelectedSubPart(null)} />
            </View>
        )
      }
    }

    return (
      <View style={styles.selectionContainer}>
        <Text style={styles.selectionText}>Ready to start: {selectedExercise}</Text>
        <Button
          title={`Start ${selectedExercise} Tracking`}
          onPress={handleStartStop}
          disabled={isLoading}
        />
        <Button title="운동 다시 선택" onPress={resetSelection} />
      </View>
    );
  };

  if (hasPermission === null) return <Text>📷 카메라 권한 요청 중...</Text>;
  if (hasPermission === false) return <Text>🚫 카메라 접근 권한이 없습니다.</Text>;

  return (
    <View style={styles.container}>
      {isFocused && hasPermission && isCameraReady ? (
        <CameraView
          ref={cameraRef}
          style={styles.camera}
          facing="back"
          onCameraReady={onCameraReady}
        />
      ) : (
        <View style={styles.camera}><Text>카메라 준비 중...</Text></View>
      )}

      <View style={styles.controls}>
        {renderSelectionControls()}

        {isLoading && <ActivityIndicator size="small" color="#555" style={{ marginTop: 10 }} />}

        {isRunning && score !== null && (
          <Text style={[styles.result, { color: score >= 80 ? 'green' : 'red' }]}>
            🏅 Score: {score}점
          </Text>
        )}

        {isRunning && feedback && <Text style={styles.feedback}>💬 {feedback}</Text>}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  camera: { flex: 4 },
  controls: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f0f0f0',
  },
  selectionContainer: {
    width: '100%',
    alignItems: 'center',
  },
  selectionText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  buttonGroup: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginBottom: 15,
  },
  result: {
    marginTop: 12,
    fontSize: 18,
    fontWeight: 'bold',
  },
  feedback: {
    marginTop: 6,
    fontSize: 16,
    color: '#333',
    textAlign: 'center',
    paddingHorizontal: 10,
  },
});
