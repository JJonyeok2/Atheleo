import { useNavigation } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import React, { useLayoutEffect, useRef, useState } from 'react';
import { Button, Dimensions, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export const meta = {
  title: 'Atheleo',
};

export default function HomeScreen() {
  const scrollRef = useRef();
  const router = useRouter();
  const navigation = useNavigation();
  const [showScrollTop, setShowScrollTop] = useState(false);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerTitle: 'Atheleo',
      headerRight: () => (
        <View style={styles.headerButtons}>
          <Button title="로그인" onPress={() => router.push('./screens/Login')} />
          <Button title="회원가입" onPress={() => router.push('./screens/Signup')} />
          <Button title="구독하기" onPress={() => router.push('./screens/Subscribe')} />
          <Button title="체형 분석" onPress={() => router.push('./screens/BodyAnalysisAI')} />
        </View>
      ),
    });
  }, [navigation]);

  const handleScroll = (event) => {
    const y = event.nativeEvent.contentOffset.y;
    setShowScrollTop(y > 200);
  };

  const scrollToTop = () => {
    scrollRef.current.scrollTo({ y: 0, animated: true });
  };

  const handleNavigate = () => {
    router.push('/Subscribe');
  };

  return (
    <View style={styles.container}>
      <ScrollView 
        ref={scrollRef} 
        onScroll={handleScroll} 
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
      >
        {/* 첫 번째 섹션 */}
        <View style={styles.section}>
          <Image 
            source={require('../assets/45614.jpg')} 
            style={styles.backgroundImage}
            resizeMode="cover"
          />
          <View style={styles.overlay}>
            <Text style={styles.header}>AI 피트니스 어시스턴트 Atheleo</Text>
            <Text style={styles.text}>체형 분석 및 운동 보조 시스템</Text>
            <Text style={styles.text}>* 월 결제 19900원(옵션 별로 상이)</Text>
            <TouchableOpacity onPress={handleNavigate} style={styles.button} activeOpacity={0.7}>
              <Text style={styles.buttonText}>AI 구독하기</Text>
            </TouchableOpacity>

            {/* 체형 분석 페이지 이동 버튼 추가 */}
            <TouchableOpacity 
              onPress={() => router.push('./screens/BodyAnalysisAI')} 
              style={[styles.button, { backgroundColor: '#28a745', marginTop: 12 }]} 
              activeOpacity={0.7}
            >
              <Text style={styles.buttonText}>체형 분석 시작하기</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.divider} />

        {/* 연혁 섹션 */}
        <View style={styles.section}>
          <Image 
            source={require('../assets/45615.jpg')} 
            style={styles.backgroundImage}
            resizeMode="cover"
          />
          <View style={styles.overlay}>
            <Text style={styles.subHeader}>연혁</Text>
            <Text style={styles.text}>Atheleo 팀 2025년 3월 10일 구성</Text>
            <Text style={styles.text}>2025년 3월 17일 | 전체 홈페이지 기획</Text>
            <Text style={styles.text}>2025년 3월 24일 | 1차 발표</Text>
          </View>
        </View>

        <View style={styles.divider} />

        {/* About Us 섹션 */}
        <View style={styles.section}>
          <Image 
            source={require('../assets/45616.jpg')} 
            style={styles.backgroundImage}
            resizeMode="cover"
          />
          <View style={styles.overlay}>
            <Text style={styles.subHeader}>About Us</Text>
            <Text style={styles.text}>팀장 | 전종혁 - ReactNative(JS), AWS서버(EC2)</Text>
            <Text style={styles.text}>부팀장 | 김한수 - AI 개발</Text>
          </View>
        </View>

        <View style={styles.divider} />

        {/* Atheleo AI 섹션 */}
        <View style={styles.section}>
          <Image 
            source={require('../assets/45617.jpg')} 
            style={styles.backgroundImage}
            resizeMode="cover"
          />
          <View style={styles.overlay}>
            <Text style={styles.subHeader}>Atheleo AI</Text>
            <Text style={styles.text}>체형 분석 + 운동 추천 시스템</Text>
            <Text style={styles.text}>자신과 유사한 체형의 운동 루틴 제공</Text>
            <Text style={styles.text}>부위별 난이도 조정 + 자세 교정 피드백</Text>
          </View>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>

      {showScrollTop && (
        <TouchableOpacity style={styles.scrollTopButton} onPress={scrollToTop} activeOpacity={0.7}>
          <Text style={styles.scrollTopText}>맨 위로</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  section: {
    width: width,
    aspectRatio: 16 / 9,
    position: 'relative',
    overflow: 'hidden',
  },
  backgroundImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: width,
    aspectRatio: 16 / 9,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  header: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
    marginBottom: 10,
  },
  subHeader: {
    fontSize: 22,
    fontWeight: '600',
    color: 'white',
    textAlign: 'center',
    marginBottom: 10,
  },
  text: {
    fontSize: 16,
    color: 'white',
    textAlign: 'center',
    marginVertical: 4,
  },
  button: {
    marginTop: 20,
    backgroundColor: '#1E90FF',
    paddingVertical: 14,
    paddingHorizontal: 30,
    borderRadius: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
  divider: {
    height: 10,
    backgroundColor: '#fff',
  },
  scrollTopButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    backgroundColor: '#444',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 5,
  },
  scrollTopText: {
    color: 'white',
    fontSize: 14,
  },
  headerButtons: {
    flexDirection: 'row',
    gap: 5,
    marginRight: 10,
  },
});
