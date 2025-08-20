import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  Image,
} from 'react-native';
import { MaterialIcons, AntDesign } from '@expo/vector-icons';
import { Comment } from '../../types/listingPageTypes';

interface CommentItemProps {
  comment: Comment;
  isReply?: boolean;
  loggedInUserId: string | null;
  handleCommentLikeToggle: (commentId: string) => void;
  handleAddComment: (text: string, parentId: string | null) => void;
}

const CommentItem: React.FC<CommentItemProps> = ({
  comment,
  isReply = false,
  loggedInUserId,
  handleCommentLikeToggle,
  handleAddComment,
}) => {
  const [showReplyInput, setShowReplyInput] = useState(false);
  const [visibleCount, setVisibleCount] = useState(3);
  const [replyText, setReplyText] = useState('');
  const replyRef = useRef<TextInput>(null);

  const toggleReplyInput = useCallback(() => {
    setShowReplyInput((v) => !v);
    if (!showReplyInput) {
      setTimeout(() => replyRef.current?.focus(), 100);
    }
  }, [showReplyInput]);

  const submitReply = () => {
    const txt = replyText.trim();
    if (!txt) return;
    const parentId = isReply ? comment.parentCommentId || comment._id : comment._id;
    handleAddComment(txt, parentId);
    setReplyText('');
    setShowReplyInput(false);
  };

  const liked = comment.isLikedByUser ?? false;
  const count = comment.likesCount ?? 0;
  const replies = comment.replies || [];
  const shown = replies.slice(0, visibleCount);
  const more = replies.length - visibleCount;

  return (
    <View className={`${isReply ? 'ml-8 pl-4 border-l border-gray-200' : ''} mb-6`}>
      <View className="flex-row">
        {/* Avatar */}
        <View className={`${isReply ? 'w-8 h-8' : 'w-10 h-10'} rounded-full bg-gray-200 mr-3 p-1 justify-center items-center flex-shrink-0`}>
          {comment.user.profilePic ? (
            <Image
              source={{ uri: comment.user.profilePic }}
              className="w-full h-full rounded-full"
            />
          ) : (
            <MaterialIcons name="person-outline" size={isReply ? 16 : 24} color="#9ca3af" />
          )}
        </View>

        <View className="flex-1">
          {/* Name, username, date */}
          <View className="flex-row items-center mb-2 flex-wrap">
            <Text className={`${isReply ? 'text-sm' : 'text-base'} font-semibold text-gray-900 mr-2`}>
              {comment.user.name}
            </Text>
            <Text className={`${isReply ? 'text-xs' : 'text-sm'} text-gray-500 mr-2`}>
              @{comment.user.username}
            </Text>
            <Text className={`${isReply ? 'text-xs' : 'text-sm'} text-gray-400`}>
              {new Date(comment.createdAt).toLocaleDateString()}
            </Text>
          </View>

          {/* Comment text */}
          <Text className={`${isReply ? 'text-sm' : 'text-base'} text-gray-800 mb-3 leading-5`}>
            {comment.text}
          </Text>

          {/* Actions */}
          <View className="flex-row items-center mb-4">
            <TouchableOpacity
              onPress={() => handleCommentLikeToggle(comment._id)}
              disabled={!loggedInUserId}
              className="flex-row items-center mr-6"
            >
              <AntDesign
                name={liked ? 'heart' : 'hearto'}
                size={16}
                color={liked ? '#ef4444' : '#6b7280'}
              />
              {count > 0 && (
                <Text className="ml-1 text-gray-600 text-xs ml-1">{count}</Text>
              )}
            </TouchableOpacity>

            {loggedInUserId && (
              <TouchableOpacity onPress={toggleReplyInput}>
                <Text className="text-blue-600 text-sm font-medium ml-2">Reply</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Reply input */}
          {showReplyInput && (
            <View className="mb-4">
              <View className="flex-row items-start space-x-3">
                <TextInput
                  ref={replyRef}
                  value={replyText}
                  onChangeText={setReplyText}
                  placeholder="Write a reply..."
                  className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm min-h-[40px]"
                  multiline
                  textAlignVertical="top"
                  onSubmitEditing={submitReply}
                />
                <TouchableOpacity
                  onPress={submitReply}
                  disabled={!replyText.trim()}
                  className="bg-green-800 px-4 py-2 rounded-lg disabled:opacity-50 min-h-[40px] justify-center"
                >
                  <Text className="text-white text-sm font-medium">Post</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
      </View>

      {/* Replies */}
      {!isReply && replies.length > 0 && (
        <View className="mt-4">
          {more > 0 && (
            <TouchableOpacity 
              onPress={() => setVisibleCount((v) => v + 5)}
              className="ml-11 mb-3"
            >
              <Text className="text-blue-600 text-sm font-medium">
                View {Math.min(more, 5)} more {more === 1 ? 'reply' : 'replies'}
              </Text>
            </TouchableOpacity>
          )}
          {shown.map((r) => (
            <CommentItem
              key={r._id}
              comment={r}
              isReply
              loggedInUserId={loggedInUserId}
              handleCommentLikeToggle={handleCommentLikeToggle}
              handleAddComment={handleAddComment}
            />
          ))}
        </View>
      )}
    </View>
  );
};

export default CommentItem;