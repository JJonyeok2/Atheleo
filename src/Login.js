// src/Login.js
import React, { useState } from 'react';
import styled from 'styled-components';
import { useNavigate } from 'react-router-dom'; // useNavigate 임포트

const Container = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100vh; /* 화면 전체 높이 */
  background: linear-gradient(to bottom, #1E3A8A, #93C5FD, #E0F2FE);
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  width: 300px; /* 폼 너비 */
  padding: 20px;
  border: 1px solid #ccc; /* 테두리 */
  border-radius: 5px; /* 모서리 둥글게 */
  background-color: white; /* 폼 배경색 */
`;

const Input = styled.input`
  margin-bottom: 15px; /* 입력 필드 간격 */
  padding: 10px;
  border: 1px solid #ccc; /* 테두리 */
  border-radius: 5px; /* 모서리 둥글게 */
`;

const Button = styled.button`
  padding: 10px;
  border: none;
  border-radius: 5px; /* 모서리 둥글게 */
  background-color: #007bff; /* 버튼 색상 */
  color: white; /* 글자 색상 */
  cursor: pointer; /* 커서 변경 */
  
  &:hover {
    background-color: #0056b3; /* 버튼 호버 색상 */
  }
`;

const SignUpButton = styled(Button)`
  margin-top: 10px; /* 회원가입 버튼과 로그인 버튼 간격 */
  background-color: #28a745; /* 회원가입 버튼 색상 */
  
  &:hover {
    background-color: #218838; /* 회원가입 버튼 호버 색상 */
  }
`;

const Login = () => {
  const [id, setId] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate(); // useNavigate 훅 사용

  const handleSubmit = (e) => {
    e.preventDefault();
    // 로그인 처리 로직 추가
    console.log('로그인 시도:', { id, password });
  };

  const handleSignUp = () => {
    navigate('/signup'); // 회원가입 페이지로 이동
  };

  return (
    <Container>
      <h2>로그인</h2>
      <Form onSubmit={handleSubmit}>
        <Input
          type="text"
          placeholder="아이디"
          value={id}
          onChange={(e) => setId(e.target.value)}
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
      <SignUpButton onClick={handleSignUp}>회원가입</SignUpButton> {/* 회원가입 버튼 유지 */}
    </Container>
  );
};

export default Login;
