import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ActivityIndicator,
  Dimensions,
  Alert,
  Modal, // Import Modal for message options
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { MaterialIcons } from '@expo/vector-icons';

interface UserPopulated {
  _id: string;
  name: string;
  email: string;
  profilePic?: string;
}

interface Message {
  _id: string;
  sender: UserPopulated;
  chat: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

const ChatPage: React.FC = () => {
  const { params } = useRoute<any>();
  const navigation = useNavigation<any>();

  const chatId = params?.id;
  const chatName = params?.chatName;
  const chatMembers = params?.chatMembers;

  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const scrollViewRef = useRef<ScrollView>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  // State for message options modal
  const [isMessageOptionsVisible, setIsMessageOptionsVisible] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [isEditingMessage, setIsEditingMessage] = useState(false); // New state for editing mode
  const [editedMessageContent, setEditedMessageContent] = useState(''); // New state for edited content


  const backendUrl = Constants.expoConfig?.extra?.API_BASE_URL || 'http://localhost:5000';

  // Helper function to check if message is within 24 hours
  const isWithin24Hours = (timestamp: string) => {
    return Date.now() - new Date(timestamp).getTime() <= 24 * 60 * 60 * 1000;
  };

  useEffect(() => {
    console.log('[ChatPage] Component mounted. Chat ID:', chatId, 'Chat Name:', chatName);
    console.log('[ChatPage] Chat Members:', chatMembers ? JSON.stringify(chatMembers.map((m: any) => ({ _id: m._id, name: m.name }))) : 'undefined');

    const loadUserData = async () => {
      try {
        console.log('[ChatPage] Attempting to load user data from AsyncStorage.');
        const userString = await AsyncStorage.getItem('user');
        if (userString) {
          const userObj = JSON.parse(userString);
          setCurrentUserId(userObj._id);
          console.log(`[ChatPage] Logged in userId: ${userObj._id}`);
        } else {
          console.log('[ChatPage] User not logged in. Navigating to Auth.');
          Alert.alert("Error", "User not logged in.");
          navigation.navigate('Auth');
        }
      } catch (e) {
        console.error("[ChatPage] Failed to load user data from AsyncStorage", e);
        Alert.alert("Error", "Failed to load user data.");
        navigation.navigate('Auth');
      }
    };
    loadUserData();
  }, [navigation, chatId, chatName, chatMembers]);


  const fetchMessages = useCallback(async () => {
    console.log('[ChatPage] fetchMessages called.');
    if (!chatId || !currentUserId) {
      console.log(`[ChatPage] Skipping fetchMessages: chatId or currentUserId missing. ChatId: ${chatId}, UserId: ${currentUserId}`);
      setLoading(false);
      return;
    }

    setLoading(true);
    console.log('[ChatPage] Fetching token from AsyncStorage...');
    const token = await AsyncStorage.getItem('token');
    if (!token) {
      console.log('[ChatPage] No token found for fetching messages. Navigating to Auth.');
      Alert.alert("Authentication Error", "No token found. Please log in again.");
      navigation.navigate('Auth');
      setLoading(false);
      return;
    }
    console.log('[ChatPage] Token found. Making API call to fetch messages.');

    try {
      console.log(`[ChatPage] API call to: ${backendUrl}/api/message/${chatId}`);
      const response = await fetch(`${backendUrl}/api/message/${chatId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error(`[ChatPage] API response not OK. Status: ${response.status}, Error: ${JSON.stringify(errorData)}`);
        throw new Error(errorData.msg || 'Failed to fetch messages.');
      }

      const data = await response.json();
      console.log(`[ChatPage] Successfully fetched ${data.length} messages.`);
      setMessages(data);
      setError(null);
    } catch (err) {
      console.error('[ChatPage] Error fetching messages:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch messages.');
      Alert.alert("Error", err instanceof Error ? err.message : 'Failed to fetch messages.');
    } finally {
      setLoading(false);
      console.log('[ChatPage] Message fetch process finished. Loading set to false.');
    }
  }, [chatId, currentUserId, backendUrl, navigation]);

  useEffect(() => {
    if (chatId && currentUserId) {
      console.log('[ChatPage] Triggering fetchMessages due to chatId or currentUserId change.');
      fetchMessages();
    } else {
      console.log('[ChatPage] Waiting for chatId and currentUserId to trigger message fetch.');
    }
  }, [fetchMessages, chatId, currentUserId]);

  useEffect(() => {
    if (scrollViewRef.current && messages.length > 0) {
      console.log('[ChatPage] Messages updated, scrolling to bottom.');
      scrollViewRef.current.scrollToEnd({ animated: true });
    } else if (messages.length === 0) {
      console.log('[ChatPage] No messages yet, not scrolling.');
    }
  }, [messages]);

  const sendMessage = useCallback(async () => {
    if (!newMessage.trim() || !chatId || !currentUserId) {
      console.log(`[ChatPage] Skipping sendMessage: newMessage empty, chatId or currentUserId missing.
        NewMessage: '${newMessage.trim()}', ChatId: ${chatId}, UserId: ${currentUserId}`);
      return;
    }

    const token = await AsyncStorage.getItem('token');
    if (!token) {
      console.log('[ChatPage] No token found for sending message. Navigating to Auth.');
      Alert.alert("Authentication Error", "No token found. Please log in again.");
      navigation.navigate('Auth');
      return;
    }
    console.log(`[ChatPage] Token found. Attempting to send message: "${newMessage}" to chat ${chatId}`);

    try {
      console.log(`[ChatPage] Making API call to: ${backendUrl}/api/message`);
      const response = await fetch(`${backendUrl}/api/message`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          chatId: chatId,
          content: newMessage,
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error(`[ChatPage] Send message API response not OK. Status: ${response.status}, Error: ${JSON.stringify(errorData)}`);
        throw new Error(errorData.msg || 'Failed to send message.');
      }

      const sentMessage = await response.json();
      console.log('[ChatPage] Message sent successfully:', sentMessage);
      setMessages((prevMessages) => [...prevMessages, sentMessage]);
      setNewMessage('');
      setError(null);
    } catch (err) {
      console.error('[ChatPage] Error sending message:', err);
      setError(err instanceof Error ? err.message : 'Failed to send message.');
      Alert.alert("Error", err instanceof Error ? err.message : 'Failed to send message.');
    }
  }, [newMessage, chatId, currentUserId, backendUrl, navigation]);


  // --- Message Options / Edit / Delete Functions ---
  const handleLongPressMessage = (message: Message) => {
    setSelectedMessage(message);
    setEditedMessageContent(message.content);
    setIsMessageOptionsVisible(true);
  };

  const handleDeleteForMe = async () => {
    if (!selectedMessage) return;
    setIsMessageOptionsVisible(false);

    Alert.alert(
      "Delete Message for Me",
      "Are you sure you want to delete this message for yourself?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            const token = await AsyncStorage.getItem('token');
            if (!token) {
              Alert.alert("Authentication Error", "Please log in again.");
              navigation.navigate('Auth');
              return;
            }

            try {
              const response = await fetch(`${backendUrl}/api/message/delete-for-me/${selectedMessage._id}`, {
                method: 'DELETE',
                headers: {
                  'Authorization': `Bearer ${token}`
                }
              });

              if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.msg || 'Failed to delete message for me.');
              }

              setMessages(prev => prev.filter(msg => msg._id !== selectedMessage._id));
              setSelectedMessage(null);
            } catch (err) {
              Alert.alert("Error", err instanceof Error ? err.message : "Failed to delete message for me.");
            }
          }
        }
      ]
    );
  };

  const handleDeleteForEveryone = async () => {
    if (!selectedMessage) return;
    setIsMessageOptionsVisible(false);

    Alert.alert(
      "Delete Message for Everyone",
      "Are you sure you want to delete this message for everyone?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            const token = await AsyncStorage.getItem('token');
            if (!token) {
              Alert.alert("Authentication Error", "Please log in again.");
              navigation.navigate('Auth');
              return;
            }

            try {
              const response = await fetch(`${backendUrl}/api/message/delete-for-everyone/${selectedMessage._id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
              });

              if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.msg || 'Failed to delete message for everyone.');
              }

              setMessages(prev => prev.filter(msg => msg._id !== selectedMessage._id));
              setSelectedMessage(null);
            } catch (err) {
              Alert.alert("Error", err instanceof Error ? err.message : "Failed to delete message for everyone.");
            }
          }
        }
      ]
    );
  };

  const handleEditMessage = () => {
    if (!selectedMessage) return;
    setIsMessageOptionsVisible(false); // Close options modal
    setIsEditingMessage(true); // Open edit input modal/view
  };

  const confirmEditMessage = async () => {
    if (!selectedMessage || !editedMessageContent.trim()) {
      console.log('[ChatPage] Edit skipped: No message selected or content empty.');
      Alert.alert("Error", "Message content cannot be empty.");
      return;
    }

    console.log(`[ChatPage] Attempting to edit message: ${selectedMessage._id} with new content: "${editedMessageContent}"`);
    const token = await AsyncStorage.getItem('token');
    if (!token) {
      Alert.alert("Authentication Error", "No token found. Please log in again.");
      navigation.navigate('Auth');
      return;
    }

    try {
      const response = await fetch(`${backendUrl}/api/message/edit/${selectedMessage._id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ content: editedMessageContent })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.msg || 'Failed to edit message.');
      }

      const updatedMessage = await response.json();
      console.log('[ChatPage] Message edited successfully:', updatedMessage);
      setMessages((prevMessages) =>
        prevMessages.map((msg) => (msg._id === updatedMessage._id ? updatedMessage : msg))
      );
      setIsEditingMessage(false); // Close edit modal
      setSelectedMessage(null); // Clear selected message
      setEditedMessageContent(''); // Clear edit input
    } catch (err) {
      console.error('[ChatPage] Error editing message:', err);
      Alert.alert("Error", err instanceof Error ? err.message : 'Failed to edit message.');
    }
  };


  if (loading) {
    console.log('[ChatPage] Displaying loading indicator.');
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-ambient">
        <ActivityIndicator size="large" color="#4A902C" />
        <Text className="mt-2 text-forest">Loading messages...</Text>
      </SafeAreaView>
    );
  }

  if (error) {
    console.log(`[ChatPage] Displaying error message: ${error}`);
    return (
      <SafeAreaView className="flex-1 items-center justify-center p-4 bg-ambient">
        <Text className="text-red-500 text-center mb-4">{error}</Text>
        <TouchableOpacity
          onPress={fetchMessages}
          className="bg-forest px-4 py-2 rounded-md"
        >
          <Text className="text-white">Retry</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => navigation.navigate('Auth')}
          className="mt-2 bg-gray-500 px-4 py-2 rounded-md"
        >
          <Text className="text-white">Go to Login</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const otherChatMembers = chatMembers?.filter((member: UserPopulated) => member._id !== currentUserId) || [];
  const displayChatName = chatName || (otherChatMembers.length > 0 ? otherChatMembers[0].name : "Chat");
  console.log(`[ChatPage] Rendering ChatPage for chat: ${displayChatName}`);

  return (
    <SafeAreaView className="flex-1 bg-ambient">
      <View className="p-4 border-b border-gray-200 flex-row items-center">
        <TouchableOpacity onPress={() => {
          console.log('[ChatPage] Back button pressed. Navigating back.');
          navigation.goBack();
        }} className="mr-3">
          <MaterialIcons name="arrow-back" size={24} color="#214F3F" />
        </TouchableOpacity>
        <Text className="text-xl font-bold text-forest">{displayChatName}</Text>
      </View>

      <ScrollView
        ref={scrollViewRef}
        className="flex-1 p-4"
        contentContainerStyle={{ paddingBottom: 20 }}
      >
        {messages.length === 0 ? (
          <View className="flex-1 items-center justify-center mt-20">
            <Text className="text-gray-500 text-base">No messages yet. Start the conversation!</Text>
          </View>
        ) : (
          messages.map((msg, index) => {
            const isSender = msg.sender._id === currentUserId;
            return (
              <TouchableOpacity
                key={msg._id || index}
                className={`flex-row my-1 ${isSender ? 'justify-end' : 'justify-start'}`}
                onLongPress={() => handleLongPressMessage(msg)}
              >
                <View
                  className={`max-w-[80%] p-3 rounded-lg ${isSender ? 'bg-forest ml-auto' : 'bg-white mr-auto'
                    }`}
                >
                  <Text className={isSender ? 'text-white' : 'text-black'}>
                    {msg.content}
                  </Text>
                  <Text className={`text-xs mt-1 text-right ${isSender ? 'text-gray-200' : 'text-gray-500'}`}>
                    {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>

      {/* Input */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="px-3 py-3 flex-row items-center mb-[14vh]"
      >
        <TextInput
          className="flex-1 px-4 py-4 border rounded-full bg-white text-black"
          placeholder="Type a message..."
          value={newMessage}
          onChangeText={setNewMessage}
        />
        <TouchableOpacity onPress={sendMessage} className="ml-2 bg-forest p-3 rounded-full">
          <MaterialIcons name="send" size={24} color="white" />
        </TouchableOpacity>
      </KeyboardAvoidingView>

      {/* Message Options Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={isMessageOptionsVisible}
        onRequestClose={() => {
          setIsMessageOptionsVisible(!isMessageOptionsVisible);
          setSelectedMessage(null);
        }}
      >
        <TouchableOpacity
          className="flex-1 justify-end items-center bg-black bg-opacity-50"
          activeOpacity={1}
          onPress={() => {
            setIsMessageOptionsVisible(false);
            setSelectedMessage(null);
          }}
        >
          <View className="w-full bg-white rounded-t-lg p-4 shadow-lg">
            <Text className="text-xl font-bold text-center mb-4">Message Options</Text>
            
            {/* Edit Message - Only for sender's messages within 24 hours */}
            {selectedMessage && selectedMessage.sender._id === currentUserId && isWithin24Hours(selectedMessage.createdAt) && (
              <TouchableOpacity
                className="py-3 border-b border-gray-200"
                onPress={handleEditMessage}
              >
                <Text className="text-base text-blue-600 text-center">Edit Message</Text>
              </TouchableOpacity>
            )}
            
            {/* Delete for Everyone - Only for sender's messages within 24 hours */}
            {selectedMessage && selectedMessage.sender._id === currentUserId && isWithin24Hours(selectedMessage.createdAt) && (
              <TouchableOpacity
                className="py-3 border-b border-gray-200"
                onPress={handleDeleteForEveryone}
              >
                <Text className="text-base text-red-600 text-center">Delete for Everyone</Text>
              </TouchableOpacity>
            )}
            
            {/* Delete for Me - Available for all messages */}
            <TouchableOpacity
              className="py-3 mb-4"
              onPress={handleDeleteForMe}
            >
              <Text className="text-base text-red-600 text-center">Delete for Me</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              className="py-3 bg-gray-100 rounded-lg"
              onPress={() => {
                setIsMessageOptionsVisible(false);
                setSelectedMessage(null);
              }}
            >
              <Text className="text-base text-gray-800 text-center font-bold">Cancel</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Edit Message Modal (or inline editor) */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={isEditingMessage}
        onRequestClose={() => {
          setIsEditingMessage(false);
          setSelectedMessage(null);
          setEditedMessageContent('');
        }}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          className="flex-1 justify-end items-center bg-black bg-opacity-50"
        >
          <View className="w-full bg-white rounded-t-lg p-4 shadow-lg">
            <Text className="text-xl font-bold text-center mb-4">Edit Message</Text>
            <TextInput
              className="border border-gray-300 rounded-lg p-3 text-lg mb-4"
              multiline
              value={editedMessageContent}
              onChangeText={setEditedMessageContent}
              autoFocus
            />
            <View className="flex-row justify-around">
              <TouchableOpacity
                className="flex-1 bg-gray-200 py-3 rounded-lg mr-2"
                onPress={() => {
                  setIsEditingMessage(false);
                  setSelectedMessage(null);
                  setEditedMessageContent('');
                }}
              >
                <Text className="text-center text-gray-800 font-bold">Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                className="flex-1 bg-forest py-3 rounded-lg ml-2"
                onPress={confirmEditMessage}
                disabled={!editedMessageContent.trim()}
              >
                <Text className="text-center text-white font-bold">Save Changes</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
};

export default ChatPage;