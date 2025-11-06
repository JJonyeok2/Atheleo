// app/screens/Authcontext.js
import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { BASE_API_URL } from '../config';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadStoredUser = async () => {
      try {
        const storedToken = await AsyncStorage.getItem('userToken');
        if (storedToken) {
          // ✅ 수정: 괄호로 변경
          const response = await axios.get(`${BASE_API_URL}users/profile/`, {
            headers: { Authorization: `Token ${storedToken}` },
          });
          setUser({ ...response.data, token: storedToken, isLoggedIn: true });
        }
      } catch (e) {
        console.error('Failed to load user data', e);
        await AsyncStorage.removeItem('userToken').catch(err => console.error(err));
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };
    loadStoredUser().catch(err => console.error('Error in loadStoredUser:', err));
  }, []);

  const login = async (userData) => {
    setUser(userData);
    if (userData && userData.token) {
      await AsyncStorage.setItem('userToken', userData.token).catch(err =>
        console.error('Failed to save token:', err)
      );
    }
  };

  const logout = async () => {
    await AsyncStorage.removeItem('userToken').catch(err => console.error(err));
    setUser(null);
  };

  return (
    <AuthContext.Provider 
      value={{ 
        user, 
        login, 
        logout, 
        isLoggedIn: !!user,
        isLoading 
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);