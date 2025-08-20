// storyFeed.tsx
import React, { useEffect, useState } from 'react';
import { View, Text, Image, Pressable, ScrollView, ActivityIndicator, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage'; // For local storage
import StoryViewerModal from './storyViewerModal'; // Adjust path as needed
import { fetchCurrentUser, fetchFeedStories, fetchMyStories } from './apiServices'; // Adjust path as needed
import { Story, User, StoryGroup } from './types'; // Adjust path as needed
import { useNavigation } from '@react-navigation/native';

export default function StoryFeed() {
  const [stories, setStories] = useState<Story[]>([]);
  const [myStories, setMyStories] = useState<Story[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true); // Add loading state

  const [isViewerOpen, setIsViewerOpen] = useState(false);
  const [initialStoryGroupIndex, setInitialStoryGroupIndex] = useState(0);
  const [initialStoryIndexInGroup, setInitialStoryIndexInGroup] = useState(0);
  const navigation = useNavigation<any>();
  useEffect(() => {
    const loadTokenAndData = async () => {
      setLoading(true);
      const storedToken = await AsyncStorage.getItem('token'); // Use AsyncStorage
      setToken(storedToken);

      if (!storedToken) {
        console.warn('No token found, user not authenticated.');
        setLoading(false);
        // In a real app, you'd navigate to a login screen here
        return;
      }

      const loadData = async () => {
        try {
          // fetchCurrentUser, fetchFeedStories, fetchMyStories no longer require token param
          // because apiServices now uses an interceptor for token.
          const currentUser = await fetchCurrentUser();
          setUser(currentUser);

          const [feedStories, userStories] = await Promise.all([
            fetchFeedStories(),
            fetchMyStories(),
          ]);
          setStories(feedStories);
          setMyStories(userStories);
        } catch (error) {
          console.error('Error loading story data:', error);
          // Handle error, e.g., show an error message to the user
        } finally {
          setLoading(false);
        }
      };

      loadData();
    };

    loadTokenAndData();
  }, []);

  const groupStories = (allStories: Story[], currentUser: User | null, userMyStories: Story[]): StoryGroup[] => {
    const grouped: StoryGroup[] = [];

    // Add current user's stories first
    if (currentUser && userMyStories.length > 0) {
      const activeMyStories = userMyStories.filter(s => new Date(s.expiresAt) > new Date());
      if (activeMyStories.length > 0) {
        grouped.push({
          userId: currentUser._id,
          username: currentUser.username,
          profilePic: currentUser.profilePic,
          stories: activeMyStories.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
        });
      }
    }

    const otherUsersStoriesMap = new Map<string, Story[]>();
    allStories.forEach(story => {
      if (currentUser && story.user._id !== currentUser._id && new Date(story.expiresAt) > new Date()) {
        if (!otherUsersStoriesMap.has(story.user._id)) {
          otherUsersStoriesMap.set(story.user._id, []);
        }
        otherUsersStoriesMap.get(story.user._id)?.push(story);
      }
    });

    otherUsersStoriesMap.forEach((userStories, userId) => {
      userStories.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      grouped.push({
        userId: userId,
        username: userStories[0].user.username,
        profilePic: userStories[0].user.profilePic,
        stories: userStories,
      });
    });

    return grouped;
  };

  const groupedStories = groupStories(stories, user, myStories);

  const handleStoryCircleClick = (storyGroupUserId: string) => {
    const groupIndex = groupedStories.findIndex(group => group.userId === storyGroupUserId);
    if (groupIndex !== -1) {
      setInitialStoryGroupIndex(groupIndex);
      setInitialStoryIndexInGroup(0);
      setIsViewerOpen(true);
    } else {
      console.warn(`Story group for user ${storyGroupUserId} not found.`);
    }
  };

  const handleCreateStoryClick = () => {
  navigation.navigate('Upload', { viewMode: 'story' });
};

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center py-4">
        <ActivityIndicator size="large" color="#506870" />
        <Text className="text-center py-4 text-gray-500">Loading stories...</Text>
      </View>
    );
  }

  if (!token || !user) {
    return (
      <View className="flex-1 justify-center items-center py-4">
        <Text className="text-center text-gray-500">Please log in to view stories.</Text>
      </View>
    );
  }

  const myActiveStories = myStories.filter(s => new Date(s.expiresAt) > new Date());
  const hasMyStory = myActiveStories.length > 0;
  // Use a local placeholder if profilePic is not available immediately, or a default user icon asset
  const myCurrentStoryThumbnail = hasMyStory ? myActiveStories[0].mediaUrl : user.profilePic || 'https://placehold.co/64x64/E0E0E0/333333?text=User';


  // API_BASE_URL is now accessed from apiServices, no longer directly here
  // const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || '';

  return (
    <ScrollView
      horizontal
      className="flex flex-row gap-4 px-6 py-3" // Apply padding via className
      showsHorizontalScrollIndicator={false} // Hides the scrollbar
    >
      {/* User's Own Story / Create Story Button */}
      <View className="flex flex-col items-center shrink-0">
        <Pressable
          onPress={() => hasMyStory ? handleStoryCircleClick(user._id) : handleCreateStoryClick()}
          className={`
            w-16 h-16 rounded-full border-2 p-0.5 relative flex items-center justify-center
            ${hasMyStory ? 'border-mint' : 'border-gray-300 border-dashed'}
            hover:scale-90 transition-transform duration-200 ease-in-out
            focus:outline-none focus:ring-2 focus:ring-forest-medium focus:ring-offset-2
          `}
          accessibilityLabel={hasMyStory ? "View your story" : "Create a new story"}
        >
          {myCurrentStoryThumbnail ? (
            <View className="w-full h-full rounded-full overflow-hidden">
              <Image
                source={{ uri: myCurrentStoryThumbnail }}
                alt="Your story"
                className="w-full h-full object-cover"
                resizeMode="cover"
              />
            </View>
          ) : (
            <Text className="text-gray-500 text-3xl">+</Text>
          )}
          {!hasMyStory && (
            <View className="absolute bottom-0 right-0 bg-forest text-white rounded-full px-1 py-[0.2px] flex items-center justify-center text-xs leading-none">
              {/* Replace with a '+' icon from react-native-vector-icons */}
              <Text className="text-white text-base">+</Text>
            </View>
          )}
        </Pressable>
        <Text className="text-xs mt-1 text-center text-gray-700 font-semibold">Your Story</Text>
      </View>

      {/* Other users' stories */}
      {groupedStories.map((group) => {
        if (user && group.userId === user._id) { // Ensure user is not null
          return null;
        }

        const latestStory = group.stories[0];
        const hasBeenViewedByCurrentUser = user && latestStory?.viewers.includes(user._id); // Ensure user is not null

        return (
          <View key={group.userId} className="flex flex-col items-center shrink-0">
            <Pressable
              onPress={() => handleStoryCircleClick(group.userId)}
              className={`
                w-16 h-16 rounded-full border-2 p-0.5 overflow-hidden
                ${hasBeenViewedByCurrentUser ? 'border-gray-400 opacity-70' : 'border-forest'}
                hover:scale-90 transition-transform duration-200 ease-in-out
                focus:outline-none focus:ring-2 focus:ring-forest-medium focus:ring-offset-2
              `}
              accessibilityLabel={`View ${group.username}'s story`}
            >
              <Image
                source={{ uri: group.profilePic || 'https://placehold.co/64x64/E0E0E0/333333?text=User' }}
                alt={group.username}
                className="w-full h-full object-cover"
                resizeMode="cover"
              />
            </Pressable>
            <Text className="text-xs mt-1 text-center text-gray-700">{group.username}</Text>
          </View>
        );
      })}

      {/* Story Viewer Modal */}
      {isViewerOpen && groupedStories.length > 0 && user && token && ( // Ensure user and token exist
        <StoryViewerModal
          stories={groupedStories}
          initialStoryGroupIndex={initialStoryGroupIndex}
          initialStoryIndexInGroup={initialStoryIndexInGroup}
          onClose={() => setIsViewerOpen(false)}
          currentUserId={user._id}
          token={token}
          API_BASE_URL={process.env.EXPO_PUBLIC_API_URL || ''} // Pass API_BASE_URL (or get it from context if preferred)
        />
      )}
    </ScrollView>
  );
}