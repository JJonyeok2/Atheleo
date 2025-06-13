// src/Profile.js
import axios from 'axios';
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';

const Container = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  padding: 40px 20px;
  min-height: 100vh;
  background-color: #121212;
  color: white;
`;

const Title = styled.h2`
  margin-bottom: 30px;
`;

const Form = styled.form`
  width: 320px;
  background-color: #222;
  padding: 25px;
  border-radius: 8px;
  box-shadow: 0 0 10px #000000aa;
  display: flex;
  flex-direction: column;
`;

const Input = styled.input`
  margin-bottom: 18px;
  padding: 10px;
  border-radius: 5px;
  border: none;
  outline: none;
  font-size: 1rem;
`;

const Button = styled.button`
  padding: 12px;
  border-radius: 5px;
  border: none;
  background-color: #007bff;
  color: white;
  font-weight: bold;
  cursor: pointer;
  margin-top: 10px;
  &:hover {
    background-color: #0056b3;
  }
`;

const Profile = () => {
  const navigate = useNavigate();

  // 예시: 토큰 기반 인증 시 토큰은 로컬스토리지에서 가져오기
  const token = localStorage.getItem('token');

  // 프로필 상태
  const [profile, setProfile] = useState({
    name: '',
    email: '',
    phone: '',
  });

  // 로딩 상태 및 에러 상태
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // 프로필 정보 불러오기
  useEffect(() => {
    if (!token) {
      navigate('/login'); // 로그인 안 되어 있으면 로그인 페이지로
      return;
    }

    axios.get('http://98.82.223.129:8000/api/profile/', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(res => {
        setProfile(res.data);
        setLoading(false);
      })
      .catch(err => {
        setError('프로필 정보를 불러오는 데 실패했습니다.');
        setLoading(false);
      });
  }, [token, navigate]);

  const handleChange = (e) => {
    setProfile({ ...profile, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // 프로필 업데이트 요청
    axios.put('http://98.82.223.129:8000/api/profile/', profile, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(() => alert('프로필이 업데이트 되었습니다.'))
      .catch(() => alert('프로필 업데이트 실패'));
  };

  if (loading) return <Container>로딩 중...</Container>;
  if (error) return <Container>{error}</Container>;

  return (
    <Container>
      <Title>내 프로필</Title>
      <Form onSubmit={handleSubmit}>
        <Input
          type="text"
          name="name"
          placeholder="이름"
          value={profile.name}
          onChange={handleChange}
          required
        />
        <Input
          type="email"
          name="email"
          placeholder="이메일"
          value={profile.email}
          onChange={handleChange}
          required
        />
        <Input
          type="tel"
          name="phone"
          placeholder="전화번호"
          value={profile.phone}
          onChange={handleChange}
          required
        />
        <Button type="submit">프로필 저장</Button>
      </Form>
    </Container>
  );
};

export default Profile;
