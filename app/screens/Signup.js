import { useNavigation } from '@react-navigation/native';
import axios from 'axios';
import React, { useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import CheckBox from '@react-native-community/checkbox';

import { BASE_API_URL } from '../config'; // ✅ API 주소를 가져오기 위해 추가

const Signup = () => {
  const navigation = useNavigation();
  const [name, setName] = useState('');
  const [birthdate, setBirthdate] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [id, setId] = useState(''); // 사용자 이름으로 사용
  const [password, setPassword] = useState('');
  const [privacyConsent, setPrivacyConsent] = useState(false);
  const [smsConsent, setSmsConsent] = useState(false);
  const [emailConsent, setEmailConsent] = useState(false);

  const handleSubmit = async () => {
    if (!privacyConsent) {
      Alert.alert('오류', '개인정보 처리방침에 동의해야 회원가입이 가능합니다.');
      return;
    }

    try {
      // ✅ 하드코딩된 주소를 BASE_API_URL로 수정
      const response = await axios.post(`${BASE_API_URL}users/signup/`, {
        username: id,
        password,
        email,
        name, // 백엔드 API가 받는 필드에 맞게 추가/수정 필요
        phone,
        // birthdate, smsConsent, emailConsent 등도 필요시 추가
      });

      Alert.alert('성공', '회원가입이 완료되었습니다. 로그인해주세요.');
      navigation.navigate('Login');
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        const errorMessages = Object.values(error.response.data).flat().join('\n');
        Alert.alert('회원가입 실패', errorMessages || '입력 내용을 다시 확인해주세요.');
      } else {
        Alert.alert('회원가입 실패', '네트워크 오류가 발생했습니다.');
      }
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <Text style={styles.title}>회원가입</Text>
      <TextInput style={styles.input} placeholder="이름" placeholderTextColor="#999" value={name} onChangeText={setName} />
      <TextInput style={styles.input} placeholder="생년월일 (YYYY-MM-DD)" placeholderTextColor="#999" value={birthdate} onChangeText={setBirthdate} />
      <TextInput style={styles.input} placeholder="연락처 (010-1234-5678)" placeholderTextColor="#999" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
      <TextInput style={styles.input} placeholder="이메일" placeholderTextColor="#999" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
      <TextInput style={styles.input} placeholder="아이디" placeholderTextColor="#999" value={id} onChangeText={setId} autoCapitalize="none" />
      <TextInput style={styles.input} placeholder="비밀번호" placeholderTextColor="#999" value={password} onChangeText={setPassword} secureTextEntry />

      <View style={styles.checkboxRow}>
        <CheckBox value={privacyConsent} onValueChange={setPrivacyConsent} tintColors={{ true: '#1E90FF', false: '#fff' }} />
        <Text style={styles.label}>개인정보 처리방침에 동의합니다. (필수)</Text>
      </View>
      <View style={styles.checkboxRow}>
        <CheckBox value={smsConsent} onValueChange={setSmsConsent} tintColors={{ true: '#1E90FF', false: '#fff' }} />
        <Text style={styles.label}>문자 수신에 동의합니다. (선택)</Text>
      </View>
      <View style={styles.checkboxRow}>
        <CheckBox value={emailConsent} onValueChange={setEmailConsent} tintColors={{ true: '#1E90FF', false: '#fff' }} />
        <Text style={styles.label}>이메일 수신에 동의합니다. (선택)</Text>
      </View>

      <TouchableOpacity style={styles.button} onPress={handleSubmit}>
        <Text style={styles.buttonText}>회원가입</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

// 스타일은 기존과 동일합니다.
const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: '#000',
    padding: 24,
    justifyContent: 'center',
  },
  title: {
    fontSize: 26,
    color: '#fff',
    fontWeight: 'bold',
    marginBottom: 20,
    alignSelf: 'center',
  },
  input: {
    height: 48,
    borderRadius: 6,
    backgroundColor: '#333',
    paddingHorizontal: 12,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#555',
    color: '#fff',
  },
  button: {
    backgroundColor: '#1E90FF',
    paddingVertical: 14,
    borderRadius: 6,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  label: {
    marginLeft: 8,
    fontSize: 14,
    color: '#fff',
    flexShrink: 1,
  },
});

export default Signup;
