import React, { useState } from 'react';
import styled from 'styled-components';
import { useLocation, Link, useNavigate } from 'react-router-dom';

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
  border-bottom: 1px solid white;
`;

const NavLinks = styled.div`
  display: flex;
  gap: 1rem;
  margin-right: 2rem;
`;

const NavLink = styled(Link)`
  color: white;
  text-decoration: none;
  cursor: pointer;
  padding: 1rem 1rem;
  &:hover {
    text-decoration: underline;
  }
`;

const Sidebar = styled.div`
  position: fixed;
  top: 0;
  right: ${({ isVisible }) => (isVisible ? '0' : '-300px')};
  width: 250px;
  height: 100vh;
  background-color: #222;
  color: white;
  padding: 20px;
  box-shadow: -2px 0 5px rgba(0, 0, 0, 0.5);
  transition: right 0.3s ease;
  z-index: 999;
  overflow-y: auto;
`;

const SidebarLink = styled(Link)`
  display: block;
  color: white;
  text-decoration: none;
  margin: 15px 0;
  &:hover {
    text-decoration: underline;
  }
`;

const HamburgerButton = styled.button`
  background: none;
  border: none;
  cursor: pointer;
  padding: 10px;
  margin-left: 20px;
`;

const Line = styled.div`
  width: 25px;
  height: 3px;
  background-color: white;
  margin: 4px 0;
  transition: all 0.3s ease;
`;

const LogoutButton = styled.button`
  background-color: #dc3545;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  cursor: pointer;

  &:hover {
    background-color: #c82333;
  }
`;

const Navbar = ({ onScrollTo }) => {
  const [isVisible, setIsVisible] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const toggleSidebar = () => {
    setIsVisible(!isVisible);
  };

  const handleLogout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    alert('로그아웃 되었습니다.');
    navigate('/login');
  };

  return (
    <>
      <Nav>
        <Link to="/" style={{ color: 'white', textDecoration: 'none' }}>Atheleo</Link>
        <NavLinks>
          {location.pathname === '/login' || location.pathname === '/signup' || location.pathname === '/subscribe' ? (
            <NavLink to="/">홈</NavLink>
          ) : (
            <>
              <NavLink onClick={() => onScrollTo('history')}>연혁</NavLink>
              <NavLink onClick={() => onScrollTo('about')}>About Us</NavLink>
              <NavLink onClick={() => onScrollTo('atheleo')}>Atheleo AI</NavLink>
              <NavLink to="/subscribe">구독하기</NavLink>
              <LogoutButton onClick={handleLogout}>로그아웃</LogoutButton>
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
        <h3 style={{ marginBottom: '50px' }}>사이드 바</h3>
        <SidebarLink to="/body-analysis">AI 체형 분석</SidebarLink>
        <SidebarLink to="/exercise-ai">AI 운동하기</SidebarLink>
      </Sidebar>
    </>
  );
};

export default Navbar;
