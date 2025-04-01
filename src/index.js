import React from 'react';
import ReactDOM from 'react-dom/client'; // 'react-dom/client'에서 임포트
import App from './App';

const root = ReactDOM.createRoot(document.getElementById('root')); // 루트 생성
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
