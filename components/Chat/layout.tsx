import React from 'react';
import { View, Text, useWindowDimensions, Dimensions } from 'react-native';
import ChatList from './chatList';
import { useRoute } from '@react-navigation/native';

interface ChatLayoutProps {
  children: React.ReactNode;
}

const ChatLayout: React.FC<ChatLayoutProps> = ({ children }) => {
  const { width } = useWindowDimensions();
  const route = useRoute(); // useRoute needs to be imported
  const pathname = route.name; // This will give the route name in React Navigation

  const isDefaultChatPage = pathname === 'Messages';
  const isChatDetailPage = pathname === 'Chat'; // Updated to specifically match 'Chat' route name

  const screenWidth = Dimensions.get('window').width; // Dimensions needs to be imported
  const isDesktop = screenWidth >= 1024; // Tailwind lg breakpoint

  console.log(`[ChatLayout] Rendered. Screen Width: ${screenWidth}, Is Desktop: ${isDesktop}`);
  console.log(`[ChatLayout] Current Route Name (pathname): ${pathname}`);
  console.log(`[ChatLayout] Is Default Chat Page: ${isDefaultChatPage}`);
  console.log(`[ChatLayout] Is Chat Detail Page: ${isChatDetailPage}`);

  return (
    <View className="h-full flex-row bg-neutral-100 mt-[-10vh] pb-[10vh]">
      {/* Sidebar for desktop */}
      {isDesktop && (
        <View className="hidden lg:flex w-1/3 xl:w-1/4 min-w-[280px] max-w-[400px] border-r border-gray-200 bg-white">
          <ChatList />
          <Text className="text-xs text-center text-gray-500 p-2">[ChatLayout] Desktop Sidebar with ChatList</Text>
        </View>
      )}

      {/* Mobile view: chat list on default page */}
      {!isDesktop && isDefaultChatPage && (
        <View className="flex w-full bg-white">
          <ChatList />
          <Text className="text-xs text-center text-gray-500 p-2">[ChatLayout] Mobile Default Page with ChatList</Text>
        </View>
      )}

      {/* Main content area */}
      {(isDesktop || isChatDetailPage) && ( // Render main content if desktop or if on chat detail page (mobile)
        <View className={`flex-1 ${isDesktop ? '' : 'w-full'} bg-white`}>
          {children}
          <Text className="text-xs text-center text-gray-500 p-2">[ChatLayout] Main Content Area</Text>
        </View>
      )}
      {!isDesktop && !isDefaultChatPage && !isChatDetailPage && ( // Fallback for other mobile routes
        <View className="flex-1 w-full bg-white">
          {children}
          <Text className="text-xs text-center text-gray-500 p-2">[ChatLayout] Other Mobile Route</Text>
        </View>
      )}
    </View>
  );
};

export default ChatLayout;