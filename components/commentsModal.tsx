import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  Modal,
  TextInput,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
  Pressable,
} from 'react-native';
import { Ionicons, Feather } from '@expo/vector-icons';
import axios from 'axios';
import Constants from 'expo-constants';

const API_BASE_URL = Constants.expoConfig?.extra?.API_BASE_URL || 'http://192.168.0.100:5000'; // 🛠 Replace with your LAN IP
const { height: screenHeight } = Dimensions.get('window');

interface User {
  _id: string;
  username: string;
  name?: string;
  profilePic?: string;
}

interface Comment {
  _id: string;
  user: User;
  content: string;
  parentCommentId?: string;
  createdAt: string;
  replies?: Comment[];
  isLikedByUser?: boolean;
  likesCount?: number;
}

interface CommentsModalProps {
  postId: string;
  postUser: User; // Current user
  modalOpen: boolean;
  onClose: () => void;
  token: string;
}

export default function CommentsModal({ postId, postUser, modalOpen, onClose, token }: CommentsModalProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [replyingTo, setReplyingTo] = useState<Comment | null>(null);
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    if (modalOpen) fetchComments();
    else {
      setComments([]);
      setNewComment('');
      setReplyingTo(null);
    }
  }, [modalOpen]);

  const fetchComments = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE_URL}/api/comments/${postId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const baseComments: Comment[] = res.data.comments || [];

      const enriched = await Promise.all(
        baseComments.map(async (c) => {
          const [likedRes, countRes] = await Promise.all([
            axios.get(`${API_BASE_URL}/api/likes/status/comment/${c._id}`, {
              headers: { Authorization: `Bearer ${token}` },
            }).catch(() => ({ data: { isLiked: false } })),
            axios.get(`${API_BASE_URL}/api/likes/count/comment/${c._id}`).catch(() => ({ data: { count: 0 } })),
          ]);

          const replies = await Promise.all(
            (c.replies || []).map(async (r) => {
              const [rLiked, rCount] = await Promise.all([
                axios.get(`${API_BASE_URL}/api/likes/status/comment/${r._id}`, {
                  headers: { Authorization: `Bearer ${token}` },
                }).catch(() => ({ data: { isLiked: false } })),
                axios.get(`${API_BASE_URL}/api/likes/count/comment/${r._id}`).catch(() => ({ data: { count: 0 } })),
              ]);
              return { ...r, isLikedByUser: rLiked.data.isLiked, likesCount: rCount.data.count };
            })
          );

          return { ...c, isLikedByUser: likedRes.data.isLiked, likesCount: countRes.data.count, replies };
        })
      );

      setComments(enriched);
    } catch (err) {
      console.error('Error fetching comments:', err);
    } finally {
      setLoading(false);
    }
  };

  const toggleCommentLike = async (commentId: string) => {
    try {
      const res = await axios.post(
        `${API_BASE_URL}/api/likes/toggle/comment/${commentId}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setComments((prev) =>
        prev.map((comment) => {
          if (comment._id === commentId) {
            return { ...comment, isLikedByUser: res.data.liked, likesCount: res.data.likesCount };
          }

          const updatedReplies = comment.replies?.map((r) =>
            r._id === commentId ? { ...r, isLikedByUser: res.data.liked, likesCount: res.data.likesCount } : r
          );

          return { ...comment, replies: updatedReplies };
        })
      );
    } catch (err) {
      console.error('Error toggling like:', err);
    }
  };

  const handleCommentSubmit = async () => {
    if (!newComment.trim()) return;

    try {
      const payload = replyingTo
        ? { content: newComment, parentCommentId: replyingTo._id }
        : { content: newComment };

      const res = await axios.post(`${API_BASE_URL}/api/comments/${postId}`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const newC: Comment = {
        ...res.data,
        user: postUser,
        isLikedByUser: false,
        likesCount: 0,
        replies: [],
      };

      if (replyingTo) {
        setComments((prev) =>
          prev.map((c) => (c._id === replyingTo._id ? { ...c, replies: [...(c.replies || []), newC] } : c))
        );
      } else {
        setComments((prev) => [newC, ...prev]);
      }

      setNewComment('');
      setReplyingTo(null);
      // Optional: auto scroll
      // setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 300);
    } catch (err) {
      console.error('Error posting comment:', err);
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const d = new Date(dateString);
    const now = new Date();
    const diff = Math.floor((now.getTime() - d.getTime()) / 1000);
    if (diff < 60) return `${diff}s`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
    if (diff < 2592000) return `${Math.floor(diff / 86400)}d`;
    if (diff < 31536000) return `${Math.floor(diff / 2592000)}mo`;
    return `${Math.floor(diff / 31536000)}y`;
  };

  const renderComment = ({ item: c }: { item: Comment }) => (
    <View key={c._id} className="mb-4">
      <View className="flex-row items-start mb-2">
        <Image
          source={{ uri: c.user.profilePic || 'https://via.placeholder.com/40' }}
          className="w-9 h-9 rounded-full mr-3 border border-gray-200"
        />
        <View className="flex-1">
          <View className="flex-row items-center mb-1">
            <Text className="font-semibold text-gray-900 text-sm">{c.user.username}</Text>
            <Text className="text-xs text-gray-500 ml-2">{formatTimeAgo(c.createdAt)}</Text>
          </View>
          <Text className="text-gray-700 text-sm">{c.content}</Text>
          <View className="flex-row mt-2">
            <TouchableOpacity onPress={() => setReplyingTo(c)} className="mr-4">
              <Text className="text-xs text-gray-500">Reply</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => toggleCommentLike(c._id)} className="flex-row items-center">
              <Ionicons
                name={c.isLikedByUser ? 'heart' : 'heart-outline'}
                size={16}
                color={c.isLikedByUser ? '#FD1D1D' : 'gray'}
              />
              {!!c.likesCount && <Text className="ml-1 text-xs text-gray-600">{c.likesCount}</Text>}
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Replies */}
      {(c.replies?.length ?? 0) > 0 && (
        <View className="ml-12 border-l border-gray-200 pl-4 py-2">
          {c.replies?.map((r) => (
            <View key={r._id} className="flex-row items-start mb-2">
              <Image
                source={{ uri: r.user.profilePic || 'https://via.placeholder.com/30' }}
                className="w-7 h-7 rounded-full mr-3 border border-gray-200"
              />
              <View className="flex-1">
                <View className="flex-row items-center mb-1">
                  <Text className="font-semibold text-gray-900 text-xs">{r.user.username}</Text>
                  <Text className="text-xs text-gray-500 ml-2">{formatTimeAgo(r.createdAt)}</Text>
                </View>
                <Text className="text-gray-700 text-xs">{r.content}</Text>
                <TouchableOpacity onPress={() => toggleCommentLike(r._id)} className="flex-row items-center mt-1">
                  <Ionicons
                    name={r.isLikedByUser ? 'heart' : 'heart-outline'}
                    size={14}
                    color={r.isLikedByUser ? '#FD1D1D' : 'gray'}
                  />
                  {!!r.likesCount && <Text className="ml-1 text-xs text-gray-600">{r.likesCount}</Text>}
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>
      )}
    </View>
  );

  if (!modalOpen) return null;

  return (
    <Modal visible={modalOpen} animationType="slide" onRequestClose={onClose} transparent>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex h-full justify-end bg-black/50"
      >
        <View
          className="bg-ambient rounded-t-xl"
          style={{ height: screenHeight * 0.9, width: '100%' }}
        >
          <View className="flex-row items-center justify-between p-4 border-b border-gray-300">
            <Pressable onPress={onClose} className="p-1">
              <Feather name="x" size={24} color="gray" />
            </Pressable>
            <Text className="text-lg font-bold text-gray-800">Comments</Text>
            <View className="w-6" />
          </View>

          <View className="flex-1">
            {loading ? (
              <View className="flex-1 justify-center items-center">
                <ActivityIndicator size="small" color="#214F3F" />
              </View>
            ) : comments.length === 0 ? (
              <View className="flex-1 justify-center items-center p-6">
                <Ionicons name="chatbubble-outline" size={40} color="lightgray" />
                <Text className="text-sm text-gray-500 mt-2">No comments yet</Text>
                <Text className="text-xs text-gray-400">Be the first to comment!</Text>
              </View>
            ) : (
              <FlatList
                ref={flatListRef}
                data={comments}
                keyExtractor={(item) => item._id}
                renderItem={renderComment}
                contentContainerStyle={{ padding: 16 }}
              />
            )}
          </View>

          {/* Input */}
          <View className="border-t border-gray-300 p-4">
            {replyingTo && (
              <View className="mb-2 p-2 bg-blue-50 rounded-md flex-row items-center justify-between">
                <Text className="text-sm text-blue-800">Replying to @{replyingTo.user.username}</Text>
                <TouchableOpacity onPress={() => setReplyingTo(null)}>
                  <Feather name="x" size={16} color="blue" />
                </TouchableOpacity>
              </View>
            )}
            <View className="flex-row items-center bg-gray-50 rounded-full p-2 border border-gray-200">
              <Image
                source={{ uri: postUser.profilePic || 'https://via.placeholder.com/30' }}
                className="w-8 h-8 rounded-full mr-3 border border-gray-200"
              />
              <TextInput
                value={newComment}
                onChangeText={setNewComment}
                placeholder={replyingTo ? `Reply to ${replyingTo.user.username}...` : 'Add a comment...'}
                placeholderTextColor="#888"
                className="flex-1 text-sm text-gray-800 py-1"
                onSubmitEditing={handleCommentSubmit}
                blurOnSubmit={false}
              />
              <TouchableOpacity
                onPress={handleCommentSubmit}
                disabled={!newComment.trim()}
                className={`ml-2 px-3 py-1 rounded-full ${newComment.trim() ? 'bg-blue-500' : 'bg-gray-300'}`}
              >
                <Text className="text-ambient text-sm font-semibold">Post</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
