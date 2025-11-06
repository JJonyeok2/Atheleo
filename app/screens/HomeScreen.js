// app/screens/HomeScreen.js
import { useNavigation } from '@react-navigation/native';
import React, { useRef, useState } from 'react';
import {
  Alert,
  Image,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
  ScrollView,
} from 'react-native';
import { useAuth } from './Authcontext';

const SECTIONS_DATA = [
  {
    key: 'hero',
    header: 'AI 피트니스 어시스턴트 Atheleo',
    texts: ['체형 분석 및 운동 보조 시스템', '* 월 결제 19,900원 (옵션 별 상이)'],
    image: require('../../assets/45614.jpg'),
  },
  {
    key: 'history',
    subHeader: '연혁',
    texts: [
      'Atheleo 팀 2025년 3월 10일 구성',
      '2025년 3월 17일 | 전체 홈페이지 기획',
      '2025년 3월 24일 | 1차 발표',
    ],
    image: require('../../assets/45615.jpg'),
  },
  {
    key: 'about',
    subHeader: 'About Us',
    texts: ['팀장 | 전종혁 - React Native(JS), AWS(EC2)', '부팀장 | 김진수 - AI 개발'],
    image: require('../../assets/45616.jpg'),
  },
  {
    key: 'ai',
    subHeader: 'Atheleo AI',
    texts: [
      '체형 분석 + 운동 추천 시스템',
      '유사 체형 루틴 제공',
      '부위별 데이터 조정 + 자세 교정 피드백',
    ],
    image: require('../../assets/45617.jpg'),
  },
];

export default function HomeScreen() {
  const { height } = useWindowDimensions();
  const scrollRef = useRef(null);
  const [showScrollTop, setShowScrollTop] = useState(false);

  const onScroll = (e) => {
    const y = e.nativeEvent.contentOffset.y;
    setShowScrollTop(y > height / 2);
  };

  const scrollToTop = () => scrollRef.current?.scrollTo({ y: 0, animated: true });

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" />
      <ScrollView
        ref={scrollRef}
        style={styles.container}
        contentContainerStyle={styles.content}
        onScroll={onScroll}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
      >
        {SECTIONS_DATA.map((item) => (
          <Section key={item.key} item={item} />
        ))}
      </ScrollView>

      {showScrollTop && (
        <TouchableOpacity style={styles.scrollTopBtn} onPress={scrollToTop} activeOpacity={0.85}>
          <Text style={styles.scrollTopTxt}>맨 위로</Text>
        </TouchableOpacity>
      )}
    </SafeAreaView>
  );
}

function Section({ item }) {
  const navigation = useNavigation();
  const { user } = useAuth();
  const { height } = useWindowDimensions();

  const handleAIExercisePress = () => {
    if (user) {
      if (user.subscription_type === 'STANDARD' || user.subscription_type === 'PRO') {
        navigation.navigate('ExerciseWithAI');
      } else {
        Alert.alert(
          '구독 필요',
          'AI 운동 기능은 STANDARD 등급 이상 구독자만 이용할 수 있습니다. 구독하시겠습니까?',
          [
            { text: '구독 화면으로 이동', onPress: () => navigation.navigate('Subscribe') },
            { text: '취소', style: 'cancel' },
          ],
          { cancelable: true }
        );
      }
    } else {
      Alert.alert(
        '로그인 필요',
        'AI 운동 기능을 사용하려면 로그인이 필요합니다.',
        [
          { text: '로그인 화면으로 이동', onPress: () => navigation.navigate('Login') },
          { text: '취소', style: 'cancel' },
        ],
        { cancelable: true }
      );
    }
  };

  const isHero = item.key === 'hero';
  // 화면 크기에 따라 유연하게: 히어로는 좀 더 큼
  const minH = isHero ? Math.max(height * 0.9, 560) : Math.max(height * 0.6, 420);

  return (
    <View style={[styles.section, { minHeight: minH }]}>
      <Image source={item.image} style={styles.bg} resizeMode="cover" />
      <View style={styles.overlay}>
        {item.header && <Text style={styles.header}>{item.header}</Text>}
        {item.subHeader && <Text style={styles.subHeader}>{item.subHeader}</Text>}

        {item.texts?.map((t, i) => (
          <Text key={i} style={styles.body}>
            {t}
          </Text>
        ))}

        {isHero && (
          <View style={styles.actionsWrap}>
            <TouchableOpacity
              onPress={() => navigation.navigate('Subscribe')}
              style={[styles.btn, styles.btnPrimary]}
              activeOpacity={0.9}
            >
              <Text style={styles.btnTxt}>AI 구독하기</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => navigation.navigate('BodyAnalysisAI')}
              style={[styles.btn, styles.btnSuccess, styles.btnGap]}
              activeOpacity={0.9}
            >
              <Text style={styles.btnTxt}>체형 분석 시작하기</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleAIExercisePress}
              style={[styles.btn, styles.btnWarn, styles.btnGap]}
              activeOpacity={0.9}
            >
              <Text style={styles.btnTxt}>AI 운동하기</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#000' },
  container: { flex: 1, backgroundColor: '#000' },
  content: { paddingBottom: 48 },

  section: {
    position: 'relative',
    width: '100%',
    backgroundColor: '#0a0a0a',
    // overflow: 'hidden', // ❌ 잘림 방지: 제거
  },
  bg: { position: 'absolute', width: '100%', height: '100%' },

  // 중앙정렬 보장용: flex:1 + 패딩 + 반투명 배경
  overlay: {
    flex: 1,
    paddingHorizontal: 20,
    paddingVertical: 28,
    paddingBottom: 40, // 버튼 3개가 항상 보이도록 여유
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'stretch',
  },

  header: {
    fontSize: 28,
    fontWeight: '800',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 10,
    alignSelf: 'center',
  },
  subHeader: {
    fontSize: 22,
    fontWeight: '700',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 8,
    alignSelf: 'center',
  },
  body: {
    fontSize: 16,
    color: '#fff',
    textAlign: 'center',
    marginVertical: 4,
    opacity: 0.95,
    alignSelf: 'center',
  },

  // 버튼 스택
  actionsWrap: {
    marginTop: 18,
    width: '100%',
    maxWidth: 560,
    alignSelf: 'center',
    alignItems: 'stretch',
  },
  btn: {
    width: '100%',
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnGap: { marginTop: 12 },
  btnPrimary: { backgroundColor: '#0A84FF' },
  btnSuccess: { backgroundColor: '#28A745' },
  btnWarn: { backgroundColor: '#FFC107' },
  btnTxt: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '700',
    textAlign: 'center',
  },

  scrollTopBtn: {
    position: 'absolute',
    right: 16,
    bottom: 24,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
  },
  scrollTopTxt: { color: '#fff', fontSize: 14, fontWeight: 'bold' },
});
