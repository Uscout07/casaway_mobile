import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  Alert,
  Dimensions,
} from 'react-native';
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { Listing, Comment } from '../../types/listingPageTypes';

// Import the Calendar component
import { Calendar } from 'react-native-calendars';

const { width: screenWidth } = Dimensions.get('window');

interface ListingDetailsCardProps {
  listing: Listing;
  comments: Comment[];
  formatAvailability: (dates: string[]) => string;
  handleContactHost: (startDate: string, endDate: string) => void;
}

const API_BASE_URL = Constants.expoConfig?.extra?.API_BASE_URL ?? 'http://localhost:5000';

// ✅ Facilities (aka amenities)
const amenityIcons: Record<string, keyof typeof MaterialCommunityIcons.glyphMap> = {
  'washing-machine': 'washing-machine',
  'dryer': 'tumble-dryer',
  'free-parking': 'car',
  'office-desk': 'desk',
  'office-chair': 'chair-rolling',
  'monitors': 'monitor',
  'air-conditioning': 'air-conditioner',
  'heater': 'radiator',
  'WiFi': 'wifi',
};

// ✅ Features
const featureIcons: Record<string, keyof typeof MaterialCommunityIcons.glyphMap> = {
  'garden': 'tree',
  'backyard': 'grass',
  'mountain-view': 'terrain',
  'ocean-view': 'waves',
  'lake-view': 'waves',
  'beach-access': 'beach',
};

