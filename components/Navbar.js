import { useNavigation, useRoute } from '@react-navigation/native';
import React, { useState } from 'react';
import { Animated, Dimensions, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const screenWidth = Dimensions.get('window').width;

const Navbar = ({ onScrollTo }) => {
  const navigation = useNavigation();
  const route = useRoute();

  const [sidebarVisible, setSidebarVisible] = useState(false);
  const slideAnim = React.useRef(new Animated.Value(-250)).current; // 사이드바 시작 위치

  const toggleSidebar = () => {
    if (sidebarVisible) {
      Animated.timing(slideAnim, {
        toValue: -250,
        duration: 300,
        useNativeDriver: false,
      }).start(() => setSidebarVisible(false));
    } else {
      setSidebarVisible(true);
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: false,
      }).start();
    }
  };

  const handleNavPress = (screenName, section) => {
    if (route.name === 'Home' && onScrollTo && section) {
      onScrollTo(section);  // RN용 ScrollView ref로 스크롤 구현 필요
      toggleSidebar();
    } else {
      navigation.navigate(screenName);
      toggleSidebar();
    }
  };

  const isAuthPage = ['Login', 'Signup', 'Subscribe'].includes(route.name);

  return (
    <>
      <View style={styles.nav}>
        <TouchableOpacity onPress={() => navigation.navigate('Home')}>
          <Text style={styles.logo}>Atheleo</Text>
        </TouchableOpacity>

        <View style={styles.links}>
          {isAuthPage ? (
            <TouchableOpacity onPress={() => navigation.navigate('Home')}>
              <Text style={styles.linkText}>홈</Text>
            </TouchableOpacity>
          ) : (
            <>
              <TouchableOpacity onPress={() => handleNavPress('Home', 'history')}>
                <Text style={styles.linkText}>연혁</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => handleNavPress('Home', 'about')}>
                <Text style={styles.linkText}>About Us</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => handleNavPress('Home', 'atheleo')}>
                <Text style={styles.linkText}>Atheleo AI</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                <Text style={styles.linkText}>로그인</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => navigation.navigate('Subscribe')}>
                <Text style={styles.linkText}>구독하기</Text>
              </TouchableOpacity>
            </>
          )}
          <TouchableOpacity onPress={toggleSidebar} style={styles.hamburger}>
            <View style={styles.line} />
            <View style={styles.line} />
            <View style={styles.line} />
          </TouchableOpacity>
        </View>
      </View>

      {sidebarVisible && (
        <Animated.View style={[styles.sidebar, { right: slideAnim }]}>
          <Text style={styles.sidebarTitle}>사이드 바</Text>
          <TouchableOpacity onPress={() => { navigation.navigate('BodyAnalysis'); toggleSidebar(); }}>
            <Text style={styles.sidebarLink}>AI 체형 분석</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => { navigation.navigate('ExerciseAI'); toggleSidebar(); }}>
            <Text style={styles.sidebarLink}>AI 운동하기</Text>
          </TouchableOpacity>
        </Animated.View>
      )}
    </>
  );
};

const styles = StyleSheet.create({
  nav: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#000000',
    padding: 12,
    width: '100%',
    position: 'absolute',
    top: 0,
    zIndex: 1000,
  },
  logo: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
  },
  links: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  linkText: {
    color: 'white',
    marginHorizontal: 10,
    fontSize: 16,
  },
  hamburger: {
    marginLeft: 20,
    padding: 10,
  },
  line: {
    width: 25,
    height: 3,
    backgroundColor: 'white',
    marginVertical: 3,
  },
  sidebar: {
    position: 'absolute',
    top: 0,
    width: 250,
    height: '100%',
    backgroundColor: '#222222',
    padding: 20,
    zIndex: 1100,
    shadowColor: '#000',
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 5,
  },
  sidebarTitle: {
    color: 'white',
    fontSize: 22,
    marginBottom: 30,
  },
  sidebarLink: {
    color: 'white',
    fontSize: 18,
    marginVertical: 15,
  },
});

export default Navbar;
