import { Camera } from 'expo-camera';
import React, { useEffect, useRef, useState } from 'react';
import { Button, Image, StyleSheet, Text, View } from 'react-native';

export default function BodyAnalysisAI() {
  const cameraRef = useRef(null);
  const [imageUri, setImageUri] = useState(null);
  const [hasPermission, setHasPermission] = useState(null);

  useEffect(() => {
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');
    })();
  }, []);

  const takePicture = async () => {
    if (cameraRef.current) {
      const photo = await cameraRef.current.takePictureAsync({ base64: true });
      setImageUri(photo.uri);
      sendToServer(photo.base64);
    }
  };

  const sendToServer = async (base64Image) => {
    try {
      const response = await fetch('http://172.30.1.6.8000/screens/BodyanalysisAI', {  // 여기 IP 바꿔야함
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ image: base64Image }),
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
      <Camera ref={cameraRef} style={styles.camera} />
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
