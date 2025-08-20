// ListingDetailsPage.tsx
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRoute, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack'; // Import NativeStackNavigationProp
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

import ListingGallery from '../components/Listing/postGallery';
import ListingDetailsCard from '../components/Listing/listingDetailsCard';
import HostCard from '../components/Listing/HostCard';
import CommentSection from '../components/Listing/commentSection';

import { User, Listing, Comment } from '../types/listingPageTypes';

interface UserProfile {
    _id: string;
    name: string;
    email: string;
    city?: string;
    country?: string;
    profilePic?: string;
}

// Define your RootStackParamList
// Add all possible routes and their parameters that can be navigated to
type RootStackParamList = {
  ListingDetails: { id: string }; // Assuming this is the current screen's route
  Auth: undefined; // Assuming 'Auth' screen takes no parameters
  Chat: { id: string }; // Assuming 'ChatScreen' takes a chatId
  // Add other screens here as needed, e.g.:
  // Profile: { userId: string };
};

const ListingDetailPage: React.FC = () => {
  const route = useRoute();
  // Use the defined type with useNavigation
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { id: listingId } = route.params as { id: string };

  const [listing, setListing] = useState<Listing | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError, ] = useState<string | null>(null);
  const [mainImage, setMainImage] = useState('');
  const [comments, setComments] = useState<Comment[]>([]);
  const [loggedInUserId, setLoggedInUserId] = useState<string | null>(null);
  const [loggedInUser, setLoggedInUser] = useState<UserProfile | null>(null);
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);

  const API_BASE_URL = Constants.expoConfig?.extra?.API_BASE_URL || 'http://localhost:5000';

  const enrichCommentLikes = useCallback(async (comment: Comment): Promise<Comment> => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        return { ...comment, isLikedByUser: false, likesCount: comment.likesCount || 0 };
      }

      const [statusRes, countRes] = await Promise.all([
        fetch(`${API_BASE_URL}/api/likes/status/comment/${comment._id}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`${API_BASE_URL}/api/likes/count/comment/${comment._id}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ]);

      const [statusData, countData] = await Promise.all([statusRes.json(), countRes.json()]);

      let enrichedComment: Comment = {
        ...comment,
        isLikedByUser: statusData && typeof statusData.isLiked === 'boolean' ? statusData.isLiked : false,
        likesCount: countData.count,
      };

      if (comment.replies && comment.replies.length > 0) {
        const enrichedReplies = await Promise.all(comment.replies.map(enrichCommentLikes));
        enrichedComment.replies = enrichedReplies;
      }
      return enrichedComment;

    } catch (err) {
      console.error(`Error enriching comment likes for ${comment._id}:`, err);
      return { ...comment, isLikedByUser: false, likesCount: comment.likesCount || 0 };
    }
  }, [API_BASE_URL]);

  useEffect(() => {
    const getUserIdAndUser = async () => {
      try {
        const userString = await AsyncStorage.getItem('user');
        const token = await AsyncStorage.getItem('token');
        if (userString && token) {
          const userObj: UserProfile = JSON.parse(userString);
          setLoggedInUserId(userObj._id);
          setLoggedInUser(userObj);
        } else {
          setLoggedInUserId(null);
          setLoggedInUser(null);
        }
      } catch (e) {
        console.error('Failed to parse user data from AsyncStorage', e);
        setLoggedInUserId(null);
        setLoggedInUser(null);
      }
    };
    getUserIdAndUser();
  }, []);

  useEffect(() => {
    const fetchListingAndComments = async () => {
      setLoading(true);
      try {
        const token = await AsyncStorage.getItem('token');
        const headers: HeadersInit = { 'Content-Type': 'application/json' };
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }

        const listingRes = await fetch(`${API_BASE_URL}/api/listing/${listingId}`, { headers });
        const listingData = await listingRes.json();

        if (listingRes.ok) {
          setListing(listingData);
          setMainImage(listingData.images[0] || '');
          setIsLiked(listingData.isLikedByUser || false);
          setLikesCount(listingData.likesCount || 0);

          const commentsRes = await fetch(`${API_BASE_URL}/api/comments/listing/${listingId}`, { headers });
          const commentsData = await commentsRes.json();
          if (commentsRes.ok) {
            const enrichedComments = await Promise.all(commentsData.map(enrichCommentLikes));
            setComments(enrichedComments);
          } else {
            console.error('Failed to fetch comments:', commentsData.msg);
          }
        } else {
          setError(listingData.msg || 'Failed to fetch listing');
        }
      } catch (err) {
        console.error('Network or server error during initial fetch:', err);
        setError('Failed to load listing. Please check your network connection.');
      } finally {
        setLoading(false);
      }
    };

    if (listingId) {
      fetchListingAndComments();
    }
  }, [listingId, API_BASE_URL, enrichCommentLikes]);


  const handleLikeToggle = useCallback(async () => {
    if (!loggedInUserId) {
      Alert.alert('Login Required', 'You must be logged in to like listings.');
      return;
    }
    setLoading(true);
    try {
      const token = await AsyncStorage.getItem('token');
      const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      };

      const res = await fetch(`${API_BASE_URL}/api/likes/toggle/listing/${listingId}`, {
        method: 'POST',
        headers: headers,
      });
      const data = await res.json();

      if (res.ok) {
        setIsLiked(data.liked);
        setLikesCount(data.likesCount);
      } else {
        Alert.alert('Error', data.msg || 'Failed to toggle like status.');
      }
    } catch (err) {
      Alert.alert('Error', 'Network error or server unavailable.');
      console.error('Error toggling like:', err);
    } finally {
      setLoading(false);
    }
  }, [listingId, API_BASE_URL, loggedInUserId]);


  const handleAddComment = useCallback(async (text: string, parentId: string | null) => {
    if (!loggedInUserId) {
      Alert.alert('Login Required', 'You must be logged in to comment.');
      return;
    }
    try {
      const token = await AsyncStorage.getItem('token');
      const requestBody = JSON.stringify({ text: text, parentCommentId: parentId });
      const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      };

      const res = await fetch(`${API_BASE_URL}/api/comments/listing/${listingId}`, {
        method: 'POST',
        headers: headers,
        body: requestBody,
      });
      const data = await res.json();

      if (res.ok) {
        const commentsRes = await fetch(`${API_BASE_URL}/api/comments/listing/${listingId}`, {
          headers: {
            'Content-Type': 'application/json',
            ...(token && { 'Authorization': `Bearer ${token}` }),
          },
        });
        const commentsData = await commentsRes.json();
        if (commentsRes.ok) {
          const enrichedComments = await Promise.all(commentsData.map(enrichCommentLikes));
          setComments(enrichedComments);
        } else {
          console.error('Failed to re-fetch comments after adding:', commentsData.msg);
          Alert.alert('Error', 'Comment added, but failed to refresh comments list.');
        }

      } else {
        Alert.alert('Error', data.msg || 'Failed to add comment.');
      }
    } catch (err) {
      Alert.alert('Error', 'Network error or server unavailable.');
      console.error('Error adding comment:', err);
    }
  }, [listingId, API_BASE_URL, loggedInUserId, enrichCommentLikes]);


  const handleCommentLikeToggle = useCallback(async (commentId: string) => {
    if (!loggedInUserId) {
      Alert.alert('Login Required', 'You must be logged in to like comments.');
      return;
    }
    try {
      const token = await AsyncStorage.getItem('token');
      const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      };

      const res = await fetch(`${API_BASE_URL}/api/likes/toggle/comment/${commentId}`, {
        method: 'POST',
        headers: headers,
      });
      const data = await res.json();

      if (res.ok) {
        setComments(prevComments => {
          const updateComment = (c: Comment): Comment => {
            if (c._id === commentId) {
              return { ...c, isLikedByUser: data.liked, likesCount: data.likesCount };
            }
            if (c.replies) {
              return { ...c, replies: c.replies.map(updateComment) };
            }
            return c;
          };
          const updatedCommentsArray = prevComments.map(updateComment);
          return updatedCommentsArray;
        });
      } else {
        Alert.alert('Error', data.msg || 'Failed to toggle comment like.');
      }
    } catch (err) {
      Alert.alert('Error', 'Network error or server unavailable.');
      console.error('Error toggling comment like:', err);
    }
  }, [API_BASE_URL, loggedInUserId]);

  const formatAvailability = useCallback((dates: string[]): string => {
    if (!dates || dates.length === 0) {
      return 'Availability not specified';
    }
    const parsedDates = dates.map(d => new Date(d));
    parsedDates.sort((a, b) => a.getTime() - b.getTime());

    if (parsedDates.length === 1) {
      return `Available on: ${parsedDates[0].toLocaleDateString()}`;
    }

    let isContinuous = true;
    for (let i = 0; i < parsedDates.length - 1; i++) {
      const diffTime = Math.abs(parsedDates[i + 1].getTime() - parsedDates[i].getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      if (diffDays !== 1) {
        isContinuous = false;
        break;
      }
    }

    if (isContinuous) {
      return `Available: ${parsedDates[0].toLocaleDateString()} - ${parsedDates[parsedDates.length - 1].toLocaleDateString()}`;
    } else {
      return `Available on selected dates`;
    }
  }, []);

  const handleContactHost = useCallback(async (startDateStr: string | null, endDateStr: string | null) => {
  if (!loggedInUser) {
    Alert.alert('Login Required', 'Please log in to contact the host.');
    navigation.navigate('Auth');
    return;
  }

  if (!startDateStr || !endDateStr) {
    Alert.alert('Error', 'Please select a date range.');
    return;
  }

  const startDate = new Date(startDateStr);
  const endDate = new Date(endDateStr);

  if (!listing?.user?._id) {
    Alert.alert('Error', 'Host information not available.');
    return;
  }

  const token = await AsyncStorage.getItem('token');
  if (!token) {
    Alert.alert('Authentication Required', 'Authentication token missing. Please log in.');
    navigation.navigate('Auth');
    return;
  }

  try {
    const chatRes = await fetch(`${API_BASE_URL}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ targetUserId: listing.user._id }),
    });

    if (!chatRes.ok) {
      const errorData = await chatRes.json();
      throw new Error(errorData.msg || 'Failed to create or get chat.');
    }

    const chatData = await chatRes.json();
    const id = chatData._id;

    const formattedStartDate = startDate.toLocaleDateString();
    const formattedEndDate = endDate.toLocaleDateString();
    const messageContent = `Hi, I am ${loggedInUser.name}${
      loggedInUser.city && loggedInUser.country
        ? ` from ${loggedInUser.city}, ${loggedInUser.country}`
        : ''
    }. Is your listing "${listing.title}" available from ${formattedStartDate} to ${formattedEndDate}?`;

    const messageRes = await fetch(`${API_BASE_URL}/api/message`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ chatId: id, content: messageContent }), // ✅ Fix here
    });

    if (!messageRes.ok) {
      const errorData = await messageRes.json();
      throw new Error(errorData.msg || 'Failed to send automated message.');
    }

    Alert.alert('Success', 'Message sent to host! Redirecting to chat...');
    navigation.navigate('Chat', { id: id }); // ✅ param name matches what ChatPage expects
  } catch (err: any) {
    console.error('Error contacting host:', err);
    Alert.alert('Error', `Error contacting host: ${err.message || 'An unknown error occurred.'}`);
  }
}, [loggedInUser, listing?.user?._id, listing?.title, API_BASE_URL, navigation]);



  if (loading) {
    return (
      <SafeAreaView className="flex-1 justify-center items-center bg-ambient">
        <ActivityIndicator size="large" color="#214F3F" />
        <Text className="mt-4 text-gray-700">Loading listing details...</Text>
      </SafeAreaView>
    );
  }
  if (error) return <Text className="pt-[10vh] text-red-600 text-center">{error}</Text>;
  if (!listing) return <Text className="pt-[10vh] text-center">Listing not found.</Text>;

  return (
    <SafeAreaView className="flex-1 bg-ambient">
      <ScrollView className="flex-1">
        <View className="min-h-screen pt-[10vh] bg-ambient text-forest font-inter pb-12">
          <View className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <ListingGallery
              images={listing.images}
              mainImage={mainImage}
              setMainImage={setMainImage}
              title={listing.title}
            />
          </View>

          <View className="grid grid-cols-1 lg:grid-cols-3 gap-8 px-4 sm:px-6 lg:px-8">
            <ListingDetailsCard
              listing={listing}
              comments={comments}
              formatAvailability={formatAvailability}
              handleContactHost={handleContactHost}
            />
          </View>

          <View className="my-6 border-b border-gray-200 mx-4 sm:mx-6 lg:mx-8" />

          <View className="px-4 sm:px-6 lg:px-8">
            <CommentSection
              comments={comments}
              handleAddComment={handleAddComment}
              handleCommentLikeToggle={handleCommentLikeToggle}
              loggedInUserId={loggedInUserId}
            />
          </View>

          <View className="my-6 border-b border-gray-200 mx-4 sm:mx-6 lg:mx-8" />
          <View className="flex-col lg:flex-row gap-8 px-4 sm:px-6 lg:px-8">
            <View className="mb-[10vh]">
              {listing.user && (
                <HostCard
                  user={listing.user}
                  onMessageHost={() => { /* This can now potentially use handleContactHost or be specific */ Alert.alert('Message Host', 'Implement chat functionality here.'); }}
                  onViewProfile={(userId) => Alert.alert('View Profile', `Maps to profile for user: ${userId}`)}
                />
              )}
            </View>
          </View>

        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default ListingDetailPage;