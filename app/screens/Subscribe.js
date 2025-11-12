import { useNavigation } from '@react-navigation/native';
import axios from 'axios';
import React, { useMemo, useState, useRef, useEffect } from 'react';
import {
  Alert,
  Dimensions,
  FlatList,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BASE_API_URL } from '../config';
import { useAuth } from './Authcontext';

const PLAN_OPTIONS = [
  {
    code: 'FREE',
    label: 'Free',
    price: '무료',
    subtitle: '가볍게 시작하기',
    description: '기본 구독: 무료로 제공되는 체형 분석 기능만 이용할 수 있습니다.',
    features: ['AI 체형 분석', '기본 운동 코칭'],
  },
  {
    code: 'STANDARD',
    label: 'Standard',
    price: '월 19,900원',
    subtitle: 'AI 코칭으로 성장',
    description: 'Standard 구독: 체형 분석, AI 운동 보조 기능을 이용할 수 있습니다.',
    features: ['AI 체형 분석', '실시간 운동 보조 기능', '음성 피드백 & 섬광 알림'],
  },
  {
    code: 'PRO',
    label: 'Pro',
    price: '월 29,900원',
    subtitle: '전문가급 퍼스널 트레이닝',
    description: 'Pro 구독: Standard 옵션에 추가로 1:1 운동 피드백 서비스를 제공합니다.',
    features: ['Standard 포함 전체 기능', '1:1 전문가 피드백', '주간 리포트 & 맞춤 루틴'],
  },
];

const { width } = Dimensions.get('window');
const CARD_GAP = 18;
const CARD_WIDTH = Math.min(width - 84, 320);
const LIST_HORIZONTAL_INSET = Math.max((width - CARD_WIDTH) / 2, 24);

