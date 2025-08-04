// components/Navbar.js
import { useNavigation } from '@react-navigation/native';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useAuth } from '../app/screens/Authcontext'; // AuthContext 임포트

const Navbar = () => {
  const navigation = useNavigation();
  const { isLoggedIn, logout } = useAuth(); // useAuth 훅 사용

  const handleLogout = () => {
    logout(); // AuthContext의 logout 함수 호출
    navigation.navigate('Home'); // 로그아웃 후 홈 화면으로 이동
  };

  return (
    <View style={styles.navbar}>
      <TouchableOpacity onPress={() => navigation.navigate('HomePage')}>
        <Text style={styles.logo}>Atheleo</Text>
      </TouchableOpacity>

      <View style={styles.menu}>
        {isLoggedIn ? (
          <> {/* 로그인 상태일 때 */}
            <TouchableOpacity onPress={() => navigation.navigate('ExerciseWithAI')}>
              <Text style={styles.menuItem}>운동</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => navigation.navigate('BodyAnalysis')}>
              <Text style={styles.menuItem}>체형분석</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => navigation.navigate('Subscribe')}>
              <Text style={styles.menuItem}>구독</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => navigation.navigate('Profile')}> {/* 마이페이지 */}
              <Text style={styles.menuItem}>마이페이지</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleLogout}>
              <Text style={styles.menuItem}>로그아웃</Text>
            </TouchableOpacity>
          </>
        ) : (
          <> {/* 로그아웃 상태일 때 */}
            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Text style={styles.menuItem}>로그인</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => navigation.navigate('Signup')}>
              <Text style={styles.menuItem}>회원가입</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => navigation.navigate('Subscribe')}>
              <Text style={styles.menuItem}>구독하기</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  navbar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#000',
    paddingHorizontal: 20,
    paddingVertical: 12,
    paddingTop: 50, // 상태바 높이 고려 (iOS/Android 공통)
    position: 'absolute',
    top: 0,
    width: '100%',
    zIndex: 1000,
  },
  logo: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  menu: {
    flexDirection: 'row',
  },
  menuItem: {
    color: '#fff',
    marginLeft: 15,
    fontSize: 16,
  },
});

export default Navbar;
