// src/services/apiService.js
import axios from 'axios';

const API_URL = 'https://your-ai-service/api'; // 실제 AI 서비스 API 엔드포인트로 교체하세요

export const analyzeBody = async (data) => {
  try {
    const response = await axios.post(`${API_URL}/analyze`, data);
    return response.data;
  } catch (error) {
    console.error('데이터 가져오기 오류:', error);
    throw error;
  }
};
