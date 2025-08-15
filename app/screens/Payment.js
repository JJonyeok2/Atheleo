import { useNavigation } from '@react-navigation/native';
import React, { useState } from 'react';
import { Alert } from 'react-native';
import styled from 'styled-components/native';

const Container = styled.View`
  flex: 1;
  padding: 40px 20px;
  background-color: #121212;
  align-items: center;
  justify-content: flex-start;
`;

const Title = styled.Text`
  font-size: 24px;
  color: white;
  font-weight: bold;
  margin-bottom: 30px;
`;

const Form = styled.View`
  width: 320px;
  background-color: #222;
  padding: 25px;
  border-radius: 8px;
`;

const Input = styled.TextInput`
  color: white;
  background-color: #333;
  margin-bottom: 18px;
  padding: 10px;
  border-radius: 5px;
  font-size: 16px;
`;

const Button = styled.TouchableOpacity`
  padding: 12px;
  border-radius: 5px;
  background-color: #28a745;
  align-items: center;
  margin-top: 10px;
`;

const ButtonText = styled.Text`
  color: white;
  font-weight: bold;
  font-size: 16px;
`;

const Payment = () => {
  const navigation = useNavigation();

  const [cardNumber, setCardNumber] = useState('');
  const [cardHolder, setCardHolder] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvc, setCvc] = useState('');

  const handleSubmit = () => {
    // 결제 처리 로직 예시 (실제 결제 API 연동 필요)
    if (!cardNumber || !cardHolder || !expiry || !cvc) {
      Alert.alert('입력 오류', '모든 결제 정보를 입력해주세요.');
      return;
    }

    // 간단한 유효성 체크 (실제론 더 엄격히 체크 필요)
    if (cardNumber.length < 12 || cardNumber.length > 19) {
      Alert.alert('입력 오류', '유효한 카드 번호를 입력해주세요.');
      return;
    }

    Alert.alert('성공', '결제가 완료되었습니다. 구독 서비스 이용을 환영합니다!');
    navigation.navigate('HomeScreen'); // 결제 완료 후 홈 화면으로 이동
  };

  return (
    <Container>
      <Title>구독 결제</Title>
      <Form>
        <Input
          placeholder="카드 번호 (숫자만 입력)"
          placeholderTextColor="#aaa"
          value={cardNumber}
          onChangeText={(text) => setCardNumber(text.replace(/\D/g, ''))}
          keyboardType="numeric"
          maxLength={19}
        />
        <Input
          placeholder="카드 소유자 이름"
          placeholderTextColor="#aaa"
          value={cardHolder}
          onChangeText={setCardHolder}
        />
        <Input
          placeholder="만료일 (MM/YY)"
          placeholderTextColor="#aaa"
          value={expiry}
          onChangeText={setExpiry}
          maxLength={5}
        />
        <Input
          placeholder="CVC"
          placeholderTextColor="#aaa"
          value={cvc}
          onChangeText={(text) => setCvc(text.replace(/\D/g, ''))}
          keyboardType="numeric"
          secureTextEntry
          maxLength={4}
        />
        <Button onPress={handleSubmit}>
          <ButtonText>결제하기</ButtonText>
        </Button>
      </Form>
    </Container>
  );
};

export default Payment;
