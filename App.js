import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Feather } from '@expo/vector-icons'; // 아이콘 임포트 추가

import HomeScreen from './app/HomeScreen';
import { AuthProvider, useAuth } from './app/screens/Authcontext';
import BodyAnalysisAI from './app/screens/BodyAnalysisAI';
import ExerciseAIScreen from './app/screens/ExerciseAIScreen';
import ExerciseWithAI from './app/screens/ExerciseWithAI';
import Login from './app/screens/Login';
import Payment from './app/screens/Payment';
import Profile from './app/screens/Profile';
import Signup from './app/screens/Signup';
import Subscribe from './app/screens/Subscribe';

const Stack = createNativeStackNavigator();

function HeaderTitle({ navigation }) {
    const handlePress = () => {
        // 현재 화면이 Home이 아닐 경우에만 popToTop을 실행합니다.
        if (navigation.canGoBack()) {
            navigation.popToTop();
        }
    };

    return (
        <TouchableOpacity onPress={handlePress}>
            <Text style={styles.headerTitle}>Atheleo</Text>
        </TouchableOpacity>
    );
}

function HeaderRightButtons({ navigation }) {
    const { isLoggedIn, logout } = useAuth();

    const handleLogout = () => {
        logout();
        navigation.replace('Home');
    };

    return (
        <View style={styles.headerButtonsContainer}>
            {isLoggedIn ? (
                <>
                    <TouchableOpacity style={styles.iconButton} onPress={() => navigation.navigate('Profile')}>
                        <Feather name="user" size={24} color="#007bff" />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.iconButton} onPress={handleLogout}>
                        <Feather name="log-out" size={24} color="#007bff" />
                    </TouchableOpacity>
                </>
            ) : (
                <TouchableOpacity style={styles.button} onPress={() => navigation.navigate('Login')}>
                    <Text style={styles.buttonText}>로그인</Text>
                </TouchableOpacity>
            )}
        </View>
    );
}

function AppNavigator() {
  return (
    <Stack.Navigator
        initialRouteName="Home"
        screenOptions={({ navigation }) => ({
            headerTitle: () => <HeaderTitle navigation={navigation} />,
            headerBackVisible: false,
            headerTitleAlign: 'left',
            headerRight: () => <HeaderRightButtons navigation={navigation} />,
            headerStyle: { backgroundColor: '#f8f9fa' },
            headerTintColor: '#007bff',
        })}
    >
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="Login" component={Login} />
        <Stack.Screen name="Signup" component={Signup} />
        <Stack.Screen name="Subscribe" component={Subscribe} />
        <Stack.Screen name="Profile" component={Profile} />
        <Stack.Screen name="Payment" component={Payment} />
        <Stack.Screen name="ExerciseWithAI" component={ExerciseWithAI} />
        <Stack.Screen name="BodyAnalysisAI" component={BodyAnalysisAI} />
        <Stack.Screen name="ExerciseAIScreen" component={ExerciseAIScreen} />
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
        marginRight: 15,
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
    },
    iconButton: {
        paddingHorizontal: 10,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
});