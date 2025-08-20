import React, { useEffect, useState } from 'react';
import { View, Text, Image, Pressable, ActivityIndicator } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

interface Listing {
  _id: string;
  title: string;
  thumbnail?: string;
  images?: string[];
  city: string;
  country: string;
  availability: { startDate: string; endDate: string }[];
  type: string;
  tags: string[];
}

interface Props {
  listing: Listing;
}

const ListingCard: React.FC<Props> = ({ listing }) => {
  const navigation = useNavigation<any>();
  const API_BASE_URL = Constants.expoConfig?.extra?.API_BASE_URL;

  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadToken = async () => {
      const storedToken = await AsyncStorage.getItem('token');
      setToken(storedToken);
    };
    loadToken();
  }, []);

  useEffect(() => {
    const fetchLikeInfo = async () => {
      const token = await AsyncStorage.getItem('token');
      if (!token) return;

      try {
        const [statusRes, countRes] = await Promise.all([
          fetch(`${API_BASE_URL}/api/likes/status/${listing._id}`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }),
          fetch(`${API_BASE_URL}/api/likes/count/listing/${listing._id}`),
        ]);

        if (statusRes.ok) {
          const statusData = await statusRes.json();
          setIsLiked(statusData.isLiked);
        }

        if (countRes.ok) {
          const countData = await countRes.json();
          setLikesCount(countData.count);
        }
      } catch (err) {
        console.error('Error fetching like info:', err);
      }
    };

    fetchLikeInfo();
  }, [token, listing._id]);

  const toggleLike = async () => {
    if (!token) return;
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE_URL}/api/likes/toggle/listing/${listing._id}`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await res.json();
      if (res.ok) {
        setIsLiked(data.liked);
        setLikesCount(data.likesCount ?? (data.liked ? likesCount + 1 : likesCount - 1));
      }
    } catch (err) {
      console.error('Like toggle failed:', err);
    } finally {
      setLoading(false);
    }
  };


  const openDetails = () => {
    navigation.navigate('ListingDetail', { id: listing._id });
  };

  return (
    <Pressable
      onPress={openDetails}
      className="bg-white rounded-xl mb-4 mt-5 w-[90%] mx-auto"
      style={{
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowRadius: 5,
        shadowOffset: { width: 0, height: 3 },
        elevation: 3,
      }}
    >
      <Image
        source={{ uri: listing.thumbnail || listing.images?.[0] || 'https://placehold.co/300x200' }}
        className="w-full rounded-t-xl"
        style={{ height: 160 }}
        resizeMode="cover"
      />

      <View className="p-4">
        <Text className="text-base font-bold text-forest mb-1" numberOfLines={1}>
          {listing.title}
        </Text>

        <View className="flex-row items-center mb-1">
          <MaterialIcons name="location-on" size={16} color="#214F3F" />
          <Text className="text-sm text-slate ml-1">
            {listing.city}, {listing.country}
          </Text>
        </View>


        <View className="flex-row items-center justify-between mt-2">
          <View className="flex-row items-center space-x-2">
            <Pressable onPress={toggleLike} disabled={loading}>
              {loading ? (
                <ActivityIndicator size="small" />
              ) : (
                <MaterialIcons
                  name={isLiked ? 'favorite' : 'favorite-outline'}
                  size={20}
                  color={isLiked ? 'red' : 'gray'}
                />
              )}
            </Pressable>
            {likesCount > 0 && (
              <Text className="text-sm text-gray-600 ml-1">{likesCount}</Text>
            )}
          </View>
        </View>

        <View className="flex-row flex-wrap gap-2 mt-3">
          {listing.type && (
            <Text className="px-3 py-1 bg-gray-100 text-gray-700 text-xs rounded-full">
              {listing.type}
            </Text>
          )}
          {listing.tags.includes('live-with-family') && (
            <Text className="px-3 py-1 bg-orange-100 text-orange-700 text-xs rounded-full">
              Live with Family
            </Text>
          )}
          {listing.tags.includes('women-only') && (
            <Text className="px-3 py-1 bg-pink-100 text-pink-700 text-xs rounded-full">
              Women Only
            </Text>
          )}
        </View>
      </View>
    </Pressable>
  );
};

export default ListingCard;
