import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  Modal,
  Image,
  TouchableOpacity, // Keep this if you use it elsewhere, though Pressable is used for icons
  KeyboardAvoidingView,
  Platform,
  Dimensions,
  Pressable,
} from 'react-native';
import { Ionicons, Feather, MaterialIcons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import CommentsModal from './commentsModal'; // Assuming this path is correct for your CommentsModal
import { SafeAreaProvider } from 'react-native-safe-area-context';

const API_BASE_URL = Constants.expoConfig?.extra?.API_BASE_URL || 'http://localhost:5000';
const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

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
  likes?: string[];
}

interface PostModalProps {
  post: Post;
  modalOpen: boolean;
  onClose: () => void;
  token: string;
}

export default function PostModal({ post, modalOpen, onClose, token }: PostModalProps) {
  const [isLiked, setIsLiked] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [commentsModalOpen, setCommentsModalOpen] = useState(false);

  const getImageUrl = () => post.image || post.imageUrl || '';

  const fetchPostStatus = async () => {
    if (!modalOpen || !post._id || !token) return;

    try {
      const [likeStatusRes, likeCountRes, saveStatusRes] = await Promise.all([
        fetch(`${API_BASE_URL}/api/likes/status/${post._id}`, {
          headers: { Authorization: `Bearer ${token}` },
        }).then(res => res.json()),

        fetch(`${API_BASE_URL}/api/likes/count/post/${post._id}`)
          .then(res => res.json()),

        fetch(`${API_BASE_URL}/api/saved-posts/status/${post._id}`, {
          headers: { Authorization: `Bearer ${token}` },
        }).then(res => res.json())
      ]);

      setIsLiked(likeStatusRes.isLiked);
      setLikesCount(likeCountRes.count || 0);
      setIsSaved(saveStatusRes.isSaved);
    } catch (error) {
      console.error('Error fetching post status:', error);
    }
  };

  useEffect(() => {
    if (modalOpen) {
      fetchPostStatus();
    }
  }, [modalOpen, post._id, token]);

  const toggleLike = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/likes/toggle/post/${post._id}`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
      });
      const data = await res.json();
      if (res.ok) {
        setIsLiked(data.liked);
        setLikesCount(prev => data.liked ? prev + 1 : prev - 1);
      }
    } catch (err) {
      console.error('Error toggling like:', err);
    }
  };

  const toggleSave = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/saved-posts/toggle/${post._id}`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
      });
      const data = await res.json();
      if (res.ok) {
        setIsSaved(data.saved);
      }
    } catch (err) {
      console.error('Error toggling save:', err);
    }
  };

  if (!modalOpen) return null;

  return (
    <SafeAreaProvider>
      <Modal visible={modalOpen} animationType="fade" onRequestClose={onClose} transparent>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          className="flex-1 justify-center items-center bg-forest-light/80"
        >
          <View
            className="bg-ambient rounded-xl overflow-hidden shadow-2xl flex-col"
            style={{
              width: screenWidth * 0.95,
              height: screenHeight * 0.9,
            }}
          >
            {/* Close Button */}
            <Pressable
              onPress={onClose}
              className="absolute top-3 right-3 z-20 bg-forest-light/20 p-2 rounded-full"
            >
              {/* Feather icon wrapped in View */}
              <View>
                <Feather name="x" size={20} color="black" />
              </View>
            </Pressable>

            {/* Header */}
            <View className="p-4 border-b border-gray-100">
              <View className="flex-row items-center">
                <Image
                  source={{ uri: post.user.profilePic || 'https://via.placeholder.com/50' }}
                  className="w-10 h-10 rounded-full mr-3 border border-gray-200"
                />
                <View className="flex-1">
                  <Text className="font-semibold text-gray-900 text-base">{post.user.username}</Text>
                  {post.user.name && (
                    <Text className="text-xs text-gray-500">{post.user.name}</Text>
                  )}
                </View>
              </View>
            </View>

            {/* Image Section */}
            <View className={`w-full ${likesCount > 0 ? 'max-h-[75%]' : 'max-h-[80%]'} flex-grow-[2] bg-forest-light items-center justify-center`}>
              {getImageUrl() ? (
                <Image
                  source={{ uri: getImageUrl() }}
                  className="w-full h-full object-contain"
                  resizeMode="contain"
                />
              ) : (
                <View className="flex items-center justify-center h-full">
                  {/* MaterialIcons icon wrapped in View */}
                  <View>
                    <MaterialIcons name="image-not-supported" size={60} color="gray" />
                  </View>
                  <Text className="text-ambient mt-2 text-sm">No image available</Text>
                </View>
              )}
            </View>

            {/* Action Buttons and Content */}
            <View className="w-full flex-grow-[1] flex flex-col justify-between bg-ambient p-4">
              <View className="flex-col">
                {/* Action Buttons */}
                <View className="flex-row items-center justify-between mb-3">
                  <View className="flex-row items-center gap-4">
                    <Pressable onPress={toggleLike}>
                      {/* Ionicons wrapped in View */}
                      <View>
                        <Ionicons
                          name={isLiked ? 'heart' : 'heart-outline'}
                          size={26}
                          color={isLiked ? '#FD1D1D' : 'gray'}
                        />
                      </View>
                    </Pressable>
                    <Pressable onPress={() => setCommentsModalOpen(true)}>
                      {/* Ionicons wrapped in View */}
                      <View>
                        <Ionicons name="chatbubble-outline" size={26} color="gray" />
                      </View>
                    </Pressable>
                    <Pressable>
                      {/* Feather icon wrapped in View */}
                      <View>
                        <Feather name="send" size={24} color="gray" />
                      </View>
                    </Pressable>
                  </View>
                  <Pressable onPress={toggleSave}>
                    {/* Ionicons wrapped in View */}
                    <View>
                      <Ionicons
                        name={isSaved ? 'bookmark' : 'bookmark-outline'}
                        size={26}
                        color={isSaved ? '#214F3F' : 'gray'}
                      />
                    </View>
                  </Pressable>
                </View>

                {/* Like Count */}
                {likesCount > 0 && (
                  <Text className="text-sm font-semibold text-gray-900 mb-2">
                    {likesCount.toLocaleString()} {likesCount === 1 ? 'like' : 'likes'}
                  </Text>
                )}

                {/* Caption */}
                {post.caption && (
                  <Text className="text-gray-800 text-sm leading-snug">
                    <Text className="font-semibold">{post.user.username}</Text> {post.caption}
                  </Text>
                )}
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {post._id && commentsModalOpen && (
        <CommentsModal
          postId={post._id}
          postUser={post.user}
          modalOpen={commentsModalOpen}
          onClose={() => setCommentsModalOpen(false)}
          token={token}
        />
      )}
    </SafeAreaProvider>
  );
}