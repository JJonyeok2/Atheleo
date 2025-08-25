import { useNavigation } from '@react-navigation/native';
import axios from 'axios';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Platform, View, Text } from 'react-native';
import styled from 'styled-components/native';
import { useAuth } from './Authcontext';
import { Feather } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';

const Container = styled.View`
  flex: 1;
  background-color: #121212;
  padding: 60px 20px 20px 20px;
`;

const ProfileContainer = styled.View`
  flex-direction: row;
  align-items: flex-start;
`;

const ProfileImageContainer = styled.View`
  margin-right: 20px;
  align-items: center;
`;

const ProfileImage = styled.Image`
  width: 100px;
  height: 100px;
  border-radius: 50px;
  border-width: 2px;
  border-color: #007bff;
`;

const UploadButton = styled.TouchableOpacity`
  margin-top: 10px;
  background-color: #007bff;
  padding: 8px;
  border-radius: 20px;
`;

const InfoContainer = styled.View`
  flex: 1;
`;

const Title = styled.Text`
  font-size: 28px;
  color: white;
  font-weight: bold;
  margin-bottom: 30px;
`;

const Form = styled.View`
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

const Input = styled.TextInput`
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

const Profile = () => {
  const navigation = useNavigation();
  const { user, logout } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [newImage, setNewImage] = useState(null);

  useEffect(() => {
    (async () => {
      if (Platform.OS !== 'web') {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Permission Denied', 'Sorry, we need camera roll permissions to make this work!');
        }
      }
    })();

    const loadProfile = async () => {
      if (!user || !user.token) {
        navigation.navigate('Login');
        return;
      }

      try {
        const res = await axios.get('http://172.30.1.13:8000/api/users/profile/', {
          headers: { Authorization: `Token ${user.token}` },
        });
        setProfile(res.data);
      } catch (error) {
        console.error('Failed to load profile:', error.response?.data || error.message);
        Alert.alert('Error', 'Failed to load profile.');
        if (error.response && error.response.status === 401) {
          logout();
          navigation.navigate('Login');
        }
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [user, navigation, logout]);

  const handleChoosePhoto = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaType.Images, // Deprecation warning 해결
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });

    if (!result.canceled) {
      const image = result.assets[0];
      if (image.fileSize > 5 * 1024 * 1024) {
        Alert.alert('Error', 'Image size must be less than 5MB.');
        return;
      }
      setNewImage(image.uri);
    }
  };

  const handleChange = (name, value) => {
    setProfile({ ...profile, [name]: value });
  };

  const handleSubmit = async () => {
    if (!user || !user.token) return;

    const formData = new FormData();
    
    // 변경된 필드만 추가 (PATCH 요청에 적합)
    if (profile.email) formData.append('email', profile.email);
    if (profile.name) formData.append('name', profile.name);
    if (profile.phone) formData.append('phone', profile.phone);

    if (newImage) {
      const uriParts = newImage.split('.');
      const fileType = uriParts[uriParts.length - 1];
      formData.append('profile_image', {
        uri: newImage,
        name: `photo.${fileType}`,
        type: `image/${fileType}`,
      });
    }

    try {
      // PUT 대신 PATCH 사용
      const res = await axios.patch('http://172.30.1.13:8000/api/users/profile/', formData, {
        headers: {
          Authorization: `Token ${user.token}`,
          'Content-Type': 'multipart/form-data',
        },
      });
      setProfile(res.data); // 서버로부터 업데이트된 프로필 정보 수신
      setNewImage(null); // 새 이미지 상태 초기화
      Alert.alert('성공', '프로필이 성공적으로 업데이트되었습니다.');
    } catch (error) {
      console.error('Failed to update profile:', error.response?.data || error.message);
      Alert.alert('오류', '프로필을 업데이트하지 못했습니다.');
    }
  };

  if (loading || !profile) return <Container><ActivityIndicator color="#fff" size="large" /></Container>;

  // newImage가 있으면 그것을, 없으면 백엔드에서 받은 profile_image URL을 사용
  const imageUri = newImage || profile.profile_image;

  return (
    <Container>
      <Title>My Profile</Title>
      <ProfileContainer>
        <ProfileImageContainer>
          <ProfileImage source={{ uri: imageUri }} />
          <UploadButton onPress={handleChoosePhoto}>
            <Feather name="camera" size={20} color="white" />
          </UploadButton>
        </ProfileImageContainer>
        <InfoContainer>
          <Form>
            <InputContainer>
              <Feather name="mail" size={20} color="#888" />
              <Input
                value={profile.email}
                onChangeText={(val) => handleChange('email', val)}
                placeholder="Email"
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </InputContainer>
            <InputContainer>
              <Feather name="user" size={20} color="#888" />
              <Input
                value={profile.name}
                onChangeText={(val) => handleChange('name', val)}
                placeholder="Name"
              />
            </InputContainer>
            <InputContainer>
              <Feather name="phone" size={20} color="#888" />
              <Input
                value={profile.phone}
                onChangeText={(val) => handleChange('phone', val)}
                placeholder="Phone"
                keyboardType="phone-pad"
              />
            </InputContainer>
            <Button onPress={handleSubmit}>
              <ButtonText>Update Profile</ButtonText>
            </Button>
          </Form>
        </InfoContainer>
      </ProfileContainer>
      {profile.subscription_type && (
        <SubscriptionText>
          Subscription: {profile.subscription_type}
        </SubscriptionText>
      )}
    </Container>
  );
};

export default Profile;