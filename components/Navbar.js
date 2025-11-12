import { useNavigation } from '@react-navigation/native';
import React, { useCallback, useMemo, useState } from 'react';
import { Image, Platform, Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../app/screens/Authcontext';

const NAV_BG = '#0B132B';

const Navbar = () => {
  const navigation = useNavigation();
  const { isLoggedIn, logout } = useAuth();
  const insets = useSafeAreaInsets();
  const [isMenuOpen, setMenuOpen] = useState(false);

  const handleLogout = useCallback(() => {
    logout();
    navigation.navigate('Home');
    setMenuOpen(false);
  }, [logout, navigation]);

  const menuItems = useMemo(() => {
    if (isLoggedIn) {
      return [
        { label: '운동', action: () => navigation.navigate('ExerciseWithAI') },
        { label: '체형분석', action: () => navigation.navigate('BodyAnalysisAI') },
        { label: '구독', action: () => navigation.navigate('Subscribe') },
        { label: '프로필', action: () => navigation.navigate('Profile') },
        { label: '로그아웃', action: handleLogout, variant: 'danger' },
      ];
    }
    return [
      { label: '로그인', action: () => navigation.navigate('Login') },
      { label: '회원가입', action: () => navigation.navigate('Signup') },
      { label: '구독하기', action: () => navigation.navigate('Subscribe') },
    ];
  }, [handleLogout, isLoggedIn, navigation]);

  const toggleMenu = () => setMenuOpen((prev) => !prev);

  const handleMenuItemPress = (item) => {
    if (item.variant !== 'danger') {
      item.action();
      setMenuOpen(false);
    } else {
      item.action();
    }
  };

  return (
    <View style={[styles.navbar, { paddingTop: insets.top + 4, backgroundColor: NAV_BG }]}>
      <View style={styles.navbarContent}>
        <TouchableOpacity
          onPress={() => navigation.navigate('Home')}
          style={styles.logoWrap}
          activeOpacity={0.85}
          accessible
          accessibilityRole="button"
          accessibilityLabel="홈으로 이동"
        >
          <Image source={require('../assets/images/Header.png')} style={styles.logoImage} resizeMode="contain" />
        </TouchableOpacity>

        <TouchableOpacity onPress={toggleMenu} style={styles.hamburger} activeOpacity={0.85}>
          <View
            style={[
              styles.hamburgerLine,
              isMenuOpen ? styles.hamburgerLineActiveTop : styles.hamburgerLineDefaultTop,
            ]}
          />
          <View
            style={[
              styles.hamburgerLine,
              isMenuOpen ? styles.hamburgerLineActiveMiddle : styles.hamburgerLineDefaultMiddle,
            ]}
          />
          <View
            style={[
              styles.hamburgerLine,
              isMenuOpen ? styles.hamburgerLineActiveBottom : styles.hamburgerLineDefaultBottom,
            ]}
          />
        </TouchableOpacity>
      </View>

      {isMenuOpen && (
        <View pointerEvents="box-none" style={styles.dropdownContainer}>
          <Pressable style={styles.dropdownBackdrop} onPress={() => setMenuOpen(false)} />
          <View style={[styles.dropdownShadow, { top: insets.top + 56 }]}>
            <View style={styles.dropdown}>
              {menuItems.map((item) => (
                <TouchableOpacity
                  key={item.label}
                  style={[
                    styles.dropdownItem,
                    item.variant === 'danger' && styles.dropdownItemDanger,
                  ]}
                  activeOpacity={0.85}
                  onPress={() => handleMenuItemPress(item)}
                >
                  <Text
                    style={[
                      styles.dropdownItemText,
                      item.variant === 'danger' && styles.dropdownItemTextDanger,
                    ]}
                  >
                    {item.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  navbarContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    paddingLeft: 0,
    paddingRight: 20,
  },
  navbar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingLeft: 0,
    paddingRight: 16,
    paddingBottom: 14,
    position: 'absolute',
    top: 0,
    width: '100%',
    zIndex: 1000,
    backgroundColor: '#0B132B',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(88, 159, 255, 0.25)',
    shadowColor: '#0A84FF',
    shadowOpacity: Platform.OS === 'ios' ? 0.25 : 0,
    shadowRadius: Platform.OS === 'ios' ? 18 : 0,
    shadowOffset: { width: 0, height: Platform.OS === 'ios' ? 12 : 0 },
    elevation: Platform.OS === 'android' ? 8 : 0,
  },
  logoWrap: {
    paddingHorizontal: 0,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: 'transparent',
    borderWidth: 0,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  logoImage: {
    width: 188,
    height: 56,
    transform: [{ translateX: -22 }],
  },
  hamburger: {
    width: 46,
    height: 42,
    borderRadius: 16,
    backgroundColor: 'rgba(26, 41, 74, 0.6)',
    borderWidth: 1,
    borderColor: 'rgba(120, 193, 255, 0.32)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 10,
    marginLeft: 'auto',
    position: 'relative',
  },
  hamburgerLine: {
    position: 'absolute',
    left: 6,
    right: 6,
    height: 3,
    borderRadius: 3,
    backgroundColor: '#E9F2FF',
  },
  hamburgerLineDefaultTop: {
    transform: [{ translateY: -8 }],
  },
  hamburgerLineDefaultMiddle: {
    transform: [{ translateY: 0 }],
  },
  hamburgerLineDefaultBottom: {
    transform: [{ translateY: 8 }],
  },
  hamburgerLineActiveTop: {
    transform: [{ rotate: '45deg' }],
  },
  hamburgerLineActiveMiddle: {
    opacity: 0,
  },
  hamburgerLineActiveBottom: {
    transform: [{ rotate: '-45deg' }],
  },
  dropdownContainer: {
    position: 'absolute',
    top: 0,
    right: 0,
    left: 0,
    bottom: 0,
  },
  dropdownBackdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  dropdownShadow: {
    position: 'absolute',
    top: Platform.select({ ios: 80, android: 76 }),
    right: 18,
    borderRadius: 18,
    backgroundColor: '#09132D',
    shadowColor: '#0A84FF',
    shadowOpacity: 0.25,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 14 },
    elevation: 10,
    borderWidth: 1,
    borderColor: 'rgba(118, 174, 255, 0.28)',
  },
  dropdown: {
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: 'rgba(13, 27, 55, 0.92)',
    paddingVertical: 6,
  },
  dropdownItem: {
    paddingVertical: 12,
    paddingHorizontal: 18,
  },
  dropdownItemText: {
    color: '#E9F2FF',
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: 0.4,
  },
  dropdownItemDanger: {
    backgroundColor: 'rgba(255, 82, 82, 0.12)',
  },
  dropdownItemTextDanger: {
    color: '#FFC9C9',
  },
});

export default Navbar;
