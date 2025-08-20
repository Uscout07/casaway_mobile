import React, { useState } from 'react';
import { View, Image, Pressable } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import PostModal from './postModal';

interface User {
  _id: string;
  username: string;
  profilePic?: string;
  name?: string;
}

interface Post {
  _id: string;
  user: User;
  image: string;
  caption?: string;
}

interface PostCardProps {
  post: Post;
  token: string;
}

const PostCard: React.FC<PostCardProps> = ({ post, token }) => {
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <>
      <Pressable
        onPress={() => setModalOpen(true)}
        className="relative rounded-md overflow-hidden"
      >
        <Image
          source={{ uri: post.image }}
          resizeMode="cover"
          className="w-full aspect-square"
        />
        <View className="absolute inset-0 bg-black/30 justify-center items-center opacity-0 active:opacity-100">
          <MaterialCommunityIcons name="eye" size={28} color="white" />
        </View>
      </Pressable>

      <PostModal
        post={post}
        token={token}
        modalOpen={modalOpen}
        onClose={() => setModalOpen(false)}
      />
    </>
  );
};

export default PostCard;
