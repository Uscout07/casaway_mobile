import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { View } from 'react-native';
import MobileNavBar from './components/header';
import HomePage from './screens/HomePage';
import AuthScreen from './screens/AuthPage';
import SearchPage from './screens/SearchPage';
import SettingsPage from './screens/SettingsPage';
import MobileNav from './components/mobileNav';
import ChatPage from './screens/ChatPage';
import DefaultChatPage from './screens/DefaultChatPage';
import UploadPage from './screens/UploadPage';
import ListingDetailPage from './screens/ListingDetailsPage';
import ProfilePage from './screens/ProfilePage';
import ReferralPage from './screens/ReferalPage';
import NotificationPage from './screens/NotificationPage';

export type RootStackParamList = {
  Home: undefined;
  Auth: undefined;
  Search: undefined;
  Settings: undefined;
  Chat: undefined;
  messages: undefined;
  Upload: undefined;
  ListingDetail: undefined;
  Profile: undefined;
  Referrals: undefined; 
  Notifications: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  return (
  
      <NavigationContainer>
        <View className="flex-1 h-full mt-0 bg-ambient">
          <MobileNavBar />
          <Stack.Navigator
            initialRouteName="Home"
            screenOptions={{ headerShown: false }}
          >
            <Stack.Screen name="Home" component={HomePage} />
            <Stack.Screen name="Auth" component={AuthScreen} />
            <Stack.Screen name="Profile" component={ProfilePage} />
            <Stack.Screen name="Search" component={SearchPage} />
            <Stack.Screen name="Settings" component={SettingsPage} />
            <Stack.Screen name="messages" component={DefaultChatPage} />
            <Stack.Screen name="Chat" component={ChatPage} />
            <Stack.Screen name="Upload" component={UploadPage} />
            <Stack.Screen name="ListingDetail" component={ListingDetailPage} />
            <Stack.Screen name="Referrals" component={ReferralPage} />
            <Stack.Screen name ="Notifications" component={NotificationPage} />
          </Stack.Navigator>
          <MobileNav />
        </View>
      </NavigationContainer>
    
  );
}
