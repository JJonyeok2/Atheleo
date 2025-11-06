// 가장 먼저 worklets-core를 import해야 함
import 'react-native-worklets-core';
import {AppRegistry} from 'react-native';
import App from './App';
import {name as appName} from './app.json';

AppRegistry.registerComponent(appName, () => App);