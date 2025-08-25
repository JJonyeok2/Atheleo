// BodyAnalysisAI.native.js
import { Camera } from 'expo-camera';
import { useEffect, useRef, useState } from 'react';
import { Button, Image, StyleSheet, Text, View, InteractionManager } from 'react-native';
import { useIsFocused } from '@react-navigation/native';
import Constants from 'expo-constants';

// 테스트용 더미 Base64 이미지 (1x1 픽셀 검은색 이미지)
// 실제 카메라가 작동하지 않을 때 AI 분석 로직 테스트용으로 사용됩니다.
// 실제 카메라 사용 시에는 이 부분을 제거하거나 주석 처리하세요.
const TEST_IMAGE_BASE64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';

const backendUrl = Constants.expoConfig.extra.backendUrl;

export default function BodyAnalysisAI() {
  console.log('BodyAnalysisAI component rendered'); // Added log
  const cameraRef = useRef(null);
  const [imageUri, setImageUri] = useState(null);
  const [hasPermission, setHasPermission] = useState(null);
  const [isCameraReady, setIsCameraReady] = useState(false);
  const isFocused = useIsFocused();

  useEffect(() => {
    console.log('useEffect for camera permission triggered. isFocused:', isFocused); // Added log
    if (isFocused) {
      InteractionManager.runAfterInteractions(async () => {
        const { status } = await Camera.requestCameraPermissionsAsync();
        setHasPermission(status === 'granted');
        console.log('Camera permission status:', status); // Added log
      });
    }
  }, [isFocused]);

  const onCameraReady = () => {
    setIsCameraReady(true);
    console.log('onCameraReady fired!'); // Added log
  };

  const takePicture = async () => {
    console.log('takePicture function called!'); // Added log
    // if (cameraRef.current) { // AVD 카메라 문제 해결을 위해 cameraRef.current 체크를 제거
      // 실제 카메라 대신 더미 이미지 사용 (AVD 카메라 문제 해결용)
      // const photo = await cameraRef.current.takePictureAsync({ base64: true });
      const photo = { base64: TEST_IMAGE_BASE64, uri: 'data:image/jpeg;base64,' + TEST_IMAGE_BASE64 }; // 더미 이미지 할당
      setImageUri(photo.uri);
      console.log('Mock photo assigned. Sending to server...'); // Added log
      sendToServer(photo.base64);
    // }
  };

  const sendToServer = async (base64Image) => {
    try {
      const response = await fetch(`${backendUrl}/api/body-analysis/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ front_image: base64Image }),
      });

      const result = await response.json();
      console.log('AI 분석 결과:', result);
      // 결과에 따른 추가 작업 여기에 작성
    } catch (error) {
      console.error('서버 전송 실패:', error);
    }
  };

  if (hasPermission === null) {
    return <View><Text>카메라 권한 요청 중...</Text></View>;
  }
  if (hasPermission === false) {
    return <View><Text>카메라 권한이 없습니다.</Text></View>;
  }

  return (
    <View style={styles.container}>
      {isFocused && hasPermission && isCameraReady ? (
        <Camera ref={cameraRef} style={styles.camera} onCameraReady={onCameraReady} facing="front" />
      ) : (
        <View style={styles.camera}><Text>카메라 준비 중...</Text></View>
      )}
      <Button title="사진 촬영" onPress={takePicture} />
      {imageUri && <Image source={{ uri: imageUri }} style={styles.preview} />}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  camera: { flex: 4 },
  preview: { flex: 2, width: '100%' },
});
