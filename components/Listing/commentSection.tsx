import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ScrollView,
} from 'react-native';
import CommentItem from './commentItem';
import { MaterialIcons } from '@expo/vector-icons';
import { Comment } from '../../types/listingPageTypes';

interface CommentSectionProps {
  comments: Comment[];
  handleAddComment: (text: string, parentId: string | null) => void;
  handleCommentLikeToggle: (commentId: string) => void;
  loggedInUserId: string | null;
}

const CommentSection: React.FC<CommentSectionProps> = ({
  comments,
  handleAddComment,
  handleCommentLikeToggle,
  loggedInUserId,
}) => {
  const [commentText, setCommentText] = useState('');
  const inputRef = useRef<TextInput>(null);

  const submit = () => {
    const txt = commentText.trim();
    if (!txt) return;
    handleAddComment(txt, null);
    setCommentText('');
    inputRef.current?.clear();
  };

  const total = comments.length + comments.reduce((sum, c) => sum + (c.replies?.length || 0), 0);

  return (
    <View className="mt-6 bg-white rounded-xl shadow-sm border border-gray-100">
      {/* Header */}
      <View className="px-6 py-4 border-b border-gray-100">
        <Text className="text-xl font-semibold text-gray-900">
          Comments ({total})
        </Text>
      </View>

      {/* New Comment Input */}
      <View className="px-6 py-4 border-b border-gray-100">
        <View className="flex-row items-start space-x-3">
          <TextInput
            ref={inputRef}
            value={commentText}
            onChangeText={setCommentText}
            placeholder="Add a comment..."
            className="flex-1 border border-gray-300 rounded-lg mr-2 px-4 py-3 text-gray-900 min-h-[44px]"
            multiline
            textAlignVertical="top"
            onSubmitEditing={submit}
          />
          <TouchableOpacity
            onPress={submit}
            disabled={!commentText.trim()}
            className="bg-green-800 px-4 py-3 rounded-lg disabled:opacity-50 min-h-[44px] justify-center"
          >
            <Text className="text-white font-medium">Post</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Comments List */}
      {comments.length === 0 ? (
        <View className="items-center py-12 px-6">
          <View className="w-16 h-16 rounded-full bg-gray-100 items-center justify-center mb-4">
            <MaterialIcons name="comment" size={32} color="#9ca3af" />
          </View>
          <Text className="text-gray-500 text-center text-base mb-1">
            No comments yet
          </Text>
          <Text className="text-gray-400 text-center text-sm">
            Be the first to share your thoughts!
          </Text>
        </View>
      ) : (
        <ScrollView 
          className="px-6"
          contentContainerStyle={{ paddingTop: 16, paddingBottom: 24 }} 
          showsVerticalScrollIndicator={false}
        >
          {comments.map((c, index) => (
            <View key={c._id}>
              <CommentItem
                comment={c}
                loggedInUserId={loggedInUserId}
                handleCommentLikeToggle={handleCommentLikeToggle}
                handleAddComment={handleAddComment}
              />
              {/* Add separator between top-level comments */}
              {index < comments.length - 1 && (
                <View className="border-b border-gray-100 mb-6" />
              )}
            </View>
          ))}
        </ScrollView>
      )}
    </View>
  );
};

export default CommentSection;