import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  Alert,
  RefreshControl,
  Image,
  Dimensions,
  TouchableOpacity,
  Modal,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { useRoute, useNavigation } from '@react-navigation/native';
import ListingCard from '../components/listingCard';
import PostModal from '../components/postModal';
import { Ionicons } from '@expo/vector-icons';

const API_BASE_URL = Constants.expoConfig?.extra?.API_BASE_URL || 'http://localhost:5000';
const { width: screenWidth } = Dimensions.get('window');

export default function ProfilePageNative() {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const navigationUserId = route.params?.userId;

  const [userId, setUserId] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  const [posts, setPosts] = useState<any[]>([]);
  const [listings, setListings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [selectedPost, setSelectedPost] = useState<any | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [profilePicModalOpen, setProfilePicModalOpen] = useState(false);

  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);

  const isMyProfile = user && (!navigationUserId || user._id === navigationUserId);


  const resolveUserId = useCallback(async () => {
    if (navigationUserId) return setUserId(navigationUserId);
    try {
      const storedToken = await AsyncStorage.getItem('token');
      if (!storedToken) throw new Error('No token');

      const res = await fetch(`${API_BASE_URL}/api/users/me`, {
        headers: { Authorization: `Bearer ${storedToken}` },
      });
      const data = await res.json();
      if (res.ok) setUserId(data._id);
      else throw new Error('User ID fetch failed');
    } catch (err) {
      Alert.alert('Error', 'Failed to determine user ID.');
    }
  }, [navigationUserId]);

  const fetchUserData = useCallback(async (id: string) => {
    try {
      const storedToken = await AsyncStorage.getItem('token');
      if (!storedToken) throw new Error('Token missing');
      setToken(storedToken);

      const [userRes, listingRes] = await Promise.all([
        fetch(`${API_BASE_URL}/api/users/${id}`, {
          headers: { Authorization: `Bearer ${storedToken}` },
        }),
        fetch(`${API_BASE_URL}/api/listing/user/${id}`),
      ]);

      if (!userRes.ok || !listingRes.ok)
        throw new Error('Failed to fetch profile data');

      const userData = await userRes.json();
      const listingsData = await listingRes.json();

      console.log('User data:', userData);

      const postsRes = await fetch(`${API_BASE_URL}/api/posts/user/${id}`);
      const postsData = postsRes.ok ? await postsRes.json() : [];

      setUser(userData);
      setPosts(postsData);
      setListings(listingsData);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Something went wrong.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const checkFollowStatus = useCallback(async () => {
    if (!userId || isMyProfile) return;
    try {
      const storedToken = await AsyncStorage.getItem('token');
      if (!storedToken) return;

      const res = await fetch(`${API_BASE_URL}/api/follow/status/${navigationUserId}`, {
        headers: { Authorization: `Bearer ${storedToken}` }
      });

      const data = await res.json();
      if (res.ok) setIsFollowing(data.isFollowing);
    } catch (err) {
      console.error('Error checking follow status', err);
    }
  }, [userId, navigationUserId, isMyProfile]);

  useEffect(() => {
    (async () => {
      await resolveUserId();
    })();
  }, [resolveUserId]);

  useEffect(() => {
    if (userId) {
      fetchUserData(userId);
      checkFollowStatus();
    }
  }, [userId, fetchUserData, checkFollowStatus]);

  const onRefresh = () => {
    setRefreshing(true);
    if (userId) fetchUserData(userId);
  };

  const handleFollowToggle = async () => {
    if (followLoading || !user) return;
    try {
      setFollowLoading(true);
      const storedToken = await AsyncStorage.getItem('token');
      const endpoint = isFollowing ? 'unfollow' : 'follow';

      const res = await fetch(`${API_BASE_URL}/api/follow/${endpoint}/${user._id}`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${storedToken}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await res.json();
      if (res.ok) {
        setIsFollowing(data.isFollowing);
        setUser((prev: any) => ({
          ...prev,
          followers: data.followers,
        }));
      } else {
        Alert.alert('Error', data.msg || 'Failed to update follow status');
      }
    } catch (err) {
      Alert.alert('Error', 'Failed to toggle follow');
    } finally {
      setFollowLoading(false);
    }
  };

  const handleStartChat = async () => {
    if (!user) return;
    try {
      const storedToken = await AsyncStorage.getItem('token');

      const res = await fetch(`${API_BASE_URL}/api/chat`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${storedToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ targetUserId: user._id }),
      });

      const data = await res.json();
      if (res.ok) {
        navigation.navigate('Chat', { chatId: data._id });
      } else {
        Alert.alert('Error', data.msg || 'Failed to start chat');
      }
    } catch (err) {
      Alert.alert('Error', 'Could not start chat');
    }
  };

  const getItemWidth = () => {
    const numColumns = 3;
    const spacing = 4;
    return (screenWidth - spacing * (numColumns + 1)) / numColumns;
  };

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-ambient">
        <ActivityIndicator size="large" color="#214F3F" />
      </View>
    );
  }

  if (!user) {
    return (
      <View className="flex-1 justify-center items-center bg-ambient">
        <Text className="text-red-500">Failed to load user profile</Text>
      </View>
    );
  }

  return (
    <ScrollView
      className="flex-1 bg-ambient"
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <View className="items-center py-6 px-4">
        {user.profilePic ? (
          <TouchableOpacity
            onPress={() => setProfilePicModalOpen(true)}
            className="w-32 h-32 rounded-full overflow-hidden border-4 border-forest mb-4"
          >
            <Image source={{ uri: user.profilePic }} className="w-full h-full" />
          </TouchableOpacity>
        ) : (
          <Ionicons name="person-circle-outline" size={125} color="#888" />
        )}
        <Text className="text-xl font-bold text-forest">{user.name}</Text>
        <Text className="text-sm text-forest">@{user.username}</Text>
        {(user.city || user.country) && (
          <Text className="text-sm text-forest">
            {user.city}{user.city && user.country ? ', ' : ''}{user.country}
          </Text>
        )}
        {user.bio && (
          <Text className="mt-2 text-center text-slate-700 px-6">{user.bio}</Text>
        )}

        {/* Follow + Message */}
        
          <View className="flex-row w-full px-2 justify-center gap-2 mt-4 space-x-4">
            {!isMyProfile ? (
            <><TouchableOpacity
              onPress={handleFollowToggle}
              disabled={followLoading}
              className={`px-6 py-4 w-2/5 rounded-full flex items-center justify-center ${isFollowing ? 'bg-gray-500' : 'bg-forest'} ${followLoading ? 'opacity-50' : ''}`}
            >
              <Text className="text-white font-semibold">
                {followLoading ? '...' : isFollowing ? 'Unfollow' : 'Follow'}
              </Text>
            </TouchableOpacity><TouchableOpacity
              onPress={handleStartChat}
              className="px-6 py-4 rounded-full bg-forest w-2/5 items-center justify-center"
            >
                <Text className="text-white font-semibold">Message</Text>
              </TouchableOpacity></>) : (<TouchableOpacity
              onPress={() => navigation.navigate('Settings')}
              
              className={`px-6 py-4 w-full rounded-full flex items-center justify-center ${isFollowing ? 'bg-gray-500' : 'bg-forest'} ${followLoading ? 'opacity-50' : ''}`}
            >
              <Text className="text-white font-semibold">
                Edit Profile
              </Text>
                
              </TouchableOpacity>)}
          </View>
        

        {/* Stats */}
        <View className="flex-row justify-around w-full mt-6">
          <View className="items-center px-3 py-4 border-2 rounded-xl border-forest w-[30%]">
            <Text className="text-xl font-bold text-forest">{posts.length}</Text>
            <Text className="text-forest text-sm">Posts</Text>
          </View>
          <View className="items-center px-3 py-4 border-2 rounded-xl border-forest w-[30%]">
            <Text className="text-xl font-bold text-forest">{user.followers?.length || 0}</Text>
            <Text className="text-forest text-sm">Followers</Text>
          </View>
          <View className="items-center px-3 py-4 border-2 rounded-xl border-forest w-[30%]">
            <Text className="text-xl font-bold text-forest">{user.following?.length || 0}</Text>
            <Text className="text-forest text-sm">Following</Text>
          </View>
        </View>
        {user.role === 'ambassador' && (
            <TouchableOpacity
                onPress={() => navigation.navigate('Referal')}
                className="mt-4 px-6 py-4 w-full rounded-full flex items-center justify-center bg-forest"
            >
                <Text className="text-white font-semibold">Referrals</Text>
            </TouchableOpacity>
        )}
      </View>

      <View className="mt-2">
        <Text className="text-lg font-semibold text-forest ml-5">Listings</Text>
        {listings.length === 0 ? (
          <Text className="text-sm text-gray-500 ml-5">No listings yet</Text>
        ) : (
          listings.map((listing) => <ListingCard key={listing._id} listing={listing} />)
        )}
      </View>

      <View className="px-4 mt-6 mb-[15vh]">
        <Text className="text-lg font-semibold text-forest ml-1">Posts</Text>
        {posts.length === 0 ? (
          <Text className="text-sm text-gray-500 ml-1">No posts yet</Text>
        ) : (
          <View className="flex-row flex-wrap mt-3">
            {posts.map((post) => (
              <TouchableOpacity
                key={post._id}
                className="p-0.5"
                style={{ width: getItemWidth(), height: getItemWidth() }}
                onPress={() => {
                  setSelectedPost(post);
                  setModalOpen(true);
                }}
              >
                <Image
                  source={{ uri: post.image || post.imageUrl }}
                  resizeMode="cover"
                  className="w-full h-full"
                />
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>

      {selectedPost && modalOpen && (
        <PostModal
          post={{
            ...selectedPost,
            user: selectedPost.user ?? { _id: '', username: 'unknown', profilePic: '' },
            image: selectedPost.imageUrl,
          }}
          modalOpen={modalOpen}
          onClose={() => {
            setModalOpen(false);
            setSelectedPost(null);
          }}
          token={token}
        />
      )}

      <Modal
        visible={profilePicModalOpen}
        transparent={true}
        onRequestClose={() => setProfilePicModalOpen(false)}
      >
        <TouchableOpacity
          className="flex-1 bg-black justify-center items-center"
          onPress={() => setProfilePicModalOpen(false)}
        >
          <Image
            source={{ uri: user.profilePic || 'https://via.placeholder.com/150' }}
            className="w-full h-full"
            resizeMode="contain"
          />
        </TouchableOpacity>
      </Modal>
    </ScrollView>
  );
}
