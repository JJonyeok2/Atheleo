import * as ImagePicker from 'expo-image-picker';
import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Button, Image, ScrollView, StyleSheet, Text, View, Platform } from 'react-native';

export default function BodyAnalysisAI() {
  const [frontImageUri, setFrontImageUri] = useState(null);
  const [sideImageUri, setSideImageUri] = useState(null);
  const [frontBase64, setFrontBase64] = useState(null);
  const [sideBase64, setSideBase64] = useState(null);
  const [hasGalleryPermission, setHasGalleryPermission] = useState(null);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const frontInputRef = useRef(null); // Ref for hidden front file input
  const sideInputRef = useRef(null); // Ref for hidden side file input

  useEffect(() => {
    // On web, permissions are typically handled by the browser's file input itself.
    // We can assume permission is granted or handle the file input directly.
    setHasGalleryPermission(true);
  }, []);

  const pickImage = async (type) => {
    console.log('pickImage called for type:', type);

    if (Platform.OS === 'web') {
      if (type === 'front') {
        frontInputRef.current.click();
      } else if (type === 'side') {
        sideInputRef.current.click();
      }
    } else {
      let result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaType.Images,
        allowsEditing: true,
        aspect: [3, 4], // Adjust aspect ratio as needed for full body
        quality: 0.7,
        base64: true,
      });
      console.log('ImagePicker result:', result);

      if (!result.canceled) {
        if (type === 'front') {
          setFrontImageUri(result.assets[0].uri);
          setFrontBase64(result.assets[0].base64);
        } else if (type === 'side') {
          setSideImageUri(result.assets[0].uri);
          setSideBase64(result.assets[0].base64);
        }
      }
    }
  };

  const handleFileChange = (event, type) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result.split(',')[1]; // Remove data:image/jpeg;base64,
      const uri = reader.result; // Full data URI for preview

      if (type === 'front') {
        setFrontImageUri(uri);
        setFrontBase64(base64String);
      } else if (type === 'side') {
        setSideImageUri(uri);
        setSideBase64(base64String);
      }
    };
    reader.readAsDataURL(file);
  };

  const analyzeImages = async () => {
    if (!frontBase64 && !sideBase64) {
      Alert.alert('이미지 없음', '분석을 위해 정면 또는 측면 이미지를 최소 하나 이상 선택해주세요.');
      return;
    }

    setLoading(true);
    setAnalysisResult(null); // Clear previous results

    try {
      const response = await fetch('http://172.30.1.6:8000/exercise/body-analysis/', { // Updated URL
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          front_image: frontBase64,
          side_image: sideBase64,
        }),
      });

      const result = await response.json();
      console.log('AI 분석 결과:', result);
      setAnalysisResult(result);
    } catch (error) {
      console.error('서버 전송 실패:', error);
      Alert.alert('오류', '이미지 분석 중 오류가 발생했습니다. 서버 상태를 확인해주세요.');
    } finally {
      setLoading(false);
    }
  };

  if (hasGalleryPermission === null) {
    return <View style={styles.centered}><Text>권한 요청 중...</Text></View>;
  }
  if (hasGalleryPermission === false) {
    return <View style={styles.centered}><Text>갤러리 권한이 없습니다.</Text></View>;
  }

  const renderAnalysisResult = () => {
    if (!analysisResult) {
      return null;
    }

    return (
      <View style={styles.resultsContainer}>
        <Text style={styles.resultsTitle}>분석 결과:</Text>
        {analysisResult.analysis && <Text style={styles.resultText}>{analysisResult.analysis}</Text>}

        {analysisResult.front_view_analysis && (
          <View style={styles.sectionResult}>
            <Text style={styles.subTitle}>정면 분석:</Text>
            {Object.entries(analysisResult.front_view_analysis).map(([key, value]) => (
              <Text key={key} style={styles.resultText}>
                {key.replace(/_/g, ' ')}: {typeof value === 'object' ? JSON.stringify(value) : value}
              </Text>
            ))}
          </View>
        )}

        {analysisResult.side_view_analysis && (
          <View style={styles.sectionResult}>
            <Text style={styles.subTitle}>측면 분석:</Text>
            {Object.entries(analysisResult.side_view_analysis).map(([key, value]) => (
              <Text key={key} style={styles.resultText}>
                {key.replace(/_/g, ' ')}: {typeof value === 'object' ? JSON.stringify(value) : value}
              </Text>
            ))}
          </View>
        )}
      </View>
    );
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>체형 분석 AI</Text>

      {/* Front View Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>정면 이미지</Text>
        <View style={styles.buttonContainer}>
          <Button title="갤러리에서 선택 (정면)" onPress={() => pickImage('front')} />
          {/* Hidden file input for web */}
          <input
            type="file"
            ref={frontInputRef}
            onChange={(e) => handleFileChange(e, 'front')}
            style={{ display: 'none' }}
            accept="image/*"
          />
        </View>
        {frontImageUri && <Image source={{ uri: frontImageUri }} style={styles.preview} />}
      </View>

      {/* Side View Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>측면 이미지</Text>
        <View style={styles.buttonContainer}>
          <Button title="갤러리에서 선택 (측면)" onPress={() => pickImage('side')} />
          {/* Hidden file input for web */}
          <input
            type="file"
            ref={sideInputRef}
            onChange={(e) => handleFileChange(e, 'side')}
            style={{ display: 'none' }}
            accept="image/*"
          />
        </View>
        {sideImageUri && <Image source={{ uri: sideImageUri }} style={styles.preview} />}
      </View>

      <Button
        title={loading ? "분석 중..." : "체형 분석 시작"}
        onPress={analyzeImages}
        disabled={loading || (!frontBase64 && !sideBase64)}
        color="#841584"
      />

      {loading && <ActivityIndicator size="large" color="#0000ff" style={styles.loadingIndicator} />}

      {renderAnalysisResult()}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 20,
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#333',
  },
  section: {
    width: '100%',
    marginBottom: 20,
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 15,
    boxShadow: '0px 2px 4px rgba(0,0,0,0.1)',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 10,
    color: '#555',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 15,
  },
  preview: {
    width: '100%',
    height: 300,
    resizeMode: 'contain',
    marginTop: 10,
    borderRadius: 8,
    backgroundColor: '#eee',
  },
  loadingIndicator: {
    marginTop: 20,
  },
  resultsContainer: {
    width: '100%',
    marginTop: 30,
    backgroundColor: '#e0ffe0',
    borderRadius: 10,
    padding: 15,
    boxShadow: '0px 2px 4px rgba(0,0,0,0.1)',
    borderWidth: 1,
    borderColor: '#aaffaa',
  },
  resultsTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#228B22',
  },
  subTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 10,
    marginBottom: 5,
    color: '#444',
  },
  resultText: {
    fontSize: 14,
    marginBottom: 5,
    color: '#333',
  },
  sideAnalysis: {
    marginTop: 15,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#ccffcc',
  },
  sectionResult: { // 결과 섹션을 위한 새로운 스타일
    marginBottom: 15,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
});