const Subscribe = () => {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { user, login, isLoggedIn } = useAuth();
  const initialPlan = isLoggedIn && user?.subscription_type 
    ? (user.subscription_type).toUpperCase() 
    : 'FREE';
  const [selectedPlan, setSelectedPlan] = useState(initialPlan);
  const planListRef = useRef(null);

  const getBenefitDescription = (plan) => {
    const normalized = (plan || '').toUpperCase();
    const match = PLAN_OPTIONS.find((item) => item.code === normalized);
    return match?.description || PLAN_OPTIONS[0].description;
  };

  const [benefitDescription, setBenefitDescription] = useState(() => getBenefitDescription(initialPlan));

  const selectedPlanMeta = useMemo(
    () => PLAN_OPTIONS.find((plan) => plan.code === selectedPlan) || PLAN_OPTIONS[0],
    [selectedPlan]
  );

  const selectPlan = (type) => {
    const normalized = (type || '').toUpperCase();
    setSelectedPlan(normalized);
    setBenefitDescription(getBenefitDescription(normalized));
  };

  const handleOptionSelect = (type, index) => {
    selectPlan(type);
    if (typeof index === 'number' && planListRef.current) {
      const targetOffset = index * (CARD_WIDTH + CARD_GAP);
      planListRef.current.scrollToOffset({ offset: targetOffset, animated: true });
    }
  };

  useEffect(() => {
    const initialIndex = PLAN_OPTIONS.findIndex((plan) => plan.code === initialPlan);
    if (initialIndex > 0) {
      setTimeout(() => {
        const targetOffset = initialIndex * (CARD_WIDTH + CARD_GAP);
        planListRef.current?.scrollToOffset({ offset: targetOffset, animated: false });
      }, 0);
    }
  }, [initialPlan]);

  const handleSubscribe = async () => {
    if (!isLoggedIn || !user?.token) {
      Alert.alert(
        '로그인이 필요합니다',
        '구독하려면 먼저 로그인해주세요.',
        [
          { text: '취소', style: 'cancel' },
          { text: '로그인하기', onPress: () => navigation.navigate('Login') },
        ]
      );
      return;
    }

    if (selectedPlan === 'FREE') {
      Alert.alert('알림', '무료 플랜은 별도 구독 절차가 필요 없습니다.');
      return;
    }

    try {
      const response = await axios.patch(
        `${BASE_API_URL}users/subscribe/`,
        { subscription_type: selectedPlan },
        { headers: { Authorization: `Token ${user.token}` } }
      );

      // AuthContext의 user 상태를 최신 정보로 업데이트
      login({ token: user.token, ...response.data });

      Alert.alert('구독 성공', `${selectedPlan} 플랜 구독이 완료되었습니다!`);
      navigation.navigate('Home');
    } catch (error) {
      console.error('구독 실패:', error.response?.data || error.message);
      Alert.alert('구독 실패', '구독 처리 중 오류가 발생했습니다. 다시 시도해주세요.');
    }
  };

  return (
    <SafeAreaView style={styles.page}>
      <StatusBar barStyle="light-content" />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.hero, { paddingTop: insets.top + 88 }]}>
          <Text style={styles.title}>Atheleo 구독</Text>
          <Text style={styles.subtitle}>
            AI 체형 분석과 실시간 운동 코칭으로, 1:1 맞춤 경험을 누려보세요.
          </Text>
        </View>

        <FlatList
          data={PLAN_OPTIONS}
          ref={planListRef}
          horizontal
          style={styles.planList}
          keyExtractor={(item) => item.code}
          showsHorizontalScrollIndicator={false}
          snapToInterval={CARD_WIDTH + CARD_GAP}
          decelerationRate="fast"
          snapToAlignment="center"
          contentContainerStyle={[styles.planListContent, { paddingHorizontal: LIST_HORIZONTAL_INSET }]}
          ItemSeparatorComponent={() => <View style={{ width: CARD_GAP }} />}
          renderItem={({ item, index }) => {
            const isSelected = selectedPlan === item.code;
            return (
              <View style={[styles.planShadow, { width: CARD_WIDTH }]}>
                <View style={styles.planShadowInner}>
                  <TouchableOpacity
                    activeOpacity={0.92}
                    onPress={() => handleOptionSelect(item.code, index)}
                    style={[
                      styles.planCard,
                      isSelected && styles.planCardSelected,
                    ]}
                  >
                    <Text style={[styles.planLabel, isSelected && styles.planLabelSelected]} numberOfLines={1}>
                      {item.label}
                    </Text>
                    <Text
                      style={[styles.planPrice, isSelected && styles.planPriceSelected]}
                      numberOfLines={1}
                      adjustsFontSizeToFit
                      minimumFontScale={0.8}
                    >
                      {item.price}
                    </Text>
                    <Text
                      style={styles.planSubtitle}
                      numberOfLines={1}
                      adjustsFontSizeToFit
                      minimumFontScale={0.85}
                    >
                      {item.subtitle}
                    </Text>
                    <View style={styles.planDivider} />
                    <View style={styles.featureList}>
                      {item.features.map((feature) => (
                        <Text key={feature} style={styles.featureItem}>
                          • {feature}
                        </Text>
                      ))}
                    </View>
                  </TouchableOpacity>
                </View>
              </View>
            );
          }}
          onMomentumScrollEnd={(event) => {
            const offsetX = event.nativeEvent.contentOffset.x;
            const rawIndex = Math.round(offsetX / (CARD_WIDTH + CARD_GAP));
            const clampedIndex = Math.min(Math.max(rawIndex, 0), PLAN_OPTIONS.length - 1);
            const targetPlan = PLAN_OPTIONS[clampedIndex];
            if (targetPlan.code !== selectedPlan) {
              selectPlan(targetPlan.code);
            }
          }}
        />

        <View style={styles.benefitShadow}>
          <View style={styles.benefitShadowInner}>
            <View style={styles.benefitCard}>
              <Text style={styles.benefitHeading}>선택한 플랜</Text>
              <Text style={styles.benefitName}>{selectedPlanMeta.label}</Text>
              <Text style={styles.benefitDescription}>{benefitDescription}</Text>
            </View>
          </View>
        </View>

        <View style={styles.actionShadow}>
          <View style={styles.actionShadowInner}>
            <TouchableOpacity style={styles.submitButton} onPress={handleSubscribe} activeOpacity={0.92}>
              <Text style={styles.submitText}>
                {selectedPlan === 'FREE' ? '무료로 이용하기' : `${selectedPlanMeta.label} 구독하기`}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <Text style={styles.helperText}>
          구독은 언제든지 앱 설정에서 변경하거나 취소할 수 있어요.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: '#030614',
  },
  scrollContent: {
    paddingBottom: 48,
  },
  hero: {
    paddingHorizontal: 24,
    paddingTop: 28,
    paddingBottom: 24,
    alignItems: 'center',
  },
  title: {
    fontSize: 30,
    fontWeight: '800',
    color: '#F2F7FF',
    letterSpacing: 0.8,
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 15,
    color: '#C7D5F8',
    textAlign: 'center',
    lineHeight: 22,
    maxWidth: 320,
  },
  planList: {
    marginBottom: 12,
  },
  planListContent: {
    paddingBottom: 28,
  },
  planShadow: {
    borderRadius: 26,
    backgroundColor: '#07122A',
    shadowColor: '#0A1F4D',
    shadowOpacity: 0.28,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: 14 },
    elevation: 10,
    padding: 2,
  },
  planShadowInner: {
    flex: 1,
    width: '100%',
    height: '100%',
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: '#07122A',
  },
  planCard: {
    flex: 1,
    width: '100%',
    borderRadius: 24,
    paddingVertical: 24,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(10, 26, 60, 0.72)',
    borderWidth: 1,
    borderColor: 'rgba(140, 186, 255, 0.35)',
    alignItems: 'flex-start',
    justifyContent: 'flex-start',
    gap: 6,
  },
  planCardSelected: {
    backgroundColor: 'rgba(17, 58, 124, 0.82)',
    borderColor: 'rgba(110, 184, 255, 0.7)',
    shadowColor: '#1B69FF',
    shadowOpacity: 0.34,
  },
  planLabel: {
    color: '#E8F2FF',
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 0.4,
  },
  planLabelSelected: {
    color: '#FFFFFF',
  },
  planPrice: {
    color: '#97B5FF',
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  planPriceSelected: {
    color: '#FFFFFF',
  },
  planSubtitle: {
    color: '#A8B6D8',
    fontSize: 12,
    letterSpacing: 0.2,
  },
  planDivider: {
    width: '100%',
    height: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(156, 195, 255, 0.25)',
    marginTop: 8,
    marginBottom: 6,
  },
  featureList: {
    width: '100%',
    gap: 6,
  },
  featureItem: {
    color: '#C7D5F8',
    fontSize: 13,
    lineHeight: 20,
  },
  benefitShadow: {
    marginHorizontal: 24,
    borderRadius: 26,
    backgroundColor: '#08132C',
    shadowColor: '#102A5C',
    shadowOpacity: 0.28,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 12 },
    elevation: 8,
    marginBottom: 24,
    padding: 2,
  },
  benefitShadowInner: {
    flex: 1,
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: '#08132C',
  },
  benefitCard: {
    borderRadius: 24,
    padding: 22,
    backgroundColor: 'rgba(12, 25, 52, 0.62)',
    borderWidth: 1,
    borderColor: 'rgba(132, 178, 255, 0.28)',
    gap: 10,
  },
  benefitHeading: {
    color: '#8EAFFF',
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 1.2,
  },
  benefitTitle: {
    color: '#E9F2FF',
    fontSize: 18,
    fontWeight: '700',
  },
  benefitName: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: 0.4,
  },
  benefitDescription: {
    color: '#C7D5F8',
    fontSize: 14,
    lineHeight: 22,
  },
  actionShadow: {
    marginHorizontal: 24,
    borderRadius: 22,
    backgroundColor: '#091734',
    shadowColor: '#14346B',
    shadowOpacity: 0.26,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 12 },
    elevation: 10,
    padding: 2,
  },
  actionShadowInner: {
    flex: 1,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: '#091734',
  },
  submitButton: {
    borderRadius: 20,
    paddingVertical: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(31, 94, 223, 0.85)',
    borderWidth: 1,
    borderColor: 'rgba(144, 194, 255, 0.45)',
  },
  submitText: {
    color: '#F1F6FF',
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: 0.6,
  },
  helperText: {
    marginTop: 18,
    textAlign: 'center',
    color: '#7D8BB4',
    fontSize: 12,
    letterSpacing: 0.2,
  },
});

export default Subscribe;
