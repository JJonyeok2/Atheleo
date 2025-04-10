// src/Subscribe.js
import React, { useState } from 'react';
import styled from 'styled-components';
import { useNavigate } from 'react-router-dom'; // useNavigate 임포트

const Container = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100vh; /* 화면 전체 높이 */
  background-color: black; /* 배경색 검은색으로 변경 */
  color: white; /* 텍스트 색상 흰색으로 변경 */
  padding: 20px; /* 여백 추가 */
`;

const Description = styled.div`
  width: 100%; /* 전체 너비 */
  max-width: 600px; /* 최대 너비 설정 */
  background-color: #333; /* 카드 배경색 */
  color: white; /* 텍스트 색상 흰색으로 변경 */
  padding: 20px; /* 내부 여백 */
  border-radius: 5px; /* 모서리 둥글게 */
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.5); /* 그림자 효과 */
  margin-bottom: 20px; /* 버튼과의 간격 */
`;

const OptionContainer = styled.div`
  display: flex;
  justify-content: space-around;
  width: 100%;
  max-width: 800px; /* 최대 너비 설정 */
  margin-bottom: 20px; /* 카드 간격 */
`;

const OptionCard = styled.div`
  background-color: #444; /* 카드 배경색 */
  color: white; /* 텍스트 색상 */
  padding: 20px;
  border-radius: 5px; /* 모서리 둥글게 */
  width: 200px; /* 카드 너비 */
  text-align: center; /* 텍스트 중앙 정렬 */
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.5); /* 그림자 효과 */
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  width: 300px; /* 폼 너비 */
  padding: 20px;
  border: 1px solid #ccc; /* 테두리 */
  border-radius: 5px; /* 모서리 둥글게 */
  background-color: #222; /* 폼 배경색 */
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

const Subscribe = () => {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [benefitDescription, setBenefitDescription] = useState(''); // 구독 혜택 설명 상태
  const navigate = useNavigate(); // useNavigate 훅 사용

  const handleSubscribe = (e) => {
    e.preventDefault();
    // 구독 신청 로직 추가
    console.log('구독 신청:', { email, name, benefitDescription });

    // 결제 페이지로 이동하는 로직
    navigate('/payment'); // 결제 페이지로 이동 (예시)
  };

  const handleOptionSelect = (type) => {
    switch (type) {
      case 'FREE':
        setBenefitDescription('기본 구독: 무료로 제공되는 체형 분석 기능만 이용할 수 있습니다.');
        break;
      case 'Standard':
        setBenefitDescription('Standard 구독: 월 19,900원, 체형 분석 및 운동 보조 기능을 이용할 수 있습니다.');
        break;
      case 'Pro':
        setBenefitDescription('Pro 구독: 월 29,900원, 스탠다드 옵션에 추가로 1:1 운동 피드백 서비스를 제공합니다.');
        break;
      default:
        setBenefitDescription('');
    }
  };

  return (
    <Container>
      <h2>구독</h2>
      <Description>
        <p>
          각 구독 별로 이용할 수 있는 컨텐츠가 나누어져 있습니다.
        </p>
      </Description>

      <OptionContainer>
        <OptionCard>
          <h4>FREE</h4>
          <p>무료</p>
          <Button onClick={() => handleOptionSelect('FREE')}>선택하기</Button>
        </OptionCard>
        <OptionCard>
          <h4>Standard</h4>
          <p>월 19,900원</p>
          <Button onClick={() => handleOptionSelect('Standard')}>선택하기</Button>
        </OptionCard>
        <OptionCard>
          <h4>Pro</h4>
          <p>월 29,900원</p>
          <Button onClick={() => handleOptionSelect('Pro')}>선택하기</Button>
        </OptionCard>
      </OptionContainer>

      {benefitDescription && (
        <Description>
          <h3>선택한 구독 혜택</h3>
          <p>{benefitDescription}</p>
        </Description>
      )}

      <Form onSubmit={handleSubscribe}>
        <Input
          type="text"
          placeholder="이름"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
        <Input
          type="email"
          placeholder="이메일"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <Button type="submit">구독하기</Button>
      </Form>
    </Container>
  );
};

export default Subscribe;