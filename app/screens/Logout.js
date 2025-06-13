import React, { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

export default function Logout({ navigation, onLogout }) {
  useEffect(() => {
    onLogout();
    navigation.navigate('HomePage');
  }, []);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" />
      <Text>로그아웃 중...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex:1, justifyContent:'center', alignItems:'center' }
});
