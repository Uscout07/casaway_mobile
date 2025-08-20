// apiServices.ts
import axios from 'axios';
import Constants from 'expo-constants'; // Import Constants
import AsyncStorage from '@react-native-async-storage/async-storage'; // Import AsyncStorage
import { Story, User } from './types';

// Access API_BASE_URL from Constants.expoConfig.extra
const API_BASE_URL = Constants.expoConfig?.extra?.API_BASE_URL as string | undefined;

if (!API_BASE_URL) {
  console.error('API_BASE_URL is not defined in app.json extra field.');
}

// Create an Axios instance with base URL
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add an interceptor for authentication tokens to ALL requests
api.interceptors.request.use(
  async (config) => {
    // Get token from AsyncStorage (React Native's local storage)
    const token = await AsyncStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);


export const fetchCurrentUser = async (): Promise<User | null> => { // No token parameter needed if using interceptor
  if (!API_BASE_URL) return null;
  try {
    const res = await api.get('/api/users/me'); // Use axios instance
    return {
      ...res.data,
      _id: res.data._id?.toString() || res.data.id?.toString() || '',
    };
  } catch (err) {
    console.error('User fetch error', err);
    return null;
  }
};

export const fetchFeedStories = async (): Promise<Story[]> => { // No token parameter needed
  if (!API_BASE_URL) return [];
  try {
    const feedRes = await api.get('/api/stories/feed'); // Use axios instance
    return feedRes.data;
  } catch (err) {
    console.error('Feed story fetch error', err);
    return [];
  }
};

export const fetchMyStories = async (): Promise<Story[]> => { // No token parameter needed
  if (!API_BASE_URL) return [];
  try {
    const myStoriesRes = await api.get('/api/stories/my-stories'); // Use axios instance
    return myStoriesRes.data;
  } catch (err) {
    console.error('My stories fetch error', err);
    return [];
  }
};

export const markStoryAsViewed = async (storyId: string): Promise<void> => { // No token parameter needed
  if (!API_BASE_URL) {
    console.error('API_BASE_URL is not defined, cannot mark story as viewed.');
    return;
  }
  try {
    await api.post(`/api/stories/${storyId}/view`, {}); // Use axios instance
    console.log(`Story ${storyId} marked as viewed.`);
  } catch (error) {
    console.error('Failed to mark story as viewed:', error);
  }
};

// Export the axios instance if you need to use it directly in other places
export { api };