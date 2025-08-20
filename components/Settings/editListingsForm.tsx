import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Image,
  Alert, // For native alerts
  SafeAreaView,
  Platform,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage'; // For persistent storage
import Constants from 'expo-constants'; // For API_BASE_URL
import axios from 'axios'; // Using axios for fetch requests
import { MaterialIcons, Ionicons } from '@expo/vector-icons'; // For icons

const API_BASE_URL = Constants.expoConfig?.extra?.API_BASE_URL || 'http://localhost:5000';

interface AvailabilityPeriod {
  startDate: string; // Will be ISO string like "YYYY-MM-DD" from date input
  endDate: string; // Will be ISO string like "YYYY-MM-DD" from date input
}

interface Listing {
  _id: string;
  user: string;
  title: string;
  details: string;
  type: 'Single Room' | 'Whole Apartment' | 'Whole House';
  amenities: string[];
  city: string;
  country: string;
  roommates: string[];
  tags: string[];
  availability: AvailabilityPeriod[]; // ISO date strings
  images: string[];
  thumbnail: string;
  status: 'draft' | 'published';
  createdAt: string;
  updatedAt: string;
}

interface EditListingFormProps {
  listingId: string;
  onCancel: () => void; // Callback to close the form
  onSuccess: () => void; // Callback to signal successful edit (e.g., to refresh parent list)
}

const propertyTypes = ['Single Room', 'Whole Apartment', 'Whole House'];
const availableAmenities = ['WiFi', 'Air Conditioning', 'Heating', 'Kitchen', 'Laundry', 'Parking', 'Gym', 'Pool'];
const commonTags = ['pets-allowed', 'dogs-allowed', 'cats-allowed', 'women-only', 'live-with-family'];
const roommateOptions = ['Male', 'Female', 'Mixed', 'No preference'];

