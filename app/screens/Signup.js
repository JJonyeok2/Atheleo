import { useNavigation } from '@react-navigation/native';
import axios from 'axios';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import CheckBox from '@react-native-community/checkbox';

import { BASE_API_URL } from '../config';

const Signup = () => {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const [name, setName] = useState('');
  const [birthdate, setBirthdate] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [id, setId] = useState('');
  const [password, setPassword] = useState('');
  const [privacyConsent, setPrivacyConsent] = useState(false);
  const [smsConsent, setSmsConsent] = useState(false);
  const [emailConsent, setEmailConsent] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const validateForm = () => {
    const newErrors = {};
    if (!name.trim()) newErrors.name = '이름을 입력해주세요';
    if (!email.trim()) newErrors.email = '이메일을 입력해주세요';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) newErrors.email = '올바른 이메일 형식이 아닙니다';
    if (!phone.trim()) newErrors.phone = '연락처를 입력해주세요';
    if (!id.trim()) newErrors.id = '아이디를 입력해주세요';
    else if (id.length < 4) newErrors.id = '아이디는 4자 이상이어야 합니다';
    if (!password.trim()) newErrors.password = '비밀번호를 입력해주세요';
    else if (password.length < 6) newErrors.password = '비밀번호는 6자 이상이어야 합니다';
    if (!privacyConsent) newErrors.privacyConsent = '개인정보 처리방침에 동의해야 합니다';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      const response = await axios.post(`${BASE_API_URL}users/signup/`, {
        username: id,
        password,
        email,
        name,
        phone,
      });

      Alert.alert('성공', '회원가입이 완료되었습니다. 로그인해주세요.', [
        { text: '확인', onPress: () => navigation.navigate('Login') },
      ]);
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        const errorMessages = Object.values(error.response.data).flat().join('\n');
        Alert.alert('회원가입 실패', errorMessages || '입력 내용을 다시 확인해주세요.');
      } else {
        Alert.alert('회원가입 실패', '네트워크 오류가 발생했습니다.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={[styles.scrollContainer, { paddingTop: insets.top + 88 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.logoContainer}>
          <Text style={styles.title}>회원가입</Text>
          <Text style={styles.subtitle}>Atheleo와 함께 시작하세요✨</Text>
        </View>

        <View style={styles.formContainer}>
          <View style={styles.inputContainer}>
            <TextInput
              style={[styles.input, errors.name && styles.inputError]}
              placeholder="이름"
              placeholderTextColor="#aaa"
              value={name}
              onChangeText={(text) => {
                setName(text);
                if (errors.name) setErrors((prev) => ({ ...prev, name: null }));
              }}
              editable={!isLoading}
            />
            {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}
          </View>

          <View style={styles.inputContainer}>
            <TextInput
              style={[styles.input, errors.email && styles.inputError]}
              placeholder="이메일"
              placeholderTextColor="#aaa"
              value={email}
              onChangeText={(text) => {
                setEmail(text);
                if (errors.email) setErrors((prev) => ({ ...prev, email: null }));
              }}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              editable={!isLoading}
            />
            {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}
          </View>

          <View style={styles.inputContainer}>
            <TextInput
              style={[styles.input, errors.phone && styles.inputError]}
              placeholder="연락처 (010-1234-5678)"
              placeholderTextColor="#aaa"
              value={phone}
              onChangeText={(text) => {
                setPhone(text);
                if (errors.phone) setErrors((prev) => ({ ...prev, phone: null }));
              }}
              keyboardType="phone-pad"
              editable={!isLoading}
            />
            {errors.phone && <Text style={styles.errorText}>{errors.phone}</Text>}
          </View>

          <View style={styles.inputContainer}>
            <TextInput
              style={[styles.input, errors.id && styles.inputError]}
              placeholder="아이디"
              placeholderTextColor="#aaa"
              value={id}
              onChangeText={(text) => {
                setId(text);
                if (errors.id) setErrors((prev) => ({ ...prev, id: null }));
              }}
              autoCapitalize="none"
              autoCorrect={false}
              editable={!isLoading}
            />
            {errors.id && <Text style={styles.errorText}>{errors.id}</Text>}
          </View>

          <View style={styles.inputContainer}>
            <TextInput
              style={[styles.input, errors.password && styles.inputError]}
              placeholder="비밀번호"
              placeholderTextColor="#aaa"
              value={password}
              onChangeText={(text) => {
                setPassword(text);
                if (errors.password) setErrors((prev) => ({ ...prev, password: null }));
              }}
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
              editable={!isLoading}
            />
            {errors.password && <Text style={styles.errorText}>{errors.password}</Text>}
          </View>

          <View style={styles.checkboxContainer}>
            <View style={styles.checkboxRow}>
              <CheckBox
                value={privacyConsent}
                onValueChange={(val) => {
                  setPrivacyConsent(val);
                  if (errors.privacyConsent) setErrors((prev) => ({ ...prev, privacyConsent: null }));
                }}
                tintColors={{ true: '#3E8EFF', false: '#aaa' }}
                disabled={isLoading}
              />
              <Text style={[styles.label, errors.privacyConsent && styles.labelError]}>
                개인정보 처리방침에 동의합니다. (필수)
              </Text>
            </View>
            {errors.privacyConsent && <Text style={styles.errorText}>{errors.privacyConsent}</Text>}

            <View style={styles.checkboxRow}>
              <CheckBox
                value={smsConsent}
                onValueChange={setSmsConsent}
                tintColors={{ true: '#3E8EFF', false: '#aaa' }}
                disabled={isLoading}
              />
              <Text style={styles.label}>문자 수신에 동의합니다. (선택)</Text>
            </View>

            <View style={styles.checkboxRow}>
              <CheckBox
                value={emailConsent}
                onValueChange={setEmailConsent}
                tintColors={{ true: '#3E8EFF', false: '#aaa' }}
                disabled={isLoading}
              />
              <Text style={styles.label}>이메일 수신에 동의합니다. (선택)</Text>
            </View>
          </View>

          <TouchableOpacity
            style={[styles.button, isLoading && styles.disabledButton]}
            onPress={handleSubmit}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={styles.buttonText}>회원가입</Text>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.loginContainer}>
          <Text style={styles.loginPromptText}>이미 계정이 있으신가요?</Text>
          <TouchableOpacity
            style={styles.loginButton}
            onPress={() => navigation.navigate('Login')}
            disabled={isLoading}
          >
            <Text style={styles.loginButtonText}>로그인</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0B132B',
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 32,
    color: '#F4F9FF',
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#AFC6FF',
    textAlign: 'center',
  },
  formContainer: {
    marginBottom: 24,
  },
  inputContainer: {
    marginBottom: 16,
  },
  input: {
    width: '100%',
    height: 48,
    borderRadius: 12,
    backgroundColor: 'rgba(15, 42, 72, 0.85)',
    paddingHorizontal: 16,
    color: '#F5FBFF',
    fontSize: 16,
    borderWidth: 1,
    borderColor: 'rgba(128, 176, 255, 0.35)',
  },
  inputError: {
    borderWidth: 1,
    borderColor: '#ff4757',
  },
  errorText: {
    color: '#ff4757',
    fontSize: 12,
    marginTop: 4,
    marginLeft: 4,
  },
  checkboxContainer: {
    marginTop: 8,
    marginBottom: 8,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  label: {
    marginLeft: 8,
    fontSize: 14,
    color: '#C7D5F8',
    flexShrink: 1,
  },
  labelError: {
    color: '#ff4757',
  },
  button: {
    backgroundColor: '#3E8EFF',
    width: '100%',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  disabledButton: {
    backgroundColor: '#555',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  loginContainer: {
    alignItems: 'center',
  },
  loginPromptText: {
    color: '#C7D5F8',
    fontSize: 14,
    marginBottom: 12,
  },
  loginButton: {
    backgroundColor: 'rgba(25, 62, 94, 0.6)',
    borderWidth: 1,
    borderColor: 'rgba(86, 220, 210, 0.6)',
    width: '100%',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  loginButtonText: {
    color: '#52E0C8',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default Signup;
