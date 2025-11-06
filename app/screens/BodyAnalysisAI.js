// app/screens/BodyAnalysisAI.js
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Button,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { launchCamera, launchImageLibrary } from 'react-native-image-picker';
import AnalysisVisualization from '../../components/AnalysisVisualization';
import { BASE_API_URL } from '../config';
import { useAuth } from './Authcontext';
import axios from 'axios';

const BODY_ANALYSIS_API_URL = BASE_API_URL + 'body-analysis/';

export default function BodyAnalysisAI() {
  const { user } = useAuth();
  const [imageUri, setImageUri] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [imageLayout, setImageLayout] = useState(null);

  const handleImageSelection = (response) => {
    if (response.didCancel) {
      console.log('User cancelled image picker');
    } else if (response.errorCode) {
      console.log('ImagePicker Error: ', response.errorMessage);
    } else if (response.assets && response.assets.length > 0) {
      const asset = response.assets[0];
      const uri = asset.uri;
      setImageUri(uri);
      setAnalysis(null); // 새 이미지 선택 시 이전 분석 결과 초기화
      setError(null);
      // fileName과 type 정보도 함께 전달
      analyzeImage(uri, asset.fileName, asset.type);
    }
  };

  const pickImage = () => {
    launchImageLibrary({ mediaType: 'photo', quality: 0.8 }, handleImageSelection);
  };

  const takePicture = () => {
    launchCamera({ mediaType: 'photo', quality: 0.8, saveToPhotos: true }, handleImageSelection);
  };

  const analyzeImage = async (uri, providedFileName, providedType) => {
    if (!user?.token) {
      Alert.alert('오류', '로그인이 필요합니다.');
      return;
    }

    setIsLoading(true);
    setError(null);
    
    // filename 결정
    let filename = 'photo.jpg';
    if (providedFileName) {
      filename = providedFileName;
    } else if (uri) {
      const uriParts = uri.split('/');
      const lastPart = uriParts[uriParts.length - 1];
      const extensionMatch = /\.(jpg|jpeg|png|heic|heif)$/i.exec(lastPart);
      if (extensionMatch) {
        const ext = extensionMatch[1].toLowerCase();
        filename = `photo_${Date.now()}.${ext === 'heic' || ext === 'heif' ? 'jpg' : ext}`;
      } else {
        filename = `photo_${Date.now()}.jpg`;
      }
    }
    
    // 파일 타입 결정 (MIME 타입 정규화)
    let fileType = 'image/jpeg';
    if (providedType) {
      // providedType이 'image/jpg'인 경우 'image/jpeg'로 정규화
      fileType = providedType === 'image/jpg' ? 'image/jpeg' : providedType;
    } else {
      const extMatch = /\.(jpg|jpeg|png)$/i.exec(filename);
      if (extMatch) {
        const ext = extMatch[1].toLowerCase();
        fileType = ext === 'png' ? 'image/png' : 'image/jpeg'; // jpg도 jpeg로
      }
    }
    
    console.log(`[BodyAnalysis] Uploading file: ${filename}, type: ${fileType}`);

    try {
      // FormData 사용 (백엔드 FileUploadParser 요구사항)
      const formData = new FormData();
      
      // iOS/Android 모두 지원하는 파일 객체 형식
      // name 속성이 Content-Disposition 헤더에 포함되도록 명시
      formData.append('file', {
        uri: uri,
        name: filename, // 필수: Content-Disposition 헤더에 포함됨
        type: fileType,
      });

      const response = await axios.post(BODY_ANALYSIS_API_URL, formData, {
        headers: {
          // Content-Type을 명시하지 않음: axios가 자동으로 boundary 설정
          'Authorization': `Token ${user.token}`,
        },
        timeout: 30000,
        // axios의 transformRequest를 사용하여 FormData를 명시적으로 처리
        transformRequest: (data, headers) => {
          // FormData인 경우 Content-Type을 설정하지 않음
          if (data instanceof FormData) {
            delete headers['Content-Type'];
          }
          return data;
        },
      });

      setAnalysis(response.data);
      setError(null);
    } catch (e) {
      let errorMsg = '알 수 없는 오류가 발생했습니다.';
      
      if (e.response) {
        const errorData = e.response.data;
        errorMsg = errorData?.error || errorData?.detail || errorData?.message || `HTTP ${e.response.status}`;
      } else if (e.request) {
        errorMsg = '서버에 연결할 수 없습니다.';
      } else {
        errorMsg = e.message || errorMsg;
      }
      
      setError(errorMsg);
      console.error('[BodyAnalysis] API Error:', e.response?.data || e.message);
      Alert.alert('오류', errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>AI 체형 분석</Text>
      <Text style={styles.instructions}>
        정면을 보고 촬영한 전신 사진을 업로드해주세요.
      </Text>

      <View style={styles.buttonContainer}>
        <Button title="라이브러리에서 선택" onPress={pickImage} />
        <Button title="카메라로 촬영" onPress={takePicture} />
      </View>

      {imageUri && (
        <View style={styles.imageContainer}>
          {analysis && analysis.landmarks && Array.isArray(analysis.landmarks) && imageLayout ? (
            <AnalysisVisualization
              imageUri={imageUri}
              landmarks={analysis.landmarks}
              imageLayout={imageLayout}
            />
          ) : (
            <Image
              source={{ uri: imageUri }}
              style={styles.preview}
              onLayout={(event) => {
                const { width, height } = event.nativeEvent.layout;
                setImageLayout({ width, height });
              }}
            />
          )}
        </View>
      )}

      {isLoading && (
        <ActivityIndicator size="large" color="#0000ff" style={styles.loader} />
      )}

      {error && !isLoading && <Text style={styles.errorText}>오류: {error}</Text>}

      {analysis && !isLoading && (
        <View style={styles.resultContainer}>
          <Text style={styles.resultTitle}>분석 결과</Text>
          <Text style={styles.shapeText}>
            당신의 체형은{' '}
            <Text style={styles.shapeResult}>{analysis.body_shape}</Text> 입니다.
          </Text>
          {analysis.description && (
            <Text style={styles.descriptionText}>{analysis.description}</Text>
          )}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    alignItems: 'center',
    padding: 20
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  instructions: {
    fontSize: 16,
    color: 'gray',
    marginBottom: 20,
    textAlign: 'center',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginBottom: 20,
  },
  imageContainer: {
    width: 300,
    height: 400,
    marginBottom: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ccc',
  },
  preview: {
    width: '100%',
    height: '100%',
    resizeMode: 'contain',
  },
  loader: {
    marginVertical: 20,
  },
  errorText: {
    color: 'red',
    marginVertical: 20,
  },
  resultContainer: {
    width: '100%',
    padding: 10,
    backgroundColor: '#f0f0f0',
    borderRadius: 5,
    alignItems: 'center',
  },
  resultTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  shapeText: {
    fontSize: 18,
    textAlign: 'center',
    marginVertical: 10,
  },
  shapeResult: {
    fontWeight: 'bold',
    color: '#007bff',
  },
  descriptionText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginTop: 10,
    lineHeight: 20,
    paddingHorizontal: 10,
  },
});

