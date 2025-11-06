import { useNavigation } from '@react-navigation/native';
import React, { useState } from 'react';
import { Alert, ActivityIndicator } from 'react-native';
import styled from 'styled-components/native';

// --- Styled Components (전체 코드) ---
const Container = styled.View`
  flex: 1;
  padding: 40px 20px;
  background-color: #121212;
`;

const Title = styled.Text`
  font-size: 28px;
  font-weight: bold;
  color: #ffffff;
  margin-bottom: 30px;
  text-align: center;
`;

const FormContainer = styled.View`
  width: 100%;
`;

const Input = styled.TextInput.attrs({
  placeholderTextColor: '#888',
})`
  background-color: #333333;
  color: #ffffff;
  padding: 15px;
  border-radius: 8px;
  margin-bottom: 15px;
  font-size: 16px;
`;

const Button = styled.TouchableOpacity`
  padding: 15px;
  border-radius: 8px;
  background-color: #28a745;
  align-items: center;
  margin-top: 10px;
  opacity: ${props => (props.disabled ? 0.6 : 1)};
`;

const ButtonText = styled.Text`
  color: #ffffff;
  font-size: 18px;
  font-weight: bold;
`;

// --- Payment 컴포넌트 ---
const Payment = () => {
  const navigation = useNavigation();

  const [cardNumber, setCardNumber] = useState('');
  const [cardHolder, setCardHolder] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvc, setCvc] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const formatCardNumber = (text) => {
    const cleaned = text.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const matches = cleaned.match(/.{1,4}/g);
    return matches ? matches.join(' ') : '';
  };

  const formatExpiry = (text) => {
    const cleaned = text.replace(/[^0-9]/gi, '');
    if (cleaned.length >= 3) {
      return `${cleaned.slice(0, 2)}/${cleaned.slice(2, 4)}`;
    }
    return cleaned;
  };

  const handleSubmit = async () => {
    if (!cardNumber || !cardHolder || !expiry || !cvc) {
      Alert.alert('오류', '모든 결제 정보를 입력해주세요.');
      return;
    }
    if (cardNumber.replace(/\s/g, '').length < 12) {
      Alert.alert('오류', '유효한 카드 번호를 입력해주세요.');
      return;
    }

    setIsLoading(true);
    // --- 실제 결제 API 호출 시뮬레이션 ---
    await new Promise(resolve => setTimeout(resolve, 2000));
    setIsLoading(false);

    Alert.alert('성공', '결제가 완료되었습니다. 구독 서비스 이용을 환영합니다!');
    navigation.navigate('Home');
  };

  return (
    <Container>
      <Title>구독 결제</Title>
      <FormContainer>
        <Input
          placeholder="카드 번호 (12~19자리)"
          value={cardNumber}
          onChangeText={(text) => setCardNumber(formatCardNumber(text))}
          keyboardType="number-pad"
          maxLength={23}
        />
        <Input
          placeholder="카드 소유자 이름"
          value={cardHolder}
          onChangeText={setCardHolder}
        />
        <Input
          placeholder="유효기간 (MM/YY)"
          value={expiry}
          onChangeText={(text) => setExpiry(formatExpiry(text))}
          keyboardType="number-pad"
          maxLength={5}
        />
        <Input
          placeholder="CVC"
          value={cvc}
          onChangeText={(text) => setCvc(text.replace(/[^0-9]/g, ''))}
          keyboardType="number-pad"
          secureTextEntry
          maxLength={4}
        />
        <Button onPress={handleSubmit} disabled={isLoading}>
          {isLoading ? (
            <ActivityIndicator color="white" />
          ) : (
            <ButtonText>결제하기</ButtonText>
          )}
        </Button>
      </FormContainer>
    </Container>
  );
};

export default Payment;