const ListingDetailsCard: React.FC<ListingDetailsCardProps> = ({
  listing,
  comments,
  formatAvailability,
  handleContactHost,
}) => {
  const [token, setToken] = useState<string | null>(null);
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [loadingLike, setLoadingLike] = useState(false);

  // Calendar state for react-native-calendars
  const [selectedRange, setSelectedRange] = useState<{ start: string | null; end: string | null }>({ start: null, end: null });
  const [showCalendar, setShowCalendar] = useState(false);
  const [markedDates, setMarkedDates] = useState<Record<string, any>>({});

  // load token
  useEffect(() => {
    AsyncStorage.getItem('token').then(setToken);
  }, []);

  // fetch like status + count
  useEffect(() => {
    if (!token) return;
    (async () => {
      try {
        const [statusRes, countRes] = await Promise.all([
          fetch(`${API_BASE_URL}/api/likes/status/${listing._id}`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch(`${API_BASE_URL}/api/likes/count/listing/${listing._id}`),
        ]);
        if (statusRes.ok) {
          const d = await statusRes.json();
          setIsLiked(d.isLiked);
        }
        if (countRes.ok) {
          const d = await countRes.json();
          setLikesCount(d.count);
        }
      } catch (err) {
        console.error(err);
      }
    })();
  }, [token, listing._id]);

  const toggleLike = async () => {
    if (!token) return Alert.alert('Auth Required', 'Please log in.');
    setLoadingLike(true);
    try {
      const res = await fetch(
        `${API_BASE_URL}/api/likes/toggle/listing/${listing._id}`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );
      const d = await res.json();
      if (res.ok) {
        setIsLiked(d.liked);
        setLikesCount(d.likesCount);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingLike(false);
    }
  };

  // Calendar date selection logic for react-native-calendars
  const onDayPress = (day: { dateString: string }) => {
    const newDate = day.dateString;

    if (!selectedRange.start || selectedRange.end) {
      // Start a new range or reset if an end date was already selected
      setSelectedRange({ start: newDate, end: null });
      setMarkedDates({
        [newDate]: {
          selected: true,
          startingDay: true,
          color: '#0d9488',
          textColor: 'white',
        },
      });
    } else {
      // Select the end date
      const start = new Date(selectedRange.start);
      const end = new Date(newDate);

      let newStart = selectedRange.start;
      let newEnd = newDate;

      // Ensure start is before end
      if (end < start) {
        newStart = newDate;
        newEnd = selectedRange.start;
      }

      setSelectedRange({ start: newStart, end: newEnd });

      // Generate marked dates for the range
      const updatedMarkedDates: Record<string, any> = {};
      let currentDate = new Date(newStart);
      while (currentDate <= new Date(newEnd)) {
        const dateString = currentDate.toISOString().split('T')[0];
        updatedMarkedDates[dateString] = {
          selected: true,
          color: '#99f6e4', // Color for dates within the range
          textColor: '#111',
        };
        currentDate.setDate(currentDate.getDate() + 1);
      }

      // Special styling for start and end dates
      updatedMarkedDates[newStart] = {
        selected: true,
        startingDay: true,
        color: '#0d9488',
        textColor: 'white',
      };
      updatedMarkedDates[newEnd] = {
        selected: true,
        endingDay: true,
        color: '#0d9488',
        textColor: 'white',
      };

      setMarkedDates(updatedMarkedDates);
    }
  };

  const isContactHostEnabled = selectedRange.start && selectedRange.end;
  const contactHostButtonText = isContactHostEnabled
    ? `Contact Host for ${selectedRange.start} to ${selectedRange.end}`
    : selectedRange.start
      ? `Select End Date (Start: ${selectedRange.start})`
      : 'Select a Date Range';

  return (
    <ScrollView className="bg-white p-6 rounded-xl shadow-md mb-6">
      {/* Title */}
      <Text className="text-2xl font-bold text-gray-900 mb-2">
        {listing.title}
      </Text>

      {/* Location */}
      <View className="flex-row items-center mb-2">
        <MaterialIcons name="location-on" size={18} color="#4B5563" />
        <Text className="text-gray-600 ml-1">
          {listing.city}, {listing.country}
        </Text>
      </View>

      {/* Type and Roommates */}
      <View className="flex flex-wrap items-center flex-row gap-x-4 gap-y-2 text-gray-600 text-sm mb-6">
        <View className="flex-row items-center">
          <MaterialIcons name="home" size={20} color="#4B5563" />
          <Text className="ml-1">{listing.type}</Text>
        </View>
        {listing.roommates && listing.roommates.length > 0 && (
          <View className="flex-row items-center">
            <MaterialIcons name="group" size={20} color="#4B5563" />
            <Text className="ml-1">Roommates: {listing.roommates.join(', ')}</Text>
          </View>
        )}
      </View>

      {/* "Select Dates" button to toggle calendar visibility */}
      <TouchableOpacity
        onPress={() => setShowCalendar(!showCalendar)}
        className="px-4 py-2 bg-forest text-white rounded-lg hover:bg-forest text-sm mb-4"
      >
        <Text className="text-white text-center font-medium">
          {showCalendar ? 'Hide Calendar' : 'Select Dates / Check Availability'}
        </Text>
      </TouchableOpacity>

      {/* Calendar Integration with react-native-calendars */}
      {showCalendar && (
        <View style={{ backgroundColor: '#fff', borderRadius: 8, padding: 12, marginBottom: 16 }}>
          <Text style={{ fontSize: 16, fontWeight: '500', color: '#374151', marginBottom: 16 }}>Select Availability</Text>

          <Calendar
            onDayPress={onDayPress}
            markingType={'period'} // Use 'period' for range selection
            markedDates={markedDates}
            theme={{
              selectedDayBackgroundColor: '#0d9488',
              selectedDayTextColor: '#ffffff',
              todayTextColor: '#0d9488',
              arrowColor: '#0d9488',
              monthTextColor: '#374151',
              textMonthFontWeight: 'bold',
              textDayHeaderFontWeight: '500',
              textDayFontSize: 14,
              textMonthFontSize: 16,
            }}
          />

          {/* Selected Range Display */}
          <Text style={{ marginTop: 12, textAlign: 'center', color: '#555', fontSize: 14 }}>
            {selectedRange.start && selectedRange.end ? (
              `Selected: ${selectedRange.start} → ${selectedRange.end}`
            ) : selectedRange.start ? (
              `Start: ${selectedRange.start} — select end date`
            ) : (
              'No date range selected'
            )}
          </Text>
        </View>
      )}

      {/* Contact Host Button - Conditionally rendered */}
      {isContactHostEnabled && (
        <TouchableOpacity
          onPress={() => handleContactHost(selectedRange.start!, selectedRange.end!)}
          className={`ml-0 mt-4 px-4 py-2 text-white rounded-lg text-sm w-full bg-forest hover:bg-forest-medium`}
        >
          <Text className="text-white text-center font-medium">{contactHostButtonText}</Text>
        </TouchableOpacity>
      )}

      {/* Like and Comment counts */}
      <View className="flex-row items-center gap-4 text-gray-700 my-6">
        <TouchableOpacity onPress={toggleLike} disabled={loadingLike} className="flex-row items-center space-x-1">
          {loadingLike ? (
            <ActivityIndicator size="small" color="#4B5563" />
          ) : (
            <MaterialIcons
              name={isLiked ? 'favorite' : 'favorite-outline'}
              size={24}
              color={isLiked ? 'red' : 'gray'}
            />
          )}
          <Text className="text-base font-medium px-1">{likesCount} Likes</Text>
        </TouchableOpacity>
        <View className="flex-row items-center space-x-1">
          <MaterialIcons name="chat-bubble-outline" size={24} color="#4B5563" />
          <Text className="text-base font-medium px-1">
            {comments.length + comments.reduce((acc, comment) => acc + (comment.replies?.length || 0), 0)} Comments
          </Text>
        </View>
      </View>

      <View className="my-6 border-b border-gray-200" />

      <Text className="text-2xl font-semibold text-gray-900 mb-3">Description</Text>
      <Text className="text-gray-700 leading-relaxed mb-6">{listing.details}</Text>

      {/* Amenities */}
      <Text className="text-2xl font-semibold text-gray-900 mb-3">Facilities</Text>
      <View className="mb-6">
        {listing.amenities.map((amenity, index) => {
          const iconName = amenityIcons[amenity];
          return (
            <View key={index} className="flex-row items-center mb-3">
              <MaterialCommunityIcons name={iconName || 'help-circle-outline'} size={24} color="#214F3F" className="mr-3" />
              <Text className="text-gray-700">{amenity.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</Text>
            </View>
          );
        })}
      </View>

      {/* Features */}
      <Text className="text-2xl font-semibold text-gray-900 mb-3 mt-3">Features</Text>
      <View className="mb-6">
        {listing.features.map((feature, index) => {
          const iconName = featureIcons[feature];
          return (
            <View key={index} className="flex-row items-center mb-3">
              <MaterialCommunityIcons name={iconName || 'help-circle-outline'} size={24} color="#214F3F" className="mr-3" />
              <Text className="text-gray-700">{feature.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</Text>
            </View>
          );
        })}
      </View>

      {/* Pets Allowed */}
      {listing.petTypes && listing.petTypes.length > 0 && (
        <>
          <Text className="text-2xl font-semibold text-gray-900 mb-3 mt-3">This Listing's Furry Residents</Text>
          <View className="flex-row flex-wrap gap-3 mb-6">
            {listing.petTypes.includes('dogs') && (
              <View className="flex-row items-center text-sm text-forest bg-green-100 px-3 py-1 rounded-full">
                <MaterialCommunityIcons name="dog" size={20} color="#214F3F" className="mr-2" />
                <Text className="text-forest">Dogs</Text>
              </View>
            )}
            {listing.petTypes.includes('cats') && (
              <View className="flex-row items-center text-sm text-forest bg-green-100 px-3 py-1 rounded-full">
                <MaterialCommunityIcons name="cat" size={20} color="#214F3F" className="mr-2" />
                <Text className="text-forest">Cats</Text>
              </View>
            )}
            {listing.petTypes
              .filter(p => p !== 'dogs' && p !== 'cats')
              .map((pet, idx) => (
                <View
                  key={idx}
                  className="flex-row items-center text-sm text-forest bg-green-100 px-3 py-1 rounded-full"
                >
                  <MaterialCommunityIcons name="paw" size={20} color="#214F3F" className="mr-2" />
                  <Text className="text-forest">{pet.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</Text>
                </View>
              ))}
          </View>
        </>
      )}

      {/* Tags */}
      {listing.tags && listing.tags.length > 0 && (
        <>
          <Text className="text-2xl font-semibold text-gray-900 mb-3 mt-3">Tags</Text>
          <View className="flex-row flex-wrap gap-2 mb-6">
            {listing.tags.map((tag, index) => {
              const normalized = tag.toLowerCase();
              const tagClass = normalized.includes('women')
                ? 'bg-purple-100 text-purple-700'
                : normalized.includes('pet')
                  ? 'bg-pink-100 text-pink-700'
                  : 'bg-blue-100 text-blue-700';

              return (
                <View key={index} className={`px-3 py-1 text-sm rounded-full ${tagClass}`}>
                  <Text className={`${tagClass}`}>{tag.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</Text>
                </View>
              );
            })}
          </View>
        </>
      )}
    </ScrollView>
  );
};

export default ListingDetailsCard;