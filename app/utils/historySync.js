// app/utils/historySync.js
// 운동 기록 오프라인 저장 및 동기화 유틸리티

import AsyncStorage from '@react-native-async-storage/async-storage';

const PENDING_HISTORY_KEY = 'pending_exercise_history';

/**
 * 미저장 운동 기록을 로컬에 저장 (오프라인 대응)
 * @param {Object} historyData - 저장할 운동 기록 데이터
 */
export const savePendingHistory = async (historyData) => {
  try {
    const existing = await AsyncStorage.getItem(PENDING_HISTORY_KEY);
    const pendingList = existing ? JSON.parse(existing) : [];
    
    // 중복 방지: 같은 시간의 기록이 있으면 제거
    const filtered = pendingList.filter(
      (item) => item.start_time !== historyData.start_time
    );
    
    // 새 기록 추가
    filtered.push({
      ...historyData,
      _pending: true, // 미저장 표시
      _created_at: new Date().toISOString(), // 로컬 저장 시간
    });
    
    await AsyncStorage.setItem(PENDING_HISTORY_KEY, JSON.stringify(filtered));
    console.log('[HistorySync] ✅ 미저장 기록 로컬 저장 완료:', historyData);
    return true;
  } catch (error) {
    console.error('[HistorySync] ❌ 로컬 저장 실패:', error);
    return false;
  }
};

/**
 * 미저장 운동 기록 목록 가져오기
 * @returns {Array} 미저장 기록 배열
 */
export const getPendingHistory = async () => {
  try {
    const data = await AsyncStorage.getItem(PENDING_HISTORY_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('[HistorySync] ❌ 미저장 기록 불러오기 실패:', error);
    return [];
  }
};

/**
 * 서버에 운동 기록 저장 시도
 * @param {Object} historyData - 저장할 운동 기록 데이터
 * @param {string} token - 사용자 토큰
 * @param {string} baseUrl - API 기본 URL
 * @returns {Promise<boolean>} 저장 성공 여부
 */
export const syncHistoryToServer = async (historyData, token, baseUrl) => {
  try {
    const axios = require('axios').default;
    await axios.post(
      `${baseUrl}exercise/history/`,
      historyData,
      {
        headers: { Authorization: `Token ${token}` },
      }
    );
    return true;
  } catch (error) {
    console.error('[HistorySync] ❌ 서버 동기화 실패:', error);
    return false;
  }
};

/**
 * 미저장 기록들을 서버에 동기화
 * @param {string} token - 사용자 토큰
 * @param {string} baseUrl - API 기본 URL
 * @returns {Promise<number>} 동기화된 기록 수
 */
export const syncAllPendingHistory = async (token, baseUrl) => {
  try {
    const pendingList = await getPendingHistory();
    if (pendingList.length === 0) {
      return 0;
    }

    const axios = require('axios').default;
    let successCount = 0;
    const failedList = [];

    // 각 기록을 서버에 저장 시도
    for (const record of pendingList) {
      // _pending, _created_at 필드 제거 (서버에 전송하지 않음)
      const { _pending, _created_at, ...historyData } = record;
      
      try {
        await axios.post(
          `${baseUrl}exercise/history/`,
          historyData,
          {
            headers: { Authorization: `Token ${token}` },
          }
        );
        successCount++;
        console.log('[HistorySync] ✅ 동기화 성공:', historyData);
      } catch (error) {
        // 400 에러는 조용히 처리 (이미 처리된 기록이거나 잘못된 데이터)
        if (error?.response?.status !== 400) {
          console.error('[HistorySync] ❌ 동기화 실패:', error?.message || error);
        }
        failedList.push(record); // 실패한 기록은 다시 저장
      }
    }

    // 성공한 기록은 제거, 실패한 기록은 다시 저장
    if (successCount > 0) {
      if (failedList.length > 0) {
        await AsyncStorage.setItem(PENDING_HISTORY_KEY, JSON.stringify(failedList));
      } else {
        await AsyncStorage.removeItem(PENDING_HISTORY_KEY);
      }
      console.log(`[HistorySync] ✅ ${successCount}개 기록 동기화 완료`);
    }

    return successCount;
  } catch (error) {
    console.error('[HistorySync] ❌ 동기화 중 오류:', error);
    return 0;
  }
};

/**
 * 미저장 기록 개수 가져오기
 * @returns {Promise<number>} 미저장 기록 개수
 */
export const getPendingHistoryCount = async () => {
  try {
    const pendingList = await getPendingHistory();
    return pendingList.length;
  } catch (error) {
    return 0;
  }
};

