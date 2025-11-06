import { useNavigation } from '@react-navigation/native'; // ❌ [수정됨] 대시(-) 하나 제거
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../app/screens/Authcontext';

const Navbar = () => {
  const navigation = useNavigation();
  const { isLoggedIn, logout } = useAuth();
  const insets = useSafeAreaInsets();

  const handleLogout = () => {
    logout();
    navigation.navigate('Home');
  };

  return (
    <View style={[styles.navbar, { paddingTop: insets.top }]}>
      <TouchableOpacity onPress={() => navigation.navigate('Home')}> {/* ❌ [수정됨] 'HomePage' -> 'Home' */}
        <Text style={styles.logo}>Atheleo</Text>
      </TouchableOpacity>

      <View style={styles.menu}>
        {isLoggedIn ? (
          <>
            <TouchableOpacity onPress={() => navigation.navigate('ExerciseWithAI')}>
              <Text style={styles.menuItem}>운동</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => navigation.navigate('BodyAnalysisAI')}> {/* ❌ [수정됨] 'BodyAnalysis' -> 'BodyAnalysisAI' */}
              <Text style={styles.menuItem}>체형분석</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => navigation.navigate('Subscribe')}>
              <Text style={styles.menuItem}>구독</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => navigation.navigate('Profile')}>
              <Text style={styles.menuItem}>마이페이지</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleLogout}>
              <Text style={styles.menuItem}>로그아웃</Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
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
    paddingBottom: 12,
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
