import { Feather } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useRef, useState } from 'react';
import { Animated, Dimensions, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

// 각 섹션에 대한 정보를 배열로 정의
const sections = [
  {
    key: 'main',
    image: require('../assets/45614.jpg'),
    title: 'AI 피트니스 어시스턴트 Atheleo',
    texts: ['체형 분석 및 운동 보조 시스템', '* 월 결제 19900원(옵션 별로 상이)'],
    buttons: [
      { text: 'AI 구독하기', screen: 'Subscribe', color: '#1E90FF' },
      { text: '체형 분석 시작하기', screen: 'BodyAnalysisAI', color: '#28a745' },
      { text: 'AI 운동 보조 시작하기', screen: 'ExerciseAIScreen', color: '#ffc107' },
    ],
  },
  {
    key: 'history',
    image: require('../assets/45615.jpg'),
    title: '연혁',
    texts: ['Atheleo -  Since 2025/3/10 ', '2025년 3월 17일 | 전체 홈페이지 기획', '2025년 3월 24일 | 1차 발표' , '2025년 8월 5일 | 모바일 서비스 전환'],
  },
  {
    key: 'about',
    image: require('../assets/45616.jpg'),
    title: 'About Us',
    texts: ['팀장 | 전종혁' , '부팀장 | 김한수 '],
  },
  {
    key: 'ai',
    image: require('../assets/45617.jpg'),
    title: 'Atheleo AI',
    texts: ['체형 분석 + 운동 추천 시스템', '자신과 유사한 체형의 운동 루틴 제공', '부위별 난이도 조정 + 자세 교정 피드백'],
  },
];

const { height: screenHeight } = Dimensions.get('window');

// 스크롤 애니메이션을 적용한 섹션 컴포넌트
const AnimatedSection = ({ section, scrollY, index }) => {
  const navigation = useNavigation();

  const position = Animated.subtract(index * screenHeight, scrollY);
  const isDisappearing = -screenHeight;
  const isTop = 0;
  const isBottom = screenHeight;
  const isAppearing = screenHeight;

  const translateY = position.interpolate({
    inputRange: [isDisappearing, isTop, isBottom, isAppearing],
    outputRange: [-50, 0, 0, 50],
    extrapolate: 'clamp',
  });

  const opacity = position.interpolate({
    inputRange: [isDisappearing, isTop, isBottom, isAppearing],
    outputRange: [0.5, 1, 1, 0.5],
    extrapolate: 'clamp',
  });

  return (
    <Animated.View style={[styles.section, { opacity, transform: [{ translateY }] }]}>
      <Image source={section.image} style={styles.backgroundImage} resizeMode="cover" />
      <View style={styles.overlay} />
      <View style={styles.contentContainer}>
        <Text style={styles.header}>{section.title}</Text>
        {section.texts.map((text, i) => (
          <Text key={i} style={styles.text}>{text}</Text>
        ))}
        {section.buttons && (
          <View style={styles.buttonContainer}>
            {section.buttons.map((button, i) => (
              <TouchableOpacity
                key={i}
                onPress={() => navigation.navigate(button.screen)}
                style={[styles.button, { backgroundColor: button.color, marginTop: 12 }]}
                activeOpacity={0.7}
              >
                <Text style={styles.buttonText}>{button.text}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>
    </Animated.View>
  );
};

export default function HomeScreen() {
  const scrollY = useRef(new Animated.Value(0)).current;
  const scrollViewRef = useRef(null);
  const [showScrollToTop, setShowScrollToTop] = useState(false);

    const onScroll = Animated.event(
    [{ nativeEvent: { contentOffset: { y: scrollY } } }],
    {
      useNativeDriver: true,
      listener: (event) => {
        const { y } = event.nativeEvent.contentOffset;
        setShowScrollToTop(y > screenHeight / 2);
      },
    }
  );

  const scrollToTop = () => {
    if (scrollViewRef.current) {
      scrollViewRef.current.scrollTo({ y: 0, animated: true });
    }
  };

  return (
    <View style={styles.container}>
      <Animated.ScrollView
        ref={scrollViewRef}
        onScroll={onScroll}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        snapToInterval={screenHeight} // 각 섹션이 화면에 딱 맞게 스크롤되도록 설정
        decelerationRate="fast"
      >
        {sections.map((section, index) => (
          <AnimatedSection key={section.key} section={section} scrollY={scrollY} index={index} />
        ))}
      </Animated.ScrollView>
      {showScrollToTop && (
        <TouchableOpacity style={styles.scrollToTopButton} onPress={scrollToTop}>
          <Feather name="arrow-up" size={24} color="white" />
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  section: {
    width: '100%',
    height: screenHeight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backgroundImage: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  contentContainer: {
    padding: 20,
    alignItems: 'center',
  },
  header: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
    marginBottom: 15,
  },
  text: {
    fontSize: 16,
    color: 'white',
    textAlign: 'center',
    marginVertical: 5,
  },
  buttonContainer: {
    marginTop: 20,
  },
  button: {
    paddingVertical: 14,
    paddingHorizontal: 30,
    borderRadius: 25,
    elevation: 5,
    alignItems: 'center',
    width: 300,
  },
  buttonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
  scrollToTopButton: {
    position: 'absolute',
    bottom: 30,
    right: 30,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
