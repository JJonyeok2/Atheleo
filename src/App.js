// src/App.js
import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import HomePage from './pages/HomePage';
import Login from './Login';
import Signup from './pages/Signup'; // Signup 컴포넌트 임포트
import Subscribe from './pages/Subscribe'; // pages 폴더에 위치할 경우
import Navbar from './components/Navbar'; // Navbar 컴포넌트 임포트
import GlobalStyle from './styles/globalStyles'; // 경로 확인
import BodyAnalysis from './components/BodyAnalysis'; // AI로 체형 분석 페이지 임포트
import ExerciseAI from './components/ExerciseAI'; // AI로 운동하기 페이지 임포트

const App = () => {
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
        <Route path="/body-analysis" element={<BodyAnalysis />} /> {/* AI로 체형 분석 페이지 추가 */}
        <Route path="/exercise-ai" element={<ExerciseAI />} /> {/* AI로 운동하기 페이지 추가 */}
      </Routes>
    </Router>
  );
};

export default App;
