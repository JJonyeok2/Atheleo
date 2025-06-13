import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import axios from 'axios';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert } from 'react-native';
import styled from 'styled-components/native';

const Container = styled.View`
  flex: 1;
  padding: 40px 20px;
  background-color: #121212;
`;

const Title = styled.Text`
  font-size: 24px;
  color: white;
  text-align: center;
  margin-bottom: 30px;
`;

const Form = styled.View`
  background-color: #222;
  padding: 25px;
  border-radius: 8px;
`;

const Input = styled.TextInput`
  background-color: #333;
  color: white;
  padding: 12px;
  border-radius: 5px;
  margin-bottom: 15px;
`;

const Button = styled.TouchableOpacity`
  background-color: #007bff;
  padding: 12px;
  border-radius: 5px;
  align-items: center;
  margin-top: 10px;
`;

const ButtonText = styled.Text`
  color: white;
  font-weight: bold;
`;

const Profile = () => {
  const navigation = useNavigation();
  const [profile, setProfile] = useState({ name: '', email: '', phone: '' });
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState('');

  useEffect(() => {
    const loadProfile = async () => {
      const storedToken = await AsyncStorage.getItem('token');
      if (!storedToken) {
        navigation.navigate('Login');
        return;
      }
      setToken(storedToken);

      try {
        const res = await axios.get('http://98.82.223.129:8000/api/profile/', {
          headers: { Authorization: `Bearer ${storedToken}` },
        });
        setProfile(res.data);
      } catch (error) {
        Alert.alert('에러', '프로필 정보를 불러오는 데 실패했습니다.');
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, []);

  const handleChange = (name, value) => {
    setProfile({ ...profile, [name]: value });
  };

  const handleSubmit = async () => {
    try {
      await axios.put('http://98.82.223.129:8000/api/profile/', profile, {
        headers: { Authorization: `Bearer ${token}` },
      });
      Alert.alert('성공', '프로필이 업데이트 되었습니다.');
    } catch (error) {
      Alert.alert('에러', '프로필 업데이트 실패');
    }
  };

  if (loading) return <Container><ActivityIndicator color="#fff" size="large" /></Container>;

  return (
    <Container>
      <Title>내 프로필</Title>
      <Form>
        <Input
          placeholder="이름"
          placeholderTextColor="#aaa"
          value={profile.name}
          onChangeText={(text) => handleChange('name', text)}
        />
        <Input
          placeholder="이메일"
          placeholderTextColor="#aaa"
          value={profile.email}
          onChangeText={(text) => handleChange('email', text)}
        />
        <Input
          placeholder="전화번호"
          placeholderTextColor="#aaa"
          value={profile.phone}
          onChangeText={(text) => handleChange('phone', text)}
        />
        <Button onPress={handleSubmit}>
          <ButtonText>프로필 저장</ButtonText>
        </Button>
      </Form>
    </Container>
  );
};

export default Profile;
