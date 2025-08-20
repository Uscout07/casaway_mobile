import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
  ScrollView,
  SafeAreaView, // Added for full page context
  Platform,     // Added for platform specific styling if needed
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
// No specific icon libraries (MaterialIcons, Iconify) used as per last instruction

// Assume API_BASE_URL is configured in your app.config.js or app.json under 'extra'
const API_BASE_URL = Constants.expoConfig?.extra?.API_BASE_URL ?? 'http://localhost:5000';

interface ImagePickerAssetWithUrl extends ImagePicker.ImagePickerAsset {
  url?: string; // Simulated URL for demonstration, actual upload would provide this
}

type Props = {
  // onPostCreated is a callback function that could be passed from a parent
  // screen/navigator to refresh data or navigate away after a post is created.
  onPostCreated?: () => void;
  // Initial values for country and city, useful if you're pre-filling location
  initialCountry?: string;
  initialCity?: string;
};

// This component is designed to be a standalone page/screen for creating a post.
const CreatePostForm: React.FC<Props> = ({
  onPostCreated,
  initialCountry = 'India', // Default initial country
  initialCity = 'Asoda Todran', // Default initial city
}) => {
  const [caption, setCaption] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  const [countryInput, setCountryInput] = useState(initialCountry);
  const [cityInput, setCityInput] = useState(initialCity);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedImages, setSelectedImages] = useState<ImagePickerAssetWithUrl[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);

  // Request media library permissions on component mount if not already granted
  useEffect(() => {
    (async () => {
      if (Platform.OS !== 'web') {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Permission Denied', 'Sorry, we need media library permissions to make this work!');
        }
      }
    })();
  }, []);


  const handleImageUpload = async () => {
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true, // Crucial for selecting multiple images
      quality: 0.7, // Compress image quality slightly
    });

    if (!res.canceled && res.assets.length > 0) {
      const newFiles = res.assets;

      // Check if adding new images exceeds the limit of 10
      if (selectedImages.length + newFiles.length > 10) {
        Alert.alert('Limit Exceeded', 'Maximum 10 images allowed per post.');
        return;
      }

      const newPreviewUrls: string[] = [];
      const newSelectedImagesWithUrls: ImagePickerAssetWithUrl[] = [];

      // Process each newly selected file
      for (const file of newFiles) {
        newPreviewUrls.push(file.uri); // Use local URI for immediate preview

        // --- IMPORTANT: Simulate cloud image upload and obtain URL ---
        // In a real application, you would send 'file' to your image upload service
        // (e.g., AWS S3, Cloudinary, etc.) and get back a public URL.
        // For this example, we're generating a dummy URL.
        const simulatedUrl = `http://example.com/uploaded/${Date.now()}-${file.fileName || `image_${Math.random().toString(36).substring(7)}.jpg`}`;
        newSelectedImagesWithUrls.push({ ...file, url: simulatedUrl });
      }

      // Update state with new images and their previews
      setPreviewUrls(prev => [...prev, ...newPreviewUrls]);
      setSelectedImages(prev => [...prev, ...newSelectedImagesWithUrls]);
    }
  };

  const handleRemoveImage = (index: number) => {
    // Remove image from both selectedImages and previewUrls arrays
    setSelectedImages(prev => prev.filter((_, i) => i !== index));
    setPreviewUrls(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmitPost = async (status: 'draft' | 'published') => {
    setIsLoading(true);
    setError(null);

    // Basic client-side validation
    if (!caption.trim() || !countryInput.trim() || !cityInput.trim()) {
      setError('Caption, City, and Country are required fields.');
      setIsLoading(false);
      return;
    }

    if (selectedImages.length === 0) {
      setError('Please upload at least one image.');
      setIsLoading(false);
      return;
    }

    // Retrieve authentication token
    const token = await AsyncStorage.getItem('token');
    if (!token) {
      setError('User not logged in. Please log in to create a post.');
      setIsLoading(false);
      return;
    }

    // --- Placeholder for retrieving userId from token ---
    // In a real application, you would decode the JWT to get the user's ID securely.
    // Example (requires a library like 'jwt-decode' if done on client-side):
    // import jwtDecode from 'jwt-decode';
    // try {
    //   const decodedToken = jwtDecode<{ userId: string }>(token);
    //   userId = decodedToken.userId;
    // } catch (e) {
    //   setError('Invalid or expired token. Please log in again.');
    //   setIsLoading(false);
    //   return;
    // }
    const userId = 'mockUserIdFromToken123'; // *** REPLACE THIS WITH ACTUAL USER ID LOGIC ***

    // Process tags input (comma-separated)
    const tagsArray = tagsInput.split(',').map(tag => tag.trim()).filter(Boolean);

    // Construct the post data payload to be sent as JSON
    const postData = {
      caption: caption,
      city: cityInput,
      country: countryInput,
      status: status,
      tags: tagsArray,
      userId: userId, // Include userId as required by the backend error
      imageUrl: selectedImages[0]?.url || '', // Main image URL (first image)
      images: selectedImages.map(image => image.url).filter(Boolean), // Array of all image URLs
    };

    console.log('Sending post data (JSON):', postData);

    try {
      // Make the API call to create the post
      const response = await fetch(`${API_BASE_URL}/api/posts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json', // Specify JSON content type
          'Authorization': `Bearer ${token}`, // Send JWT for authentication
        },
        body: JSON.stringify(postData), // Send data as JSON string
      });

      const data = await response.json(); // Parse response JSON
      if (!response.ok) {
        // If response is not OK (e.g., 4xx or 5xx status)
        throw new Error(data.msg || response.statusText || 'Failed to create post');
      }

      // Success feedback
      Alert.alert('Success', `Post ${status === 'published' ? 'published' : 'saved as draft'}!`);

      // Reset form fields
      setCaption('');
      setTagsInput('');
      setCountryInput(initialCountry); // Reset to initial or empty string
      setCityInput(initialCity);       // Reset to initial or empty string
      setSelectedImages([]);
      setPreviewUrls([]);
      setError(null);

      // Trigger callback if provided (e.g., to close modal, navigate, or refresh data)
      onPostCreated?.();

    } catch (err: any) {
      console.error('Error creating post:', err.message);
      setError(err.message || 'An unexpected error occurred.');
    } finally {
      setIsLoading(false); // Always stop loading indicator
    }
  };

  // Determine if the 'Publish Post' button should be enabled
  const canPublish = !isLoading && selectedImages.length > 0 && caption.trim() && countryInput.trim() && cityInput.trim();

  return (
    <SafeAreaView className="flex-1 bg-ambient">
      <ScrollView className="flex-1 p-4">
        {/* Page Title */}
        <Text className="text-2xl font-bold text-forest mb-6 text-center">Create New Post</Text>

        {/* Image Uploader Section */}
        <View className="bg-white rounded-xl px-4 py-6 mb-6 shadow-md">
          <Text className="text-lg font-medium text-gray-800 pb-4 text-center">
            Upload Images for Your Post
          </Text>
          <TouchableOpacity onPress={handleImageUpload} className="h-32 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center relative mb-4">
            {/* Simple plus sign for image upload area */}
            <Text className="text-gray-400 text-5xl font-light">+</Text>
            <Text className="text-gray-600 mt-2 text-center">
              {selectedImages.length > 0 ? 'Add More Images (Max 10)' : 'Tap to select images'}
            </Text>
            {selectedImages.length > 0 && (
                <Text className="absolute bottom-2 right-2 text-xs text-gray-500">
                {selectedImages.length}/10 selected
                </Text>
            )}
          </TouchableOpacity>

          {previewUrls.length > 0 && (
            <View className="mt-4">
              <Text className="text-sm text-gray-600 mb-3">Selected Images:</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row">
                {previewUrls.map((url, index) => (
                  <View key={index} className="relative mr-3 w-20 h-20 border border-gray-200 rounded-lg overflow-hidden">
                    <Image source={{ uri: url }} className="w-full h-full object-cover" resizeMode="cover" />
                    <TouchableOpacity
                      onPress={() => handleRemoveImage(index)}
                      className="absolute -top-2 -right-2 bg-red-500 rounded-full p-1 items-center justify-center w-5 h-5 shadow-sm"
                    >
                      {/* Simple 'X' for remove image button */}
                      <Text className="text-white text-xs font-bold">X</Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </ScrollView>
            </View>
          )}
          {error && error.includes('image') && <Text className="text-red-500 text-sm mt-2 text-center">{error}</Text>}
        </View>

        {/* Form Fields Section */}
        <View className="bg-white rounded-xl px-4 py-6 shadow-md">
            {/* Country Input */}
            <View className="mb-4">
                <Text className="text-sm font-medium text-gray-800 mb-2">Country <Text className="text-red-500">*</Text></Text>
                <TextInput
                    className="w-full p-3 px-4 border border-gray-300 rounded-lg text-gray-700 bg-gray-50"
                    value={countryInput}
                    onChangeText={setCountryInput}
                    placeholder="e.g., India"
                    placeholderTextColor="#888"
                />
            </View>

            {/* City Input */}
            <View className="mb-4">
                <Text className="text-sm font-medium text-gray-800 mb-2">City <Text className="text-red-500">*</Text></Text>
                <TextInput
                    className="w-full p-3 px-4 border border-gray-300 rounded-lg text-gray-700 bg-gray-50"
                    value={cityInput}
                    onChangeText={setCityInput}
                    placeholder="e.g., Asoda Todran"
                    placeholderTextColor="#888"
                />
            </View>

            {/* Caption Input */}
            <View className="mb-4">
                <Text className="text-sm font-medium text-gray-800 mb-2">Caption <Text className="text-red-500">*</Text></Text>
                <TextInput
                    className="w-full p-3 px-4 border border-gray-300 rounded-lg text-gray-700 bg-gray-50 min-h-[100px] text-left align-top" // min-h for multiline, align-top for textAlignVertical
                    multiline
                    numberOfLines={4}
                    value={caption}
                    onChangeText={setCaption}
                    placeholder="What's on your mind?"
                    placeholderTextColor="#888"
                    textAlignVertical="top" // Ensure text starts from top
                />
            </View>

            {/* Tags Input */}
            <View className="mb-4">
                <Text className="text-sm font-medium text-gray-800 mb-2">Tags (comma-separated)</Text>
                <TextInput
                    className="w-full p-3 px-4 border border-gray-300 rounded-lg text-gray-700 bg-gray-50"
                    value={tagsInput}
                    onChangeText={setTagsInput}
                    placeholder="e.g., travel, adventure, homestay"
                    placeholderTextColor="#888"
                />
            </View>

            {error && !error.includes('image') && <Text className="text-red-500 text-sm mt-2 text-center">{error}</Text>}

            {/* Action Buttons */}
            <View className="flex-row gap-4 pt-4">
                <TouchableOpacity
                    onPress={() => handleSubmitPost('draft')}
                    disabled={isLoading}
                    className={`flex-1 py-3 rounded-lg items-center justify-center ${isLoading ? 'opacity-50 bg-gray-400' : 'bg-gray-500'} shadow-sm`}
                >
                    {isLoading ? (
                    <ActivityIndicator color="#fff" />
                    ) : (
                    <Text className="text-white font-medium">Save As Draft</Text>
                    )}
                </TouchableOpacity>

                <TouchableOpacity
                    onPress={() => handleSubmitPost('published')}
                    disabled={!canPublish}
                    className={`flex-1 py-3 rounded-lg items-center justify-center ${!canPublish ? 'opacity-50 bg-teal-500' : 'bg-teal-600'} shadow-sm`}
                >
                    {isLoading ? (
                    <ActivityIndicator color="#fff" />
                    ) : (
                    <Text className="text-white font-medium">Publish Post</Text>
                    )}
                </TouchableOpacity>
            </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default CreatePostForm;