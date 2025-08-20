import React from 'react';
import { View, Text, useWindowDimensions } from 'react-native';
import ChatList from '../components/Chat/chatList';

const DefaultChatPage = () => {
  const { width } = useWindowDimensions();
  const isLargeScreen = width >= 1024; // Tailwind lg breakpoint

  if (!isLargeScreen) return <ChatList />;

  return (
    <View className="flex-1 items-center justify-center bg-neutral-100 px-4 py-6">
      <Text className="text-4xl text-gray-400 mb-4">💬</Text>
      <Text className="text-xl font-bold mb-2 text-center text-gray-700">
        Select a Chat to Start Messaging
      </Text>
      <Text className="text-sm text-center text-gray-500 max-w-md">
        Choose a conversation from the left sidebar to view messages or start a new chat from a user's profile.
      </Text>
    </View>
  );
};

export default DefaultChatPage;
