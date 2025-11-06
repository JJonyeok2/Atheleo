import { useNavigation } from '@react-navigation/native';
import axios from 'axios';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Platform, ScrollView } from 'react-native';
import { launchImageLibrary } from 'react-native-image-picker';
import Feather from 'react-native-vector-icons/Feather';
import styled from 'styled-components/native';

import { BASE_API_URL } from '../config'; // MEDIA_BASE_URL은 이제 여기서 필요 없습니다.
import { useAuth } from './Authcontext';

// 로컬 기본 이미지 (경로가 다르면 실제 경로로 수정하세요)
const localDefaultImage = require('../../assets/images/default.png');

const Profile = () => {
  const { user, login, isLoading: isAuthLoading } = useAuth();
  const [editableUser, setEditableUser] = useState(null);
  const [newImage, setNewImage] = useState(null);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    if (user) setEditableUser(user);
  }, [user]);

  const handleChoosePhoto = () => {
    launchImageLibrary({ mediaType: 'photo', quality: 0.5 }, (response) => {
      if (response.didCancel || response.errorCode) return;
      if (response.assets && response.assets.length > 0) {
        const image = response.assets[0];
        if (image.fileSize > 5 * 1024 * 1024) { // 5MB Limit
          Alert.alert('오류', '이미지 파일 크기는 5MB를 초과할 수 없습니다.');
          return;
        }
        setNewImage(image);
      }
    });
  };

  const handleChange = (name, value) => {
    setEditableUser({ ...editableUser, [name]: value });
  };

  const handleSubmit = async () => {
    if (!user?.token) return;

    const formData = new FormData();
    if (editableUser.email !== user.email) formData.append('email', editableUser.email);
    if (editableUser.name !== user.name) formData.append('name', editableUser.name);
    if (editableUser.phone !== user.phone) formData.append('phone', editableUser.phone);

    if (newImage) {
      formData.append('profile_image', {
        uri: Platform.OS === 'android' ? newImage.uri : newImage.uri.replace('file://', ''),
        type: newImage.type,
        name: newImage.fileName,
      });
    }

    if (Object.keys(formData._parts).length === 0) {
      Alert.alert('알림', '변경된 내용이 없습니다.');
      return;
    }

    setIsUploading(true);
    try {
      const res = await axios.patch(`${BASE_API_URL}users/profile/`, formData, {
        headers: {
          Authorization: `Token ${user.token}`,
          'Content-Type': 'multipart/form-data',
        },
      });

      login({ token: user.token, ...res.data }); // 컨텍스트 업데이트
      setNewImage(null);
      Alert.alert('성공', '프로필이 성공적으로 업데이트되었습니다.');
    } catch (error) {
      console.error('프로필 업데이트 실패:', error.response?.data || error.message);
      Alert.alert('오류', '프로필 업데이트에 실패했습니다.');
    } finally {
      setIsUploading(false);
    }
  };

  if (isAuthLoading || !editableUser) {
    return (
      <Container style={{ justifyContent: 'center' }}>
        <ActivityIndicator color="#fff" size="large" />
      </Container>
    );
  }

  // --- 💡 여기가 수정된 부분입니다 ---
  const imageSource = newImage
    ? { uri: newImage.uri } // 1순위: 새로 선택한 이미지
    : user.profile_image // 2순위: 서버에서 받은 이미지가 있다면
    ? { uri: user.profile_image } //          (그대로 사용)
    : localDefaultImage; // 3순위: 로컬 기본 이미지

  return (
    <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
      <Container>
        <Title>My Profile</Title>
        <ProfileImageContainer>
          <ProfileImage source={imageSource} />
          <UploadButton onPress={handleChoosePhoto}>
            <Feather name="camera" size={20} color="white" />
          </UploadButton>
        </ProfileImageContainer>

        <Form>
          <InputContainer>
            <Feather name="user" size={20} color="#aaa" />
            <Input value={editableUser.username || ''} editable={false} />
          </InputContainer>

          <InputContainer>
            <Feather name="mail" size={20} color="#aaa" />
            <Input
              placeholder="Email"
              value={editableUser.email || ''}
              onChangeText={(text) => handleChange('email', text)}
              keyboardType="email-address"
            />
          </InputContainer>

          <InputContainer>
            <Feather name="user" size={20} color="#aaa" />
            <Input
              placeholder="Name"
              value={editableUser.name || ''}
              onChangeText={(text) => handleChange('name', text)}
            />
          </InputContainer>

          <InputContainer>
            <Feather name="phone" size={20} color="#aaa" />
            <Input
              placeholder="Phone"
              value={editableUser.phone || ''}
              onChangeText={(text) => handleChange('phone', text)}
              keyboardType="phone-pad"
            />
          </InputContainer>

          <SubscriptionText>
            구독 상태: {editableUser.subscription_type || 'FREE'}
          </SubscriptionText>

          <Button onPress={handleSubmit} disabled={isUploading}>
            {isUploading ? <ActivityIndicator color="white" /> : <ButtonText>프로필 저장</ButtonText>}
          </Button>
        </Form>
      </Container>
    </ScrollView>
  );
};

export default Profile;

// --- Styled Components ---
const Container = styled.View`
  flex: 1;
  background-color: #121212;
  padding: 20px;
  align-items: center;
`;

const Title = styled.Text`
  font-size: 28px;
  color: white;
  font-weight: bold;
  margin-top: 40px;
  margin-bottom: 30px;
  align-self: flex-start;
`;

const ProfileImageContainer = styled.View`
  align-items: center;
  margin-bottom: 30px;
`;

const ProfileImage = styled.Image`
  width: 120px;
  height: 120px;
  border-radius: 60px;
  border-width: 3px;
  border-color: #007bff;
`;

const UploadButton = styled.TouchableOpacity`
  position: absolute;
  bottom: 0;
  right: 0;
  background-color: #007bff;
  padding: 8px;
  border-radius: 20px;
  border-width: 2px;
  border-color: #121212;
`;

const Form = styled.View`
  width: 100%;
  background-color: #1e1e1e;
  padding: 20px;
  border-radius: 10px;
`;

const InputContainer = styled.View`
  flex-direction: row;
  align-items: center;
  background-color: #333;
  border-radius: 8px;
  margin-bottom: 15px;
  padding-horizontal: 15px;
`;

const Input = styled.TextInput.attrs({
  placeholderTextColor: '#aaa',
})`
  flex: 1;
  color: white;
  padding-vertical: 12px;
  padding-horizontal: 10px;
  font-size: 16px;
`;

const Button = styled.TouchableOpacity`
  background-color: #007bff;
  padding: 15px;
  border-radius: 8px;
  align-items: center;
  margin-top: 20px;
  opacity: ${props => (props.disabled ? 0.5 : 1)};
`;

const ButtonText = styled.Text`
  color: white;
  font-weight: bold;
  font-size: 16px;
`;

const SubscriptionText = styled.Text`
  color: #00ff7f;
  font-size: 16px;
  font-weight: bold;
  text-align: center;
  margin-top: 15px;
  padding: 10px;
  background-color: #222;
  border-radius: 8px;
`;