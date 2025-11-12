// app/screens/HomeScreen.js
import { useNavigation } from '@react-navigation/native';
import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
  Alert,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
  ScrollView,
  RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from './Authcontext';

const HERO_BADGES = ['실시간 AI 코칭', '개인 맞춤 루틴', '비대면 PT 경험'];
const HERO_HIGHLIGHTS = [
  { title: '정확한 자세 추적', description: 'VisionCamera로 포즈를 감지하고 반복 횟수를 자동 기록합니다.' },
  { title: '음성 & 플래시 피드백', description: '멀리서도 편하게! 음성 안내, 플래시 효과로 자세를 즉시 교정합니다.' },
  { title: '체형 분석 연동', description: '체형 분석 결과와 연동해 일일·주간 루틴을 추천해 드려요.' },
];
const HISTORY_TEXTS = [
  `2025년 3월 10일
팀 구성`,
  `2025년 3월 17일
제품 기획`,
  `2025년 5월 2일
VisionCamera 기반 시범 구현 완료`,
  `2025년 7월 15일
체형 분석 API 베타 테스트 시작`,
  `2025년 11월 10일
음성 피드백·플래시 효과 기능 추가`,
  `2025년 11월 25일
Atheleo 1.0 출시 예정`,
  `2025년 12월 예정
개인 맞춤형 피드백 & 클라우드 운동 기록`,
];
const ABOUT_TEXTS = [
  `팀장
전종혁(Frontend/Backend)`,
  `부팀장
김한수(AI/ML)`,
  `비전
어디서나 사용할 수 있는 개인 맞춤형 운동 경험을 제공합니다.`,
  `사용 스택
React Native, VisionCamera, Django REST,
AWS, Pose Estimation, Xcode`,
];
const ATHELEO_AI_TEXTS = [
  `앱 소개
체형 분석, 실시간 운동 보조 기능을 각 화면에서 제공하는 스마트 피트니스 코치`,
  `핵심 기능
자세 분석으로 반복 횟수·자세 정확도 측정,
음성/플래시 피드백, 맞춤 루틴 추천`,
  `사용 기술
React Native, VisionCamera, Pose Estimation,
Django REST, AWS, Notion, Github`,
];
const SECTIONS_DATA = [
  {
    key: 'hero',
    headerLine1: 'AI Fitness Assistant',
    headerLine2: 'Atheleo',
    texts: ['체형 분석 및 운동 보조 시스템', '* 월 결제 19,900원 (옵션 별 상이)'],
    colors: {
      base: '#142347',
      overlay: 'rgba(10, 21, 52, 0.32)',
      glow: 'rgba(62, 142, 255, 0.5)',
    },
  },
  {
    key: 'history',
    subHeader: 'History',
    texts: HISTORY_TEXTS,
    colors: {
      base: '#1A1740',
      overlay: 'rgba(8, 3, 20, 0.78)',
      glow: 'rgba(144, 109, 255, 0.32)',
    },
  },
  {
    key: 'about',
    subHeader: 'About Us',
    texts: ABOUT_TEXTS,
    colors: {
      base: '#132640',
      overlay: 'rgba(3, 12, 20, 0.78)',
      glow: 'rgba(73, 198, 255, 0.32)',
    },
  },
  {
    key: 'ai',
    subHeader: 'Atheleo AI',
    texts: ATHELEO_AI_TEXTS,
    colors: {
      base: '#142347',
      overlay: 'rgba(3, 6, 20, 0.78)',
      glow: 'rgba(42, 112, 255, 0.35)',
    },
  },
];

export default function HomeScreen() {
  const { height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const scrollRef = useRef(null);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const onScroll = (e) => {
    const y = e.nativeEvent.contentOffset.y;
    setShowScrollTop(y > height / 2);
  };

  const scrollToTop = () => scrollRef.current?.scrollTo({ y: 0, animated: true });

  const onRefresh = useCallback(async () => {
    try {
      setRefreshing(true);
      // TODO: 홈 화면 데이터 재로딩 로직이 생기면 이 위치에서 처리합니다.
      await new Promise((resolve) => setTimeout(resolve, 600));
    } finally {
      setRefreshing(false);
    }
  }, []);

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
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#8AB8FF"
            progressBackgroundColor="rgba(5, 11, 24, 0.85)"
          />
        }
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
        <TouchableOpacity
          style={[styles.scrollTopBtn, { bottom: insets.bottom + 24 }]}
          onPress={scrollToTop}
          activeOpacity={0.85}
          accessible
          accessibilityRole="button"
          accessibilityLabel="맨 위로 스크롤"
        >
          <Text style={styles.scrollTopTxt}>맨 위로</Text>
        </TouchableOpacity>
      )}
    </SafeAreaView>
  );
}