const EditListingForm: React.FC<EditListingFormProps> = ({ listingId, onCancel, onSuccess }) => {
  const [listing, setListing] = useState<Listing | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<Listing>>({
    title: '',
    details: '',
    type: 'Single Room',
    amenities: [],
    city: '',
    country: '',
    roommates: [],
    tags: [],
    availability: [],
    images: [],
    thumbnail: '',
    status: 'draft',
  });

  useEffect(() => {
    if (listingId) {
      fetchListingData();
    } else {
      setError('No listing ID provided.');
      setLoading(false);
    }
  }, [listingId]);

  const fetchListingData = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        setError('Authentication required. Please log in.');
        return;
      }

      const response = await axios.get(`${API_BASE_URL}/api/listing/${listingId}`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.status === 200) {
        const data: Listing = response.data;
        setListing(data);
        setFormData({
          title: data.title,
          details: data.details,
          type: data.type,
          amenities: data.amenities || [],
          city: data.city,
          country: data.country,
          roommates: data.roommates || [],
          tags: data.tags || [],
          availability: data.availability || [],
          images: data.images || [],
          thumbnail: data.thumbnail || '',
          status: data.status,
        });
      } else {
        setError(response.data?.msg || 'Failed to fetch listing data.');
      }
    } catch (err: any) {
      setError(err.response?.data?.msg || 'An error occurred while fetching listing data.');
      console.error('Error fetching listing:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (name: keyof Partial<Listing>, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleCheckboxChange = (name: 'amenities' | 'roommates' | 'tags', value: string) => {
    setFormData(prev => {
      const currentArray = prev[name] as string[] || [];
      if (currentArray.includes(value)) {
        return { ...prev, [name]: currentArray.filter(item => item !== value) };
      } else {
        return { ...prev, [name]: [...currentArray, value] };
      }
    });
  };

  const handleImageChange = (value: string, index: number) => {
    const newImages = [...(formData.images || [])];
    newImages[index] = value;
    setFormData(prev => ({ ...prev, images: newImages }));
  };

  const addImageField = () => {
    setFormData(prev => ({
      ...prev,
      images: [...(prev.images || []), ''],
    }));
  };

  const removeImageField = (index: number) => {
    setFormData(prev => ({
      ...prev,
      images: (prev.images || []).filter((_, i) => i !== index),
    }));
  };

  const handleAvailabilityChange = (value: string, index: number, field: 'startDate' | 'endDate') => {
    const newAvailability = [...(formData.availability || [])];
    if (!newAvailability[index]) {
      newAvailability[index] = { startDate: '', endDate: '' };
    }
    newAvailability[index][field] = value;
    setFormData(prev => ({ ...prev, availability: newAvailability }));
  };

  const addAvailabilityPeriod = () => {
    setFormData(prev => ({
      ...prev,
      availability: [...(prev.availability || []), { startDate: '', endDate: '' }],
    }));
  };

  const removeAvailabilityPeriod = (index: number) => {
    setFormData(prev => ({
      ...prev,
      availability: (prev.availability || []).filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);

    if (!formData.title || !formData.details || !formData.city || !formData.country) {
      setError('Please fill in all required fields (Title, Details, City, Country).');
      setLoading(false);
      return;
    }

    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        setError('Authentication required. Please log in.');
        return;
      }

      const response = await axios.patch(`${API_BASE_URL}/api/listing/${listingId}`, formData, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.status === 200) {
        Alert.alert('Success', 'Listing updated successfully!');
        onSuccess();
      } else {
        setError(response.data?.msg || 'Failed to update listing.');
        console.error('Error updating listing:', response.data);
      }
    } catch (err: any) {
      setError(err.response?.data?.msg || 'An unexpected error occurred.');
      console.error('Error updating listing:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading && !listing) { // Only show full screen loader if no listing data is present yet
    return (
      <View className="flex-1 justify-center items-center bg-ambient">
        <ActivityIndicator size="large" color="#214F3F" />
        <Text className="mt-4 text-xl text-forest">Loading listing for editing...</Text>
      </View>
    );
  }

  if (error && error !== 'No listing ID provided.') {
    return (
      <View className="flex-1 justify-center items-center p-8 bg-ambient">
        <View className="p-8 bg-white rounded-lg shadow-md items-center">
          <Text className="text-2xl font-bold text-coral mb-4">Error</Text>
          <Text className="text-gray-700 mb-6 text-center">{error}</Text>
          <TouchableOpacity
            onPress={onCancel}
            className="bg-gray-300 hover:bg-gray-400 py-2 px-4 rounded-lg shadow-md"
          >
            <Text className="text-gray-800 font-bold">Go Back</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (!listing && !loading) {
    return (
      <View className="flex-1 justify-center items-center p-8 bg-ambient">
        <View className="p-8 bg-white rounded-lg shadow-md items-center">
          <Text className="text-2xl font-bold text-forest mb-4">Listing Not Found</Text>
          <Text className="text-gray-700 mb-6 text-center">The listing you are trying to edit does not exist.</Text>
          <TouchableOpacity
            onPress={onCancel}
            className="bg-gray-300 hover:bg-gray-400 py-2 px-4 rounded-lg shadow-md"
          >
            <Text className="text-gray-800 font-bold">Go Back</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-ambient">
      <ScrollView className="p-4 bg-white rounded-lg mb-8 mx-auto w-full max-w-2xl">
        <Text className="text-2xl sm:text-3xl font-bold text-forest mb-6 text-center">Edit Listing: {listing?.title}</Text>

        <View className="space-y-6">
          {/* Basic Details */}
          <View>
            <Text className="text-xl sm:text-2xl font-semibold text-forest mb-4">Basic Details</Text>
            <View className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <View>
                <Text className="block text-sm font-medium text-gray-700 mb-1">Title</Text>
                <TextInput
                  value={formData.title || ''}
                  onChangeText={(text) => handleChange('title', text)}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:border-teal-500"
                  placeholder="Listing Title"
                />
              </View>
              <View>
                <Text className="block text-sm font-medium text-gray-700 mb-1">Property Type</Text>
                {/* For simplicity, using TextInput. Consider @react-native-picker/picker for a true dropdown */}
                <TextInput
                  value={formData.type || 'Single Room'}
                  onChangeText={(text) => handleChange('type', text as 'Single Room' | 'Whole Apartment' | 'Whole House')}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:border-teal-500"
                  placeholder="e.g., Single Room, Whole Apartment"
                />
              </View>
              <View>
                <Text className="block text-sm font-medium text-gray-700 mb-1">City</Text>
                <TextInput
                  value={formData.city || ''}
                  onChangeText={(text) => handleChange('city', text)}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:border-teal-500"
                  placeholder="City"
                />
              </View>
              <View>
                <Text className="block text-sm font-medium text-gray-700 mb-1">Country</Text>
                <TextInput
                  value={formData.country || ''}
                  onChangeText={(text) => handleChange('country', text)}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:border-teal-500"
                  placeholder="Country"
                />
              </View>
            </View>
            <View className="mt-4">
              <Text className="block text-sm font-medium text-gray-700 mb-1">Details</Text>
              <TextInput
                value={formData.details || ''}
                onChangeText={(text) => handleChange('details', text)}
                multiline={true}
                numberOfLines={5}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 h-32 text-top focus:border-teal-500"
                placeholder="Detailed description of the listing..."
                textAlignVertical="top" // Ensures text starts from the top
              />
            </View>
          </View>

          {/* Amenities */}
          <View>
            <Text className="text-xl sm:text-2xl font-semibold text-forest mb-4">Amenities</Text>
            <View className="flex-row flex-wrap gap-2">
              {availableAmenities.map(amenity => (
                <TouchableOpacity
                  key={amenity}
                  onPress={() => handleCheckboxChange('amenities', amenity)}
                  className={`flex-row items-center p-2 rounded-md border ${
                    formData.amenities?.includes(amenity) ? 'bg-teal-100 border-teal-500' : 'bg-gray-100 border-gray-300'
                  }`}
                >
                  <Ionicons
                    name={formData.amenities?.includes(amenity) ? 'checkbox-outline' : 'square-outline'}
                    size={20}
                    color={formData.amenities?.includes(amenity) ? '#00796B' : 'gray'}
                  />
                  <Text className="ml-2 text-sm text-gray-700">{amenity}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Roommate Preferences */}
          <View>
            <Text className="text-xl sm:text-2xl font-semibold text-forest mb-4">Roommate Preferences</Text>
            <View className="flex-row flex-wrap gap-2">
              {roommateOptions.map(option => (
                <TouchableOpacity
                  key={option}
                  onPress={() => handleCheckboxChange('roommates', option)}
                  className={`flex-row items-center p-2 rounded-md border ${
                    formData.roommates?.includes(option) ? 'bg-teal-100 border-teal-500' : 'bg-gray-100 border-gray-300'
                  }`}
                >
                  <Ionicons
                    name={formData.roommates?.includes(option) ? 'checkbox-outline' : 'square-outline'}
                    size={20}
                    color={formData.roommates?.includes(option) ? '#00796B' : 'gray'}
                  />
                  <Text className="ml-2 text-sm text-gray-700">{option}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Tags (Features) */}
          <View>
            <Text className="text-xl sm:text-2xl font-semibold text-forest mb-4">Additional Features (Tags)</Text>
            <View className="flex-row flex-wrap gap-2">
              {commonTags.map(tag => (
                <TouchableOpacity
                  key={tag}
                  onPress={() => handleCheckboxChange('tags', tag)}
                  className={`flex-row items-center p-2 rounded-md border ${
                    formData.tags?.includes(tag) ? 'bg-teal-100 border-teal-500' : 'bg-gray-100 border-gray-300'
                  }`}
                >
                  <Ionicons
                    name={formData.tags?.includes(tag) ? 'checkbox-outline' : 'square-outline'}
                    size={20}
                    color={formData.tags?.includes(tag) ? '#00796B' : 'gray'}
                  />
                  <Text className="ml-2 text-sm text-gray-700 capitalize">{tag.replace(/-/g, ' ')}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Images */}
          <View>
            <Text className="text-xl sm:text-2xl font-semibold text-forest mb-4">Images</Text>
            <Text className="block text-sm font-medium text-gray-700 mb-1">Thumbnail URL</Text>
            <TextInput
              value={formData.thumbnail || ''}
              onChangeText={(text) => handleChange('thumbnail', text)}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:border-teal-500 mb-4"
              placeholder="Main image URL for your listing"
            />
            {formData.thumbnail && (
              <Image source={{ uri: formData.thumbnail }} className="mb-4 w-48 h-32 object-cover rounded-md shadow-sm" />
            )}
            <Text className="block text-sm font-medium text-gray-700 mb-2">Additional Image URLs</Text>
            {(formData.images || []).map((image, index) => (
              <View key={index} className="flex-row items-center space-x-2 mb-2">
                <TextInput
                  value={image}
                  onChangeText={(text) => handleImageChange(text, index)}
                  className="block flex-1 border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:border-teal-500"
                  placeholder={`Image URL ${index + 1}`}
                />
                <TouchableOpacity
                  onPress={() => removeImageField(index)}
                  className="p-2 text-coral hover:text-red-800 rounded-full"
                >
                  <Ionicons name="close-circle-outline" size={24} color="#EF4444" />
                </TouchableOpacity>
              </View>
            ))}
            <TouchableOpacity
              onPress={addImageField}
              className="mt-2 bg-gray-200 hover:bg-gray-300 py-2 px-4 rounded-lg flex-row items-center justify-center space-x-2"
            >
              <Ionicons name="add-circle-outline" size={20} color="#333" />
              <Text className="text-gray-800 font-bold">Add Image URL</Text>
            </TouchableOpacity>
          </View>

          {/* Availability Dates */}
          <View>
            <Text className="text-xl sm:text-2xl font-semibold text-forest mb-4">Availability</Text>
            {(formData.availability || []).map((period, index) => (
              <View key={index} className="flex-col sm:flex-row items-center space-y-2 sm:space-y-0 sm:space-x-2 mb-2">
                <TextInput
                  value={period.startDate || ''}
                  onChangeText={(text) => handleAvailabilityChange(text, index, 'startDate')}
                  className="block w-full sm:w-1/2 border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:border-teal-500"
                  placeholder="Start Date (YYYY-MM-DD)"
                />
                <Text className="text-gray-600">-</Text>
                <TextInput
                  value={period.endDate || ''}
                  onChangeText={(text) => handleAvailabilityChange(text, index, 'endDate')}
                  className="block w-full sm:w-1/2 border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:border-teal-500"
                  placeholder="End Date (YYYY-MM-DD)"
                />
                <TouchableOpacity
                  onPress={() => removeAvailabilityPeriod(index)}
                  className="p-2 text-coral hover:text-red-800 rounded-full"
                >
                  <Ionicons name="close-circle-outline" size={24} color="#EF4444" />
                </TouchableOpacity>
              </View>
            ))}
            <TouchableOpacity
              onPress={addAvailabilityPeriod}
              className="mt-2 bg-gray-200 hover:bg-gray-300 py-2 px-4 rounded-lg flex-row items-center justify-center space-x-2"
            >
              <Ionicons name="add-circle-outline" size={20} color="#333" />
              <Text className="text-gray-800 font-bold">Add Availability Period</Text>
            </TouchableOpacity>
            <Text className="text-sm text-gray-500 mt-2">Enter dates in YYYY-MM-DD format.</Text>
          </View>

          {/* Status */}
          <View>
            <Text className="text-xl sm:text-2xl font-semibold text-forest mb-4">Status</Text>
            {/* For simplicity, using TextInput. Consider @react-native-picker/picker for a true dropdown */}
            <TextInput
              value={formData.status || 'draft'}
              onChangeText={(text) => handleChange('status', text as 'draft' | 'published')}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:border-teal-500"
              placeholder="e.g., draft, published"
            />
          </View>

          {/* Error Message */}
          {error && (
            <View className="bg-red-100 border border-red-400 p-3 rounded-md relative">
              <Text className="font-bold text-red-700">Error!</Text>
              <Text className="block sm:inline ml-2 text-red-700">{error}</Text>
            </View>
          )}

          {/* Submit Buttons */}
          <View className="flex-row justify-end space-x-4 mt-6">
            <TouchableOpacity
              onPress={onCancel}
              className="bg-gray-300 hover:bg-gray-400 py-2 px-4 rounded-lg shadow-md"
            >
              <Text className="text-gray-800 font-bold">Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleSubmit}
              className="bg-forest hover:bg-teal-700 py-2 px-4 rounded-lg shadow-md"
              disabled={loading}
            >
              <Text className="text-white font-bold">{loading ? 'Saving...' : 'Save Changes'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default EditListingForm;