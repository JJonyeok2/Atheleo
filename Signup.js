// src/Signup.js
import React, { useState } from 'react'; // React import
import styled from 'styled-components'; // styled-components import
import axios from 'axios'; // axios import

// 스타일 컴포넌트
const Container = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100vh;
  background: linear-gradient(to bottom, #1e3a8a, #93c5fd, #e0f2fe);
`;

// ADD: Input 컴포넌트 정의 추가
const Input = styled.input`
  margin-bottom: 15px; 
  padding: 10px;
  border: 1px solid #ccc;
  border-radius: 5px;
`;

// ADD: Form 컴포넌트
const Form = styled.form`
  display: flex;
  flex-direction: column;
  width: 300px;
  padding: 20px;
  border: 1px solid #ccc;
  border-radius: 5px;
  background-color: white;
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

const CheckboxContainer = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 15px;
`;

const Checkbox = styled.input`
  margin-right: 10px;
`;

const Label = styled.label`
  font-size: 0.9rem;
  color: black;
`;

// Signup 컴포넌트 정의
const Signup = () => {
  const [name, setName] = useState('');
  const [birthdate, setBirthdate] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [id, setId] = useState('');
  const [password, setPassword] = useState('');
  const [privacyConsent, setPrivacyConsent] = useState(false);
  const [smsConsent, setSmsConsent] = useState(false);
  const [emailConsent, setEmailConsent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const formData = {
      name,
      birthdate,
      phone,
      email,
      username: id,
      password,
      privacy_consent: privacyConsent,
      sms_consent: smsConsent,
      email_consent: emailConsent,
    };

    try {
      const response = await axios.post('http://127.0.0.1:8000/api/signup/', formData);

      if (response.status === 201) {
        alert('회원가입 성공! 이제 로그인하세요.');
        setName('');
        setBirthdate('');
        setPhone('');
        setEmail('');
        setId('');
        setPassword('');
        setPrivacyConsent(false);
        setSmsConsent(false);
        setEmailConsent(false);
      }
    } catch (error) {
      console.error('회원가입 에러:', error.response?.data);
      alert('회원가입 실패: ' + (error.response?.data?.message || '알 수 없는 오류'));
    }
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
          type="date"
          placeholder="생년월일"
          value={birthdate}
          onChange={(e) => setBirthdate(e.target.value)}
          required
        />
        <Input
          type="tel"
          placeholder="연락처"
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