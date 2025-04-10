import React, { useState } from 'react';
import styled from 'styled-components';
import { useNavigate } from 'react-router-dom';
import axios from 'axios'; // axios 추가

const Container = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100vh;
  background: linear-gradient(to bottom, #1E3A8A, #93C5FD, #E0F2FE);
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  width: 300px;
  padding: 20px;
  border: 1px solid #ccc;
  border-radius: 5px;
  background-color: white;
`;

const Input = styled.input`
  margin-bottom: 15px;
  padding: 10px;
  border: 1px solid #ccc;
  border-radius: 5px;
`;

const Button = styled.button`
  padding: 10px;
  border: none;
  border-radius: 5px;
  background-color: #007bff;
  color: white;
  cursor: pointer;

  &:hover {
    background-color: #0056b3;
  }
`;

const SignUpButton = styled(Button)`
  margin-top: 10px;
  background-color: #28a745;

  &:hover {
    background-color: #218838;
  }
`;

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null); // 에러 메시지 상태
  const navigate = useNavigate();

  // 로그인 처리
  const handleSubmit = async (e) => {
  e.preventDefault();

  try {
    // Django JWT 인증 엔드포인트로 요청
    const response = await axios.post('http://127.0.0.1:8000/api/token/', {
      username,
      password,
    });

    const { access, refresh } = response.data;

    // ✅ 토큰을 localStorage에 저장해서 로그인 유지
    localStorage.setItem('accessToken', access);
    localStorage.setItem('refreshToken', refresh);

    setError(null);
    console.log('로그인 성공:', response.data);

    // 홈 페이지로 이동
    navigate('/');
  } catch (err) {
    console.error('로그인 실패:', err.response?.data?.detail || err.message);
    setError('로그인 실패. 아이디와 비밀번호를 확인하세요.');
  }
};


  // 회원가입 페이지로 이동
  const handleSignUp = () => {
    navigate('/signup');
  };

  return (
    <Container>
      <h2>로그인</h2>

      {/* 에러 메시지 렌더링 */}
      {error && <p style={{ color: 'red' }}>{error}</p>}

      {/* 로그인 폼 */}
      <Form onSubmit={handleSubmit}>
        <Input
          type="text"
          placeholder="아이디"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
        />
        <Input
          type="password"
          placeholder="비밀번호"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <Button type="submit">로그인</Button>
      </Form>

      {/* 회원가입 버튼 */}
      <SignUpButton onClick={handleSignUp}>회원가입</SignUpButton>
    </Container>
  );
};

export default Login;