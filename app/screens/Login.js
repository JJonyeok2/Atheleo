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

const Login = () => {
  const [id, setId] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const navigation = useNavigation();

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
      
      // 실제 API 호출 예시
      // const response = await loginAPI({ id, password });
      // if (response.success) {
      //   navigation.navigate('Home');
      // }
      
      // 임시 로그인 성공 시뮬레이션 (2초 후)
      setTimeout(() => {
        setIsLoading(false);
        Alert.alert('성공', '로그인되었습니다', [
          { text: '확인', onPress: () => navigation.navigate('Home') }
        ]);
      }, 2000);
      
    } catch (error) {
      setIsLoading(false);
      Alert.alert('오류', '로그인에 실패했습니다. 다시 시도해주세요.');
      console.error('로그인 오류:', error);
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

// Default export
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