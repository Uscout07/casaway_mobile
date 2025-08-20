import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  TextInput,
  Text,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Image,
  SafeAreaView,
  Dimensions,
  Platform,
} from 'react-native';
import Constants from 'expo-constants';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { MaterialIcons } from '@expo/vector-icons';
import PostModal from '../components/postModal';
import { debounce } from 'lodash';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE_URL = Constants.expoConfig?.extra?.API_BASE_URL || 'http://192.168.0.100:5000'; // ✅ Replace with your LAN IP

interface User {
  _id: string;
  username: string;
  name?: string;
  profilePic?: string;
}

interface Post {
  _id: string;
  caption: string;
  imageUrl: string;
  user?: User;
  tags?: string[];
  city?: string;
  country?: string;
  createdAt?: string;
}

interface Suggestion {
  type: 'post' | 'tag' | 'user';
  data: Post | string | User;
  displayText: string;
  subtitle?: string;
}

type RootStackParamList = {
  Profile: { userId: string };
};

const { width: screenWidth } = Dimensions.get('window');

export default function SearchScreen() {
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();

  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [token, setToken] = useState<string>('');

  useEffect(() => {
    (async () => {
      const storedToken = await AsyncStorage.getItem('token');
      if (storedToken) setToken(storedToken);
    })();

    fetchPosts();
  }, []);

  const fetchPosts = async (searchParams?: { tags?: string; city?: string }) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchParams?.tags) params.append('tags', searchParams.tags);
      if (searchParams?.city) params.append('city', searchParams.city);

      const res = await fetch(`${API_BASE_URL}/api/posts?${params.toString()}`);
      const data = await res.json();
      if (res.ok) setPosts(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const searchSuggestions = async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setSuggestions([]);
      return;
    }

    try {
      const [postsRes, tagsRes, usersRes] = await Promise.all([
        fetch(`${API_BASE_URL}/api/posts?city=${encodeURIComponent(searchQuery)}`),
        fetch(`${API_BASE_URL}/api/posts/search/tags?query=${encodeURIComponent(searchQuery)}`),
        fetch(`${API_BASE_URL}/api/users/search/users?query=${encodeURIComponent(searchQuery)}`)
      ]);

      const [postsData, tagsData, usersData] = await Promise.all([
        postsRes.ok ? postsRes.json() : [],
        tagsRes.ok ? tagsRes.json() : [],
        usersRes.ok ? usersRes.json() : []
      ]);

      const newSuggestions: Suggestion[] = [];

      postsData.slice(0, 3).forEach((post: Post) => {
        newSuggestions.push({
          type: 'post',
          data: post,
          displayText: post.caption.slice(0, 50),
          subtitle: `${post.city || 'Unknown'}, ${post.country || 'Unknown'} • @${post.user?.username || 'user'}`
        });
      });

      tagsData.slice(0, 5).forEach((tag: string) => {
        newSuggestions.push({
          type: 'tag',
          data: tag,
          displayText: `#${tag}`,
          subtitle: 'Tag'
        });
      });

      usersData.slice(0, 3).forEach((user: User) => {
        newSuggestions.push({
          type: 'user',
          data: user,
          displayText: user.name || user.username,
          subtitle: `@${user.username}`
        });
      });

      setSuggestions(newSuggestions);
    } catch (err) {
      console.error(err);
    }
  };

  const debouncedSearch = useCallback(
    debounce((val: string) => searchSuggestions(val), 300),
    []
  );

  const handleSearchChange = (val: string) => {
    setQuery(val);
    setShowSuggestions(true);
    debouncedSearch(val);
  };

  const handleSuggestionClick = (suggestion: Suggestion) => {
    setShowSuggestions(false);
    if (suggestion.type === 'user') {
      const user = suggestion.data as User;
      navigation.navigate('Profile', { userId: user._id });
    } else if (suggestion.type === 'tag') {
      const tag = suggestion.data as string;
      setQuery(`#${tag}`);
      fetchPosts({ tags: tag });
    } else if (suggestion.type === 'post') {
      const postData = suggestion.data as Post;
      setSelectedPost(postData);
      setModalOpen(true);
    }
  };

  const getSuggestionIcon = (type: string) => {
    switch (type) {
      case 'post': return 'image';
      case 'tag': return 'loyalty';
      case 'user': return 'person';
      default: return 'search';
    }
  };

  const getItemWidth = () => {
    const numColumns = 3;
    const spacing = 4;
    return (screenWidth - spacing * (numColumns + 1)) / numColumns;
  };

  return (
    <SafeAreaView className="flex-1 bg-ambient pt-[10vh] px-2">
      {/* Search Bar */}
      <View className="px-4 pt-4 pb-2">
        <View className="relative flex-row items-center rounded-full bg-white shadow-lg border border-gray-200">
          <MaterialIcons name="search" size={24} color="#E2725B" className="ml-4 mr-2" />
          <TextInput
            placeholder="Search posts, tags (#tag), or city"
            placeholderTextColor="#888"
            value={query}
            onChangeText={handleSearchChange}
            onFocus={() => setShowSuggestions(true)}
            className="flex-1 py-3 pr-4 text-base text-gray-800"
          />
        </View>

        {showSuggestions && suggestions.length > 0 && (
          <View className="absolute w-full bg-white mt-2 rounded-md shadow-lg border border-gray-200 z-10" style={{ top: 75 }}>
            {suggestions.map((sugg, i) => (
              <TouchableOpacity
                key={i}
                onPress={() => handleSuggestionClick(sugg)}
                className="flex-row items-center px-4 py-3 border-b border-gray-100 last:border-b-0"
              >
                <MaterialIcons name={getSuggestionIcon(sugg.type)} size={20} color="gray" />
                <View className="ml-3 flex-1">
                  <Text className="font-medium text-gray-800">{sugg.displayText}</Text>
                  {sugg.subtitle && <Text className="text-xs text-gray-500">{sugg.subtitle}</Text>}
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>

      {/* Grid */}
      <View className="flex-1 px-1 mt-4">
        {loading ? (
          <ActivityIndicator size="large" color="#214F3F" className="mt-8" />
        ) : (
          <FlatList
            data={posts}
            numColumns={3}
            keyExtractor={item => item._id}
            renderItem={({ item }) => (
              <TouchableOpacity
                onPress={() => {
                  setSelectedPost(item);
                  setModalOpen(true);
                }}
                className="p-0.5"
                style={{ width: getItemWidth(), height: getItemWidth() }}
              >
                <Image
                  source={{ uri: item.imageUrl }}
                  resizeMode="cover"
                  className="w-full h-full"
                />
              </TouchableOpacity>
            )}
            contentContainerStyle={{ paddingHorizontal: 0.5 }}
          />
        )}
      </View>

      {/* Post Modal */}
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
    </SafeAreaView>
  );
}
