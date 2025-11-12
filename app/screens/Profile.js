import { useNavigation } from '@react-navigation/native';
import axios from 'axios';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Platform, ScrollView } from 'react-native';
import { launchImageLibrary } from 'react-native-image-picker';
import styled from 'styled-components/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';

import { BASE_API_URL } from '../config'; // MEDIA_BASE_URL은 이제 여기서 필요 없습니다.
import { useAuth } from './Authcontext';

// 로컬 기본 이미지 (경로가 다르면 실제 경로로 수정하세요)
const localDefaultImage = require('../../assets/images/default.png');

const Profile = () => {
  const { user, login, isLoading: isAuthLoading } = useAuth();
  const [editableUser, setEditableUser] = useState(null);
  const [newImage, setNewImage] = useState(null);
  const [useDefaultImage, setUseDefaultImage] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const insets = useSafeAreaInsets();

  const applyProfile = useCallback(
    (profile, options = {}) => {
      if (!profile) return;
      setEditableUser(profile);
      if (!options.preserveDefaultChoice) {
        setUseDefaultImage(!profile.profile_image);
      }
      setNewImage(null);
    },
    []
  );

  useEffect(() => {
    if (user) {
      applyProfile(user, { preserveDefaultChoice: true });
    }
  }, [applyProfile, user]);

  useFocusEffect(
    useCallback(() => {
      let isActive = true;
      const fetchProfile = async () => {
        if (!user?.token) return;
        try {
          const res = await axios.get(`${BASE_API_URL}users/profile/`, {
            headers: { Authorization: `Token ${user.token}` },
          });
          if (!isActive) return;
          const merged = { ...user, ...res.data };
          applyProfile(merged, { preserveDefaultChoice: true });
          if (
            user?.email !== res.data.email ||
            user?.name !== res.data.name ||
            user?.phone !== res.data.phone ||
            user?.profile_image !== res.data.profile_image ||
            user?.subscription_type !== res.data.subscription_type
          ) {
            login({ token: user.token, ...res.data });
          }
        } catch (error) {
          console.error('프로필 불러오기 실패:', error.response?.data || error.message);
        }
      };
      fetchProfile();
      return () => {
        isActive = false;
      };
    }, [applyProfile, login, user?.token, user?.email, user?.name, user?.phone, user?.profile_image, user?.subscription_type])
  );

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
        setUseDefaultImage(false);
      }
    });
  };

  const handleUseDefaultImage = () => {
    Alert.alert(
      '기본 이미지로 변경',
      '프로필 사진을 기본 이미지로 변경하시겠습니까?',
      [
        { text: '취소', style: 'cancel' },
        {
          text: '확인',
          onPress: () => {
            setNewImage(null);
            setUseDefaultImage(true);
            setEditableUser((prev) => (prev ? { ...prev, profile_image: null } : prev));
          },
        },
      ]
    );
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
    } else if (useDefaultImage) {
      formData.append('reset_profile_image', 'true');
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
      setUseDefaultImage(false);
      Alert.alert('성공', '프로필이 성공적으로 업데이트되었습니다.');
    } catch (error) {
      console.error('프로필 업데이트 실패:', error.response?.data || error.message);
      Alert.alert('오류', '프로필 업데이트에 실패했습니다.');
    } finally {
      setIsUploading(false);
    }
  };

  const subscriptionLabel = useMemo(() => {
    const normalized = (editableUser?.subscription_type || user?.subscription_type || 'FREE').toUpperCase();
    switch (normalized) {
      case 'STANDARD':
        return 'Standard';
      case 'PRO':
        return 'Pro';
      case 'FREE':
      default:
        return 'Free';
    }
  }, [editableUser?.subscription_type, user?.subscription_type]);

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
    : useDefaultImage || !editableUser?.profile_image
    ? localDefaultImage // 기본 이미지 사용 시
    : { uri: editableUser.profile_image || user.profile_image }; // 기존 서버 이미지

  return (
    <ScrollView contentContainerStyle={{ flexGrow: 1, paddingTop: insets.top + 52, paddingBottom: insets.bottom + 28 }}>
      <Container>
        <Title>My Profile</Title>
        <ProfileImageContainer>
          <ProfileImage source={imageSource} />
          <UploadButton onPress={handleChoosePhoto}>
            <UploadButtonIcon>📷</UploadButtonIcon>
          </UploadButton>
        </ProfileImageContainer>

        <InlineActions>
          <InlineButton onPress={handleChoosePhoto} activeOpacity={0.85}>
            <InlineButtonText>사진 선택</InlineButtonText>
          </InlineButton>
          <InlineButton onPress={handleUseDefaultImage} activeOpacity={0.85}>
            <InlineButtonText>기본 이미지 사용</InlineButtonText>
          </InlineButton>
        </InlineActions>

        <Form>
          <InputContainer>
            <IconText>👤</IconText>
            <Input value={editableUser.username || ''} editable={false} />
          </InputContainer>

          <InputContainer>
            <IconText>📧</IconText>
            <Input
              placeholder="Email"
              value={editableUser.email || ''}
              onChangeText={(text) => handleChange('email', text)}
              keyboardType="email-address"
            />
          </InputContainer>

          <InputContainer>
            <IconText>📝</IconText>
            <Input
              placeholder="Name"
              value={editableUser.name || ''}
              onChangeText={(text) => handleChange('name', text)}
            />
          </InputContainer>

          <InputContainer>
            <IconText>📞</IconText>
            <Input
              placeholder="Phone"
              value={editableUser.phone || ''}
              onChangeText={(text) => handleChange('phone', text)}
              keyboardType="phone-pad"
            />
          </InputContainer>

          <SubscriptionText>
            구독 상태: {subscriptionLabel}
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
  background-color: #0B132B;
  padding: 20px;
  align-items: center;
`;

const Title = styled.Text`
  font-size: 28px;
  color: #F4F9FF;
  font-weight: bold;
  margin-top: 20px;
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
  border-color: #3E8EFF;
`;

const UploadButton = styled.TouchableOpacity`
  position: absolute;
  bottom: 0;
  right: 0;
  background-color: #3E8EFF;
  padding: 8px;
  border-radius: 20px;
  border-width: 2px;
  border-color: #0B132B;
`;

const UploadButtonIcon = styled.Text`
  font-size: 18px;
  color: #FFFFFF;
`;

const InlineActions = styled.View`
  flex-direction: row;
  justify-content: center;
  gap: 12px;
  margin-bottom: 24px;
`;

const InlineButton = styled.TouchableOpacity`
  padding-vertical: 10px;
  padding-horizontal: 16px;
  border-radius: 12px;
  background-color: rgba(62, 142, 255, 0.18);
  border-width: 1px;
  border-color: rgba(118, 174, 255, 0.4);
`;

const InlineButtonText = styled.Text`
  color: #E8F0FF;
  font-weight: 600;
`;

const Form = styled.View`
  width: 100%;
  gap: 16px;
  padding-bottom: 40px;
`;

const InputContainer = styled.View`
  flex-direction: row;
  align-items: center;
  background-color: rgba(255, 255, 255, 0.08);
  padding: 12px 16px;
  border-radius: 12px;
  margin-bottom: 8px;
`;

const IconText = styled.Text`
  font-size: 18px;
  margin-right: 12px;
`;

const Input = styled.TextInput`
  flex: 1;
  color: #F5FBFF;
  margin-left: 10px;
`;

const Button = styled.TouchableOpacity`
  background-color: #3E8EFF;
  padding: 16px;
  border-radius: 12px;
  align-items: center;
  margin-top: 6px;
  margin-bottom: 6px;
  opacity: ${props => (props.disabled ? 0.5 : 1)};
`;

const ButtonText = styled.Text`
  color: white;
  font-size: 16px;
  font-weight: bold;
`;

const SubscriptionText = styled.Text`
  color: #C7D5F8;
  font-size: 16px;
  margin-top: 10px;
  margin-bottom: 20px;
`;