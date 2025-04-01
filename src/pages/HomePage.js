import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom'; // useNavigate 훅 임포트
import styled from 'styled-components';
import Navbar from '../components/Navbar'; // 경로 확인
import sampleImage from '../45614.jpg'; // 이미지 경로 수정
import historyImage from '../45616.jpg'; // 연혁 섹션 이미지
import aboutImage from '../45615.jpg'; // About Us 섹션 이미지
import atheleoaiImage from '../45617.jpg'; // Atheleo AI 섹션 이미지

const HomeContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100vh;
  text-align: center;
  background-image: url(${sampleImage}); /* 배경 이미지 설정 */
  background-size: cover; /* 배경 이미지 크기 조정 */
  background-position: center; /* 배경 이미지 위치 조정 */
  color: white; /* 텍스트 색상 */
`;

const SubscribeButton = styled.button`
  margin-top: 20px; /* 버튼과 텍스트 간의 간격 */
  background-color: #000000; /* 버튼 배경 색상 - 검은색 */
  color: white; /* 버튼 텍스트 색상 - 흰색 */
  border: none;
  border-radius: 5px;
  padding: 10px 20px; /* 버튼 패딩 */
  font-size: 16px; /* 버튼 글씨 크기 */
  cursor: pointer; /* 커서 변경 */
  &:hover {
    background-color: #444444; /* 호버 시 색상 변경 */
  }
`;

const Section = styled.section`
  position: relative; /* 배경 이미지 설정을 위한 상대 위치 */
  padding: 50px; /* 섹션 패딩 추가 */
  min-height: 100vh; /* 섹션 높이 설정 */
  display: flex; /* Flexbox 사용 */
  flex-direction: column; /* 세로 방향으로 정렬 */
  align-items: center; /* 가운데 정렬 */
  justify-content: center; /* 수직 가운데 정렬 */
  background-image: url(${(props) => props.bgImage}); /* 배경 이미지 설정 */
  background-size: cover; /* 배경 이미지 크기 조정 */
  background-position: center; /* 배경 이미지 위치 조정 */
  color: white; /* 기본 텍스트 색상 */
`;

const AboutSection = styled(Section)`
  color: white; /* About Us 섹션 텍스트 색상 변경 (예: 흰색) */
`;

const Divider = styled.div`
  height: 20px; /* 구분선 높이 */
  background-color: white; /* 구분선 색상 */
`;

const ScrollToTopButton = styled.button`
  position: fixed;
  bottom: 20px;
  right: 20px;
  background-color: #282c34; /* 버튼 배경 색상 */
  color: white; /* 버튼 텍스트 색상 */
  border: none;
  border-radius: 5px;
  padding: 10px 15px;
  cursor: pointer;
  z-index: 1000; /* 다른 요소 위에 표시되도록 설정 */
  display: ${({ show }) => (show ? 'block' : 'none')}; /* 상태에 따라 보이기/숨기기 */
`;

const HomePage = () => {
  const [showPopup, setShowPopup] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const navigate = useNavigate(); // useNavigate 훅 사용

  const handleScrollTo = (id) => {
    const section = document.getElementById(id);
    section.scrollIntoView({ behavior: 'smooth' });
  };

  const handleScrollTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubscribe = () => {
    // Subscribe.js로 이동
    navigate('/subscribe'); // 구독 페이지로 이동
  };

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 200) { // 200px 이상 스크롤 시
        setShowPopup(true);
        setShowScrollTop(true); // 스크롤 시 버튼 보이기
      } else {
        setShowPopup(false);
        setShowScrollTop(false); // 스크롤 상단으로 돌아가면 버튼 숨기기
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  return (
    <>
      <Navbar onScrollTo={handleScrollTo} showPopup={showPopup} /> {/* 네비게이션 바 추가 */}
      <HomeContainer>
        <h1>AI 피트니스 어시스턴트 Atheleo</h1>
        <p>체형 분석 및 운동 보조 시스템</p>
        <p>* 월 결제 19900원(옵션 별로 상이)</p>
        <SubscribeButton onClick={handleSubscribe}>AI 구독하기</SubscribeButton> {/* AI 구독하기 버튼 추가 */}
      </HomeContainer>
      
      <Divider /> {/* 구분선 추가 - 연혁 위에 위치 */}
      
      {/* 연혁 섹션 */}
      <Section id="history" bgImage={historyImage}>
        <h2>연혁</h2>
        <p>Atheleo 팀 2025년 3월 10일 구성</p>
        <p>2025년 3월 17일 | 캡스톤 디자인 과목을 통해 전체적인 홈페이지와 기능을 구상</p>
        <p>2025년 3월 24일 | 프로젝트 진행상황 첫 발표</p>
      </Section>
      <Divider /> {/* 구분선 추가 */}
      
      {/* About Us 섹션 */}
      <AboutSection id="about" bgImage={aboutImage}>
        <h2>About Us</h2>
        <p>팀장 | 전종혁</p>
        <p>담당업무: React를 이용한 프론트앤드 개발</p>
        <p>부팀장 | 김한수</p>
        <p>담당업무: Python을 이용한 Atheleo AI 개발</p>
      </AboutSection>
      <Divider /> {/* 구분선 추가 */}
      
      <Section id="atheleo" bgImage={atheleoaiImage}>
        <h2>Atheleo AI</h2>
        <p>Atheleo AI는 체형 분석과 운동 보조 프로그램입니다.</p>
        <p>다양한 사람들의 체형을 수집하고 분석하여, 이를 통해, 사용자와 비슷한 체형의 사람들이 했던 운동 루틴이나, 자신의 취약점인 부분을 운동할 수 있도록 돕습니다.</p>
        <p>원하는 부위의 운동을 난이도를 조절해 운동 강도의 조정이 가능하며, 잘못된 운동 자세의 교정을 돕습니다.</p>
      </Section>
      <Divider />
      <ScrollToTopButton onClick={handleScrollTop} show={showScrollTop}>
        맨 위로
      </ScrollToTopButton>
    </>
  );
};

export default HomePage;
