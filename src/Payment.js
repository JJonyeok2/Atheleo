// src/Payment.js
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';

const Container = styled.div`
  min-height: 100vh;
  padding: 40px 20px;
  background-color: #121212;
  color: white;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
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
  background-color: #28a745;
  color: white;
  font-weight: bold;
  cursor: pointer;
  margin-top: 10px;
  &:hover {
    background-color: #218838;
  }
`;

const Payment = () => {
  const navigate = useNavigate();

  const [cardNumber, setCardNumber] = useState('');
  const [cardHolder, setCardHolder] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvc, setCvc] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();

    // 결제 처리 로직 예시 (실제 결제 API 연동 필요)
    if (!cardNumber || !cardHolder || !expiry || !cvc) {
      alert('모든 결제 정보를 입력해주세요.');
      return;
    }

    // 간단한 유효성 체크 (실제론 더 엄격히 체크 필요)
    if (cardNumber.length < 12 || cardNumber.length > 19) {
      alert('유효한 카드 번호를 입력해주세요.');
      return;
    }

    alert('결제가 완료되었습니다. 구독 서비스 이용을 환영합니다!');
    navigate('/'); // 결제 완료 후 홈페이지로 이동
  };

  return (
    <Container>
      <Title>구독 결제</Title>
      <Form onSubmit={handleSubmit}>
        <Input
          type="text"
          placeholder="카드 번호 (숫자만 입력)"
          value={cardNumber}
          onChange={(e) => setCardNumber(e.target.value.replace(/\D/g, ''))} // 숫자만 입력
          maxLength={19}
          required
        />
        <Input
          type="text"
          placeholder="카드 소유자 이름"
          value={cardHolder}
          onChange={(e) => setCardHolder(e.target.value)}
          required
        />
        <Input
          type="text"
          placeholder="만료일 (MM/YY)"
          value={expiry}
          onChange={(e) => setExpiry(e.target.value)}
          maxLength={5}
          required
        />
        <Input
          type="password"
          placeholder="CVC"
          value={cvc}
          onChange={(e) => setCvc(e.target.value.replace(/\D/g, ''))} // 숫자만
          maxLength={4}
          required
        />
        <Button type="submit">결제하기</Button>
      </Form>
    </Container>
  );
};

export default Payment;
