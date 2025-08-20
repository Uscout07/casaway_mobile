import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { MaterialIcons, FontAwesome, AntDesign } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

const API_BASE_URL = Constants.expoConfig?.extra?.API_BASE_URL; 

const AuthScreen = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [loading, setLoading] = useState(false);
  const navigation = useNavigation<any>();

  const handleInputChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const validateForm = () => {
    if (!formData.email || !formData.password) {
      Alert.alert('Validation Error', 'Email and password are required.');
      return false;
    }

    if (!/\S+@\S+\.\S+/.test(formData.email)) {
      Alert.alert('Validation Error', 'Invalid email address.');
      return false;
    }

    if (!isLogin) {
      if (!formData.username) {
        Alert.alert('Validation Error', 'Username is required.');
        return false;
      }

      if (formData.password !== formData.confirmPassword) {
        Alert.alert('Validation Error', 'Passwords do not match.');
        return false;
      }

      if (formData.password.length < 6) {
        Alert.alert('Validation Error', 'Password must be at least 6 characters.');
        return false;
      }
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;
    setLoading(true);

    const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register';
    const payload = isLogin
      ? { email: formData.email, password: formData.password }
      : {
          username: formData.username,
          email: formData.email,
          password: formData.password,
        };

    try {
      const res = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.msg || 'Authentication failed');
      }

      if (data.token && data.user) {
        await AsyncStorage.setItem('token', data.token);
        await AsyncStorage.setItem('user', JSON.stringify(data.user));
        navigation.navigate('Home');
      } else {
        throw new Error('Invalid server response');
      }
    } catch (err: any) {
      Alert.alert('Auth Error', err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const toggleMode = () => {
    setIsLogin(prev => !prev);
    setFormData({ username: '', email: '', password: '', confirmPassword: '' });
  };

  return (
    <View className="flex-1 bg-ambient px-6 py-10 justify-center">
      {/* Header */}
      <View className="items-center mb-8">
        <View className="w-16 h-16 bg-forest rounded-full justify-center items-center">
          <MaterialIcons name="home" size={28} color="white" />
        </View>
        <Text className="text-2xl font-bold text-gray-900 mt-4">
          {isLogin ? 'Welcome Back' : 'Create Account'}
        </Text>
        <Text className="text-gray-600 mt-1">
          {isLogin ? 'Sign in to your account' : 'Join us and find your perfect home'}
        </Text>
      </View>

      {/* Form */}
      <View className="bg-white p-6 rounded-xl shadow gap-4">
        {!isLogin && (
          <TextInput
            placeholder="Username"
            value={formData.username}
            onChangeText={text => handleInputChange('username', text)}
            className="border border-gray-300 rounded-lg px-4 py-3"
          />
        )}

        <TextInput
          placeholder="Email"
          keyboardType="email-address"
          autoCapitalize="none"
          value={formData.email}
          onChangeText={text => handleInputChange('email', text)}
          className="border border-gray-300 rounded-lg px-4 py-3"
        />

        <TextInput
          placeholder="Password"
          secureTextEntry
          value={formData.password}
          onChangeText={text => handleInputChange('password', text)}
          className="border border-gray-300 rounded-lg px-4 py-3"
        />

        {!isLogin && (
          <TextInput
            placeholder="Confirm Password"
            secureTextEntry
            value={formData.confirmPassword}
            onChangeText={text => handleInputChange('confirmPassword', text)}
            className="border border-gray-300 rounded-lg px-4 py-3"
          />
        )}

        <Pressable
          onPress={handleSubmit}
          disabled={loading}
          className="bg-forest py-3 rounded-lg flex-row justify-center items-center"
        >
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <>
              <MaterialIcons
                name={isLogin ? 'login' : 'person-add-alt'}
                size={20}
                color="white"
              />
              <Text className="text-white ml-2">
                {isLogin ? 'Sign In' : 'Create Account'}
              </Text>
            </>
          )}
        </Pressable>
      </View>

      {/* Toggle */}
      <View className="mt-6 items-center">
        <Text className="text-gray-700">
          {isLogin ? "Don't have an account?" : 'Already have an account?'}{' '}
          <Text className="text-forest font-semibold" onPress={toggleMode}>
            {isLogin ? 'Sign up' : 'Sign in'}
          </Text>
        </Text>
      </View>

      {/* OR separator */}
      <View className="flex-row items-center my-6">
        <View className="flex-1 h-px bg-gray-300" />
        <Text className="mx-2 text-gray-500 text-sm">or continue with</Text>
        <View className="flex-1 h-px bg-gray-300" />
      </View>

      {/* Social Buttons */}
      <View className="flex-row justify-center gap-4 mb-[15vh]">
        <Pressable className="border border-gray-300 rounded-lg p-3 flex-row items-center">
          <AntDesign name="google" size={20} color="#EA4335" />
          <Text className="ml-2 text-gray-700">Google</Text>
        </Pressable>
        <Pressable className="border border-gray-300 rounded-lg p-3 flex-row items-center">
          <FontAwesome name="facebook" size={20} color="#1877F2" />
          <Text className="ml-2 text-gray-700">Facebook</Text>
        </Pressable>
      </View>
    </View>
  );
};

export default AuthScreen;
