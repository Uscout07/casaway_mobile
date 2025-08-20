import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';

interface EditPostFormProps {
  postId: string;
  onCancel: () => void;
  onSuccess: () => void;
}

const EditPostForm: React.FC<EditPostFormProps> = ({ postId, onCancel, onSuccess }) => {
  const [caption, setCaption] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  const [countryInput, setCountryInput] = useState('');
  const [cityInput, setCityInput] = useState('');
  const [selectedImages, setSelectedImages] = useState<{ url: string; id: number }[]>([]);
  const [status, setStatus] = useState<'draft' | 'published'>('published');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const API_BASE_URL = Constants.expoConfig?.extra?.API_BASE_URL || 'http://localhost:5000';

  useEffect(() => {
    (async () => {
      try {
        const token = await AsyncStorage.getItem('token');
        const res = await fetch(`${API_BASE_URL}/api/posts/${postId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error('Failed to load post');
        const data = await res.json();
        setCaption(data.caption);
        setTagsInput((data.tags || []).join(', '));
        setCountryInput(data.country);
        setCityInput(data.city);
        setStatus(data.status);
        const imgs = (data.images || []).map((url: string, idx: number) => ({ url, id: idx }));
        setSelectedImages(imgs);
      } catch (err: any) {
        console.error(err);
        setError(err.message);
      }
    })();
  }, [postId]);

  const handleImageRemove = (id: number) => {
    setSelectedImages(prev => prev.filter(img => img.id !== id));
  };

  const handleSubmit = async (newStatus: 'draft' | 'published') => {
    setLoading(true);
    setError(null);

    const tagsArray = tagsInput.split(',').map(t => t.trim()).filter(t => t);
    const imageUrls = selectedImages.map(img => img.url);

    if (!caption.trim()) return setError("Caption can't be empty");
    if (!imageUrls.length) return setError('Need at least one image');

    try {
      const token = await AsyncStorage.getItem('token');
      const body = {
        caption,
        tags: tagsArray,
        country: countryInput,
        city: cityInput,
        images: imageUrls,
        imageUrl: imageUrls[0],
        status: newStatus,
      };

      const res = await fetch(`${API_BASE_URL}/api/posts/${postId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.msg || 'Update failed');
      }

      Alert.alert('Success', 'Post updated!');
      onSuccess();
    } catch (err: any) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView className="p-4">
      <Text className="text-xl font-bold mb-4">Edit Post</Text>
      {error && <Text className="text-red-500 mb-3">{error}</Text>}

      <View className="flex-row flex-wrap gap-2 mb-4">
        {selectedImages.map(img => (
          <View key={img.id} className="relative w-20 h-20">
            <Image source={{ uri: img.url }} className="w-full h-full rounded-md" />
            <TouchableOpacity
              onPress={() => handleImageRemove(img.id)}
              className="absolute -top-2 -right-2 bg-red-500 p-1 rounded-full"
            >
              <Ionicons name="close" size={12} color="white" />
            </TouchableOpacity>
          </View>
        ))}
      </View>

      {[{
        label: 'Country',
        value: countryInput,
        setter: setCountryInput,
      }, {
        label: 'City',
        value: cityInput,
        setter: setCityInput,
      }, {
        label: 'Caption',
        value: caption,
        setter: setCaption,
        multiline: true,
      }, {
        label: 'Tags (comma‑sep)',
        value: tagsInput,
        setter: setTagsInput,
      }].map(({ label, value, setter, multiline }, idx) => (
        <View key={idx} className="mb-4">
          <Text className="mb-1 text-sm font-semibold text-gray-700">{label}</Text>
          <TextInput
            value={value}
            onChangeText={setter}
            multiline={multiline}
            className="border border-gray-300 rounded p-2"
          />
        </View>
      ))}

      <View className="flex-row justify-between mt-6">
        <TouchableOpacity
          onPress={onCancel}
          className="px-4 py-2 border border-gray-300 rounded"
        >
          <Text>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => handleSubmit('draft')}
          disabled={loading}
          className="px-4 py-2 bg-gray-500 rounded"
        >
          <Text className="text-white">{loading && status === 'draft' ? 'Saving...' : 'Save Draft'}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => handleSubmit('published')}
          disabled={loading}
          className="px-4 py-2 bg-teal-600 rounded"
        >
          <Text className="text-white">{loading && status === 'published' ? 'Updating...' : 'Update & Publish'}</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

export default EditPostForm;
