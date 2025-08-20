// app/components/Chat/chatList.tsx - Native React Native Chat List
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  SafeAreaView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { StackNavigationProp } from '@react-navigation/stack';
import Constants from 'expo-constants';

interface UserPopulated {
  _id: string;
  name: string;
  email: string;
  profilePic?: string;
}

interface MessagePopulated {
  _id: string;
  sender: UserPopulated;
  content: string;
  createdAt: string;
  updatedAt: string;
}

interface Chat {
  _id: string;
  members: UserPopulated[];
  lastMessage?: MessagePopulated;
  isGroup: boolean;
  createdAt: string;
  updatedAt: string;
}

type RootStackParamList = {
  Auth: undefined;
  Chat: { id: string; chatName: string; chatMembers: UserPopulated[] }; // Updated to include chatName and chatMembers
  Profile: { userId: string }; // Add Profile to navigation stack
};

const ChatList: React.FC = () => {
  const [chats, setChats] = useState<Chat[] | any>([]); // allow any in case API returns object
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();

  // Using Constants.expoConfig?.extra?.API_BASE_URL for consistency with Expo config practices
  const API = Constants.expoConfig?.extra?.API_BASE_URL || 'http://localhost:5000';
  const [loggedInUserId, setLoggedInUserId] = useState<string | null>(null);

  useEffect(() => {
    const fetchUser = async () => {
      const userString = await AsyncStorage.getItem('user');
      if (userString) {
        try {
          const userObj = JSON.parse(userString);
          setLoggedInUserId(userObj._id);
        } catch (e) {
          console.error("Failed to parse user from AsyncStorage", e);
        }
      } else {
        navigation.navigate('Auth');
      }
    };
    fetchUser();
  }, []);

  useEffect(() => {
    if (loggedInUserId) {
      const fetchUserChats = async () => {
        setLoading(true);
        const token = await AsyncStorage.getItem('token');
        if (!token) {
          navigation.navigate('Auth');
          setLoading(false);
          return;
        }

        try {
          const response = await fetch(`${API}/api/chat/user`, {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.msg || 'Failed to fetch chats.');
          }

          const data = await response.json();
          setChats(data);
          setError(null);
        } catch (err) {
          console.error('Error fetching chats:', err);
          setError(err instanceof Error ? err.message : 'Failed to fetch chats.');
        } finally {
          setLoading(false);
        }
      };
      fetchUserChats();
    }
  }, [loggedInUserId, API, navigation]);

  const handleChatClick = (chat: Chat) => { // Modified to accept the entire chat object
    const otherMember = getOtherMemberInfo(chat);
    const chatName = chat.isGroup ? 'Group Chat' : otherMember.name;
    const chatMembers = chat.members;

    navigation.navigate('Chat', { id: chat._id, chatName: chatName, chatMembers: chatMembers });
  };

  const handleProfileClick = (userId: string) => {
    navigation.navigate('Profile', { userId: userId }); // Navigate to profile page
  };

  const getOtherMemberInfo = (chat: Chat) => {
    if (!loggedInUserId) {
      return { _id: '', name: "Loading User...", profilePic: undefined };
    }
    const otherMember = chat.members.find(member => member._id !== loggedInUserId);
    return otherMember || { _id: '', name: "Unknown User", profilePic: undefined };
  };

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-ambient">
        <ActivityIndicator size="large" color="#4A902C" />
        <Text className="mt-2 text-forest">Loading chats...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View className="flex-1 items-center justify-center p-4 bg-ambient">
        <Text className="text-red-500 text-center mb-4">{error}</Text>
        <TouchableOpacity
          onPress={() => {
            setError(null); // Clear error and try fetching again
            // You might want to re-run fetchUserChats here or navigate to a login screen
            navigation.replace('Auth'); // Example: Go back to login
          }}
          className="bg-forest px-4 py-2 rounded-md"
        >
          <Text className="text-white">Retry / Go to Login</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-ambient">
      <View className="p-4 border-b border-gray-200">
        <Text className="text-2xl font-bold text-forest">Your Chats</Text>
      </View>
      <ScrollView className="flex-1">
        {chats.length === 0 ? (
          <View className="flex-1 items-center justify-center mt-20 p-4">
            <Text className="text-gray-500 text-base text-center">
              No active chats yet. Start a conversation from a user's profile!
            </Text>
          </View>
        ) : (
          chats.map((chat: Chat) => {
            const otherMember = getOtherMemberInfo(chat);
            const lastMessage = chat.lastMessage;
            const shortName = otherMember.name?.split(' ')[0] || 'Someone';

            return (
              <TouchableOpacity
                key={chat._id}
                className="flex-row items-center p-4 border-b border-gray-200 active:bg-gray-100"
                onPress={() => handleChatClick(chat)} // Pass the entire chat object
              >
                {/* Profile Picture / Fallback Icon - Now clickable */}
                <TouchableOpacity
                  className="w-12 h-12 rounded-full overflow-hidden mr-4 items-center justify-center bg-gray-200"
                  onPress={(e) => {
                    // Prevent the parent TouchableOpacity's onPress from firing
                    e.stopPropagation();
                    if (otherMember._id) {
                      handleProfileClick(otherMember._id);
                    }
                  }}
                >
                  {otherMember.profilePic ? (
                    <Image
                      source={{ uri: otherMember.profilePic }}
                      className="w-full h-full"
                      resizeMode="cover"
                    />
                  ) : (
                    <Text className="text-lg text-gray-600">👤</Text>
                  )}
                </TouchableOpacity>
                <View className="flex-1">
                  <Text className="font-semibold text-forest text-base">
                    {chat.isGroup ? 'Group Chat' : otherMember.name}
                  </Text>
                  {lastMessage ? (
                    <Text className="text-xs text-gray-600" numberOfLines={1}>
                      <Text className="font-medium">
                        {lastMessage.sender._id === loggedInUserId
                          ? 'You: '
                          : `${shortName}: `}
                      </Text>
                      {lastMessage.content}
                    </Text>
                  ) : (
                    <Text className="text-xs text-gray-500 italic">
                      No messages yet.
                    </Text>
                  )}
                </View>
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

export default ChatList;