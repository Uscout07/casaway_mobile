import React, { useEffect, useState } from 'react';
import "../global.css";
import {
  View,
  Text,
  ActivityIndicator,
  FlatList,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import Constants from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';
import StoryFeed from '../components/Story/storyFeed';
import SearchBar from '../components/searchBar';
import FilterModal from '../components/filterModal';
import ListingCard from '../components/listingCard';
import { ListingType } from '../components/filterModal'; 

import type { StackNavigationProp } from '@react-navigation/stack';

type RootStackParamList = {
  Home: undefined;
  Auth: undefined;
};

const API_BASE_URL = Constants.expoConfig?.extra?.API_BASE_URL

const HomeScreen = () => {
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();

  // ── Auth Check ──
  useEffect(() => {
    const checkAuth = async () => {
      const token = await AsyncStorage.getItem('token');
      if (!token) navigation.navigate('Auth');
    };
    checkAuth();
  }, []);

  // ── State ──
  const [destinationInput, setDestinationInput] = useState('');
  const [countrySuggestions, setCountrySuggestions] = useState<string[]>([]);
  const [citySuggestions, setCitySuggestions] = useState<string[]>([]);
  const [showCountrySuggestions, setShowCountrySuggestions] = useState(false);
  const [showCitySuggestions, setShowCitySuggestions] = useState(false);
  const [isSearchingDestinations, setIsSearchingDestinations] = useState(false);

  const [listings, setListings] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showFilterModal, setShowFilterModal] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCountries, setSelectedCountries] = useState<string[]>([]);
  const [selectedCities, setSelectedCities] = useState<string[]>([]);
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
const [selectedListingType, setSelectedListingType] = useState<ListingType>('');
  const [bedroomOnly, setBedroomOnly] = useState(false);
  const [liveWithFamily, setLiveWithFamily] = useState(false);
  const [womenOnly, setWomenOnly] = useState(false);
  const [petsAllowed, setPetsAllowed] = useState(false);
  const [dogsAllowed, setDogsAllowed] = useState(false);
  const [catsAllowed, setCatsAllowed] = useState(false);
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>([]);

  const allAmenities = [
    'washing-machine', 'dryer', 'free-parking',
    'office-desk', 'office-chair', 'monitor',
    'heater', 'air-conditioner',
  ];

  const allFeatures = [
    'garden', 'backyard', 'mountain-view',
    'ocean-view', 'lake-view', 'beach-access',
  ];

  // ── Query Builder ──
  const buildQueryString = () => {
    const params = new URLSearchParams();
    if (searchQuery) params.append('search', searchQuery);
    if (selectedCountries.length) params.append('countries', selectedCountries.join(','));
    if (selectedCities.length) params.append('cities', selectedCities.join(','));
    if (startDate) params.append('startDate', startDate.toISOString());
    if (endDate) params.append('endDate', endDate.toISOString());
    if (selectedListingType) params.append('type', selectedListingType);
    if (bedroomOnly) params.append('bedroomOnly', 'true');
    if (liveWithFamily) params.append('liveWithFamily', 'true');
    if (womenOnly) params.append('womenOnly', 'true');
    if (petsAllowed) params.append('petsAllowed', 'true');
    if (dogsAllowed) params.append('dogsAllowed', 'true');
    if (catsAllowed) params.append('catsAllowed', 'true');
    if (selectedAmenities.length) params.append('amenities', selectedAmenities.join(','));
    if (selectedFeatures.length) params.append('features', selectedFeatures.join(','));
    return params.toString();
  };

  // ── Fetch Listings ──
  const fetchListings = async (pageNumber = 1) => {
    setLoading(true);
    const qs = buildQueryString();
    try {
      const res = await fetch(`${API_BASE_URL}/api/listing?page=${pageNumber}&limit=20&${qs}`);
      const data = await res.json();

      if (!res.ok) throw new Error(data?.msg || 'Failed to fetch');

      setListings(prev => (pageNumber === 1 ? data : [...prev, ...data]));
      setHasMore(data.length === 20); // ✅ Only load more if we got a full page
      setPage(pageNumber);
    } catch (err: any) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchListings(1);
  }, []);

  const loadMore = () => {
    if (!loading && hasMore && listings.length >= 20) {
      fetchListings(page + 1);
    }
  };

  const handleSelectCountry = (country: string) => {
    setDestinationInput(country);
    setSelectedCountries([country]);
    setSelectedCities([]);
    fetchListings(1);
  };

  const handleSelectCity = (combo: string) => {
    const [city, country] = combo.split(',').map(s => s.trim());
    setDestinationInput(combo);
    setSelectedCities([city]);
    setSelectedCountries([country]);
    fetchListings(1);
  };

  return (
    <SafeAreaView className="flex-1 mt-0 bg-ambient  pb-[10vh]">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1"
      >
        <FlatList
          data={listings}
          keyExtractor={(item) => item._id}
          renderItem={({ item }) => <ListingCard listing={item} />}
          onEndReached={loadMore}
          onEndReachedThreshold={0.5}
          ListHeaderComponent={
            <>
              <StoryFeed />
              <SearchBar
                destinationInput={destinationInput}
                setDestinationInput={setDestinationInput}
                fetchListings={() => fetchListings(1)}
                openFilterModal={() => setShowFilterModal(true)}       
              />
              {error && (
                <View className="my-4 items-center ">
                  <MaterialIcons name="error-outline" size={20} color="red" />
                  <Text className="text-red-500 mt-1">{error}</Text>
                </View>
              )}
            </>
          }
          ListFooterComponent={loading ? <ActivityIndicator className="my-6" /> : null}
        />

        <FilterModal
          showFilterModal={showFilterModal}
          setShowFilterModal={setShowFilterModal}
          destinationInput={destinationInput}
          setDestinationInput={setDestinationInput}
          startDate={startDate}
          setStartDate={setStartDate}
          endDate={endDate}
          setEndDate={setEndDate}
          selectedListingType={selectedListingType}
          setSelectedListingType={setSelectedListingType}
          bedroomOnly={bedroomOnly}
          setBedroomOnly={setBedroomOnly}
          liveWithFamily={liveWithFamily}
          setLiveWithFamily={setLiveWithFamily}
          womenOnly={womenOnly}
          setWomenOnly={setWomenOnly}
          petsAllowed={petsAllowed}
          setPetsAllowed={setPetsAllowed}
          dogsAllowed={dogsAllowed}
          setDogsAllowed={setDogsAllowed}
          catsAllowed={catsAllowed}
          setCatsAllowed={setCatsAllowed}
          selectedAmenities={selectedAmenities}
          setSelectedAmenities={setSelectedAmenities}
          allAmenities={allAmenities}
          selectedFeatures={selectedFeatures}
          setSelectedFeatures={setSelectedFeatures}
          allFeatures={allFeatures}
          fetchListings={() => fetchListings(1)}
          setSearchQuery={setSearchQuery}
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default HomeScreen;
