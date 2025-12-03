// app/screens/ExerciseHistory.js
import axios from 'axios';
import React, { useCallback, useEffect, useState, useRef } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BASE_API_URL } from '../config';
import { useAuth } from './Authcontext';
import { syncAllPendingHistory, getPendingHistoryCount } from '../utils/historySync';

const ExerciseHistory = () => {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [history, setHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [calendarDays, setCalendarDays] = useState([]);
  const [allHistory, setAllHistory] = useState([]); // 전체 기록 (캘린더 점 표시용)
  const [pendingCount, setPendingCount] = useState(0); // 미저장 기록 개수
  const [isSyncing, setIsSyncing] = useState(false); // 동기화 중 여부
  const fetchAllHistoryRef = useRef(null); // fetchAllHistory 함수 참조 (무한 루프 방지)
  const fetchHistoryRef = useRef(null); // fetchHistory 함수 참조 (무한 루프 방지)

  // 캘린더 날짜 생성
  useEffect(() => {
    const generateCalendar = () => {
      const year = selectedDate.getFullYear();
      const month = selectedDate.getMonth();
      const firstDay = new Date(year, month, 1);
      const lastDay = new Date(year, month + 1, 0);
      const daysInMonth = lastDay.getDate();
      const startingDayOfWeek = firstDay.getDay();

      const days = [];
      
      // 이전 달의 마지막 날들
      const prevMonthLastDay = new Date(year, month, 0).getDate();
      for (let i = startingDayOfWeek - 1; i >= 0; i--) {
        days.push({
          date: new Date(year, month - 1, prevMonthLastDay - i),
          isCurrentMonth: false,
        });
      }

      // 현재 달의 날들
      for (let i = 1; i <= daysInMonth; i++) {
        days.push({
          date: new Date(year, month, i),
          isCurrentMonth: true,
        });
      }

      // 다음 달의 첫 날들 (캘린더를 6주로 채우기)
      const remainingDays = 42 - days.length;
      for (let i = 1; i <= remainingDays; i++) {
        days.push({
          date: new Date(year, month + 1, i),
          isCurrentMonth: false,
        });
      }

      setCalendarDays(days);
    };

    generateCalendar();
  }, [selectedDate]);

  // 전체 운동 기록 불러오기 (캘린더 점 표시용)
  const fetchAllHistory = useCallback(async () => {
    if (!user?.token) {
      setAllHistory([]);
      return;
    }

    try {
      // 현재 월의 시작일과 종료일 계산
      const year = selectedDate.getFullYear();
      const month = selectedDate.getMonth();
      const startDate = new Date(year, month, 1);
      const endDate = new Date(year, month + 1, 0);
      
      const startDateStr = startDate.toISOString().split('T')[0];
      const endDateStr = endDate.toISOString().split('T')[0];
      
      console.log(`[ExerciseHistory] 📥 전체 기록 조회 중: ${startDateStr} ~ ${endDateStr}`);
      const response = await axios.get(
        `${BASE_API_URL}exercise/history/`,
        {
          params: { 
            start_date: startDateStr,
            end_date: endDateStr,
          },
          headers: { Authorization: `Token ${user.token}` },
        }
      );
      
      console.log(`[ExerciseHistory] 📥 전체 기록 API 응답:`, response.data);
      
      // API 응답 형식 처리
      let records = [];
      if (Array.isArray(response.data)) {
        records = response.data;
      } else if (response.data?.results && Array.isArray(response.data.results)) {
        records = response.data.results;
      } else if (response.data?.data && Array.isArray(response.data.data)) {
        records = response.data.data;
      }
      
      console.log(`[ExerciseHistory] ✅ 전체 기록 ${records.length}개 로드 완료`);
      setAllHistory(records);
    } catch (error) {
      // 405 에러는 GET 메서드가 지원되지 않음 (정상)
      if (error?.response?.status === 405 || error?.response?.status === 404 || error?.response?.status === 400) {
        // 조용히 처리 (API가 아직 구현되지 않았을 수 있음)
      } else {
        console.error('[ExerciseHistory] 전체 운동 기록 불러오기 실패:', error?.message || error);
      }
      setAllHistory([]);
    }
  }, [user?.token, selectedDate]);

  // fetchAllHistory 함수 참조 업데이트
  useEffect(() => {
    fetchAllHistoryRef.current = fetchAllHistory;
  }, [fetchAllHistory]);

  // 선택한 날짜의 운동 기록 불러오기
  const fetchHistory = useCallback(async () => {
    if (!user?.token) {
      setHistory([]);
      return;
    }

    setIsLoading(true);
    try {
      const dateStr = selectedDate.toISOString().split('T')[0]; // YYYY-MM-DD 형식
      console.log(`[ExerciseHistory] 📥 ${dateStr} 날짜의 운동 기록 조회 중...`);
      const response = await axios.get(
        `${BASE_API_URL}exercise/history/`,
        {
          params: { date: dateStr },
          headers: { Authorization: `Token ${user.token}` },
        }
      );
      
      console.log(`[ExerciseHistory] 📥 API 응답:`, response.data);
      
      // API 응답 형식 처리 (배열 또는 객체)
      let records = [];
      if (Array.isArray(response.data)) {
        records = response.data;
      } else if (response.data?.results && Array.isArray(response.data.results)) {
        records = response.data.results;
      } else if (response.data?.data && Array.isArray(response.data.data)) {
        records = response.data.data;
      }
      
      console.log(`[ExerciseHistory] ✅ ${records.length}개 기록 로드 완료`);
      setHistory(records);
    } catch (error) {
      // 405 에러는 GET 메서드가 지원되지 않음 (정상)
      if (error?.response?.status === 405 || error?.response?.status === 404 || error?.response?.status === 400) {
        // 조용히 처리 (API가 아직 구현되지 않았을 수 있음)
      } else {
        console.error('[ExerciseHistory] 운동 기록 불러오기 실패:', error?.message || error);
      }
      // 백엔드 API가 없을 경우 빈 배열로 처리
      setHistory([]);
    } finally {
      setIsLoading(false);
    }
  }, [user?.token, selectedDate]);

  // fetchHistory 함수 참조 업데이트
  useEffect(() => {
    fetchHistoryRef.current = fetchHistory;
  }, [fetchHistory]);

  // 미저장 기록 동기화
  const syncPendingHistory = useCallback(async () => {
    if (!user?.token || isSyncing) return;
    
    setIsSyncing(true);
    try {
      const count = await syncAllPendingHistory(user.token, BASE_API_URL);
      if (count > 0) {
        // 동기화 성공 시 기록 다시 불러오기 (ref를 통해 호출하여 무한 루프 방지)
        if (fetchAllHistoryRef.current) {
          await fetchAllHistoryRef.current();
        }
        if (fetchHistoryRef.current) {
          await fetchHistoryRef.current();
        }
      }
      // 미저장 기록 개수 업데이트
      const pendingCount = await getPendingHistoryCount();
      setPendingCount(pendingCount);
    } catch (error) {
      // 400 에러는 조용히 처리 (이미 처리된 기록이거나 잘못된 데이터)
      if (error?.response?.status !== 400) {
        console.error('[ExerciseHistory] 동기화 실패:', error?.message || error);
      }
      // 에러가 발생해도 계속 진행
    } finally {
      setIsSyncing(false);
    }
  }, [user?.token, isSyncing]);

  // 미저장 기록 개수 확인
  useEffect(() => {
    const checkPendingCount = async () => {
      const count = await getPendingHistoryCount();
      setPendingCount(count);
    };
    checkPendingCount();
  }, []);

  // 전체 기록 불러오기와 동기화는 별도로 처리 (무한 루프 방지)
  useEffect(() => {
    if (!user?.token) return; // 토큰이 없으면 실행하지 않음
    
    fetchAllHistory(); // 전체 기록 불러오기 (캘린더 점 표시용)
  }, [user?.token, fetchAllHistory]);

  // 동기화는 한 번만 실행 (마운트 시)
  useEffect(() => {
    if (!user?.token) return;
    
    // 동기화는 한 번만 실행하도록 플래그 사용
    let mounted = true;
    const doSync = async () => {
      if (mounted && !isSyncing) {
        await syncPendingHistory();
      }
    };
    doSync();
    
    return () => {
      mounted = false;
    };
  }, [user?.token]); // syncPendingHistory를 의존성에서 제거하여 무한 루프 방지

  useEffect(() => {
    fetchHistory(); // 선택한 날짜의 기록 불러오기
  }, [fetchHistory]);

  // 날짜 선택
  const handleDateSelect = (date) => {
    setSelectedDate(date);
  };

  // 이전 달
  const handlePrevMonth = () => {
    setSelectedDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth() - 1, 1));
  };

  // 다음 달
  const handleNextMonth = () => {
    setSelectedDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 1));
  };

  // 날짜가 오늘인지 확인
  const isToday = (date) => {
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  // 날짜가 선택된 날짜인지 확인
  const isSelected = (date) => {
    return (
      date.getDate() === selectedDate.getDate() &&
      date.getMonth() === selectedDate.getMonth() &&
      date.getFullYear() === selectedDate.getFullYear()
    );
  };

  // 해당 날짜에 운동 기록이 있는지 확인 (전체 기록에서 확인)
  const hasHistory = (date) => {
    try {
      if (!allHistory || allHistory.length === 0) return false;
      
      const dateStr = date.toISOString().split('T')[0]; // YYYY-MM-DD 형식
      
      return allHistory.some((record) => {
        if (!record) return false;
        
        // 다양한 날짜 필드명 지원
        const recordDate = record.date || record.start_time || record.created_at || record.date_created;
        if (!recordDate) return false;
        
        // 날짜 문자열 추출 (ISO 형식 또는 다른 형식)
        let recordDateStr = '';
        try {
          if (typeof recordDate === 'string') {
            // ISO 형식: "2024-11-27T10:30:00Z" -> "2024-11-27"
            recordDateStr = recordDate.split('T')[0];
          } else if (recordDate instanceof Date) {
            recordDateStr = recordDate.toISOString().split('T')[0];
          }
        } catch (e) {
          // 날짜 파싱 실패 시 무시
          return false;
        }
        
        return recordDateStr === dateStr;
      });
    } catch (error) {
      console.error('[ExerciseHistory] hasHistory 에러:', error?.message || error);
      return false;
    }
  };

  const monthNames = ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월'];
  const dayNames = ['일', '월', '화', '수', '목', '금', '토'];

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[
        styles.contentContainer,
        { paddingTop: insets.top + 100, paddingBottom: insets.bottom + 28 },
      ]}
    >
      <View style={styles.header}>
        <Text style={styles.title}>나의 운동 기록</Text>
        <Text style={styles.subtitle}>날짜를 선택하여 운동 기록을 확인하세요</Text>
      </View>

      {/* 캘린더 */}
      <View style={styles.calendarContainer}>
        {/* 월 네비게이션 */}
        <View style={styles.monthHeader}>
          <TouchableOpacity onPress={handlePrevMonth} style={styles.monthButton}>
            <Text style={styles.monthButtonText}>‹</Text>
          </TouchableOpacity>
          <Text style={styles.monthText}>
            {selectedDate.getFullYear()}년 {monthNames[selectedDate.getMonth()]}
          </Text>
          <TouchableOpacity onPress={handleNextMonth} style={styles.monthButton}>
            <Text style={styles.monthButtonText}>›</Text>
          </TouchableOpacity>
        </View>

        {/* 요일 헤더 */}
        <View style={styles.weekHeader}>
          {dayNames.map((day, index) => (
            <View key={index} style={styles.weekDay}>
              <Text style={styles.weekDayText}>{day}</Text>
            </View>
          ))}
        </View>

        {/* 캘린더 그리드 */}
        <View style={styles.calendarGrid}>
          {calendarDays.map((day, index) => {
            const date = day.date;
            const isCurrentMonth = day.isCurrentMonth;
            const isSelectedDate = isSelected(date);
            const isTodayDate = isToday(date);
            const hasRecord = hasHistory(date);

            return (
              <TouchableOpacity
                key={index}
                style={[
                  styles.calendarDay,
                  !isCurrentMonth && styles.calendarDayOtherMonth,
                  isSelectedDate && styles.calendarDaySelected,
                  isTodayDate && !isSelectedDate && styles.calendarDayToday,
                ]}
                onPress={() => handleDateSelect(date)}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.calendarDayText,
                    !isCurrentMonth && styles.calendarDayTextOtherMonth,
                    isSelectedDate && styles.calendarDayTextSelected,
                    isTodayDate && !isSelectedDate && styles.calendarDayTextToday,
                  ]}
                >
                  {date.getDate()}
                </Text>
                {hasRecord && <View style={styles.recordDot} />}
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* 선택한 날짜의 운동 기록 */}
      <View style={styles.historyContainer}>
        <Text style={styles.historyTitle}>
          {selectedDate.getFullYear()}년 {selectedDate.getMonth() + 1}월 {selectedDate.getDate()}일
        </Text>

        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#3E8EFF" />
          </View>
        ) : history.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>이 날짜에는 운동 기록이 없습니다.</Text>
          </View>
        ) : (
          <View style={styles.recordsList}>
            {history.map((record, index) => (
              <View key={index} style={styles.recordCard}>
                <View style={styles.recordHeader}>
                  <Text style={styles.recordExercise}>
                    {record.exercise === 'squat' ? '스쿼트' : record.exercise === 'push_up' ? '푸쉬업' : record.exercise}
                  </Text>
                  <Text style={styles.recordTime}>
                    {record.start_time ? new Date(record.start_time).toLocaleTimeString('ko-KR', {
                      hour: '2-digit',
                      minute: '2-digit',
                    }) : ''}
                  </Text>
                </View>
                <View style={styles.recordStats}>
                  <View style={styles.recordStat}>
                    <Text style={styles.recordStatLabel}>총 횟수</Text>
                    <Text style={styles.recordStatValue}>{record.total_reps || 0}회</Text>
                  </View>
                  <View style={styles.recordStat}>
                    <Text style={styles.recordStatLabel}>평균 점수</Text>
                    <Text style={styles.recordStatValue}>{record.average_score || 0}점</Text>
                  </View>
                  <View style={styles.recordStat}>
                    <Text style={styles.recordStatLabel}>세트</Text>
                    <Text style={styles.recordStatValue}>{record.total_sets || 0}세트</Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0B132B',
  },
  contentContainer: {
    padding: 20,
  },
  header: {
    marginBottom: 24,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#F4F9FF',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#C7D5F8',
    textAlign: 'center',
    marginBottom: 8,
  },
  syncButton: {
    marginTop: 12,
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(62, 142, 255, 0.2)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(62, 142, 255, 0.4)',
  },
  syncButtonText: {
    fontSize: 12,
    color: '#3E8EFF',
    fontWeight: '600',
    textAlign: 'center',
  },
  calendarContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(140, 186, 255, 0.2)',
  },
  monthHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  monthButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  monthButtonText: {
    fontSize: 24,
    color: '#3E8EFF',
    fontWeight: 'bold',
  },
  monthText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#F4F9FF',
  },
  weekHeader: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  weekDay: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
  },
  weekDayText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#8EAFFF',
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  calendarDay: {
    width: '14.28%',
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  calendarDayOtherMonth: {
    opacity: 0.3,
  },
  calendarDaySelected: {
    backgroundColor: '#3E8EFF',
    borderRadius: 8,
  },
  calendarDayToday: {
    borderWidth: 2,
    borderColor: '#3E8EFF',
    borderRadius: 8,
  },
  calendarDayText: {
    fontSize: 14,
    color: '#F4F9FF',
    fontWeight: '500',
  },
  calendarDayTextOtherMonth: {
    color: '#7D8BB4',
  },
  calendarDayTextSelected: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  calendarDayTextToday: {
    color: '#3E8EFF',
    fontWeight: 'bold',
  },
  recordDot: {
    position: 'absolute',
    bottom: 4,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#3E8EFF',
  },
  historyContainer: {
    marginTop: 8,
  },
  historyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#F4F9FF',
    marginBottom: 16,
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: '#7D8BB4',
  },
  recordsList: {
    gap: 12,
  },
  recordCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(140, 186, 255, 0.2)',
  },
  recordHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  recordExercise: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#F4F9FF',
  },
  recordTime: {
    fontSize: 12,
    color: '#8EAFFF',
  },
  recordStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  recordStat: {
    alignItems: 'center',
  },
  recordStatLabel: {
    fontSize: 12,
    color: '#7D8BB4',
    marginBottom: 4,
  },
  recordStatValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#3E8EFF',
  },
});

export default ExerciseHistory;

