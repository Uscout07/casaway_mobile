import React, { useState, useEffect, Suspense } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Image,
  TextInput,
  ActivityIndicator,
  Alert,
  SafeAreaView,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

// --- Type Definitions ---
// Define the RootStackParamList based on your App.tsx.
export type RootStackParamList = {
  Home: undefined;
  Auth: undefined;
  Search: undefined;
  Settings: undefined;
  NewPost: undefined;
};

type SettingsPageNavigationProp = StackNavigationProp<RootStackParamList, 'Settings'>;

// --- API Configuration ---
const API_BASE_URL = Constants.expoConfig?.extra?.API_BASE_URL || 'http://192.168.0.100:5000';

// --- Type Definitions based on your provided schemas and components ---
interface UserData {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  profilePic?: string;
  followers?: string[];
  following?: string[];
  listings?: any[];
  posts?: any[];
}

interface Listing {
  _id: string;
  title: string;
  thumbnail: string;
  city: string;
  country: string;
  status: 'draft' | 'published';
}

interface Post {
  city: string;
  country: string;
  caption: string;
  imageUrl: string | Blob | undefined;
  _id: string;
  title: string;
  content: string;
}

// --- Import the separate form components here ---
// You will need to ensure these components are created and exported from their respective files.
// Assuming the files are in the same directory for simplicity.
import EditListingForm from '../components/Settings/editListingsForm';
import EditPostForm from '../components/Settings/editPostForm';
import Constants from 'expo-constants';

