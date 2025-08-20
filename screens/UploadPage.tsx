import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  Alert,
  Dimensions,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import {
  MaterialIcons,
  MaterialCommunityIcons,
  Ionicons,
  FontAwesome5,
  AntDesign,
} from '@expo/vector-icons';
import { useRoute } from '@react-navigation/native';



// Assuming these components are already converted and available
// Make sure the path is correct based on your project structure
import CreatePostForm from '../components/createPostForm';
import StoryUpload from '../components/storyUpload';

// Types
interface SelectedImage {
  id: number;
  uri: string;
  name: string;
  type?: string;
}

interface DateRange {
  start: string | null;
  end: string | null;
}

interface RoommateDetails {
  count: string;
  gender: string;
}

// Ensure this interface matches the actual props CreatePostForm expects
interface CreatePostFormProps {
  onPostCreated: () => void;
  initialImageUrl?: string;
  initialCountry?: string;
  initialCity?: string;
}

interface FormData {
  title: string;
  details: string;
  country: string;
  city: string;
  type: string;
  amenities: string[];
  tags: string[];
  availability: string[];
  images: string[];
  thumbnail: string;
  status: string;
}

interface Facility {
  id: string;
  name: string;
  icon: keyof typeof MaterialCommunityIcons.glyphMap | keyof typeof MaterialIcons.glyphMap;
  iconFamily: 'MaterialCommunityIcons' | 'MaterialIcons';
}

interface Feature {
  id: string;
  name: string;
  icon: keyof typeof MaterialCommunityIcons.glyphMap | keyof typeof MaterialIcons.glyphMap;
  iconFamily: 'MaterialCommunityIcons' | 'MaterialIcons';
}

type ViewMode = 'listing' | 'post' | 'story';

const { width } = Dimensions.get('window'); // Not directly used in final layout logic, but kept if needed

