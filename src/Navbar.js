// src/Navbar.js
import React from 'react';
import styled from 'styled-components';
import { useLocation } from 'react-router-dom';

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
`;

const NavLinks = styled.div`
  display: flex;
  gap: 1rem;
  margin-right: 2rem;
`;

const NavLink = styled.a`
  color: white;
  text-decoration: none;
  cursor: pointer;
  padding: 0.5rem 1rem;
  &:hover {
    text-decoration: underline;
  }
`;

const Divider = styled.hr`
  border: none;
  height: 1px;
  background-color: white;
  margin: 0;
`;

const Navbar = ({ onScrollTo }) => {
  const location = useLocation(); // 현재 경로를 얻기 위해 useLocation 훅 사용

  return (
    <>
      <Nav>
        <a href="/" style={{ color: 'white', textDecoration: 'none' }}>Atheleo</a>
        <NavLinks>
          {location.pathname === '/login' || location.pathname === '/signup' || location.pathname === '/subscribe' ? (
            <NavLink href="/">홈</NavLink> // 홈 버튼만 보여줌
          ) : (
            <>
              <NavLink onClick={() => onScrollTo('history')}>연혁</NavLink>
              <NavLink onClick={() => onScrollTo('about')}>About Us</NavLink>
              <NavLink onClick={() => onScrollTo('atheleo')}>Atheleo AI</NavLink>
              <NavLink href="/login">로그인</NavLink>
              <NavLink href="/subscribe">구독하기</NavLink>
            </>
          )}
        </NavLinks>
      </Nav>
      <Divider />
    </>
  );
};

export default Navbar;
