import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Image,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { MaterialIcons, AntDesign } from '@expo/vector-icons';
import PostModal from '../components/postModal';

type RootStackParamList = {
  NotificationPage: undefined;
  Auth: undefined;
  ListingDetail: { id: string };
  Chat: { _id: string; chatName?: string; chatMembers?: any[] };
  Upload: { viewMode?: 'listing' | 'post' | 'story' };
};

interface User {
  _id: string;
  username: string;
  name?: string;
  profilePic?: string;
}

interface Post {
  _id: string;
  user: User;
  image?: string;
  imageUrl?: string;
  caption?: string;
}

interface Notification {
  _id: string;
  recipient: string;
  type: 'like' | 'comment' | 'reply' | 'message' | 'chat';
  sourceUser: { _id: string; name: string; profilePic?: string };
  relatedId: string;
  targetType: 'post' | 'listing' | 'comment' | 'reply' | 'chat';
  isRead: boolean;
  createdAt: string;
  parentEntityId?: string;
  parentEntityType?: 'post' | 'listing';
}

export default function NotificationPage() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [showPostModal, setShowPostModal] = useState(false);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);

  // track which notification images failed
  const [imageErrorMap, setImageErrorMap] = useState<Record<string, boolean>>({});
  const fallbackUri = 'https://placehold.co/48x48/aabbcc/ffffff?text=U';

  const API_BASE_URL = Constants.expoConfig?.extra?.API_BASE_URL || 'http://localhost:5000';

  // load token
  useEffect(() => {
    AsyncStorage.getItem('token').then((t) => {
      if (t) setToken(t);
      else navigation.navigate('Auth');
    });
  }, [navigation]);

  // fetch notifications
  const fetchNotifications = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE_URL}/api/notifications`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(res.statusText);
      const data: Notification[] = await res.json();
      setNotifications(data);
    } catch (err: any) {
      console.error(err);
      setError('Failed to load notifications.');
    } finally {
      setLoading(false);
    }
  }, [API_BASE_URL, token]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // delete notification
  const handleDelete = useCallback(async (id: string) => {
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE_URL}/api/notifications/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) setNotifications((prev) => prev.filter((n) => n._id !== id));
      else throw new Error(await res.text());
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'Could not delete notification.');
    }
  }, [API_BASE_URL, token]);

  // handle click
  const handleClick = useCallback(async (n: Notification) => {
    let redirected = false;

    if (n.targetType === 'post') {
      try {
        const res = await fetch(`${API_BASE_URL}/api/posts/${n.relatedId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          setSelectedPost(await res.json());
          setShowPostModal(true);
          redirected = true;
        }
      } catch { /* ignore */ }
    } else if (n.targetType === 'listing') {
      navigation.navigate('ListingDetail', { id: n.relatedId });
      redirected = true;
    } else if (n.targetType === 'chat') {
      navigation.navigate('Chat', { _id: n.relatedId });
      redirected = true;
    } else if ((n.targetType === 'comment' || n.targetType === 'reply') && n.parentEntityId) {
      if (n.parentEntityType === 'post') {
        try {
          const res = await fetch(`${API_BASE_URL}/api/posts/${n.parentEntityId}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (res.ok) {
            setSelectedPost(await res.json());
            setShowPostModal(true);
            redirected = true;
          }
        } catch { /* ignore */ }
      } else {
        navigation.navigate('ListingDetail', { id: n.parentEntityId });
        redirected = true;
      }
    }

    if (redirected) await handleDelete(n._id);
  }, [API_BASE_URL, navigation, token, handleDelete]);

  const getMessage = (n: Notification) => {
    const user = n.sourceUser.name;
    switch (n.type) {
      case 'like': return `${user} liked your ${n.targetType}.`;
      case 'comment': return `${user} commented on your ${n.targetType}.`;
      case 'reply': return `${user} replied to your comment.`;
      case 'message': return `${user} sent you a message.`;
      case 'chat': return `${user} started a chat with you.`;
      default: return 'New activity.';
    }
  };

  const getIcon = (type: Notification['type']) => {
    switch (type) {
      case 'like': return <MaterialIcons name="favorite" size={24} color="#214F3F" />;
      case 'comment': return <MaterialIcons name="chat-bubble" size={24} color="#214F3F" />;
      case 'reply': return <MaterialIcons name="reply" size={24} color="#214F3F" />;
      case 'message': return <MaterialIcons name="mail" size={24} color="#214F3F" />;
      case 'chat': return <MaterialIcons name="chat" size={24} color="#214F3F" />;
      default: return <MaterialIcons name="notifications" size={24} color="#214F3F" />;
    }
  };

  const timeAgo = (d: string) => {
    const sec = Math.floor((Date.now() - new Date(d).getTime()) / 1000);
    if (sec > 31536000) return `${Math.floor(sec/31536000)}y ago`;
    if (sec > 2592000) return `${Math.floor(sec/2592000)}mo ago`;
    if (sec > 86400) return `${Math.floor(sec/86400)}d ago`;
    if (sec > 3600) return `${Math.floor(sec/3600)}h ago`;
    if (sec > 60) return `${Math.floor(sec/60)}m ago`;
    return `${sec}s ago`;
  };

  return (
    <SafeAreaView className="flex-1 bg-ambient pt-4 px-4">
      <View className="flex-row items-center justify-center mb-6">
        <Text className="text-3xl font-bold text-gray-900">Your Notifications</Text>
      </View>

      {loading && (
        <View className="flex-1 justify-center items-center py-12">
          <ActivityIndicator size="large" color="#214F3F" />
          <Text className="mt-4 text-lg text-gray-600">Loading notifications...</Text>
        </View>
      )}

      {error && (
        <View className="bg-red-100 border border-red-400 px-4 py-3 rounded mb-4">
          <Text className="font-bold text-red-700">Error!</Text>
          <Text className="text-red-700">{error}</Text>
        </View>
      )}

      {!loading && notifications.length === 0 && !error && (
        <View className="flex-1 justify-center items-center py-12">
          <MaterialIcons name="notifications-off" size={60} color="#d1d5db" className="mb-4" />
          <Text className="text-xl font-semibold text-gray-900 mb-2">No new notifications</Text>
          <Text className="text-gray-600">You're all caught up!</Text>
        </View>
      )}

      {!loading && notifications.length > 0 && (
        <ScrollView className="flex-1 space-y-4">
          {notifications.map((n) => {
            const err = imageErrorMap[n._id];
            const uri = !err && n.sourceUser.profilePic ? n.sourceUser.profilePic : fallbackUri;

            return (
              <View
                key={n._id}
                className={`flex-row items-center p-4 rounded-xl shadow-sm mb-2 ${
                  n.isRead ? 'bg-white' : 'bg-teal-50 border border-teal-200'
                }`}
              >
                <TouchableOpacity
                  className="flex-row items-center flex-grow"
                  onPress={() => handleClick(n)}
                  activeOpacity={0.7}
                >
                  <View className="mr-4 rounded-full overflow-hidden" style={{ width: 48, height: 48, borderWidth: 2, borderColor: '#214F3F' }}>
                    <Image
                      source={{ uri }}
                      style={{ width: 48, height: 48 }}
                      onError={() => setImageErrorMap((p) => ({ ...p, [n._id]: true }))}
                    />
                  </View>
                  <View className="flex-1">
                    <View className="flex-row items-center">
                      {getIcon(n.type)}
                      <Text className="ml-2 flex-1">{getMessage(n)}</Text>
                    </View>
                    <Text className="text-sm text-gray-500 mt-1">{timeAgo(n.createdAt)}</Text>
                  </View>
                </TouchableOpacity>

                <TouchableOpacity onPress={() => handleDelete(n._id)} className="ml-4 p-2">
                  <AntDesign name="close" size={20} color="#9ca3af" />
                </TouchableOpacity>
              </View>
            );
          })}
        </ScrollView>
      )}

      {showPostModal && selectedPost && (
        <PostModal
          post={selectedPost}
          modalOpen={showPostModal}
          onClose={() => setShowPostModal(false)}
          token={token!}
        />
      )}
    </SafeAreaView>
  );
}
