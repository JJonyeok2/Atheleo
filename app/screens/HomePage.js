import { useNavigation } from '@react-navigation/native';
import React, { useRef, useState } from 'react';
import { ImageBackground, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const HomePage = () => {
  const scrollRef = useRef();
  const navigation = useNavigation();
  const [showScrollTop, setShowScrollTop] = useState(false);

  const handleScroll = (event) => {
    const y = event.nativeEvent.contentOffset.y;
    setShowScrollTop(y > 200);
  };

  const scrollToTop = () => {
    scrollRef.current.scrollTo({ y: 0, animated: true });
  };

  const handleNavigate = () => {
    navigation.navigate('Subscribe');
  };

  return (
    <View style={styles.container}>
      <ScrollView ref={scrollRef} onScroll={handleScroll} scrollEventThrottle={16}>

        <ImageBackground source={require('../../assets/45614.jpg')} style={styles.section}>
          <Text style={styles.header}>AI 피트니스 어시스턴트 Atheleo</Text>
          <Text style={styles.text}>체형 분석 및 운동 보조 시스템</Text>
          <Text style={styles.text}>* 월 결제 19900원(옵션 별로 상이)</Text>
          <TouchableOpacity onPress={handleNavigate} style={styles.button}>
            <Text style={styles.buttonText}>AI 구독하기</Text>
          </TouchableOpacity>
        </ImageBackground>

        <View style={styles.divider} />

        <ImageBackground source={require('../../assets/45616.jpg')} style={styles.section}>
          <Text style={styles.subHeader}>연혁</Text>
          <Text style={styles.text}>Atheleo 팀 2025년 3월 10일 구성</Text>
          <Text style={styles.text}>2025년 3월 17일 | 캡스톤 디자인 과목을 통해 전체적인 홈페이지와 기능을 구상</Text>
          <Text style={styles.text}>2025년 3월 24일 | 프로젝트 진행상황 첫 발표</Text>
        </ImageBackground>

        <View style={styles.divider} />

        <ImageBackground source={require('../../assets/45615.jpg')} style={styles.section}>
          <Text style={styles.subHeader}>About Us</Text>
          <Text style={styles.text}>팀장 | 전종혁</Text>
          <Text style={styles.text}>담당업무: React를 이용한 프론트앤드 개발</Text>
          <Text style={styles.text}>부팀장 | 김한수</Text>
          <Text style={styles.text}>담당업무: Python을 이용한 Atheleo AI 개발</Text>
        </ImageBackground>

        <View style={styles.divider} />

        <ImageBackground source={require('../../assets/45617.jpg')} style={styles.section}>
          <Text style={styles.subHeader}>Atheleo AI</Text>
          <Text style={styles.text}>Atheleo AI는 체형 분석과 운동 보조 프로그램입니다.</Text>
          <Text style={styles.text}>다양한 사람들의 체형을 수집하고 분석하여, 이를 통해, 사용자와 비슷한 체형의 사람들이 했던 운동 루틴이나, 자신의 취약점인 부분을 운동할 수 있도록 돕습니다.</Text>
          <Text style={styles.text}>원하는 부위의 운동을 난이도를 조절해 운동 강도의 조정이 가능하며, 잘못된 운동 자세의 교정을 돕습니다.</Text>
        </ImageBackground>

        <View style={{ height: 40 }} />
        <View style={{ padding: 20, alignItems: 'center' }}>
  <TouchableOpacity
    style={[styles.button, { backgroundColor: '#1E88E5' }]}
    onPress={() => navigation.navigate('Login')}
  >
    <Text style={styles.buttonText}>로그인</Text>
  </TouchableOpacity>
  <TouchableOpacity
    style={[styles.button, { backgroundColor: '#43A047', marginTop: 10 }]}
    onPress={() => navigation.navigate('Signup')}
  >
    <Text style={styles.buttonText}>회원가입</Text>
  </TouchableOpacity>
  <TouchableOpacity
    style={[styles.button, { backgroundColor: '#F4511E', marginTop: 10 }]}
    onPress={() => navigation.navigate('Subscribe')}
  >
    <Text style={styles.buttonText}>구독하기</Text>
  </TouchableOpacity>
</View>

      </ScrollView>

      {showScrollTop && (
        <TouchableOpacity style={styles.scrollTopButton} onPress={scrollToTop}>
          <Text style={styles.scrollTopText}>맨 위로</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000'
  },
  section: {
    width: '100%',
    minHeight: 500,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20
  },
  header: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'Black',
    textAlign: 'center',
    marginBottom: 10
  },
  subHeader: {
    fontSize: 22,
    fontWeight: '600',
    color: 'white',
    textAlign: 'center',
    marginBottom: 10
  },
  text: {
    fontSize: 16,
    color: 'white',
    textAlign: 'center',
    marginVertical: 4
  },
  button: {
    marginTop: 15,
    backgroundColor: 'black',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5
  },
  buttonText: {
    color: 'white',
    fontSize: 16
  },
  divider: {
    height: 10,
    backgroundColor: '#fff'
  },
  scrollTopButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    backgroundColor: '#444',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 5
  },
  scrollTopText: {
    color: 'white',
    fontSize: 14
  }
});

export default HomePage;    