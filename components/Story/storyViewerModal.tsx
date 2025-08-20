// StoryViewerModal.tsx
import React, { useEffect, useState, useRef, useCallback } from 'react';
import { View, Text, Image, Pressable, StyleSheet, Dimensions, Modal, ActivityIndicator, Platform } from 'react-native';
import { Video, ResizeMode } from 'expo-av'; // Import Video and ResizeMode from expo-av
import { LinearGradient } from 'expo-linear-gradient'; // Import LinearGradient
import { Story, StoryGroup, StoryViewerModalProps } from './types'; // Adjust path as needed
import { markStoryAsViewed } from './apiServices'; // Adjust path as needed

const STORY_DURATION_MS = 5000; // 5 seconds per story segment
const { width, height } = Dimensions.get('window'); // Get screen dimensions

const StoryViewerModal: React.FC<StoryViewerModalProps> = ({
  stories: allStoryGroups,
  initialStoryGroupIndex,
  initialStoryIndexInGroup,
  onClose,
  currentUserId,
  token,
  // API_BASE_URL is now handled by apiServices interceptor, no longer needed as a prop here
}) => {
  const [currentGroupIndex, setCurrentGroupIndex] = useState(initialStoryGroupIndex);
  const [currentStoryIndex, setCurrentStoryIndex] = useState(initialStoryIndexInGroup);
  const [progressBarWidth, setProgressBarWidth] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const videoRef = useRef<Video>(null);
  const [isVideoLoading, setIsVideoLoading] = useState(false);

  const currentStoryGroup = allStoryGroups[currentGroupIndex];
  const currentStory = currentStoryGroup?.stories[currentStoryIndex];

  // Callback to mark story as viewed. token is no longer passed as a direct arg
  const handleMarkStoryAsViewed = useCallback(async (storyId: string) => {
    await markStoryAsViewed(storyId); // apiServices now uses interceptor for token
  }, []);

  const goToNextStory = useCallback(() => {
    if (!currentStoryGroup || !currentStory) {
      onClose(); // Close if no story or group
      return;
    }

    // Mark current story as viewed before moving
    if (!currentStory.viewers.includes(currentUserId)) {
      handleMarkStoryAsViewed(currentStory._id);
    }

    if (currentStoryIndex < currentStoryGroup.stories.length - 1) {
      setCurrentStoryIndex(prev => prev + 1);
      setProgressBarWidth(0);
    } else if (currentGroupIndex < allStoryGroups.length - 1) {
      setCurrentGroupIndex(prev => prev + 1);
      setCurrentStoryIndex(0);
      setProgressBarWidth(0);
    } else {
      onClose(); // Close modal if no more stories
    }
  }, [currentStoryGroup, currentStoryIndex, currentGroupIndex, allStoryGroups, onClose, handleMarkStoryAsViewed, currentStory, currentUserId]);

  const goToPreviousStory = useCallback(() => {
    if (currentStoryIndex > 0) {
      setCurrentStoryIndex(prev => prev - 1);
      setProgressBarWidth(0);
    } else if (currentGroupIndex > 0) {
      setCurrentGroupIndex(prev => prev - 1);
      const prevGroup = allStoryGroups[currentGroupIndex - 1];
      setCurrentStoryIndex(prevGroup.stories.length - 1);
      setProgressBarWidth(0);
    }
    // No action if it's the first story of the first group
  }, [currentStoryIndex, currentGroupIndex, allStoryGroups]);

  // Main timer effect for story progression
  useEffect(() => {
    if (!currentStory) {
      onClose();
      return;
    }

    if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    // Reset progress bar for new story
    setProgressBarWidth(0);

    const startTime = Date.now();
    timerRef.current = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const progress = (elapsed / STORY_DURATION_MS) * 100;
      setProgressBarWidth(Math.min(progress, 100));

      if (progress >= 100) {
        goToNextStory();
      }
    }, 50); // Update every 50ms for smooth progress bar

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [currentStory, goToNextStory, onClose]);


  // Effect to handle video loading state and auto-play
  useEffect(() => {
    if (currentStory?.mediaUrl.match(/\.(mp4|mov|webm)$/i)) {
      setIsVideoLoading(true);
      if (videoRef.current) {
        videoRef.current.loadAsync({ uri: currentStory.mediaUrl }, {}, true)
          .then(() => {
            videoRef.current?.playAsync();
            setIsVideoLoading(false);
          })
          .catch(error => {
            console.error("Video load error:", error);
            setIsVideoLoading(false);
            goToNextStory(); // Move to next story if video fails to load
          });
      }
    } else {
      setIsVideoLoading(false); // Not a video, so not video loading
    }
  }, [currentStory, goToNextStory]);


  if (!currentStory) {
    return null;
  }

  // Determine if the current media is a video
  const isVideo = currentStory.mediaUrl.match(/\.(mp4|mov|webm)$/i);

  return (
    <Modal
      visible={true} // Modal is always visible when component is rendered
      animationType="fade" // Or "slide"
      transparent={true}
      onRequestClose={onClose} // Handles Android hardware back button
    >
      <View style={styles.modalOverlay}>
        <View className="relative w-full h-full max-w-xl rounded-lg overflow-hidden flex flex-col" style={{ maxHeight: height * 0.9 }}>
          {/* Close Button */}
          <Pressable
            onPress={onClose}
            className="absolute top-4 right-4 z-50 p-2 text-white bg-black bg-opacity-50 rounded-full"
            style={({ pressed }) => [{ opacity: pressed ? 0.75 : 1 }]} // Simulates hover/transition
            accessibilityLabel="Close story viewer"
          >
            {/* Replace with an actual X icon from react-native-vector-icons */}
            <Text className="text-white text-xl">X</Text>
          </Pressable>

          {/* User Info and Progress Bars */}
          <View className="absolute top-0 left-0 right-0 p-4 z-40">
            <View className="flex flex-row space-x-1 mb-2">
              {currentStoryGroup.stories.map((story, index) => (
                <View key={story._id} className="flex-1 h-1 bg-gray-700 rounded-full overflow-hidden">
                  <View
                    className="h-full bg-white rounded-full"
                    style={{ width: `${index < currentStoryIndex ? 100 : index === currentStoryIndex ? progressBarWidth : 0}%` }}
                  ></View>
                </View>
              ))}
            </View>
            <View className="flex flex-row items-center">
              <Image
                source={{ uri: currentStoryGroup.profilePic || 'https://placehold.co/40x40/E0E0E0/333333?text=User' }}
                alt={currentStoryGroup.username}
                className="w-10 h-10 rounded-full border-2 border-white object-cover mr-3"
                resizeMode="cover"
              />
              <View>
                <Text className="font-semibold text-lg text-white">{currentStoryGroup.username}</Text>
                <Text className="text-xs text-gray-300">
                  {currentStory.createdAt ? new Date(currentStory.createdAt).toLocaleString() : 'Just now'}
                </Text>
              </View>
            </View>
          </View>

          {/* Media (Image/Video) */}
          <View className="flex-1 items-center justify-center bg-black">
            {isVideoLoading && (
                <ActivityIndicator size="large" color="#fff" className="absolute" />
            )}
            {isVideo ? (
              <Video
                ref={videoRef}
                source={{ uri: currentStory.mediaUrl }}
                style={styles.mediaContent} // Use StyleSheet for dimensions
                resizeMode={ResizeMode.CONTAIN}
                shouldPlay={!isVideoLoading} // Play only when not loading
                isLooping={false} // Stories typically don't loop
                onPlaybackStatusUpdate={(status) => {
                  if (status.isLoaded && status.didJustFinish) {
                    goToNextStory();
                  }
                }}
                onLoadStart={() => setIsVideoLoading(true)}
                onLoad={() => setIsVideoLoading(false)}
                onError={(error) => {
                  console.error("Video playback error:", error);
                  setIsVideoLoading(false);
                  goToNextStory(); // Move to next story on error
                }}
              />
            ) : (
              <Image
                key={currentStory._id}
                source={{ uri: currentStory.mediaUrl }}
                alt={currentStory.caption || 'Story media'}
                style={styles.mediaContent} // Use StyleSheet for dimensions
                resizeMode="contain"
              />
            )}
          </View>

          {/* Caption */}
          {currentStory.caption && (
            <LinearGradient
              colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0.8)']} // From transparent to black
              className="absolute left-0 right-0 p-4 text-white text-center pb-8 z-40"
              style={{ bottom: 0 }} // Position at the bottom
            >
              <Text className="text-base sm:text-lg text-white">{currentStory.caption}</Text>
            </LinearGradient>
          )}

          {/* Navigation Buttons */}
          <View className="absolute inset-y-0 w-full flex flex-row justify-between items-center px-0 z-30">
            <Pressable
              onPress={goToPreviousStory}
              className="flex-1 h-full opacity-0 md:opacity-100 items-start justify-center p-3" // Make it full height and transparent for touch
              style={({ pressed }) => [{ backgroundColor: pressed ? 'rgba(0,0,0,0.3)' : 'transparent' }]}
              accessibilityLabel="Previous story"
            >
              {/* Replace with actual Left Arrow Icon */}
              <Text className="text-white text-2xl md:bg-black md:bg-opacity-30 md:rounded-full md:p-2">{`<`}</Text>
            </Pressable>
            <Pressable
              onPress={goToNextStory}
              className="flex-1 h-full opacity-0 md:opacity-100 items-end justify-center p-3" // Make it full height and transparent for touch
              style={({ pressed }) => [{ backgroundColor: pressed ? 'rgba(0,0,0,0.3)' : 'transparent' }]}
              accessibilityLabel="Next story"
            >
              {/* Replace with actual Right Arrow Icon */}
              <Text className="text-white text-2xl md:bg-black md:bg-opacity-30 md:rounded-full md:p-2">{`>`}</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    ...StyleSheet.absoluteFillObject, // Covers the entire screen
    backgroundColor: 'rgba(0, 0, 0, 0.9)', // Semi-transparent black background
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Platform.OS === 'android' ? 20 : 0, // Add some vertical padding for Android status bar if needed
  },
  mediaContent: {
    width: '100%',
    height: '100%',
  },
});

export default StoryViewerModal;