// App.js
import 'react-native-gesture-handler';
import 'react-native-worklets-core';
import 'react-native-reanimated';
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ActivityIndicator, View, StyleSheet } from 'react-native';
import Navbar from './components/Navbar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import HomeScreen from './app/screens/HomeScreen';
import { AuthProvider, useAuth } from './app/screens/Authcontext';
import BodyAnalysisAI from './app/screens/BodyAnalysisAI';
import ExerciseWithAI from './app/screens/ExerciseWithAI';
import Login from './app/screens/Login';
import Payment from './app/screens/Payment';
import Profile from './app/screens/Profile';
import Signup from './app/screens/Signup';
import Subscribe from './app/screens/Subscribe';

const Stack = createNativeStackNavigator();

function AppNavigator() {
  const { isLoading } = useAuth();

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#8AB8FF" />
      </View>
    );
  }

  return (
    <Stack.Navigator
      initialRouteName="Home"
      screenOptions={{
        header: () => <Navbar />,
        headerShown: true,
        headerTransparent: true,
        headerShadowVisible: false,
        contentStyle: {
          backgroundColor: '#030614',
        },
      }}
    >
      <Stack.Screen 
        name="Home" 
        component={HomeScreen}
      />
      <Stack.Screen 
        name="Login" 
        component={Login}
      />
      <Stack.Screen 
        name="Signup" 
        component={Signup}
      />
      <Stack.Screen 
        name="Subscribe" 
        component={Subscribe}
      />
      <Stack.Screen 
        name="Profile" 
        component={Profile}
      />
      <Stack.Screen 
        name="Payment" 
        component={Payment}
      />
      <Stack.Screen 
        name="BodyAnalysisAI" 
        component={BodyAnalysisAI}
      />
      <Stack.Screen 
        name="ExerciseWithAI" 
        component={ExerciseWithAI}
        options={{
          headerShown: false,
        }}
      />
    </Stack.Navigator>
  );
}

export default function App() {
  return (
    <GestureHandlerRootView style={styles.container}>
      <AuthProvider>
        <NavigationContainer>
          <AppNavigator />
        </NavigationContainer>
      </AuthProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#030614',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#030614',
  },
});