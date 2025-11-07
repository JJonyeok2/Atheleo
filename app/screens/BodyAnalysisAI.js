// app/screens/BodyAnalysisAI.js
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
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

  const renderMetrics = () => {
    if (!analysis?.ratios) return null;
    const metrics = [
      { key: 'shoulder_to_hip', label: '어깨/골반', value: analysis.ratios.shoulder_to_hip },
      { key: 'waist_to_shoulder', label: '허리/어깨', value: analysis.ratios.waist_to_shoulder },
      { key: 'waist_to_hip', label: '허리/골반', value: analysis.ratios.waist_to_hip },
    ].filter((metric) => metric.value !== undefined && metric.value !== null);

    if (!metrics.length) return null;

    return (
      <View style={styles.metricsRow}>
        {metrics.map((metric) => (
          <View key={metric.key} style={styles.metricChip}>
            <Text style={styles.metricLabel}>{metric.label}</Text>
            <Text style={styles.metricValue}>{metric.value}</Text>
          </View>
        ))}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.page}>
      <StatusBar barStyle="light-content" />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.hero}>
          <Text style={styles.title}>AI 체형 분석</Text>
          <Text style={styles.subtitle}>정면 전신 사진을 업로드하면, 딥러닝 기술을 활용해서 체형을 진단해드려요.</Text>
        </View>

        <View style={styles.buttonRow}>
          <TouchableOpacity style={styles.actionButton} activeOpacity={0.88} onPress={pickImage}>
            <Text style={styles.actionButtonText}>앨범에서 선택</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton} activeOpacity={0.88} onPress={takePicture}>
            <Text style={styles.actionButtonText}>카메라 촬영</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.previewCard}>
          {imageUri ? (
            <>
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
            </>
          ) : (
            <View style={styles.previewPlaceholder}>
              <Text style={styles.previewPlaceholderTitle}>이미지를 선택해주세요</Text>
              <Text style={styles.previewPlaceholderText}>
                어두운 배경, 밝은 조명에서 전신이 나오면 정확도가 높아요.
              </Text>
            </View>
          )}
        </View>

        {isLoading && (
          <View style={styles.loaderCard}>
            <ActivityIndicator size="large" color="#7ab8ff" />
            <Text style={styles.loaderText}>AI가 체형을 분석 중입니다...</Text>
          </View>
        )}

        {error && !isLoading && (
          <View style={styles.errorCard}>
            <Text style={styles.errorTitle}>분석에 실패했어요</Text>
            <Text style={styles.errorMessage}>{error}</Text>
          </View>
        )}

        {analysis && !isLoading && (
          <View style={styles.resultCard}>
            <Text style={styles.resultBadge}>RESULT</Text>
            <Text style={styles.resultTitle}>당신의 체형은</Text>
            <Text style={styles.resultShape}>{analysis.body_shape}</Text>

            {renderMetrics()}

            {analysis.description && (
              <View style={styles.descriptionBox}>
                <Text style={styles.descriptionText}>{analysis.description}</Text>
              </View>
            )}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: '#030614',
  },
  scrollContent: {
    paddingBottom: 40,
  },
  hero: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 18,
    alignItems: 'center',
  },
  title: {
    fontSize: 30,
    fontWeight: '800',
    color: '#F2F7FF',
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: '#C7D5F8',
    textAlign: 'center',
    lineHeight: 22,
    maxWidth: 320,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    paddingHorizontal: 24,
    marginTop: 12,
    marginBottom: 24,
  },
  actionButton: {
    flex: 1,
    minWidth: 140,
    paddingVertical: 14,
    borderRadius: 18,
    backgroundColor: 'rgba(17, 42, 92, 0.6)',
    borderWidth: 1,
    borderColor: 'rgba(115, 189, 255, 0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0A84FF',
    shadowOpacity: 0.2,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },
  actionButtonText: {
    color: '#E9F2FF',
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.6,
  },
  previewCard: {
    marginHorizontal: 24,
    borderRadius: 26,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(142, 189, 255, 0.25)',
    backgroundColor: 'rgba(8, 18, 40, 0.65)',
    minHeight: 360,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0A1F4D',
    shadowOpacity: 0.35,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: 14 },
    elevation: 8,
    padding: 12,
  },
  preview: {
    width: '100%',
    height: '100%',
    resizeMode: 'contain',
  },
  previewPlaceholder: {
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  previewPlaceholderTitle: {
    color: '#E0EAFF',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
  },
  previewPlaceholderText: {
    color: '#A9B9D6',
    fontSize: 14,
    lineHeight: 22,
    textAlign: 'center',
  },
  loaderCard: {
    marginTop: 28,
    marginHorizontal: 24,
    borderRadius: 22,
    paddingVertical: 32,
    alignItems: 'center',
    backgroundColor: 'rgba(12, 25, 52, 0.6)',
    borderWidth: 1,
    borderColor: 'rgba(132, 178, 255, 0.25)',
    shadowColor: '#102A5C',
    shadowOpacity: 0.28,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 12 },
  },
  loaderText: {
    marginTop: 16,
    color: '#D4E2FF',
    fontSize: 15,
    letterSpacing: 0.3,
  },
  errorCard: {
    marginTop: 24,
    marginHorizontal: 24,
    borderRadius: 20,
    padding: 20,
    backgroundColor: 'rgba(255, 74, 88, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255, 108, 125, 0.45)',
  },
  errorTitle: {
    color: '#FFD6DB',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 8,
  },
  errorMessage: {
    color: '#FFC4CC',
    fontSize: 14,
    lineHeight: 21,
  },
  resultCard: {
    marginTop: 28,
    marginHorizontal: 24,
    borderRadius: 26,
    paddingVertical: 28,
    paddingHorizontal: 20,
    alignItems: 'center',
    backgroundColor: 'rgba(10, 26, 54, 0.62)',
    borderWidth: 1,
    borderColor: 'rgba(110, 184, 255, 0.35)',
    shadowColor: '#0A2048',
    shadowOpacity: 0.28,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 16 },
  },
  resultBadge: {
    fontSize: 13,
    letterSpacing: 2,
    color: '#8AB8FF',
    marginBottom: 10,
  },
  resultTitle: {
    color: '#D9E4FF',
    fontSize: 18,
    fontWeight: '600',
  },
  resultShape: {
    marginTop: 10,
    fontSize: 32,
    fontWeight: '800',
    color: '#FFFFFF',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
  },
  metricsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 12,
    marginTop: 18,
  },
  metricChip: {
    minWidth: 100,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 18,
    backgroundColor: 'rgba(19, 46, 100, 0.75)',
    borderWidth: 1,
    borderColor: 'rgba(150, 196, 255, 0.35)',
  },
  metricLabel: {
    color: '#B6CCF5',
    fontSize: 13,
    marginBottom: 2,
  },
  metricValue: {
    color: '#F1F6FF',
    fontSize: 16,
    fontWeight: '700',
  },
  descriptionBox: {
    marginTop: 22,
    padding: 18,
    borderRadius: 18,
    backgroundColor: 'rgba(230, 241, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(170, 206, 255, 0.28)',
  },
  descriptionText: {
    fontSize: 14,
    lineHeight: 22,
    color: '#D5E3FF',
    textAlign: 'center',
  },
});

