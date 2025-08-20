import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  View,
  TextInput,
  Text,
  TouchableOpacity,
  FlatList,
  Keyboard,
  ActivityIndicator,
} from 'react-native';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';

const API_BASE_URL = Constants.expoConfig?.extra?.API_BASE_URL || 'http://localhost:5000';

interface Props {
  destinationInput: string;
  setDestinationInput: (val: string) => void;
  fetchListings: () => void;
  openFilterModal: () => void;
}

const SearchBar: React.FC<Props> = ({
  destinationInput,
  setDestinationInput,
  fetchListings,
  openFilterModal,
}) => {
  const inputRef = useRef<TextInput>(null);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  const debounce = (fn: (...args: any[]) => void, delay: number) => {
    let timeout: NodeJS.Timeout;
    return (...args: any[]) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => fn(...args), delay);
    };
  };

  const fetchSuggestions = useCallback(
    debounce(async (query: string) => {
      if (query.length < 2) return;
      setLoading(true);
      try {
        const cityRes = await fetch(`${API_BASE_URL}/api/listing/autocomplete/cities?query=${query}`);
        const cities = cityRes.ok ? await cityRes.json() : [];

        const countryRes = await fetch(`${API_BASE_URL}/api/listing/autocomplete/countries?query=${query}`);
        const countries = countryRes.ok ? await countryRes.json() : [];

        setSuggestions([
          ...countries.map((c: string) => `Country: ${c}`),
          ...cities.map((c: string) => `City: ${c}`)
        ]);
        setShowDropdown(true);
      } catch (err) {
        console.error(err);
        setSuggestions([]);
      } finally {
        setLoading(false);
      }
    }, 300),
    []
  );

  useEffect(() => {
    if (destinationInput.length > 1) {
      fetchSuggestions(destinationInput);
    } else {
      setShowDropdown(false);
      setSuggestions([]);
    }
  }, [destinationInput]);

  const onSubmit = () => {
    Keyboard.dismiss();
    setShowDropdown(false);
    fetchListings();
  };

  const handleSelectSuggestion = (text: string) => {
    const label = text.replace(/^Country: |^City: /, '');
    setDestinationInput(label);
    setShowDropdown(false);
    fetchListings();
  };

  return (
    <View className="px-4 pt-4 z-50">
      <View className="relative bg-white rounded-full shadow-lg flex-row items-center px-4 py-3">
        <MaterialIcons name="search" size={24} color="#E2725B" />
        <TextInput
          ref={inputRef}
          value={destinationInput}
          onChangeText={setDestinationInput}
          onSubmitEditing={onSubmit}
          placeholder="Search destinations or dates"
          className="flex-1 text-base ml-3 text-black"
        />
        <TouchableOpacity onPress={openFilterModal} className="ml-2 p-1">
          <Ionicons name="filter" size={24} color="black" />
        </TouchableOpacity>
      </View>

      {showDropdown && (
        <View className="mt-2 bg-white rounded-lg shadow border border-gray-300 max-h-64">
          {loading ? (
            <View className="flex-row items-center justify-center p-4">
              <ActivityIndicator size="small" color="gray" />
              <Text className="ml-2 text-gray-500">Searching...</Text>
            </View>
          ) : suggestions.length === 0 ? (
            <View className="p-4 items-center">
              <Text className="text-gray-500">No results found.</Text>
            </View>
          ) : (
            <FlatList
              data={suggestions.filter(Boolean)}
              keyExtractor={(item, index) => `${item}-${index}`} // safer than raw string
              renderItem={({ item }) => (
                <TouchableOpacity
                  onPress={() => handleSelectSuggestion(item)}
                  className="flex-row items-center px-4 py-3 border-b border-gray-100"
                >
                  <MaterialIcons
                    name={item.startsWith('Country') ? 'location-on' : 'location-city'}
                    size={20}
                    color="gray"
                  />
                  <Text className="ml-2 text-gray-700">
                    {typeof item === 'string' ? item.replace(/^Country: |^City: /, '') : ''}
                  </Text>
                </TouchableOpacity>
              )}
            />

          )}
        </View>
      )}
    </View>
  );
};

export default SearchBar;
