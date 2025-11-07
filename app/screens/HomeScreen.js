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
      '2025년 3월 17일 |  기획',
      '2025년 3월 24일 | 첫 발표',
      '2025년 11월 5일 | 백엔드 로직 구현',
      '2025년 11월 6일 | 카메라 기능 구현',
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
      '체형 분석 + 각 체형별 운동 추천 시스템',
      '유사 체형 루틴 제공',
      '부위별 데이터 조정 + 운동 자세 교정 피드백',
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
        contentInsetAdjustmentBehavior="always"
        contentInset={{ bottom: 120 }}
        onScroll={onScroll}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
      >
        {SECTIONS_DATA.map((item, index) => (
          <Section
            key={item.key}
            item={item}
            index={index}
            totalCount={SECTIONS_DATA.length}
          />
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

function Section({ item, index, totalCount }) {
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
  const isLast = index === totalCount - 1;

  const minH = isHero || isLast
    ? Math.max(height * 0.9, 560)
    : Math.max(height * 0.48, 360);

  return (
    <View style={[styles.section, { minHeight: minH }]}>
      <Image
        source={item.image}
        style={styles.bg}
        resizeMode="cover"
      />
      <View
        style={[
          styles.sectionOverlay,
          isHero || isLast ? styles.sectionOverlayHero : styles.sectionOverlayMid,
        ]}
      >
        <View style={styles.contentBox}>
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
                style={[styles.glassBtn, styles.btnPrimary]}
                activeOpacity={0.9}
              >
                <Text style={styles.btnTxt}>AI 구독하기</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => navigation.navigate('BodyAnalysisAI')}
                style={[styles.glassBtn, styles.btnSuccess]}
                activeOpacity={0.9}
              >
                <Text style={styles.btnTxt}>체형 분석 시작하기</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleAIExercisePress}
                style={[styles.glassBtn, styles.btnWarn]}
                activeOpacity={0.9}
              >
                <Text style={styles.btnTxt}>AI 운동하기</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#05070f',
  },
  container: {
    flex: 1,
    backgroundColor: '#05070f',
  },
  content: {
    paddingBottom: 160,
  },

  section: {
    position: 'relative',
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bg: {
    ...StyleSheet.absoluteFillObject,
  },
  sectionOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(5, 7, 15, 0.35)',
  },
  sectionOverlayHero: {
    paddingHorizontal: 24,
    paddingTop: 40,
    paddingBottom: 130,
  },
  sectionOverlayMid: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 80,
  },
  contentBox: {
    width: '100%',
    maxWidth: 720,
    alignItems: 'center',
  },
  header: {
    fontSize: 30,
    fontWeight: '800',
    color: '#F8FBFF',
    textAlign: 'center',
    marginBottom: 12,
    letterSpacing: 0.8,
    textShadowColor: 'rgba(10,132,255,0.35)',
    textShadowRadius: 16,
    textShadowOffset: { width: 0, height: 2 },
  },
  subHeader: {
    fontSize: 22,
    fontWeight: '700',
    color: '#D7E3FF',
    textAlign: 'center',
    marginBottom: 10,
    letterSpacing: 0.5,
  },
  body: {
    fontSize: 16,
    color: '#E5EDFF',
    textAlign: 'center',
    marginVertical: 6,
    opacity: 0.92,
    lineHeight: 24,
  },
  actionsWrap: {
    marginTop: 28,
    width: '100%',
    alignSelf: 'center',
    gap: 14,
  },
  glassBtn: {
    width: '100%',
    paddingVertical: 16,
    borderRadius: 20,
    backgroundColor: 'rgba(12, 22, 42, 0.55)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.16)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#111C2C',
    shadowOpacity: 0.3,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 6,
  },
  btnPrimary: {
    borderColor: 'rgba(58,130,255,0.45)',
    backgroundColor: 'rgba(10,132,255,0.18)',
    shadowColor: '#1A6BFF',
  },
  btnSuccess: {
    borderColor: 'rgba(86, 204, 242, 0.45)',
    backgroundColor: 'rgba(61, 220, 151, 0.16)',
    shadowColor: '#3DDC97',
  },
  btnWarn: {
    borderColor: 'rgba(255, 186, 73, 0.45)',
    backgroundColor: 'rgba(255, 186, 73, 0.16)',
    shadowColor: '#FFB648',
  },
  btnTxt: {
    color: '#F5FBFF',
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
    letterSpacing: 0.6,
  },
  scrollTopBtn: {
    position: 'absolute',
    right: 18,
    bottom: 30,
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 18,
    backgroundColor: 'rgba(15, 24, 44, 0.6)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
    shadowColor: '#0A84FF',
    shadowOpacity: 0.22,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  scrollTopTxt: {
    color: '#F2F6FF',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.4,
  },
});
