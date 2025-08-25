// BodyAnalysisAI.native.js
import { Camera } from 'expo-camera';
import { useEffect, useRef, useState } from 'react';
import { Button, Image, StyleSheet, Text, View, InteractionManager } from 'react-native';
import { useIsFocused } from '@react-navigation/native';
import Constants from 'expo-constants';

const backendUrl = Constants.expoConfig.extra.backendUrl;

export default function BodyAnalysisAI() {
  const cameraRef = useRef(null);
  const [imageUri, setImageUri] = useState(null);
  const [hasPermission, setHasPermission] = useState(null);
  const [isCameraReady, setIsCameraReady] = useState(false);
  const isFocused = useIsFocused();

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

  const takePicture = async () => {
    if (cameraRef.current) {
      const photo = await cameraRef.current.takePictureAsync({ base64: true });
      setImageUri(photo.uri);
      sendToServer(photo.base64);
    }
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
