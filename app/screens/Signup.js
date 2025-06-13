import axios from 'axios';
import CheckBox from 'expo-checkbox';
import React, { useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';

const Signup = () => {
  const [name, setName] = useState('');
  const [birthdate, setBirthdate] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [id, setId] = useState('');
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
      const response = await axios.post('http://98.82.223.129:8000/api/signup/', {
        username: id,
        password,
        email,
        birthdate,
        phone,
        privacyConsent,
        smsConsent,
        emailConsent,
        name,
      });
      Alert.alert('성공', '회원가입 성공!');
      console.log(response.data);
      // 회원가입 후 동작 (예: 로그인 화면 이동) 추가 가능
    } catch (error) {
      if (axios.isAxiosError(error)) {
        Alert.alert('회원가입 실패', error.response?.data?.error || error.message);
      } else {
        Alert.alert('회원가입 실패', '알 수 없는 오류가 발생했습니다.');
      }
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>회원가입</Text>
      <TextInput
        style={styles.input}
        placeholder="이름"
        placeholderTextColor="#999"
        value={name}
        onChangeText={setName}
      />
      <TextInput
        style={styles.input}
        placeholder="생년월일 (YYYY-MM-DD)"
        placeholderTextColor="#999"
        value={birthdate}
        onChangeText={setBirthdate}
      />
      <TextInput
        style={styles.input}
        placeholder="연락처 (예: 010-1234-5678)"
        placeholderTextColor="#999"
        value={phone}
        onChangeText={setPhone}
      />
      <TextInput
        style={styles.input}
        placeholder="이메일"
        placeholderTextColor="#999"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
      />
      <TextInput
        style={styles.input}
        placeholder="아이디"
        placeholderTextColor="#999"
        value={id}
        onChangeText={setId}
      />
      <TextInput
        style={styles.input}
        placeholder="비밀번호"
        placeholderTextColor="#999"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />
      <View style={styles.checkboxRow}>
        <CheckBox value={privacyConsent} onValueChange={setPrivacyConsent} />
        <Text style={styles.label}>개인정보 처리방침에 동의합니다.</Text>
      </View>
      <View style={styles.checkboxRow}>
        <CheckBox value={smsConsent} onValueChange={setSmsConsent} />
        <Text style={styles.label}>전화번호 문자 수신에 동의합니다.</Text>
      </View>
      <View style={styles.checkboxRow}>
        <CheckBox value={emailConsent} onValueChange={setEmailConsent} />
        <Text style={styles.label}>이메일 수신에 동의합니다.</Text>
      </View>
      <TouchableOpacity style={styles.button} onPress={handleSubmit}>
        <Text style={styles.buttonText}>회원가입</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

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
    marginBottom: 10,
  },
  label: {
    marginLeft: 8,
    fontSize: 14,
    color: '#fff',
    flexShrink: 1,
  },
});

export default Signup;