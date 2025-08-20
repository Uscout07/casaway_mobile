import React, { useState, useEffect } from 'react';
import {
    SafeAreaView,
    View,
    Text,
    TouchableOpacity,
    TextInput,
    Image,
    Alert,
    ActivityIndicator,
    ScrollView,
    Platform,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { MaterialIcons, AntDesign } from '@expo/vector-icons';

const API_BASE_URL = Constants.expoConfig?.extra?.API_BASE_URL ?? 'http://localhost:5000';

const StoryUpload = () => {
    const [file, setFile] = useState<ImagePicker.ImagePickerAsset | null>(null);
    const [caption, setCaption] = useState('');
    const [loading, setLoading] = useState(false);
    const [token, setToken] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        AsyncStorage.getItem('token')
            .then((t) => setToken(t))
            .catch((e) => {
                console.error('Failed to fetch token', e);
                setError('Session error. Log in again.');
            });
    }, []);

    const pickMedia = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Permission Denied', 'Need camera roll access.');
            return;
        }
        const res = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.All,
            allowsEditing: true,
            aspect: [9, 16],
            quality: 1,
        });
        if (!res.canceled && res.assets.length) setFile(res.assets[0]);
    };

    const handleUpload = async () => {
        if (!file) return Alert.alert('No Media', 'Select an image or video.');
        if (!token) return Alert.alert('Auth Required', 'Please log in.');

        setLoading(true);
        const formData = new FormData();
        formData.append('caption', caption);
        const ext = file.uri.split('.').pop();
        const name = `story_${Date.now()}.${ext}`;
        const type = file.type === 'image' ? `image/${ext}` : `video/${ext}`;
        formData.append('media', { uri: file.uri, name, type } as any);

        try {
            const res = await fetch(`${API_BASE_URL}/api/stories/upload`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` },
                body: formData,
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.msg || data.error || 'Upload failed');
            Alert.alert('Success', 'Story uploaded!');
            setCaption(''); setFile(null);
        } catch (e: any) {
            console.error(e);
            Alert.alert('Error', e.message);
            setError(e.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView className="flex-1 bg-ambient">
            <ScrollView className="space-y-6">
                {/* Media Picker */}
                <View className="bg-white rounded-xl px-4 py-6 sm:px-6 mb-6 space-y-6">
                    <Text className="text-lg font-medium text-gray-800 pb-4">
                        Upload an image or video for your story
                    </Text>
                    <TouchableOpacity
                        onPress={pickMedia}
                        className="h-32 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center"
                    >
                        <MaterialIcons name="cloud-upload" size={48} color="#9ca3af" />
                        <Text className="text-gray-600 mt-2 text-center">
                            {file ? 'Change Media' : 'Tap or drag to select media'}
                        </Text>
                    </TouchableOpacity>

                    {file && (
                        <>
                            <View className="mt-4">

                                <ScrollView
                                    horizontal
                                    showsHorizontalScrollIndicator={false}
                                    className="flex-row gap-3"
                                >
                                    <View className="relative w-24 h-24">
                                        <Image
                                            source={{ uri: file.uri }}
                                            className="w-24 h-24 rounded-lg"
                                            resizeMode="cover"
                                        />
                                    </View>
                                </ScrollView>
                            </View>
                        </>
                    )}
                </View>

                {/* Caption & Upload */}
                <View className="space-y-4">
                    <Text className="text-sm font-medium text-forest my-1">Caption (Optional)</Text>
                    <TextInput
                        multiline
                        numberOfLines={3}
                        value={caption}
                        onChangeText={setCaption}
                        placeholder="Add a caption..."
                        className="w-full p-3 px-5 border-2 border-forest bg-forest-light rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-forest text-sm my-1"
                        textAlignVertical="top"
                    />

                    <TouchableOpacity
                        onPress={handleUpload}
                        disabled={loading || !file}
                        className={`w-full py-3 rounded-lg font-medium  my-2 ${loading || !file ? 'bg-gray-400 opacity-50' : 'bg-forest'
                            }`}
                    >
                        {loading ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <Text className="text-center text-white">Upload Story</Text>
                        )}
                    </TouchableOpacity>

                    {error && <Text className="text-red-500 text-sm text-center">{error}</Text>}
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

export default StoryUpload;
