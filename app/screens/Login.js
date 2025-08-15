import { useNavigation } from '@react-navigation/native';
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
  View
} from 'react-native';
import axios from 'axios'; // Import axios
import { useAuth } from './Authcontext'; // AuthContext 임포트
import AsyncStorage from '@react-native-async-storage/async-storage'; // AsyncStorage 임포트

const Login = () => {
  const [id, setId] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const navigation = useNavigation();
  const { login } = useAuth(); // useAuth 훅에서 login 함수 가져오기

  const validateForm = () => {
    const newErrors = {};
    
    if (!id.trim()) {
      newErrors.id = '아이디를 입력해주세요';
    } else if (id.length < 4) {
      newErrors.id = '아이디는 4자 이상이어야 합니다';
    }
    
    if (!password.trim()) {
      newErrors.password = '비밀번호를 입력해주세요';
    } else if (password.length < 6) {
      newErrors.password = '비밀번호는 6자 이상이어야 합니다';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async () => {
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    try {
      console.log('로그인 시도:', { id, password });
      
      const response = await axios.post('http://127.0.0.1:8000/api/users/login/', {
        username: id,
        password,
      });

      const { token, user_id, email, username, is_subscribed, name, phone, subscription_type } = response.data;
      console.log('로그인 성공:', { token, user_id, email, username, is_subscribed, name, phone, subscription_type });

      // 토큰을 AsyncStorage에 저장
      await AsyncStorage.setItem('userToken', token);

      // AuthContext의 login 함수 호출하여 사용자 정보 저장
      login({ id: user_id, username, email, is_subscribed, token, name, phone, subscription_type });

      // Alert 없이 바로 Home 화면으로 이동
      navigation.navigate('Home');
      
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response && error.response.data) {
          const errorMessages = Object.values(error.response.data).reduce((acc, val) => acc.concat(val), []).join('\n');
          Alert.alert('로그인 실패', errorMessages);
        } else {
          Alert.alert('로그인 실패', error.message);
        }
      } else {
        Alert.alert('로그인 실패', '알 수 없는 오류가 발생했습니다.');
      }
      console.error('로그인 오류:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleNavigateToSignup = () => {
    navigation.navigate('Signup');
  };

  const handleForgotPassword = () => {
    Alert.alert('비밀번호 찾기', '비밀번호 찾기 기능은 준비 중입니다.');
  };

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
            {errors.password && <Text style={styles.errorText}>{errors.password}</Text>}
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

// 기본 내보내기
export default Login;

// Named export도 추가 (선택사항)
export { Login };

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 48,
  },
  title: {
    fontSize: 32,
    color: '#fff',
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#aaa',
    textAlign: 'center',
  },
  formContainer: {
    marginBottom: 32,
  },
  inputContainer: {
    marginBottom: 16,
  },
  input: {
    width: '100%',
    height: 48,
    borderRadius: 8,
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    color: '#000',
    fontSize: 16,
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
  loginButton: {
    backgroundColor: '#007bff',
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
  forgotPasswordButton: {
    alignItems: 'center',
    marginTop: 16,
  },
  forgotPasswordText: {
    color: '#007bff',
    fontSize: 14,
  },
  signupContainer: {
    alignItems: 'center',
  },
  signupPromptText: {
    color: '#aaa',
    fontSize: 14,
    marginBottom: 12,
  },
  signupButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#28a745',
    width: '100%',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  signupButtonText: {
    color: '#28a745',
    fontSize: 16,
    fontWeight: '600',
  },
});
