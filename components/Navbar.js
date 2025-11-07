import { useNavigation } from '@react-navigation/native'; // ❌ [수정됨] 대시(-) 하나 제거
import { Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
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
    <View style={[styles.navbar, { paddingTop: insets.top + 4 }]}> {/* ❌ [수정됨] 'HomePage' -> 'Home' */}
      <TouchableOpacity onPress={() => navigation.navigate('Home')} style={styles.logoWrap}>
        <Text style={styles.logo}>Atheleo</Text>
      </TouchableOpacity>

      <View style={styles.menu}>
        {isLoggedIn ? (
          <>
            <TouchableOpacity
              onPress={() => navigation.navigate('ExerciseWithAI')}
              style={styles.menuButton}
              activeOpacity={0.85}
            >
              <Text style={styles.menuItem}>운동</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => navigation.navigate('BodyAnalysisAI')}
              style={styles.menuButton}
              activeOpacity={0.85}
            >
              <Text style={styles.menuItem}>체형분석</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => navigation.navigate('Subscribe')} style={styles.menuButton} activeOpacity={0.85}>
              <Text style={styles.menuItem}>구독</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => navigation.navigate('Profile')} style={styles.menuButton} activeOpacity={0.85}>
              <Text style={styles.menuItem}>마이페이지</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleLogout} style={[styles.menuButton, styles.logoutButton]} activeOpacity={0.85}>
              <Text style={[styles.menuItem, styles.logoutText]}>로그아웃</Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <TouchableOpacity onPress={() => navigation.navigate('Login')} style={styles.menuButton} activeOpacity={0.85}>
              <Text style={styles.menuItem}>로그인</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => navigation.navigate('Signup')} style={styles.menuButton} activeOpacity={0.85}>
              <Text style={styles.menuItem}>회원가입</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => navigation.navigate('Subscribe')} style={styles.menuButton} activeOpacity={0.85}>
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
    paddingHorizontal: 24,
    paddingBottom: 14,
    position: 'absolute',
    top: 0,
    width: '100%',
    zIndex: 1000,
    backgroundColor: 'rgba(6, 19, 46, 0.55)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(88, 159, 255, 0.25)',
    shadowColor: '#0A84FF',
    shadowOpacity: Platform.OS === 'ios' ? 0.25 : 0.3,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 12 },
    elevation: 8,
  },
  logoWrap: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 18,
    backgroundColor: 'rgba(15, 40, 90, 0.45)',
    borderWidth: 1,
    borderColor: 'rgba(113, 179, 255, 0.4)',
  },
  logo: {
    color: '#F4F9FF',
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: 1,
  },
  menu: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuButton: {
    marginLeft: 12,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 16,
    backgroundColor: 'rgba(20, 54, 120, 0.35)',
    borderWidth: 1,
    borderColor: 'rgba(120, 193, 255, 0.32)',
  },
  menuItem: {
    color: '#E9F2FF',
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  logoutButton: {
    backgroundColor: 'rgba(255, 99, 98, 0.18)',
    borderColor: 'rgba(255, 99, 98, 0.45)',
  },
  logoutText: {
    color: '#FFD9D9',
  },
});

export default Navbar;
