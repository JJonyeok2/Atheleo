import { Camera } from 'expo-camera';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function ExerciseWithAI() {
  const cameraRef = useRef(null);
  const [hasPermission, setHasPermission] = useState(null);
  const [score, setScore] = useState(null);
  const [feedback, setFeedback] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const [selectedPart, setSelectedPart] = useState(null);
  const [selectedSubPart, setSelectedSubPart] = useState(null);
  const [selectedExercise, setSelectedExercise] = useState(null);

  useEffect(() => {
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');
    })();
  }, []);

  useEffect(() => {
    let interval;
    if (isRunning && cameraRef.current) {
      const execute = () => {
        captureAndSend();
      };
      execute(); 
      interval = setInterval(execute, 2000); 
    }
    return () => clearInterval(interval);
  }, [isRunning]);

  const captureAndSend = async () => {
    if (!cameraRef.current || !selectedExercise) return;
    try {
      setIsLoading(true);
      const photo = await cameraRef.current.takePictureAsync({ base64: true });
      if (!photo?.base64) return;

      const res = await fetch('http://127.0.0.1:8000/api/exercise-score/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: photo.base64, exercise: selectedExercise }),
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
    setIsRunning(false);
  };

  const handleStartStop = () => {
    if (isRunning) resetSelection();
    else if (selectedExercise) setIsRunning(true);
  };

  const renderSelectionControls = () => {
    if (!isRunning) {
      return (
        <ScrollView style={styles.selectionContainer}>
          {!selectedPart && (
            <>
              <Text style={styles.selectionText}>1. 운동 부위를 선택하세요.</Text>
              <View style={styles.buttonGroup}>
                <TouchableOpacity style={styles.btn} onPress={() => setSelectedPart('upper')}><Text style={styles.btnText}>상체</Text></TouchableOpacity>
                <TouchableOpacity style={styles.btn} onPress={() => setSelectedPart('lower')}><Text style={styles.btnText}>하체</Text></TouchableOpacity>
              </View>
            </>
          )}
          {selectedPart && !selectedSubPart && (
            <>
              <Text style={styles.selectionText}>2. 세부 부위를 선택하세요.</Text>
              <View style={styles.buttonGroup}>
                {selectedPart === 'upper' && <>
                  <TouchableOpacity style={styles.btn} onPress={() => setSelectedSubPart('arm')}><Text style={styles.btnText}>팔</Text></TouchableOpacity>
                  <TouchableOpacity style={styles.btn} onPress={() => setSelectedSubPart('shoulder')}><Text style={styles.btnText}>어깨</Text></TouchableOpacity>
                  <TouchableOpacity style={styles.btn} onPress={() => setSelectedSubPart('chest')}><Text style={styles.btnText}>가슴</Text></TouchableOpacity>
                </>}
                {selectedPart === 'lower' && <>
                  <TouchableOpacity style={styles.btn} onPress={() => setSelectedSubPart('leg')}><Text style={styles.btnText}>다리</Text></TouchableOpacity>
                </>}
              </View>
              <TouchableOpacity style={styles.backBtn} onPress={() => setSelectedPart(null)}><Text style={styles.backBtnText}>뒤로</Text></TouchableOpacity>
            </>
          )}
          {selectedSubPart && !selectedExercise && (
            <>
              <Text style={styles.selectionText}>3. 운동을 선택하세요.</Text>
              <View style={styles.buttonGroup}>
                {selectedSubPart === 'arm' && <>
                  <TouchableOpacity style={styles.btn} onPress={() => setSelectedExercise('bicep_curl')}><Text style={styles.btnText}>이두 컬</Text></TouchableOpacity>
                  <TouchableOpacity style={styles.btn} onPress={() => setSelectedExercise('tricep_extension')}><Text style={styles.btnText}>삼두 익스텐션</Text></TouchableOpacity>
                </>}
                {selectedSubPart === 'leg' && <>
                  <TouchableOpacity style={styles.btn} onPress={() => setSelectedExercise('squat')}><Text style={styles.btnText}>스쿼트</Text></TouchableOpacity>
                </>}
              </View>
              <TouchableOpacity style={styles.backBtn} onPress={() => setSelectedSubPart(null)}><Text style={styles.backBtnText}>뒤로</Text></TouchableOpacity>
            </>
          )}
          {selectedExercise && (
            <>
              <TouchableOpacity style={styles.startBtn} onPress={handleStartStop}><Text style={styles.startBtnText}>운동 시작</Text></TouchableOpacity>
              <TouchableOpacity style={styles.backBtn} onPress={resetSelection}><Text style={styles.backBtnText}>선택 초기화</Text></TouchableOpacity>
            </>
          )}
        </ScrollView>
      );
    } else {
      return (
        <View style={styles.runningContainer}>
          <TouchableOpacity style={styles.stopBtn} onPress={handleStartStop}><Text style={styles.stopBtnText}>운동 종료</Text></TouchableOpacity>
          {score !== null && <Text style={[styles.score, { color: score >= 80 ? 'green' : 'red' }]}>🏅 {score}점</Text>}
          {feedback && <Text style={styles.feedback}>💬 {feedback}</Text>}
        </View>
      );
    }
  };

  if (hasPermission === null) return <Text>카메라 권한 확인 중...</Text>;
  if (hasPermission === false) return <Text>카메라 권한이 필요합니다.</Text>;

  return (
    <View style={styles.container}>
      <Camera ref={cameraRef} style={styles.camera} facing="front" ratio="16:9" />
      {isLoading && <ActivityIndicator size="large" color="#007bff" style={styles.loading} />}
      {renderSelectionControls()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0f0f0' },
  camera: { flex: 3, width: '100%' },
  loading: { position: 'absolute', top: '50%', left: '50%', marginLeft: -25, marginTop: -25 },
  selectionContainer: { flex: 2, padding: 15 },
  buttonGroup: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', marginVertical: 10 },
  btn: { backgroundColor: '#007bff', paddingVertical: 12, paddingHorizontal: 18, borderRadius: 8, margin: 6 },
  btnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  backBtn: { padding: 10, marginTop: 5, alignSelf: 'center' },
  backBtnText: { color: '#007bff', fontWeight: 'bold', fontSize: 16 },
  startBtn: { backgroundColor: 'green', padding: 15, borderRadius: 10, alignItems: 'center', marginVertical: 10 },
  startBtnText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  runningContainer: { flex: 2, alignItems: 'center', justifyContent: 'center', padding: 10 },
  stopBtn: { backgroundColor: 'red', padding: 15, borderRadius: 10, marginVertical: 10 },
  stopBtnText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  score: { fontSize: 22, fontWeight: 'bold', marginVertical: 10 },
  feedback: { fontSize: 18, textAlign: 'center', paddingHorizontal: 15 },
});
