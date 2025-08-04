import { useNavigation } from '@react-navigation/native';
import axios from 'axios';
import { useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useAuth } from './Authcontext';

const Subscribe = () => {
  const navigation = useNavigation();
  const { user, login, isLoggedIn } = useAuth();
  const [benefitDescription, setBenefitDescription] = useState('');
  const [selectedPlan, setSelectedPlan] = useState('FREE');

  const handleOptionSelect = (type) => {
    setSelectedPlan(type);
    switch (type) {
      case 'FREE':
        setBenefitDescription('기본 구독: 무료로 제공되는 체형 분석 기능만 이용할 수 있습니다.');
        break;
      case 'STANDARD':
        setBenefitDescription('Standard 구독: 월 19,900원, 체형 분석 및 운동 보조 기능을 이용할 수 있습니다.');
        break;
      case 'PRO':
        setBenefitDescription('Pro 구독: 월 29,900원, 스탠다드 옵션에 추가로 1:1 운동 피드백 서비스를 제공합니다.');
        break;
      default:
        setBenefitDescription('');
    }
  };

  const handleSubscribe = async () => {
    console.log('구독하기 버튼 클릭됨');
    if (!isLoggedIn) {
      Alert.alert('로그인 필요', '구독하려면 먼저 로그인해야 합니다.', [
        { text: '확인', onPress: () => navigation.navigate('Login') },
      ]);
      return;
    }

    if (selectedPlan === 'FREE') {
      Alert.alert('알림', '무료 플랜은 구독할 필요가 없습니다.');
      return;
    }

    try {
      const response = await axios.patch(
        'http://127.0.0.1:8000/api/users/subscribe/',
        { subscription_type: selectedPlan },
        {
          headers: { Authorization: `Token ${user.token}` },
        }
      );

      const updatedUser = {
        ...response.data.user,
        token: response.data.token,
        subscription_type: response.data.user.subscription_type,
      };
      login(updatedUser);

      Alert.alert('구독 성공', `${selectedPlan} 플랜 구독이 완료되었습니다!`);
      navigation.navigate('Home');
    } catch (error) {
      console.error('구독 실패:', error.response?.data || error.message);
      Alert.alert('구독 실패', '구독 처리 중 오류가 발생했습니다. 다시 시도해주세요.');
      if (error.response && error.response.status === 401) {
        Alert.alert('인증 오류', '로그인이 필요합니다.');
        navigation.navigate('Login');
      }
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>구독</Text>
      <View style={styles.options}>
        {['FREE', 'STANDARD', 'PRO'].map((type, index) => (
          <View
            key={index}
            style={[
              styles.optionCard,
              selectedPlan === type && styles.selectedOptionCard,
            ]}
          >
            <Text style={styles.optionTitle}>{String(type)}</Text>
            <Text style={styles.optionPrice}>
              {String(type === 'FREE'
                ? '무료'
                : type === 'STANDARD'
                ? '월 19,900원'
                : '월 29,900원')}
            </Text>
            <TouchableOpacity
              style={styles.button}
              onPress={() => handleOptionSelect(type)}
            >
              <Text style={styles.buttonText}>선택하기</Text>
            </TouchableOpacity>
          </View>
        ))}
      </View>

      {benefitDescription ? ( // benefitDescription이 비어있지 않으면 렌더링
        <View style={styles.descriptionBox}>
          <Text style={styles.benefitTitle}>선택한 구독 혜택</Text>
          <Text style={styles.description}>{benefitDescription}</Text>
        </View>
      ) : null} {/* 비어있으면 null 반환 */}

      <TouchableOpacity style={styles.submitButton} onPress={handleSubscribe}>
        <Text style={styles.submitText}>구독하기</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#000',
    padding: 20,
    paddingBottom: 60,
    alignItems: 'center',
    flexGrow: 1,
  },
  title: {
    fontSize: 28,
    color: 'white',
    marginBottom: 20,
  },
  options: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 20,
  },
  optionCard: {
    backgroundColor: '#444',
    padding: 16,
    borderRadius: 8,
    width: '30%',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedOptionCard: {
    borderColor: '#007bff',
  },
  optionTitle: {
    color: 'white',
    fontSize: 16,
    marginBottom: 10,
  },
  optionPrice: {
    color: '#ccc',
    marginBottom: 10,
  },
  button: {
    backgroundColor: '#007bff',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  buttonText: {
    color: 'white',
  },
  descriptionBox: {
    backgroundColor: '#333',
    padding: 20,
    borderRadius: 8,
    marginBottom: 20,
    width: '100%',
  },
  benefitTitle: {
    color: 'white',
    fontSize: 18,
    marginBottom: 10,
  },
  description: {
    color: '#ccc',
    fontSize: 14,
  },
  submitButton: {
    backgroundColor: '#007bff',
    padding: 12,
    borderRadius: 6,
    alignItems: 'center',
    width: '100%',
  },
  submitText: {
    color: 'white',
    fontSize: 16,
  },
});

export default Subscribe;