function Section({ item, index, totalCount }) {
  const navigation = useNavigation();
  const { user } = useAuth();
  const { height, width } = useWindowDimensions();
  const insets = useSafeAreaInsets();

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
  const isAiSection = item.key === 'ai';
  const isLast = index === totalCount - 1;
  const isCompact = width < 420;

  const minH = isHero
    ? Math.max(height * 0.82, 520)
    : isAiSection
    ? Math.max(height * 0.68, 460)
    : isLast
    ? Math.max(height * 0.78, 500)
    : Math.max(height * 0.7, 460);
  const extraTopMargin = isHero ? Math.max(insets.top + 24, 48) : 0;

  const { colors = {} } = item;
  const baseColor = colors.base || '#071229';
  const overlayColor = colors.overlay || 'rgba(5, 11, 24, 0.82)';
  const glowColor = colors.glow || 'rgba(58, 132, 255, 0.28)';
  const heroBadges = useMemo(() => (isHero ? HERO_BADGES : []), [isHero]);
  const heroHighlights = useMemo(() => (isHero ? HERO_HIGHLIGHTS : []), [isHero]);
  const heroButtons = useMemo(
    () => [
      {
        label: 'Atheleo 구독하기',
        onPress: () => navigation.navigate('Subscribe'),
        buttonStyle: styles.btnPrimary,
        accessibilityLabel: 'AI 구독 화면으로 이동',
      },
      {
        label: '체형 분석 시작하기',
        onPress: () => navigation.navigate('BodyAnalysisAI'),
        buttonStyle: styles.btnSuccess,
        accessibilityLabel: '체형 분석 페이지로 이동',
      },
      {
        label: 'AI 운동하기',
        onPress: handleAIExercisePress,
        buttonStyle: styles.btnWarn,
        accessibilityLabel: 'AI 운동 페이지로 이동',
      },
    ],
    [navigation, handleAIExercisePress]
  );
  const contentStyle = isHero
    ? styles.sectionContentHero
    : isLast
    ? styles.sectionContentLast
    : styles.sectionContentMid;

  return (
    <View
      style={[styles.sectionShell, {
        minHeight: minH,
        backgroundColor: baseColor,
        marginTop: extraTopMargin + (isHero ? 18 : 0),
      }]}
    >
      <View style={styles.sectionInner}>
        <View pointerEvents="none" style={[styles.sectionBase, { backgroundColor: baseColor }]} />
        <View pointerEvents="none" style={[styles.sectionOverlay, { backgroundColor: overlayColor }]} />
        <View pointerEvents="none" style={[styles.sectionGlow, { backgroundColor: glowColor }]} />

        <View style={[styles.sectionContent, contentStyle]}>
          <View style={styles.contentBox}>
            {isHero && item.headerLine1 ? (
              <View style={styles.heroHeaderBlock}>
                <Text
                  style={[styles.header, styles.heroHeaderPrimary]}
                  accessibilityRole="header"
                  accessible
                >
                  {item.headerLine1}
                </Text>
                {item.headerLine2 ? (
                  <Text
                    style={[styles.header, styles.heroHeaderSecondary]}
                    accessibilityRole="header"
                    accessible
                  >
                    {item.headerLine2}
                  </Text>
                ) : null}
              </View>
            ) : (
              item.header && (
                <Text
                  style={styles.header}
                  accessibilityRole="header"
                  accessible
                >
                  {item.header}
                </Text>
              )
            )}
            {!isHero && item.subHeader ? (
              <Text style={[styles.subHeader, styles.nonHeroSubHeader]}>{item.subHeader}</Text>
            ) : null}

            {item.texts?.map((t, i) => (
              <Text key={i} style={styles.body} accessible>
                {t}
              </Text>
            ))}

            {isHero && (
              <>
                <View style={styles.heroBadgeRow}>
                  {heroBadges.map((badge) => (
                    <View key={badge} style={styles.heroBadge}>
                      <Text style={styles.heroBadgeText}>{badge}</Text>
                    </View>
                  ))}
                </View>

                <View style={styles.heroHighlights}>
                  {heroHighlights.map((item) => (
                    <View key={item.title} style={styles.heroHighlightItem}>
                      <Text style={styles.heroHighlightTitle}>{item.title}</Text>
                      <Text style={styles.heroHighlightDesc}>{item.description}</Text>
                    </View>
                  ))}
                </View>

                <View style={styles.heroActions}>
                  {heroButtons.map(({ label, onPress, buttonStyle, accessibilityLabel }) => (
                    <View key={label} style={styles.heroActionShell}>
                      <TouchableOpacity
                        onPress={onPress}
                        style={[styles.glassBtn, buttonStyle]}
                        activeOpacity={0.9}
                        accessible
                        accessibilityRole="button"
                        accessibilityLabel={accessibilityLabel}
                      >
                        <Text style={styles.btnTxt}>{label}</Text>
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              </>
            )}
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#030614',
  },
  container: {
    flex: 1,
    backgroundColor: '#030614',
  },
  content: {
    paddingBottom: 160,
  },

  sectionShell: {
    position: 'relative',
    width: '92%',
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginVertical: 16,
    borderRadius: 32,
    borderWidth: 1,
    borderColor: 'rgba(132, 178, 255, 0.12)',
    shadowColor: 'rgba(10, 26, 60, 0.55)',
    shadowOffset: { width: 0, height: 24 },
    shadowOpacity: 0.35,
    shadowRadius: 32,
    elevation: 12,
  },
  sectionInner: {
    flex: 1,
    width: '100%',
    height: '100%',
    borderRadius: 28,
    overflow: 'hidden',
    position: 'relative',
  },
  sectionBase: {
    ...StyleSheet.absoluteFillObject,
  },
  sectionOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  sectionGlow: {
    position: 'absolute',
    top: -140,
    width: '90%',
    height: 280,
    alignSelf: 'center',
    borderRadius: 280,
    opacity: 0.38,
    transform: [{ scaleX: 1.3 }],
  },
  sectionContent: {
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sectionContentHero: {
    paddingHorizontal: 28,
    paddingTop: 80,
    paddingBottom: 112,
  },
  sectionContentMid: {
    paddingHorizontal: 26,
    paddingTop: 36,
    paddingBottom: 96,
    justifyContent: 'flex-start',
    alignItems: 'center',
  },
  sectionContentLast: {
    paddingHorizontal: 26,
    paddingTop: 42,
    paddingBottom: 110,
    justifyContent: 'flex-start',
    alignItems: 'center',
  },
  contentBox: {
    width: '100%',
    maxWidth: 720,
    alignItems: 'center',
  },
  heroHeaderBlock: {
    alignItems: 'center',
    marginBottom: 16,
  },
  heroHeaderPrimary: {
    fontSize: 24,
    letterSpacing: 0.4,
    marginBottom: 4,
  },
  heroHeaderSecondary: {
    fontSize: 34,
    fontWeight: '800',
    letterSpacing: 1,
    textShadowColor: 'rgba(10,132,255,0.35)',
    textShadowRadius: 20,
    textShadowOffset: { width: 0, height: 3 },
    marginBottom: 0,
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
  nonHeroSubHeader: {
    marginBottom: 28,
  },
  body: {
    fontSize: 16,
    color: '#E5EDFF',
    textAlign: 'center',
    opacity: 0.92,
    lineHeight: 26,
    maxWidth: 480,
    marginBottom: 12,
  },
  nonHeroBody: {
    width: '100%',
    maxWidth: 580,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
    paddingTop: 24,
  },
  heroBody: {
    width: '100%',
    alignItems: 'center',
  },
  actionsWrap: {
    marginTop: 28,
    width: '100%',
    alignSelf: 'center',
    gap: 16,
  },
  heroActions: {
    width: '100%',
    maxWidth: 620,
    alignSelf: 'center',
    flexDirection: 'column',
    gap: 12,
    alignItems: 'center',
  },
  heroActionShell: {
    width: '100%',
    maxWidth: 360,
    alignItems: 'center',
  },
  heroActionShellFull: {
    width: '100%',
  },
  glassBtn: {
    width: '100%',
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(108, 182, 255, 0.28)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnPrimary: {
    backgroundColor: 'rgba(33, 112, 255, 0.38)',
    shadowColor: '#3E8EFF',
  },
  btnSuccess: {
    backgroundColor: 'rgba(98, 82, 255, 0.36)',
    shadowColor: '#7463FF',
  },
  btnWarn: {
    backgroundColor: 'rgba(66, 204, 164, 0.35)',
    shadowColor: '#42CCA4',
  },
  btnTxt: {
    color: '#F5FBFF',
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
    letterSpacing: 0.6,
  },
  heroBadgeRow: {
    marginTop: 20,
    marginBottom: 18,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    justifyContent: 'center',
  },
  heroBadge: {
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 999,
    backgroundColor: 'rgba(67, 135, 255, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(126, 186, 255, 0.45)',
  },
  heroBadgeText: {
    color: '#D8E6FF',
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  heroHighlights: {
    width: '100%',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 14,
    justifyContent: 'center',
    alignItems: 'stretch',
    marginBottom: 24,
  },
  heroHighlightItem: {
    flexBasis: '48%',
    minWidth: 220,
    maxWidth: 300,
    paddingHorizontal: 18,
    paddingVertical: 16,
    borderRadius: 18,
    backgroundColor: 'rgba(12, 30, 72, 0.65)',
    borderWidth: 1,
    borderColor: 'rgba(126, 186, 255, 0.28)',
  },
  heroHighlightTitle: {
    color: '#F3F8FF',
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 6,
    textAlign: 'center',
    width: '100%',
  },
  heroHighlightDesc: {
    color: '#B9C8EB',
    fontSize: 13,
    lineHeight: 19,
    textAlign: 'center',
    width: '100%',
  },
  scrollTopBtn: {
    position: 'absolute',
    right: 20,
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 18,
    backgroundColor: '#132041',
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
