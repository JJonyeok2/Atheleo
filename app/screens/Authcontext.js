// 인증 컨텍스트
import React, { createContext, useContext, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage'; // AsyncStorage 임포트

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true); // 로딩 상태 추가

  // 앱 시작 시 저장된 토큰 로드
  React.useEffect(() => {
    const loadStoredUser = async () => {
      try {
        const storedToken = await AsyncStorage.getItem('userToken');
        if (storedToken) {
          // 토큰이 있으면 사용자 정보도 다시 불러오거나, 토큰만 저장
          // 여기서는 간단히 토큰만 user 객체에 넣어줌 (실제 앱에서는 사용자 정보도 API로 불러오는 것이 좋음)
          setUser({ token: storedToken, isLoggedIn: true }); 
        }
      } catch (e) {
        console.error('Failed to load user token from AsyncStorage', e);
      } finally {
        setIsLoading(false);
      }
    };
    loadStoredUser();
  }, []);

  const login = (userData) => {
    console.log('AuthContext - login userData:', userData); // 디버깅용
    setUser(userData);
  };
  const logout = async () => {
    await AsyncStorage.removeItem('userToken'); // 토큰 삭제
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoggedIn: !!user, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

export default AuthProvider;