import { useNavigation } from '@react-navigation/native';
import axios from 'axios';
import React, { useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { BASE_API_URL } from '../config';
import { useAuth } from './Authcontext';

const Subscribe = () => {
  const navigation = useNavigation();
  const { user, login, isLoggedIn } = useAuth();
  const [selectedPlan, setSelectedPlan] = useState(user?.subscription_type || 'FREE');

  const getBenefitDescription = (plan) => {
    switch (plan) {
      case 'STANDARD':
        return 'Standard 구독: 월 19,900원, 체형 분석 및 운동 보조 기능을 이용할 수 있습니다.';
      case 'PRO':
        return 'Pro 구독: 월 29,900원, 스탠다드 옵션에 추가로 1:1 운동 피드백 서비스를 제공합니다.';
      case 'FREE':
      default:
        return '기본 구독: 무료로 제공되는 체형 분석 기능만 이용할 수 있습니다.';
    }
  };

  const [benefitDescription, setBenefitDescription] = useState(() => getBenefitDescription(selectedPlan));

  const handleOptionSelect = (type) => {
    setSelectedPlan(type);
    setBenefitDescription(getBenefitDescription(type));
  };

  const handleSubscribe = async () => {
    if (!isLoggedIn) {
      Alert.alert('로그인 필요', '구독하려면 먼저 로그인해야 합니다.', [
        { text: '확인', onPress: () => navigation.navigate('Login') },
      ]);
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
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>구독 플랜</Text>
      <View style={styles.options}>
        {['FREE', 'STANDARD', 'PRO'].map((type) => (
          <TouchableOpacity
            key={type}
            style={[styles.optionCard, selectedPlan === type && styles.selectedOptionCard]}
            onPress={() => handleOptionSelect(type)}
          >
            <Text style={styles.optionTitle}>{type}</Text>
            <Text style={styles.optionPrice}>
              {type === 'FREE' ? '무료' : type === 'STANDARD' ? '월 19,900원' : '월 29,900원'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.descriptionBox}>
        <Text style={styles.benefitTitle}>선택한 구독 혜택</Text>
        <Text style={styles.description}>{benefitDescription}</Text>
      </View>

      <TouchableOpacity style={styles.submitButton} onPress={handleSubscribe}>
        <Text style={styles.submitText}>구독하기</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

// 스타일은 기존과 동일합니다.
const styles = StyleSheet.create({
  container: {
    backgroundColor: '#000',
    padding: 20,
    alignItems: 'center',
    flexGrow: 1,
  },
  title: {
    fontSize: 28,
    color: 'white',
    marginBottom: 30,
    fontWeight: 'bold',
  },
  options: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginBottom: 30,
  },
  optionCard: {
    backgroundColor: '#222',
    padding: 16,
    borderRadius: 10,
    width: '31%',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#444',
  },
  selectedOptionCard: {
    borderColor: '#007bff',
    transform: [{ scale: 1.05 }],
  },
  optionTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  optionPrice: {
    color: '#ccc',
    marginBottom: 15,
  },
  descriptionBox: {
    backgroundColor: '#1c1c1e',
    padding: 20,
    borderRadius: 10,
    marginBottom: 30,
    width: '100%',
  },
  benefitTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  description: {
    color: '#b0b0b0',
    fontSize: 15,
    lineHeight: 22,
  },
  submitButton: {
    backgroundColor: '#007bff',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    width: '100%',
  },
  submitText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default Subscribe;
