import { NavigationContainer, useNavigation } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { AuthProvider, useAuth } from './app/screens/Authcontext';
import HomeScreen from './app/HomeScreen';
import BodyAnalysisAI from './app/screens/BodyAnalysisAI';
import ExerciseWithAI from './app/screens/ExerciseWithAI';
import Login from './app/screens/Login';
import Payment from './app/screens/Payment';
import Profile from './app/screens/Profile';
import Signup from './app/screens/Signup';
import Subscribe from './app/screens/Subscribe';

const Stack = createNativeStackNavigator();

function HeaderTitle() {
    const navigation = useNavigation();
    return (
        <TouchableOpacity onPress={() => navigation.popToTop()}>
            <Text style={styles.headerTitle}>Atheleo</Text>
        </TouchableOpacity>
    );
}

function HeaderRightButtons() {
    const { isLoggedIn, logout } = useAuth();
    const navigation = useNavigation();

    console.log('HeaderRightButtons - isLoggedIn:', isLoggedIn); // 디버깅용

    const handleLogout = () => {
        logout();
        navigation.replace('Home');
    };

    return (
        <View style={styles.headerButtonsContainer}>
            <TouchableOpacity style={styles.button} onPress={() => navigation.navigate('ExerciseWithAI')}>
                <Text style={styles.buttonText}>AI 운동하기</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.button} onPress={() => navigation.navigate('BodyAnalysisAI')}>
                <Text style={styles.buttonText}>체형 분석</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.button} onPress={() => navigation.navigate('Subscribe')}>
                <Text style={styles.buttonText}>구독하기</Text>
            </TouchableOpacity>
            {!isLoggedIn ? (
                <>
                    <TouchableOpacity style={styles.button} onPress={() => navigation.navigate('Login')}>
                        <Text style={styles.buttonText}>로그인</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.button} onPress={() => navigation.navigate('Signup')}>
                        <Text style={styles.buttonText}>회원가입</Text>
                    </TouchableOpacity>
                </>
            ) : (
                <>
                    <TouchableOpacity style={styles.button} onPress={() => navigation.navigate('Profile')}>
                        <Text style={styles.buttonText}>프로필</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.button} onPress={handleLogout}>
                        <Text style={styles.buttonText}>로그아웃</Text>
                    </TouchableOpacity>
                </>
            )}
        </View>
    );
}

function AppNavigator() {
  return (
    <Stack.Navigator
        initialRouteName="Home"
        screenOptions={{
            headerTitle: () => <HeaderTitle />,
            headerBackVisible: false, // 뒤로가기 버튼 숨기기
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
        <Stack.Screen name="ExerciseWithAI" component={ExerciseWithAI} />
        <Stack.Screen name="BodyAnalysisAI" component={BodyAnalysisAI} />
    </Stack.Navigator>
  );
}

export default function App() {
  return (
    <AuthProvider>
        <GestureHandlerRootView style={{ flex: 1 }}>
            <NavigationContainer>
                <AppNavigator />
            </NavigationContainer>
        </GestureHandlerRootView>
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
    headerTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#000',
    },
    headerButtonsContainer: {
        flexDirection: 'row',
        gap: 10,
        marginRight: 10,
    },
    button: {
        backgroundColor: '#007bff',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 5,
    },
    buttonText: {
        color: '#fff',
        fontWeight: 'bold',
    }
});