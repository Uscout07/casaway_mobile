import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  Modal,
  TouchableWithoutFeedback,
  Platform,
} from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { twMerge } from 'tailwind-merge';
import { SafeAreaView } from 'react-native-safe-area-context';

const API_BASE_URL = Constants.expoConfig?.extra?.API_BASE_URL || 'http://localhost:5000';

interface User {
  _id: string;
  name: string;
  username: string;
  profilePic?: string;
  role?: 'user' | 'ambassador' | 'admin';
}

export default function MobileNavBar() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [dropdownVisible, setDropdownVisible] = useState(false);
  const [imageError, setImageError] = useState(false);
  const navigation = useNavigation<any>();

  useEffect(() => {
    const fetchUser = async () => {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const res = await fetch(`${API_BASE_URL}/api/users/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok) {
          setUser(null);
          return;
        }

        const data = await res.json();
        console.log("Fetched user:", data); // Debug role field from backend

        setUser({
          ...data,
          _id: data._id?.toString() || data.id?.toString() || '',
          role: data.role as 'user' | 'ambassador' | 'admin' | undefined, // trust backend
        });
      } catch (err) {
        console.error('Error fetching user:', err);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, []);

  const handleLogout = async () => {
    await AsyncStorage.removeItem('token');
    navigation.reset({
      index: 0,
      routes: [{ name: 'Auth' }],
    });
  };

  const renderProfileImage = () => {
    if (imageError || !user?.profilePic) {
      return <Ionicons name="person-circle-outline" size={40} color="#888" />;
    }
    return (
      <Image
        source={{ uri: user.profilePic }}
        className="w-10 h-10 rounded-full"
        onError={() => setImageError(true)}
      />
    );
  };

  const renderDropdownMenu = () => {
    const userRole = user?.role ?? 'user'; // only default when consuming
    
    return (
      <View className="bg-ambient rounded-t-xl pb-8 pt-4">
        {/* View Profile - Always shown */}
        <TouchableOpacity
          className="px-5 py-3"
          onPress={() => {
            if (user?._id) {
              setDropdownVisible(false);
              navigation.navigate('Profile', { userId: user._id });
            }
          }}
        >
          <Text className="text-base text-gray-800">View Profile</Text>
        </TouchableOpacity>

        {/* Refer a friend - Only for ambassadors and admins */}
        {(userRole === 'ambassador' || userRole === 'admin') && (
          <TouchableOpacity
            className="px-5 py-3"
            onPress={() => {
              if (user?._id) {
                setDropdownVisible(false);
                navigation.navigate('Referrals', { userId: user._id });
              }
            }}
          >
            <Text className="text-base text-gray-800">Refer friend</Text>
          </TouchableOpacity>
        )}

        {/* Admin Panel - Only for admins */}
        {userRole === 'admin' && (
          <TouchableOpacity
            className="px-5 py-3"
            onPress={() => {
              setDropdownVisible(false);
              navigation.navigate('AdminPanel');
            }}
          >
            <Text className="text-base text-gray-800">Admin Panel</Text>
          </TouchableOpacity>
        )}

        {/* Separator - Only show if role-specific options exist */}
        {(userRole === 'ambassador' || userRole === 'admin') && (
          <View className="border-t border-gray-200 mx-5" />
        )}

        {/* Logout - Always shown */}
        <TouchableOpacity
          className="px-5 py-3"
          onPress={handleLogout}
        >
          <Text className="text-base text-red-600">Logout</Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <SafeAreaView>
      <View
        className={twMerge(
          'flex-row items-center justify-between w-full px-4 pt-4',
          Platform.OS === 'ios' ? 'pt-10 pb-2' : 'pt-6 pb-2',
          'bg-ambient'
        )}
      >
        <Image
          source={require('../assets/logo.png')}
          className="w-10 h-10"
          resizeMode="contain"
        />
        <View className='flex flex-row items-center gap-2 '>
          <TouchableOpacity
            onPress={() => navigation.navigate('Notifications')}
            className="w-10 h-10 rounded-full bg-forest-light items-center justify-center"
          >
            <View className="items-center justify-center w-full h-full">
              <MaterialIcons name="notifications" size={24} color="#214F3F" />
            </View>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => setDropdownVisible(true)}>
            {loading ? (
              <View className="w-10 h-10 bg-gray-300 rounded-full" />
            ) : (
              renderProfileImage()
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Dropdown */}
      <Modal
        visible={dropdownVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setDropdownVisible(false)}
      >
        <TouchableWithoutFeedback onPress={() => setDropdownVisible(false)}>
          <View className="flex-1 bg-black/50 justify-end">
            {renderDropdownMenu()}
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </SafeAreaView>
  );
}