const UploadListingScreen: React.FC = () => {
  // State management
  const [selectedImages, setSelectedImages] = useState<SelectedImage[]>([]);
  const [listingType, setListingType] = useState<string>('');
  const [selectedFacilities, setSelectedFacilities] = useState<string[]>([]);
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>([]);
  const [customFacilities, setCustomFacilities] = useState<string>('');
  const [customFeatures, setCustomFeatures] = useState<string>('');
  const [livingWith, setLivingWith] = useState<string[]>([]);
  const [roommateDetails, setRoommateDetails] = useState<RoommateDetails>({
    count: '',
    gender: '',
  });
  const [petTypes, setPetTypes] = useState<string[]>([]);
  const [customPets, setCustomPets] = useState<string>('');
  const [currentMonth, setCurrentMonth] = useState<number>(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState<number>(new Date().getFullYear());
  const [selectedRange, setSelectedRange] = useState<DateRange>({
    start: null,
    end: null,
  });
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [viewMode, setViewMode] = useState<ViewMode>('listing');
  const [thumbnailIndex, setThumbnailIndex] = useState<number>(0);
  const [formData, setFormData] = useState<FormData>({
    title: '',
    details: '',
    country: '',
    city: '',
    type: '',
    amenities: [],
    tags: [],
    availability: [],
    images: [],
    thumbnail: '',
    status: 'draft',
  });
  const route = useRoute<any>(); // or typed version if using TS types

  useEffect(() => {
    if (route.params?.viewMode) {
      setViewMode(route.params.viewMode); // sets to 'story' if passed
    }
  }, [route.params]);
  // Placeholder for handlePostCreated to resolve error
  const handlePostCreated = () => {
    // Logic after a post is created, e.g., navigate, show success message
    Alert.alert("Success", "Post created successfully!");
    // You might want to navigate back or clear the form here.
  };

  // Data arrays
  const facilities: Facility[] = [
    { id: 'washing-machine', name: 'Washing Machine', icon: 'washing-machine', iconFamily: 'MaterialCommunityIcons' },
    { id: 'dryer', name: 'Dryer', icon: 'tumble-dryer', iconFamily: 'MaterialCommunityIcons' },
    { id: 'free-parking', name: 'Free Parking', icon: 'car', iconFamily: 'MaterialCommunityIcons' },
    { id: 'office-desk', name: 'Office Desk', icon: 'desk', iconFamily: 'MaterialCommunityIcons' },
    { id: 'office-chair', name: 'Office Chair', icon: 'chair-rolling', iconFamily: 'MaterialCommunityIcons' },
    { id: 'monitors', name: 'Monitors', icon: 'monitor', iconFamily: 'MaterialCommunityIcons' },
    { id: 'air-conditioning', name: 'Air Conditioning', icon: 'air-conditioner', iconFamily: 'MaterialCommunityIcons' },
    { id: 'heater', name: 'Heater', icon: 'radiator', iconFamily: 'MaterialCommunityIcons' },
    { id: 'wifi', name: 'Wi-Fi', icon: 'wifi', iconFamily: 'MaterialCommunityIcons' },
  ];

  const features: Feature[] = [
    { id: 'garden', name: 'Garden', icon: 'tree', iconFamily: 'MaterialCommunityIcons' },
    { id: 'backyard', name: 'Backyard', icon: 'grass', iconFamily: 'MaterialCommunityIcons' },
    { id: 'mountain-view', name: 'Mountain View', icon: 'terrain', iconFamily: 'MaterialCommunityIcons' },
    { id: 'ocean-view', name: 'Ocean View', icon: 'waves', iconFamily: 'MaterialCommunityIcons' },
    { id: 'lake-view', name: 'Lake View', icon: 'waves', iconFamily: 'MaterialCommunityIcons' },
    { id: 'beach-access', name: 'Beach Access', icon: 'beach', iconFamily: 'MaterialCommunityIcons' },
  ];

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  // Icon renderer helper - Matches the previous logic, ensure colors are consistent
  const renderIcon = (item: Facility | Feature, size: number = 24, color: string = '#059669') => { // default color for forest-medium/green-600
    const IconComponent = item.iconFamily === 'MaterialCommunityIcons'
      ? MaterialCommunityIcons
      : MaterialIcons;

    return <IconComponent name={item.icon as any} size={size} color={color} />;
  };

  // Image picker handler
  const handleImageUpload = async (): Promise<void> => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Permission Required', 'Sorry, we need camera roll permissions to upload images.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true,
        quality: 0.8,
        aspect: [4, 3],
      });

      if (!result.canceled && result.assets) {
        if (selectedImages.length + result.assets.length > 10) {
          Alert.alert('Limit Exceeded', 'Maximum 10 images allowed');
          return;
        }

        const newImages: SelectedImage[] = result.assets.map((asset, index) => ({
          id: Date.now() + index, // Use unique ID
          uri: asset.uri,
          name: asset.fileName || `image_${Date.now()}_${index}.jpg`,
          type: asset.type,
        }));

        setSelectedImages(prev => [...prev, ...newImages]);
      }
    } catch (error) {
      console.error('ImagePicker Error:', error);
      Alert.alert('Error', 'Failed to pick images');
    }
  };

  // Remove image handler
  const removeImage = (imageId: number): void => {
    setSelectedImages(prev => {
      const filtered = prev.filter(img => img.id !== imageId);
      // Adjust thumbnail index if the current thumbnail is removed
      if (thumbnailIndex >= filtered.length) {
        setThumbnailIndex(Math.max(0, filtered.length - 1));
      }
      return filtered;
    });
  };

  // Space type selection handler
  const handleSpaceTypeSelect = (type: string): void => {
    setListingType(type);
    setFormData(prev => ({ ...prev, type }));
  };

  // Toggle handlers for facilities/features/livingWith/pets
  const handleToggle = (id: string, setter: React.Dispatch<React.SetStateAction<string[]>>) => {
    setter(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  // Calendar helpers
  const getDaysInMonth = (month: number, year: number): number => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (month: number, year: number): number => {
    return new Date(year, month, 1).getDay(); // 0 for Sunday, 1 for Monday, etc.
  };

  const handleDateClick = (day: number): void => {
    const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const clickedDate = new Date(dateStr);

    if (!selectedRange.start || (selectedRange.start && selectedRange.end)) {
      // Start a new range
      setSelectedRange({ start: dateStr, end: null });
    } else if (selectedRange.start && !selectedRange.end) {
      const startDate = new Date(selectedRange.start);
      if (clickedDate < startDate) {
        // If clicked date is before start, make it the new start and old start the end
        setSelectedRange({ start: dateStr, end: selectedRange.start });
      } else {
        // Otherwise, make it the end
        setSelectedRange({ ...selectedRange, end: dateStr });
      }
    }
  };

  const navigateMonth = (direction: 'prev' | 'next'): void => {
    if (direction === 'prev') {
      if (currentMonth === 0) {
        setCurrentMonth(11);
        setCurrentYear(prev => prev - 1);
      } else {
        setCurrentMonth(prev => prev - 1);
      }
    } else {
      if (currentMonth === 11) {
        setCurrentMonth(0);
        setCurrentYear(prev => prev + 1);
      } else {
        setCurrentMonth(prev => prev + 1);
      }
    }
  };

  const isInRange = (dateStr: string): boolean => {
    if (!selectedRange.start || !selectedRange.end) return false;
    const date = new Date(dateStr);
    const start = new Date(selectedRange.start);
    const end = new Date(selectedRange.end);
    return date >= start && date <= end;
  };

  const getDateRangeArray = (start: string, end: string): string[] => {
    const startDate = new Date(start);
    const endDate = new Date(end);
    const range: string[] = [];

    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      range.push(new Date(d).toISOString().split('T')[0]);
    }

    return range;
  };

  // Calendar renderer
  const renderCalendar = () => {
    const daysInMonth = getDaysInMonth(currentMonth, currentYear);
    const firstDay = getFirstDayOfMonth(currentMonth, currentYear); // 0 (Sunday) through 6 (Saturday)
    const days = [];

    // Empty cells for days before month starts
    for (let i = 0; i < firstDay; i++) {
      days.push(<View key={`empty-${i}`} className="w-10 h-10" />);
    }

    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const isSelectedStart = selectedRange.start === dateStr;
      const isSelectedEnd = selectedRange.end === dateStr;
      const inRange = isInRange(dateStr);

      days.push(
        <TouchableOpacity
          key={dateStr}
          onPress={() => handleDateClick(day)}
          className={`w-10 h-10 rounded-lg justify-center items-center ${isSelectedStart || isSelectedEnd
              ? 'bg-forest'
              : inRange
                ? 'bg-teal-200'
                : 'bg-transparent'
            }`}
        >
          <Text className={`text-sm ${isSelectedStart || isSelectedEnd
              ? 'text-white font-bold'
              : inRange
                ? 'text-gray-900'
                : 'text-gray-700'
            }`}>
            {day}
          </Text>
        </TouchableOpacity>
      );
    }

    return days;
  };

  // Submit listing handler
  const handleSubmitListing = async (status: 'draft' | 'published'): Promise<void> => {
    setIsLoading(true);

    try {
      const token = await AsyncStorage.getItem('token');

      if (!token) {
        Alert.alert('Authentication Required', 'Please log in to create a listing');
        setIsLoading(false);
        return;
      }

      const availability = selectedRange.start && selectedRange.end
        ? getDateRangeArray(selectedRange.start, selectedRange.end)
        : [];

      const amenities = [
        ...selectedFacilities,
        ...(customFacilities ? [customFacilities] : [])
      ];

      const featuresArray = [
        ...selectedFeatures,
        ...(customFeatures ? [customFeatures] : [])
      ];

      const tags = [];
      if (livingWith.includes('family')) tags.push('Family');
      if (livingWith.includes('roommates-women') || livingWith.includes('females-only')) {
        tags.push('Women Only');
      }
      if (livingWith.includes('pets')) { // Check if 'pets' is selected, regardless of listingType
        tags.push('Pets Allowed');
        tags.push(...petTypes);
        if (customPets) tags.push(customPets);
      }
      // Add other tags based on livingWith options if needed

      const imageUrls = selectedImages.map(img => img.uri);
      const roommates = []; // Populate based on livingWith logic if needed for backend

      if (livingWith.includes('family')) roommates.push('Family');
      if (livingWith.includes('roommates')) {
        let roommateString = 'Roommates';
        if (roommateDetails.count) roommateString += `: ${roommateDetails.count}`;
        if (roommateDetails.gender) roommateString += ` (${roommateDetails.gender})`;
        if (roommateString !== 'Roommates') roommates.push(roommateString);
      }
      if (livingWith.includes('females-only')) roommates.push('Females Only');


      const listingData = {
        title: formData.title,
        details: formData.details,
        type: listingType,
        amenities,
        features: featuresArray,
        city: formData.city,
        country: formData.country,
        tags,
        availability,
        images: imageUrls,
        thumbnail: imageUrls[thumbnailIndex] || imageUrls[0] || '', // Use first image if thumbnailIndex is out of bounds
        status,
        roommates,
        petTypes, // This is already included in tags, consider if backend needs it separately
      };

      // --- Start of added logging for debugging ---
      console.log('Sending request to URL:', `${Constants.expoConfig?.extra?.API_BASE_URL || 'http://localhost:5000'}/api/listing`);
      console.log('Request Body:', JSON.stringify(listingData, null, 2));
      // --- End of added logging for debugging ---

      const response = await fetch(`${Constants.expoConfig?.extra?.API_BASE_URL || 'http://localhost:5000'}/api/listing`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(listingData),
      });

      // --- Start of added logging for debugging ---
      console.log('Response Status:', response.status);
      console.log('Response OK status:', response.ok);
      console.log('Response Headers (raw):', response.headers);
      // You can also iterate through specific headers if needed, e.g., response.headers.get('content-type')

      const responseText = await response.text(); // Read the response as plain text first
      console.log('Raw Response Body:', responseText); // Log the raw response text

      try {
        const result = JSON.parse(responseText); // Manually parse the text as JSON
        console.log('Parsed API Response:', result);

        if (response.ok) {
          Alert.alert(
            'Success',
            `Listing ${status === 'published' ? 'published' : 'saved as draft'} successfully!`
          );
          // TODO: Reset form or navigate away after successful upload
        } else {
          Alert.alert('Error', result.msg || result.error || 'Error submitting listing');
        }
      } catch (parseError) {
        console.error('JSON Parse Error: Could not parse response text as JSON.', parseError);
        Alert.alert('Error', 'Failed to parse server response. Received non-JSON data.');
      }
      // --- End of added logging for debugging ---

    } catch (error) {
      console.error('Listing submission network error or unexpected issue:', error);
      Alert.alert('Error', 'Network error or unexpected issue. Please check your connection and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-ambient pb-[10vh]">
      <ScrollView className="flex-1 p-4 sm:p-6 md:p-8">
        {/* Header */}
        <Text className="text-2xl sm:text-3xl font-bold text-forest text-center mb-6">
          {viewMode === 'listing'
            ? 'Upload Listing'
            : viewMode === 'post'
              ? 'Create Post'
              : 'Create Story'}
        </Text>

        {/* Toggle */}
        <View className="flex justify-center mb-6">
          <View className="bg-forest-medium rounded-full p-1 flex-row w-full max-w-xl self-center">
            {(['listing', 'post', 'story'] as const).map((mode) => (
              <TouchableOpacity
                key={mode}
                onPress={() => setViewMode(mode)}
                className={`flex-1 py-3 px-4 rounded-full ${viewMode === mode ? 'bg-forest' : 'bg-transparent'
                  }`}
              >
                <Text className="text-center font-bold text-white capitalize">
                  {mode}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {viewMode === 'listing' ? (
          <>
            {/* Image Upload */}
            <View className="bg-white rounded-xl px-4 py-6 sm:px-6 mb-6 space-y-6">
              <Text className="text-lg font-medium text-gray-800 pb-4">
                Upload Images of Your Property
              </Text>
              <TouchableOpacity
                onPress={handleImageUpload}
                className="h-32 border-2 border-dashed border-gray-300 rounded-lg items-center justify-center"
              >
                <MaterialIcons name="cloud-upload" size={48} color="#9ca3af" />
                <Text className="text-gray-600 mt-2 text-center">
                  Drag & drop images or click to browse
                </Text>
              </TouchableOpacity>
              {selectedImages.length > 0 && (
                <View>
                  <Text className="text-sm text-gray-600 mb-3">
                    Selected ({selectedImages.length}/10):
                  </Text>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    className="flex-row gap-3"
                  >
                    {selectedImages.map((img, i) => (
                      <View key={img.id} className="relative w-24 h-24">
                        <TouchableOpacity
                          onPress={() => setThumbnailIndex(i)}
                          className={`border-2 rounded-lg ${thumbnailIndex === i ? 'border-forest' : 'border-transparent'
                            }`}
                        >
                          <Image
                            source={{ uri: img.uri }}
                            className="w-24 h-24 rounded-lg"
                            resizeMode="cover"
                          />
                        </TouchableOpacity>
                        <TouchableOpacity
                          onPress={() => removeImage(img.id)}
                          className="absolute -top-2 -right-2 bg-red-500 rounded-full p-1"
                        >
                          <AntDesign name="close" size={12} color="white" />
                        </TouchableOpacity>
                        {thumbnailIndex === i && (
                          <View className="absolute bottom-0 left-0 bg-forest px-2 py-1 rounded-tr-lg">
                            <Text className="text-white text-xs">Thumbnail</Text>
                          </View>
                        )}
                      </View>
                    ))}
                  </ScrollView>
                </View>
              )}
            </View>

            {/* Calendar */}
            <View className="bg-white rounded-xl px-4 py-6 sm:px-6 mb-6">
              <Text className="text-lg font-medium text-gray-800 mb-4">
                Select Availability
              </Text>
              <View className="flex-row justify-between items-center mb-4">
                <TouchableOpacity onPress={() => navigateMonth('prev')} className="p-2">
                  <AntDesign name="left" size={20} color="#374151" />
                </TouchableOpacity>
                <Text className="text-lg font-medium text-gray-800">
                  {monthNames[currentMonth]} {currentYear}
                </Text>
                <TouchableOpacity onPress={() => navigateMonth('next')} className="p-2">
                  <AntDesign name="right" size={20} color="#374151" />
                </TouchableOpacity>
              </View>
              <View className="flex-row flex-wrap justify-start border-t border-b border-gray-200 py-2">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
                  <View key={d} style={{ width: `${100 / 7}%` }} className="items-center mb-2">
                    <Text className="text-sm font-medium text-gray-500">{d}</Text>
                  </View>
                ))}
                {renderCalendar()}
              </View>
              {selectedRange.start && (
                <View className="mt-4 p-3 bg-gray-100 rounded-lg">
                  <Text className="text-sm text-gray-700">
                    Range: {selectedRange.start}
                    {selectedRange.end ? ` to ${selectedRange.end}` : ''}
                  </Text>
                </View>
              )}
            </View>

            {/* Details Form */}
            <View className="bg-white rounded-xl px-4 py-6 sm:px-6 space-y-6 mb-6">
              <Text className="text-lg font-medium text-gray-800 mb-4">
                Listing Details
              </Text>

              <TextInput
                placeholder="Listing Title"
                value={formData.title}
                onChangeText={(t) => setFormData({ ...formData, title: t })}
                className="w-full border-2 border-forest bg-forest-light rounded-lg p-3 text-forest text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500 mb-2"
              />
              <TextInput
                placeholder="Details"
                value={formData.details}
                onChangeText={(t) => setFormData({ ...formData, details: t })}
                multiline
                textAlignVertical="top"
                className="w-full h-24 border-2 border-forest bg-forest-light rounded-lg p-3 text-forest text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500 mb-2"
              />
              <TextInput
                placeholder="Country"
                value={formData.country}
                onChangeText={(t) => setFormData({ ...formData, country: t })}
                className="w-full border-2 border-forest bg-forest-light rounded-lg p-3 text-forest text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500 mb-2"
              />
              <TextInput
                placeholder="City"
                value={formData.city}
                onChangeText={(t) => setFormData({ ...formData, city: t })}
                className="w-full border-2 border-forest bg-forest-light rounded-lg p-3 text-forest text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
              />

              {/* Space Type */}
              <Text className="text-base font-medium text-gray-800 mt-5 mb-2">Space Type</Text>
              <View className="flex-row flex-wrap justify-between gap-2">
                {['Apartment', 'House', 'Single Room', 'Studio'].map((type) => (
                  <TouchableOpacity
                    key={type}
                    onPress={() => handleSpaceTypeSelect(type)}
                    className={`w-[48%] p-3 rounded-lg border-2 ${listingType === type
                        ? 'border-forest bg-teal-50'
                        : 'border-forest bg-forest-light'
                      }`}
                  >
                    <Text className="text-forest text-center">{type}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Facilities */}
              <Text className="text-base font-medium text-gray-800 mt-5 mb-2">Facilities</Text>
              <View className="flex-row flex-wrap justify-between gap-2">
                {facilities.map((f) => (
                  <TouchableOpacity
                    key={f.id}
                    onPress={() => handleToggle(f.id, setSelectedFacilities)}
                    className={`w-[48%] p-3 rounded-lg border-2 flex-row items-center gap-2 ${selectedFacilities.includes(f.id)
                        ? 'border-forest bg-teal-50'
                        : 'border-forest bg-forest-light'
                      }`}
                  >
                    {renderIcon(f, 20, selectedFacilities.includes(f.id) ? '#0d9488' : '#059669')}
                    <Text className="text-forest">{f.name}</Text>
                  </TouchableOpacity>
                ))}
                <TextInput
                  placeholder="Other facility"
                  value={customFacilities}
                  onChangeText={setCustomFacilities}
                  className="w-full border-2 border-forest bg-forest-light rounded-lg p-3 text-forest text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                />
              </View>

              {/* Features */}
              <Text className="text-base font-medium text-gray-800 mt-5 mb-2">Features</Text>
              <View className="flex-row flex-wrap justify-between gap-2">
                {features.map((f) => (
                  <TouchableOpacity
                    key={f.id}
                    onPress={() => handleToggle(f.id, setSelectedFeatures)}
                    className={`w-[48%] p-3 rounded-lg border-2 flex-row items-center gap-2 ${selectedFeatures.includes(f.id)
                        ? 'border-forest bg-teal-50'
                        : 'border-forest bg-forest-light'
                      }`}
                  >
                    {renderIcon(f, 20, selectedFeatures.includes(f.id) ? '#0d9488' : '#059669')}
                    <Text className="text-forest">{f.name}</Text>
                  </TouchableOpacity>
                ))}
                <TextInput
                  placeholder="Other feature"
                  value={customFeatures}
                  onChangeText={setCustomFeatures}
                  className="w-full border-2 border-forest bg-forest-light rounded-lg p-3 text-forest text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                />
              </View>

              {/* Living With */}
              <Text className="text-base font-medium text-gray-800 mt-5 mb-3">Who will the guest live with?</Text>
              <View className="space-y-2">
                {['alone', 'family', 'roommates', 'females-only', 'pets'].map((opt) => (
                  <TouchableOpacity
                    key={opt}
                    onPress={() => handleToggle(opt, setLivingWith)}
                    className={`p-3 rounded-lg border-2 flex-row items-center justify-between my-1 ${livingWith.includes(opt)
                        ? 'border-forest bg-teal-50'
                        : 'border-forest bg-forest-light'
                      }`}
                  >
                    <View className="flex-row items-center gap-3">
                      {/* map opt to icon, name */}
                      <Text className="text-forest capitalize">{opt.replace('-', ' ')}</Text>
                    </View>
                    {livingWith.includes(opt) && (
                      <AntDesign name="check" size={20} color="#0d9488" />
                    )}
                  </TouchableOpacity>
                ))}
                {/* sub-options for roommates and pets can follow same pattern */}
              </View>

              {/* Action Buttons */}
              <View className="flex-col sm:flex-row gap-4 mt-6">
                <TouchableOpacity
                  onPress={() => handleSubmitListing('draft')}
                  disabled={isLoading}
                  className="w-full sm:flex-1 bg-gray-400 text-white py-2 sm:py-3 rounded-lg font-medium disabled:opacity-50"
                >
                  <Text className="text-center text-white">
                    {isLoading ? 'Saving Draft...' : 'Save as Draft'}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => handleSubmitListing('published')}
                  disabled={isLoading || !formData.title || !formData.city || !listingType}
                  className="w-full sm:flex-1 bg-forest text-white py-2 sm:py-3 rounded-lg font-medium disabled:opacity-50"
                >
                  <Text className="text-center text-white">
                    {isLoading ? 'Publishing...' : 'Post Listing'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </>
        ) : viewMode === 'post' ? (
          <View className="flex justify-center mt-4 sm:mt-6 md:mt-8">
            <View className="w-full max-w-4xl px-2 sm:px-0">
              <CreatePostForm
                initialImageUrl={selectedImages[0]?.uri || ''}
                initialCountry={formData.country}
                initialCity={formData.city}
                onPostCreated={handlePostCreated}
              />
            </View>
          </View>
        ) : (
          <StoryUpload />
        )}
      </ScrollView>
    </SafeAreaView>


  );
};

export default UploadListingScreen;