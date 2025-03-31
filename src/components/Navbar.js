// src/Navbar.js
import React, { useState } from 'react';
import styled from 'styled-components';
import { useLocation, Link } from 'react-router-dom';

const Nav = styled.nav`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  background-color: #000000;
  color: white;
  position: fixed;
  top: 0;
  width: 100%;
  z-index: 1000;
  border-bottom: 1px solid white; /* 얇은 하얀 실선 추가 */
`;

const NavLinks = styled.div`
  display: flex;
  gap: 1rem;
  margin-right: 2rem;
`;

const NavLink = styled(Link)` /* a 태그 대신 Link 사용 */
  color: white;
  text-decoration: none;
  cursor: pointer;
  padding: 1rem 1rem;
  font-size: 16px;
  line-height:1.5;
  &:hover {
    text-decoration: underline;
  }
`;

const Sidebar = styled.div`
  position: fixed;
  top: 0;
  right: ${({ isVisible }) => (isVisible ? '0' : '-300px')}; /* 사이드 바가 보이는지에 따라 위치 결정 */
  width: 250px; /* 사이드 바 너비 */
  height: 100vh; /* 화면 전체 높이 */
  background-color: #222; /* 사이드 바 배경색 */
  color: white; /* 텍스트 색상 흰색 */
  padding: 20px; /* 내부 여백 */
  box-shadow: -2px 0 5px rgba(0, 0, 0, 0.5); /* 그림자 효과 */
  transition: right 0.3s ease; /* 부드러운 전환 효과 */
  z-index: 999; /* 네비게이션 바 아래에 위치하도록 설정 */
  overflow-y: auto; /* 스크롤 가능하게 설정 */
`;

const SidebarLink = styled(Link)` /* a 태그 대신 Link 사용 */
  display: block;
  color: white;
  text-decoration: none;
  margin: 15px 0; /* 링크 간격 조정 */
  &:hover {
    text-decoration: underline;
  }
`;

const HamburgerButton = styled.button`
  background: none;
  border: none;
  cursor: pointer;
  padding: 10px;
  margin-left: 20px; /* 네비게이션 링크와 간격 */
`;

const Line = styled.div`
  width: 25px; /* 선의 너비 */
  height: 3px; /* 선의 높이 */
  background-color: white; /* 선의 색상 */
  margin: 4px 0; /* 선 간격 */
  transition: all 0.3s ease; /* 부드러운 전환 효과 */
`;

const Navbar = ({ onScrollTo }) => {
  const [isVisible, setIsVisible] = useState(false); // 사이드 바의 가시성 상태
  const location = useLocation(); // 현재 경로를 얻기 위해 useLocation 훅 사용

  const toggleSidebar = () => {
    setIsVisible(!isVisible); // 사이드 바 가시성 토글
  };

  return (
    <>
      <Nav>
        <Link to="/" style={{ color: 'white', textDecoration: 'none' }}>Atheleo</Link>
        <NavLinks>
          {location.pathname === '/login' || location.pathname === '/signup' || location.pathname === '/subscribe' ? (
            <NavLink to="/">홈</NavLink> // 홈 버튼만 보여줌
          ) : (
            <>
              <NavLink onClick={() => onScrollTo('history')}>연혁</NavLink>
              <NavLink onClick={() => onScrollTo('about')}>About Us</NavLink>
              <NavLink onClick={() => onScrollTo('atheleo')}>Atheleo AI</NavLink>
              <NavLink to="/login">로그인</NavLink>
              <NavLink to="/subscribe">구독하기</NavLink>
            </>
          )}
          <HamburgerButton onClick={toggleSidebar}>
            <Line />
            <Line />
            <Line />
          </HamburgerButton>
        </NavLinks>
      </Nav>
      <Sidebar isVisible={isVisible}>
        <h3 style={{ marginBottom: '50px' }}>사이드 바</h3> {/* 제목 아래 여백 추가 */}
        <SidebarLink to="/body-analysis">AI 체형 분석</SidebarLink> {/* 링크 수정 */}
        <SidebarLink to="/exercise-ai">AI 운동하기</SidebarLink> {/* 링크 수정 */}
      </Sidebar>
    </>
  );
};

export default Navbar;
