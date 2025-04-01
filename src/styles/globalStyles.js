// src/styles/GlobalStyle.js
import { createGlobalStyle } from 'styled-components';

const GlobalStyle = createGlobalStyle`
  body {
    margin: 0;
    padding: 0;
    background-color: #A9A9A9; /* 메탈릭 그레이 */
    color: #ffffff; /* 텍스트 기본색 */
    font-family: Arial, sans-serif;
  }

  h1, h2 {
    color: #ffffff; /* 헤드라인 색상 */
  }
`;

export default GlobalStyle;