const SettingsPage = () => {
  const navigation = useNavigation<SettingsPageNavigationProp>();
  const [activeTab, setActiveTab] = useState('profile');
  const [user, setUser] = useState<UserData | null>(null);
  const [listings, setListings] = useState<Listing[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingPostId, setEditingPostId] = useState<string | null>(null);
  const [editingListingId, setEditingListingId] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<{ type: 'listing' | 'post' | 'account'; id?: string } | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Profile edit states
  const [profileData, setProfileData] = useState({
    name: '',
    phone: '',
    profilePic: '',
  });

  const [errors, setErrors] = useState<{ name?: string; phone?: string; profilePic?: string; general?: string }>({});

  useEffect(() => {
    fetchUserData();
  }, []);

  useEffect(() => {
    if (user?._id && activeTab === 'listings' && !editingListingId) {
      fetchListings();
    }
    if (user?._id && activeTab === 'posts' && !editingPostId) {
      fetchPosts();
    }
  }, [activeTab, user?._id, editingListingId, editingPostId]);

  // Use useEffect to trigger the confirmation alert
  useEffect(() => {
    if (showDeleteConfirm) {
      const type = showDeleteConfirm.type;
      const id = showDeleteConfirm.id;
      Alert.alert(
        `Delete ${type === 'account' ? 'Account' : type}`,
        `Are you sure you want to delete this ${type}? This action cannot be undone.`,
        [
          {
            text: 'Cancel',
            onPress: () => setShowDeleteConfirm(null),
            style: 'cancel',
          },
          {
            text: 'Confirm',
            onPress: () => handleConfirmAction(type, id),
            style: 'destructive',
          },
        ],
        { cancelable: false }
      );
    }
  }, [showDeleteConfirm]);

  const fetchUserData = async () => {
    setLoading(true);
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        console.warn('No token found, user not logged in.');
        setLoading(false);
        return;
      }
      const response = await fetch(`${API_BASE_URL}/api/users/me`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
        setProfileData({
          name: userData.name || '',
          phone: userData.phone || '',
          profilePic: userData.profilePic || ''
        });
      } else {
        console.error('Failed to fetch user data:', response.statusText);
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchListings = async () => {
    if (!user?._id) return;
    setLoading(true);
    try {
      const token = await AsyncStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/api/listing/user/${user._id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setListings(data);
      } else {
        console.error('Failed to fetch listings:', response.statusText);
      }
    } catch (error) {
      console.error('Error fetching listings:', error);
    } finally {
      setLoading(false);
    }
  };

  const deleteListing = async (listingId?: string) => {
    if (!listingId) return;
    setShowDeleteConfirm(null);
    setLoading(true);
    try {
      const token = await AsyncStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/api/listing/${listingId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        Alert.alert('Success', 'Listing deleted successfully!');
        fetchListings();
      } else {
        const errorData = await response.json();
        Alert.alert('Error', errorData.msg || 'Failed to delete listing.');
      }
    } catch (error) {
      Alert.alert('Error', 'Error deleting listing.');
    } finally {
      setLoading(false);
    }
  };

  const fetchPosts = async () => {
    if (!user?._id) return;
    setLoading(true);
    try {
      const token = await AsyncStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/api/posts/user/${user._id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setPosts(data);
      } else {
        console.error('Failed to fetch posts:', response.statusText);
      }
    } catch (error) {
      console.error('Error fetching posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const deletePost = async (postId?: string) => {
    if (!postId) return;
    setShowDeleteConfirm(null);
    setLoading(true);
    try {
      const token = await AsyncStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/api/posts/${postId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        Alert.alert('Success', 'Post deleted successfully!');
        fetchPosts();
      } else {
        const errorData = await response.json();
        Alert.alert('Error', errorData.msg || 'Failed to delete post.');
      }
    } catch (error) {
      Alert.alert('Error', 'Error deleting post.');
    } finally {
      setLoading(false);
    }
  };

  const deleteAccount = async () => {
    setShowDeleteConfirm(null);
    setLoading(true);
    try {
      const token = await AsyncStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/api/users/delete`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        Alert.alert('Success', 'Account deleted successfully!');
        await AsyncStorage.removeItem('token');
        navigation.navigate('Auth'); // Redirect to login page
      } else {
        const errorData = await response.json();
        Alert.alert('Error', errorData.msg || 'Failed to delete account.');
      }
    } catch (error) {
      Alert.alert('Error', 'Error deleting account.');
    } finally {
      setLoading(false);
    }
  };

  const handleProfileChange = (name: string, value: string) => {
    setProfileData({ ...profileData, [name]: value });
  };

  const handleProfileSubmit = async () => {
    setLoading(true);
    setErrors({});
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        setErrors({ general: 'Authentication token not found. Please log in again.' });
        setLoading(false);
        return;
      }
      const response = await fetch(`${API_BASE_URL}/api/users/edit`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(profileData)
      });
      if (response.ok) {
        const updatedUser = await response.json();
        setUser(updatedUser);
        Alert.alert('Success', 'Profile updated successfully!');
      } else {
        const errorData = await response.json();
        setErrors(errorData.errors || { general: errorData.msg || 'Failed to update profile.' });
      }
    } catch (error) {
      setErrors({ general: 'Network error or unexpected issue.' });
    } finally {
      setLoading(false);
    }
  };

  const handleEditListing = (id: string) => {
    setEditingListingId(id);
    setActiveTab('listings');
  };

  const handleEditPost = (id: string) => {
    setEditingPostId(id);
    setActiveTab('posts');
  };

  const handleEditFormCancel = () => {
    setEditingListingId(null);
    setEditingPostId(null);
  };

  const handleEditFormSuccess = () => {
    setEditingListingId(null);
    setEditingPostId(null);
    fetchListings(); // Refresh the list after successful edit
    fetchPosts(); // Refresh the list after successful edit
  };

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    setEditingListingId(null);
    setEditingPostId(null);
    setIsMobileMenuOpen(false);
  };

  const tabItems = [
    { id: 'profile', icon: 'account-outline', label: 'Profile' },
    { id: 'listings', icon: 'home-city-outline', label: 'My Listings' },
    { id: 'posts', icon: 'post-outline', label: 'My Posts' },
    { id: 'security', icon: 'security', label: 'Security' },
    { id: 'notifications', icon: 'bell-outline', label: 'Notifications' },
  ];

  const handleConfirmAction = (type: string, id?: string) => {
    if (type === 'listing') {
      deleteListing(id);
    } else if (type === 'post') {
      deletePost(id);
    } else if (type === 'account') {
      deleteAccount();
    }
    // Dismiss the confirmation state after action is taken
    setShowDeleteConfirm(null);
  };

  const UserListingsSection = () => (
    <View>
      <Text className="text-2xl sm:text-3xl font-semibold text-forest mb-4 sm:mb-6">
        My Listings
      </Text>
      {loading && activeTab === 'listings' ? (
        <ActivityIndicator size="large" color="#214F3F" className="mt-8" />
      ) : listings.length > 0 ? (
        listings.map((listing) => (
          <View key={listing._id} className="bg-gray-100 p-4 mb-2 rounded-lg flex-row items-center justify-between">
            <Text className="font-semibold">{listing.title}</Text>
            <View className="flex-row space-x-2">
              <TouchableOpacity onPress={() => handleEditListing(listing._id)}>
                <MaterialIcons name="edit" size={20} color="#214F3F" />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setShowDeleteConfirm({ type: 'listing', id: listing._id })}>
                <MaterialIcons name="delete" size={20} color="red" />
              </TouchableOpacity>
            </View>
          </View>
        ))
      ) : (
        <Text className="text-center text-gray-500 mt-4">No listings found.</Text>
      )}
    </View>
  );

  const UserPostsSection = () => (
    <View>
      <Text className="text-2xl sm:text-3xl font-semibold text-forest mb-4 sm:mb-6">
        My Posts
      </Text>
      <TouchableOpacity
        onPress={() => navigation.navigate('NewPost')}
        className="bg-forest-medium p-3 rounded-lg flex-row items-center justify-center mb-4"
      >
        <MaterialCommunityIcons name="plus" size={20} color="#FFF" />
        <Text className="text-white font-bold ml-2">Add New Post</Text>
      </TouchableOpacity>
      {loading && activeTab === 'posts' ? (
        <ActivityIndicator size="large" color="#214F3F" className="mt-8" />
      ) : posts.length > 0 ? (
        posts.map((post) => (
          <View key={post._id} className="bg-gray-100 p-4 mb-2 rounded-lg flex-row items-center justify-between">
            <Text className="font-semibold">{post.caption}</Text>
            <View className="flex-row space-x-2">
              <TouchableOpacity onPress={() => handleEditPost(post._id)}>
                <MaterialIcons name="edit" size={20} color="#214F3F" />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setShowDeleteConfirm({ type: 'post', id: post._id })}>
                <MaterialIcons name="delete" size={20} color="red" />
              </TouchableOpacity>
            </View>
          </View>
        ))
      ) : (
        <Text className="text-center text-gray-500 mt-4">No posts found.</Text>
      )}
    </View>
  );

  return (
    <SafeAreaView className="flex-1 bg-ambient">
      <ScrollView className="flex-1">
        <View className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
          <Text className="text-2xl sm:text-3xl lg:text-4xl font-bold text-center text-forest mb-6 sm:mb-8 lg:mb-10">
            Account Settings
          </Text>

          <View className="bg-white rounded-lg shadow-xl overflow-hidden">
            {/* Mobile Header with Menu Toggle */}
            <View className="lg:hidden bg-forest-medium p-4 flex-row items-center justify-between">
              <Text className="text-white font-semibold text-lg">
                {tabItems.find(item => item.id === activeTab)?.label}
              </Text>
              <TouchableOpacity
                onPress={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="p-2 rounded-md transition-colors"
              >
                <MaterialCommunityIcons name={isMobileMenuOpen ? 'close' : 'menu'} size={24} color="#FFF" />
              </TouchableOpacity>
            </View>

            <View className="flex-row">
              {/* Desktop Sidebar Navigation */}
              <View className="hidden lg:flex w-1/4 bg-forest-medium p-6 flex-col space-y-4">
                {tabItems.map((item) => (
                  <TouchableOpacity
                    key={item.id}
                    className={`flex-row items-center space-x-3 p-3 rounded-lg transition-colors duration-200 ${
                      activeTab === item.id ? 'bg-forest-light text-forest' : 'text-white'
                    }`}
                    onPress={() => handleTabChange(item.id)}
                  >
                    <MaterialCommunityIcons
                      name={item.icon as any}
                      size={24}
                      color={activeTab === item.id ? '#214F3F' : '#FFF'}
                    />
                    <Text className="font-medium text-white">{item.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Mobile Navigation Menu */}
              {isMobileMenuOpen && (
                <View className="lg:hidden bg-forest-medium border-t border-forest-light w-full h-[90%]">
                  <View className="px-4 py-2 space-y-1 w-full">
                    {tabItems.map((item) => (
                      <TouchableOpacity
                        key={item.id}
                        className={`w-full flex-row items-center space-x-5 p-5 rounded-lg transition-colors duration-200 ${
                          activeTab === item.id ? 'bg-forest-light' : 'text-white'
                        }`}
                        onPress={() => handleTabChange(item.id)}
                      >
                        <MaterialCommunityIcons
                          name={item.icon as any}
                          size={20}
                          color={activeTab === item.id ? '#214F3F' : '#FFF'}
                        />
                        <Text className={`font-medium ${activeTab === item.id ? 'text-forest' : 'text-white'}`}>{item.label}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              )}

              {/* Main Content Area */}
              <View className="flex-1 p-4 sm:p-6 lg:p-8 relative">
                {loading && activeTab !== 'listings' && activeTab !== 'posts' && (
                  <View className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center z-50">
                    <ActivityIndicator size="large" color="#214F3F" />
                    <Text className="text-forest text-lg mt-2">Loading...</Text>
                  </View>
                )}

                {/* Profile Tab */}
                {activeTab === 'profile' && (
                  <View className="space-y-6">
                    <Text className="text-2xl sm:text-3xl font-semibold text-forest mb-4 sm:mb-6">
                      Profile Settings
                    </Text>
                    <View>
                      <View className="grid grid-cols-1 gap-4 sm:gap-6">
                        <View>
                          <Text className="block text-sm font-medium text-gray-700 mb-1">Name</Text>
                          <TextInput
                            id="name"
                            value={profileData.name}
                            onChangeText={(text) => handleProfileChange('name', text)}
                            className="w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-teal-500 focus:border-teal-500"
                          />
                          {errors.name && <Text className="text-red-500 text-xs mt-1">{errors.name}</Text>}
                        </View>
                        <View>
                          <Text className="block text-sm font-medium text-gray-700 mb-1">Phone Number</Text>
                          <TextInput
                            id="phone"
                            value={profileData.phone}
                            onChangeText={(text) => handleProfileChange('phone', text)}
                            className="w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-teal-500 focus:border-teal-500"
                          />
                          {errors.phone && <Text className="text-red-500 text-xs mt-1">{errors.phone}</Text>}
                        </View>
                        <View>
                          <Text className="block text-sm font-medium text-gray-700 mb-1">Profile Picture URL</Text>
                          <TextInput
                            id="profilePic"
                            value={profileData.profilePic}
                            onChangeText={(text) => handleProfileChange('profilePic', text)}
                            className="w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-teal-500 focus:border-teal-500"
                          />
                          {errors.profilePic && (
                            <Text className="text-red-500 text-xs mt-1">{errors.profilePic}</Text>
                          )}
                          {profileData.profilePic ? (
                            <View className="mt-4 flex justify-center sm:justify-start">
                              <Image
                                source={{ uri: profileData.profilePic }}
                                className="w-20 h-20 sm:w-24 sm:h-24 rounded-full object-cover"
                              />
                            </View>
                          ) : null}
                        </View>
                      </View>
                      {errors.general && <Text className="text-red-500 text-sm mt-2">{errors.general}</Text>}
                      <View className="flex justify-center sm:justify-start mt-6">
                        <TouchableOpacity
                          onPress={handleProfileSubmit}
                          className="w-full sm:w-auto bg-forest-medium hover:forest text-white font-bold py-2 px-6 rounded-lg shadow-md transition-colors duration-200"
                          disabled={loading}
                        >
                          <Text className="text-white font-bold text-center">Save Changes</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                    <View className="mt-8 pt-8 border-t border-gray-200 space-y-4">
                      <Text className="text-2xl font-semibold text-forest">Account Info</Text>
                      {user && (
                        <View>
                          <Text><Text className="font-bold">Name:</Text> {user.name}</Text>
                          <Text><Text className="font-bold">Email:</Text> {user.email}</Text>
                          <Text><Text className="font-bold">Phone:</Text> {user.phone || 'N/A'}</Text>
                          <Text><Text className="font-bold">Followers:</Text> {user.followers?.length || 0}</Text>
                          <Text><Text className="font-bold">Following:</Text> {user.following?.length || 0}</Text>
                        </View>
                      )}
                    </View>
                  </View>
                )}

                {/* My Listings Tab */}
                {activeTab === 'listings' && (
                  editingListingId ? (
                    <EditListingForm listingId={editingListingId} onCancel={handleEditFormCancel} onSuccess={handleEditFormSuccess} />
                  ) : (
                    <UserListingsSection />
                  )
                )}

                {/* My Posts Tab */}
                {activeTab === 'posts' && (
                  editingPostId ? (
                    <EditPostForm postId={editingPostId} onCancel={handleEditFormCancel} onSuccess={handleEditFormSuccess} />
                  ) : (
                    <UserPostsSection />
                  )
                )}
                {/* Security Tab */}
                {activeTab === 'security' && (
                  <View>
                    <Text className="text-2xl sm:text-3xl font-semibold text-forest mb-4 sm:mb-6">
                      Security Settings
                    </Text>
                    <TouchableOpacity
                      onPress={() => setShowDeleteConfirm({ type: 'account' })}
                      className="bg-red-600 p-3 rounded-lg flex-row items-center justify-center"
                    >
                      <MaterialCommunityIcons name="delete-forever" size={20} color="#FFF" />
                      <Text className="text-white font-bold ml-2">Delete My Account</Text>
                    </TouchableOpacity>
                  </View>
                )}
                {/* Notifications Tab */}
                {activeTab === 'notifications' && (
                  <View>
                    <Text className="text-2xl sm:text-3xl font-semibold text-forest mb-4 sm:mb-6">
                      Notification Settings
                    </Text>
                    <Text className="text-gray-600">
                      You can manage your notification preferences here.
                    </Text>
                  </View>
                )}
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default SettingsPage;