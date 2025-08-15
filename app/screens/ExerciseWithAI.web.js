import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Button, StyleSheet, Text, View } from 'react-native';
import Webcam from 'react-webcam';

export default function ExerciseWithAI() {
  const webcamRef = useRef(null);
  const [score, setScore] = useState(null);
  const [feedback, setFeedback] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // State for exercise selection
  const [selectedPart, setSelectedPart] = useState(null);
  const [selectedSubPart, setSelectedSubPart] = useState(null);
  const [selectedExercise, setSelectedExercise] = useState(null);

  useEffect(() => {
    let interval;
    if (isRunning && webcamRef.current) {
      const execute = () => {
        if (webcamRef.current) captureAndSend();
      };
      execute(); // Run immediately
      interval = setInterval(execute, 2000); // Then every 2 seconds
    }
    return () => clearInterval(interval);
  }, [isRunning]);

  const captureAndSend = async () => {
    if (!webcamRef.current || !selectedExercise) return;
    try {
      // For web, we don't want to show the loading indicator for every single frame
      // It makes the UI flicker. We'll only set it if it's not already running.
      if (!isRunning) setIsLoading(true);

      const imageSrc = webcamRef.current.getScreenshot();
      if (!imageSrc) return;

      const res = await fetch('http://127.0.0.1:8000/api/exercise-score/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image: imageSrc.split(',')[1], // remove data:image/jpeg;base64,
          exercise: selectedExercise,
        }),
      });

      const result = await res.json();
      setScore(result.score);
      setFeedback(result.feedback);
    } catch (err) {
      console.error('🚨 웹 전송 실패:', err);
    } finally {
      if (!isRunning) setIsLoading(false);
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

  return (
    <View style={styles.container}>
      <Webcam
        audio={false}
        ref={webcamRef}
        screenshotFormat="image/jpeg"
        style={styles.camera}
        videoConstraints={{ facingMode: 'user' }}
        videoStyle={{ objectFit: 'contain' }}
      />
      <View style={styles.controls}>
        {renderSelectionControls()}

        {/* For web, we might not want to show a flickering indicator on every frame check */}
        {isLoading && !isRunning && <ActivityIndicator size="large" color="#0000ff" />}

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
  container: { flex: 1, height: '100%' },
  camera: { flex: 4, aspectRatio: 9 / 16, minHeight: 300 }, // 반응형으로 만들기 위해 flex 값 사용
  controls: {
    flex: 1,
    minHeight: 100,
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