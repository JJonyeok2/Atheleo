import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React, { useState } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';

import HomePage from '../screens/HomePage';
import Subscribe from '../screens/Subscribe';
import Login from './app/Login';
import Logout from './app/Logout';
import Payment from './app/Payment'; // 추가
import Profile from './app/Profile';
import Signup from './app/Signup';

const Stack = createNativeStackNavigator();

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const onLogin = () => setIsLoggedIn(true);
  const onLogout = () => setIsLoggedIn(false);

  const HeaderRightButtons = ({ navigation }) => (
    <View style={{ flexDirection: 'row', gap: 10 }}>
      <TouchableOpacity onPress={() => navigation.navigate('Subscribe')}>
        <Text style={{ color: 'blue', marginRight: 10 }}>구독하기</Text>
      </TouchableOpacity>
      {!isLoggedIn ? (
        <>
          <TouchableOpacity onPress={() => navigation.navigate('Login')}>
            <Text style={{ color: 'blue', marginRight: 10 }}>로그인</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.navigate('Signup')}>
            <Text style={{ color: 'blue' }}>회원가입</Text>
          </TouchableOpacity>
        </>
      ) : (
        <>
          <TouchableOpacity onPress={() => navigation.navigate('Profile')}>
            <Text style={{ color: 'blue', marginRight: 10 }}>프로필</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => {
            onLogout();
            navigation.navigate('HomePage');
          }}>
            <Text style={{ color: 'blue' }}>로그아웃</Text>
          </TouchableOpacity>
        </>
      )}
    </View>
  );

  return (
    <NavigationContainer>
      <Stack.Navigator
  initialRouteName="HomePage"
  screenOptions={({ navigation }) => ({
    headerTitle: 'Atheleo',
    headerRight: () => <HeaderRightButtons navigation={navigation} />,
    headerTitleAlign: 'center',
  })}
>

        <Stack.Screen
         name="HomePage"
         component={HomePage}
         options={{
         headerTitle: 'Atheleo',
         headerTitleAlign: 'center',
          }}
        />

        <Stack.Screen name="HomePage">
          {(props) => <HomePage {...props} isLoggedIn={isLoggedIn} />}
        </Stack.Screen>
        <Stack.Screen name="Login">
          {(props) => <Login {...props} onLogin={onLogin} />}
        </Stack.Screen>
        <Stack.Screen name="Signup" component={Signup} />
        <Stack.Screen name="Subscribe">
          {(props) => <Subscribe {...props} isLoggedIn={isLoggedIn} />}
        </Stack.Screen>
        <Stack.Screen name="Profile" component={Profile} />
        <Stack.Screen name="Payment" component={Payment} />
        <Stack.Screen name="Logout">
          {(props) => (
            <Logout
              {...props}
              onLogout={() => {
                onLogout();
                props.navigation.navigate('HomePage');
              }}
            />
          )}
        </Stack.Screen>
      </Stack.Navigator>
    </NavigationContainer>
  );
}
