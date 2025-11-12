import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import axios from 'axios';
import { useState } from 'react';
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
  View
} from 'react-native';
import { BASE_API_URL } from '../config';
import { useAuth } from './Authcontext';

const Login = () => {
  const [id, setId] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const navigation = useNavigation();
  const { login } = useAuth();

  const validateForm = () => {
    const newErrors = {};
    if (!id.trim()) newErrors.id = '아이디를 입력해주세요';
    else if (id.length < 4) newErrors.id = '아이디는 4자 이상이어야 합니다';

    if (!password.trim()) newErrors.password = '비밀번호를 입력해주세요';
    else if (password.length < 6) newErrors.password = '비밀번호는 6자 이상이어야 합니다';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async () => {
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      console.log('로그인 시도:', { id, password });

      const response = await axios.post(BASE_API_URL + 'users/login/', {
        username: id,
        password,
      });

      console.log('로그인 응답 원본 : ', response.data);

      const { token, user } = response.data;

      // AuthContext에 user 정보 전달
      login({
        token,
        id: user.id,
        username: user.username,
        email: user.email,
        name: user.name,
        phone: user.phone,
        subscription_type: user.subscription_type,
        is_subscribed: user.is_subscribed,
        profile_image: user.profile_image,
      });

      // 토큰 AsyncStorage 저장
      await AsyncStorage.setItem('userToken', token);

      navigation.navigate('Home');
    } catch (error) {
      // ✅ 아래 catch 블록을 상세 에러 로깅 코드로 수정했습니다.
      console.error('--- 로그인 실패: 상세 에러 정보 ---');
      if (axios.isAxiosError(error)) {
        // 서버가 응답을 했을 경우 (예: 400, 401, 500 에러)
        if (error.response) {
          console.error('서버 응답 상태 코드:', error.response.status);
          console.error('서버 응답 데이터:', JSON.stringify(error.response.data, null, 2));
        }
        // 서버가 응답조차 없을 경우 (예: 네트워크 단절, 서버 다운)
        else if (error.request) {
          console.error('서버로부터 응답을 받지 못했습니다. 네트워크나 서버 주소를 확인해주세요.');
        }
      } else {
        // Axios 에러가 아닌 다른 종류의 에러
        console.error('Axios가 아닌 다른 에러:', error.message);
      }
      console.error('------------------------------------');

      // 사용자에게 보여주는 알림창
      if (axios.isAxiosError(error) && error.response) {
        // Django의 기본 인증 에러는 보통 non_field_errors에 담겨 옵니다.
        const errorDetail = error.response.data.non_field_errors?.[0] || '아이디 또는 비밀번호가 올바르지 않습니다.';
        Alert.alert('로그인 실패', errorDetail);
      } else {
        Alert.alert('로그인 실패', '서버에 연결할 수 없습니다. 네트워크 상태를 확인해주세요.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleNavigateToSignup = () => navigation.navigate('Signup');
  const handleForgotPassword = () => Alert.alert('비밀번호 찾기', '비밀번호 찾기 기능은 준비 중입니다.');

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.logoContainer}>
          <Text style={styles.title}>Atheleo</Text>
          <Text style={styles.subtitle}>Atheleo에 오신 것을 환영합니다👏</Text>
        </View>

        <View style={styles.formContainer}>
          <View style={styles.inputContainer}>
            <TextInput
              style={[styles.input, errors.id && styles.inputError]}
              placeholder="아이디"
              placeholderTextColor="#aaa"
              value={id}
              onChangeText={(text) => {
                setId(text);
                if (errors.id) setErrors(prev => ({ ...prev, id: null }));
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
              secureTextEntry
              value={password}
              onChangeText={(text) => {
                setPassword(text);
                if (errors.password) setErrors(prev => ({ ...prev, password: null }));
              }}
              autoCapitalize="none"
              autoCorrect={false}
              editable={!isLoading}
            />
            {errors.password && <Text style={styles.errorText}>{errors.errorText}</Text>}
          </View>

          <TouchableOpacity
            style={[styles.loginButton, isLoading && styles.disabledButton]}
            onPress={handleLogin}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={styles.buttonText}>로그인</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.forgotPasswordButton}
            onPress={handleForgotPassword}
            disabled={isLoading}
          >
            <Text style={styles.forgotPasswordText}>비밀번호를 잊으셨나요?</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.signupContainer}>
          <Text style={styles.signupPromptText}>계정이 없으신가요?</Text>
          <TouchableOpacity
            style={styles.signupButton}
            onPress={handleNavigateToSignup}
            disabled={isLoading}
          >
            <Text style={styles.signupButtonText}>회원가입</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default Login;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0B132B' },
  scrollContainer: { flexGrow: 1, justifyContent: 'center', padding: 24 },
  logoContainer: { alignItems: 'center', marginBottom: 48 },
  title: { fontSize: 32, color: '#F4F9FF', fontWeight: 'bold', marginBottom: 8 },
  subtitle: { fontSize: 16, color: '#AFC6FF', textAlign: 'center' },
  formContainer: { marginBottom: 32 },
  inputContainer: { marginBottom: 16 },
  input: {
    width: '100%',
    height: 48,
    borderRadius: 12,
    backgroundColor: 'rgba(15, 42, 72, 0.85)',
    paddingHorizontal: 16,
    color: '#F5FBFF',
    fontSize: 16,
    borderWidth: 1,
    borderColor: 'rgba(128, 176, 255, 0.35)'
  },
  inputError: {
    borderWidth: 1,
    borderColor: '#ff4757'
  },
  errorText: {
    color: '#ff4757',
    fontSize: 12,
    marginTop: 4,
    marginLeft: 4
  },
  loginButton: {
    backgroundColor: '#3E8EFF',
    width: '100%',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8
  },
  disabledButton: {
    backgroundColor: '#555'
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600'
  },
  forgotPasswordButton: {
    alignItems: 'center',
    marginTop: 16
  },
  forgotPasswordText: {
    color: '#9DBCFF',
    fontSize: 14
  },
  signupContainer: {
    alignItems: 'center'
  },
  signupPromptText: {
    color: '#C7D5F8',
    fontSize: 14,
    marginBottom: 12
  },
  signupButton: {
    backgroundColor: 'rgba(25, 62, 94, 0.6)',
    borderWidth: 1,
    borderColor: 'rgba(86, 220, 210, 0.6)',
    width: '100%',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center'
  },
  signupButtonText: {
    color: '#52E0C8',
    fontSize: 16,
    fontWeight: '600'
  },
});
