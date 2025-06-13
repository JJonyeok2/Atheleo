import { useNavigation } from '@react-navigation/native';
import React, { useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';

const Subscribe = ({ isLoggedIn }) => {
  const navigation = useNavigation();
  const [benefitDescription, setBenefitDescription] = useState('');

  const handleOptionSelect = (type) => {
    switch (type) {
      case 'FREE':
        setBenefitDescription('기본 구독: 무료로 제공되는 체형 분석 기능만 이용할 수 있습니다.');
        break;
      case 'Standard':
        setBenefitDescription('Standard 구독: 월 19,900원, 체형 분석 및 운동 보조 기능을 이용할 수 있습니다.');
        break;
      case 'Pro':
        setBenefitDescription('Pro 구독: 월 29,900원, 스탠다드 옵션에 추가로 1:1 운동 피드백 서비스를 제공합니다.');
        break;
      default:
        setBenefitDescription('');
    }
  };

  const handleSubscribe = () => {
    if (!isLoggedIn) {
      Alert.alert(
        '로그인 필요',
        '구독하려면 먼저 로그인해야 합니다.',
        [
          { text: '확인', onPress: () => navigation.navigate('Login') }
        ]
      );
      return;
    }

    navigation.navigate('Payment');
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>구독</Text>
      <View style={styles.options}>
        {['FREE', 'Standard', 'Pro'].map((type, index) => (
          <View key={index} style={styles.optionCard}>
            <Text style={styles.optionTitle}>{type}</Text>
            <Text style={styles.optionPrice}>
              {type === 'FREE' ? '무료' : type === 'Standard' ? '월 19,900원' : '월 29,900원'}
            </Text>
            <TouchableOpacity style={styles.button} onPress={() => handleOptionSelect(type)}>
              <Text style={styles.buttonText}>선택하기</Text>
            </TouchableOpacity>
          </View>
        ))}
      </View>

      {benefitDescription !== '' && (
        <View style={styles.descriptionBox}>
          <Text style={styles.benefitTitle}>선택한 구독 혜택</Text>
          <Text style={styles.description}>{benefitDescription}</Text>
        </View>
      )}

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
