// src/Signup.js
import React, { useState } from 'react';
import styled from 'styled-components';

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

const CheckboxContainer = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 15px; /* 체크박스 간격 */
`;

const Checkbox = styled.input`
  margin-right: 10px; /* 체크박스와 텍스트 간격 */
`;

const Label = styled.label`
  font-size: 0.9rem; /* 글자 크기 조정 */
  color: black; /* 글자 색상 */
`;

const Signup = () => {
  const [name, setName] = useState('');
  const [birthdate, setBirthdate] = useState(''); // 생년월일 상태 추가
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [id, setId] = useState('');
  const [password, setPassword] = useState('');
  const [privacyConsent, setPrivacyConsent] = useState(false);
  const [smsConsent, setSmsConsent] = useState(false);
  const [emailConsent, setEmailConsent] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    // 회원가입 처리 로직 추가
    console.log('회원가입 시도:', { name, birthdate, phone, email, id, password, privacyConsent, smsConsent, emailConsent });
  };

  return (
    <Container>
      <h2>회원가입</h2>
      <Form onSubmit={handleSubmit}>
        <Input
          type="text"
          placeholder="이름"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
        <Input
          type="date" // 생년월일 입력 필드
          placeholder="생년월일"
          value={birthdate}
          onChange={(e) => setBirthdate(e.target.value)}
          required
        />
        <Input
          type="tel"
          placeholder="연락처 (예: 010-1234-5678)"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          required
        />
        <Input
          type="email"
          placeholder="이메일"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
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
        
        <CheckboxContainer>
          <Checkbox
            type="checkbox"
            checked={privacyConsent}
            onChange={() => setPrivacyConsent(!privacyConsent)}
          />
          <Label>개인정보 처리방침에 동의합니다.</Label>
        </CheckboxContainer>

        <CheckboxContainer>
          <Checkbox
            type="checkbox"
            checked={smsConsent}
            onChange={() => setSmsConsent(!smsConsent)}
          />
          <Label>전화번호 문자 수신에 동의합니다.</Label>
        </CheckboxContainer>

        <CheckboxContainer>
          <Checkbox
            type="checkbox"
            checked={emailConsent}
            onChange={() => setEmailConsent(!emailConsent)}
          />
          <Label>이메일 수신에 동의합니다.</Label>
        </CheckboxContainer>

        <Button type="submit">회원가입</Button>
      </Form>
    </Container>
  );
};

export default Signup;
