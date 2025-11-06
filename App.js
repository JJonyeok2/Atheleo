// App.js
import 'react-native-gesture-handler';
import 'react-native-worklets-core';
import 'react-native-reanimated';
import React from 'react';
import { NavigationContainer, useNavigation } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

// --- 경로 수정 ---
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

// --- 헤더 컴포넌트 ---
function HeaderTitle() {
    const navigation = useNavigation();
    return (
        <TouchableOpacity onPress={() => navigation.navigate('Home')}>
            <Text style={styles.headerTitle}>Atheleo</Text>
        </TouchableOpacity>
    );
}

function HeaderRightButtons() {
    const { isLoggedIn, logout } = useAuth();
    const navigation = useNavigation();

    const handleLogout = () => {
        logout();
        navigation.replace('Home');
    };

    return (
        <View style={styles.headerButtonsContainer}>
            {isLoggedIn ? (
                <>
                    <TouchableOpacity style={styles.button} onPress={() => navigation.navigate('Profile')}>
                        <Text style={styles.buttonText}>프로필</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.button} onPress={handleLogout}>
                        <Text style={styles.buttonText}>로그아웃</Text>
                    </TouchableOpacity>
                </>
            ) : (
                <>
                    <TouchableOpacity style={styles.button} onPress={() => navigation.navigate('Login')}>
                        <Text style={styles.buttonText}>로그인</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.button} onPress={() => navigation.navigate('Signup')}>
                        <Text style={styles.buttonText}>회원가입</Text>
                    </TouchableOpacity>
                </>
            )}
        </View>
    );
}

// --- 메인 내비게이션 ---
function AppNavigator() {
    const { isLoading } = useAuth();

    if (isLoading) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <ActivityIndicator size="large" />
            </View>
        );
    }

    return (
        <Stack.Navigator
            initialRouteName="Home"
            screenOptions={{
                headerTitle: () => <HeaderTitle />,
                headerBackVisible: false,
                headerTitleAlign: 'left',
                headerRight: () => <HeaderRightButtons />,
                headerStyle: { backgroundColor: '#f8f9fa' },
                headerTintColor: '#007bff',
            }}
        >
            <Stack.Screen name="Home" component={HomeScreen} />
            <Stack.Screen name="Login" component={Login} />
            <Stack.Screen name="Signup" component={Signup} />
            <Stack.Screen name="Subscribe" component={Subscribe} />
            <Stack.Screen name="Profile" component={Profile} />
            <Stack.Screen name="Payment" component={Payment} />
            <Stack.Screen name="BodyAnalysisAI" component={BodyAnalysisAI} />
            <Stack.Screen name="ExerciseWithAI" component={ExerciseWithAI} />
        </Stack.Navigator>
    );
}

// --- 최종 앱 컴포넌트 ---
export default function App() {
    return (
        <GestureHandlerRootView style={{ flex: 1 }}>
            <AuthProvider>
                <NavigationContainer>
                    <AppNavigator />
                </NavigationContainer>
            </AuthProvider>
        </GestureHandlerRootView>
    );
}

// --- 스타일 ---
const styles = StyleSheet.create({
    headerTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#000000',
    },
    headerButtonsContainer: {
        flexDirection: 'row',
        marginRight: 10,
    },
    button: {
        marginLeft: 15,
        paddingVertical: 5,
        paddingHorizontal: 10,
        borderRadius: 5,
        backgroundColor: '#007bff',
    },
    buttonText: {
        color: '#ffffff',
        fontSize: 16,
    },
});
