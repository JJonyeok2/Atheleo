// src/App.js
import React, { useEffect, useState } from "react";
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import HomePage from './pages/HomePage';
import Login from './Login';
import Signup from './Signup'; // Signup 컴포넌트 임포트
import Subscribe from './Subscribe'; // Subscribe 컴포넌트 임포트
import Navbar from './Navbar'; // Navbar 컴포넌트 임포트
import GlobalStyle from './styles/globalStyles'; // 경로 확인
import axios from 'axios';

const App = () => {
  const [message, setMessage] = useState('');

  useEffect(() => {
    axios
      .get('http://127.0.0.1:8000/api/login/')
      .then((response) => {
        setMessage(response.data.message); // JSON 변환 없이 바로 데이터 사용
      })
      .catch((error) => console.error('Error:', error));
    axios.post('http://127.0.0.1:8000/api/login/', {
        username: 'user1',
        password: '<PASSWORD>'
    })
        .then((response) => {
            console.log(response.data);

        })
        .catch((error) => console.error('Error:', error));
  }, []);

  const handleScrollTo = (section) => {
    const element = document.getElementById(section);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    } else {
      console.log(`Section ${section} not found.`);
    }
  };

  return (
    <Router>
      <GlobalStyle /> {/* 글로벌 스타일 적용 */}
      <Navbar onScrollTo={handleScrollTo} /> {/* 모든 페이지에 네비게이션 바 추가 */}
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} /> {/* 회원가입 페이지 추가 */}
        <Route path="/subscribe" element={<Subscribe />} /> {/* 구독 페이지로 변경 */}
      </Routes>
    </Router>
  );
};

export default App;