import React from 'react';
import {
  Modal,
  View,
  Text,
  Pressable,
  TextInput,
  ScrollView,
  Switch,
} from 'react-native';
import { DateTime } from 'luxon';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import { MaterialIcons } from '@expo/vector-icons';
import { twMerge } from 'tailwind-merge';

// ---
// Export the ListingType so it can be imported by other files (like HomePage.tsx)
export type ListingType = '' | 'Single Room' | 'Whole Apartment' | 'Whole House';
// ---

interface Props {
  showFilterModal: boolean;
  setShowFilterModal: (val: boolean) => void;

  destinationInput: string;
  setDestinationInput: (val: string) => void;

  startDate: Date | null;
  setStartDate: (val: Date | null) => void;
  endDate: Date | null;
  setEndDate: (val: Date | null) => void;

  selectedListingType: ListingType;
  setSelectedListingType: (val: ListingType) => void;
  bedroomOnly: boolean;
  setBedroomOnly: (val: boolean) => void;

  liveWithFamily: boolean;
  setLiveWithFamily: (val: boolean) => void;
  womenOnly: boolean;
  setWomenOnly: (val: boolean) => void;

  petsAllowed: boolean;
  setPetsAllowed: (val: boolean) => void;
  dogsAllowed: boolean;
  setDogsAllowed: (val: boolean) => void;
  catsAllowed: boolean;
  setCatsAllowed: (val: boolean) => void;

  selectedAmenities: string[];
  setSelectedAmenities: React.Dispatch<React.SetStateAction<string[]>>;
  allAmenities: string[];

  selectedFeatures: string[];
  setSelectedFeatures: React.Dispatch<React.SetStateAction<string[]>>;
  allFeatures: string[];

  fetchListings: () => void;
  setSearchQuery: (val: string) => void;
}

const FilterModal: React.FC<Props> = ({
  showFilterModal,
  setShowFilterModal,
  destinationInput,
  setDestinationInput,
  startDate,
  setStartDate,
  endDate,
  setEndDate,
  selectedListingType,
  setSelectedListingType,
  bedroomOnly,
  setBedroomOnly,
  liveWithFamily,
  setLiveWithFamily,
  womenOnly,
  setWomenOnly,
  petsAllowed,
  setPetsAllowed,
  dogsAllowed,
  setDogsAllowed,
  catsAllowed,
  setCatsAllowed,
  selectedAmenities,
  setSelectedAmenities,
  allAmenities,
  selectedFeatures,
  setSelectedFeatures,
  allFeatures,
  fetchListings,
  setSearchQuery,
}) => {
  const [startPickerVisible, setStartPickerVisible] = React.useState(false);
  const [endPickerVisible, setEndPickerVisible] = React.useState(false);

  const toggleAmenity = (a: string) =>
    setSelectedAmenities((prev) =>
      prev.includes(a) ? prev.filter((x) => x !== a) : [...prev, a]
    );

  const toggleFeature = (f: string) =>
    setSelectedFeatures((prev) =>
      prev.includes(f) ? prev.filter((x) => x !== f) : [...prev, f]
    );

  const resetFilters = () => {
    setSearchQuery('');
    setDestinationInput('');
    setStartDate(null);
    setEndDate(null);
    setSelectedListingType('');
    setBedroomOnly(false);
    setLiveWithFamily(false);
    setWomenOnly(false);
    setPetsAllowed(false);
    setDogsAllowed(false);
    setCatsAllowed(false);
    setSelectedAmenities([]);
    setSelectedFeatures([]);
  };

  return (
    <>
      <Modal visible={showFilterModal} animationType="slide" transparent>
        <View className="flex-1 bg-black/50 justify-end">
          <View className="bg-white rounded-t-2xl p-4 h-[90%]">
            {/* Header */}
            <View className="flex-row justify-between items-center mb-4 border-b pb-2">
              <Text className="text-xl font-bold text-slate-800">Filters</Text>
              <Pressable onPress={() => setShowFilterModal(false)}>
                <MaterialIcons name="close" size={28} color="#334155" />
              </Pressable>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Destination */}
              <View className="mb-4">
                <Text className="mb-2 text-gray-700 font-semibold">Destination</Text>
                <TextInput
                  value={destinationInput}
                  onChangeText={setDestinationInput}
                  placeholder="Where to?"
                  className="border border-gray-300 rounded-md px-4 py-2 text-gray-800"
                />
              </View>

              {/* Dates */}
              <View className="mb-4">
                <Text className="mb-2 text-gray-700 font-semibold">Dates</Text>
                <View className="flex-row space-x-2">
                  <Pressable
                    onPress={() => setStartPickerVisible(true)}
                    className="flex-1 border border-gray-300 rounded-md px-4 py-3"
                  >
                    <Text className="text-gray-700">
                      {startDate
                        ? DateTime.fromJSDate(startDate).toFormat('yyyy/MM/dd')
                        : 'Start Date'}
                    </Text>
                  </Pressable>
                  <Pressable
                    onPress={() => setEndPickerVisible(true)}
                    className="flex-1 border border-gray-300 rounded-md px-4 py-3"
                  >
                    <Text className="text-gray-700">
                      {endDate
                        ? DateTime.fromJSDate(endDate).toFormat('yyyy/MM/dd')
                        : 'End Date'}
                    </Text>
                  </Pressable>
                </View>
              </View>

              {/* Listing Type */}
              <View className="mb-4">
                <Text className="mb-2 font-semibold text-gray-700">Listing Type</Text>
                <View className="flex-row flex-wrap gap-2">
                  {['', 'Single Room', 'Whole Apartment', 'Whole House'].map((type) => (
                    <Pressable
                      key={type}
                      onPress={() => setSelectedListingType(type as ListingType)}
                      className={twMerge(
                        'px-4 py-2 rounded-full border',
                        selectedListingType === type
                          ? 'bg-forest border-forest'
                          : 'border-gray-300'
                      )}
                    >
                      <Text
                        className={twMerge(
                          'text-sm',
                          selectedListingType === type
                            ? 'text-white'
                            : 'text-gray-700'
                        )}
                      >
                        {type === '' ? 'Any' : type}
                      </Text>
                    </Pressable>
                  ))}
                </View>
                <View className="mt-3 flex-row justify-between items-center">
                  <Text className="text-gray-700">Bedroom only</Text>
                  <Switch value={bedroomOnly} onValueChange={setBedroomOnly} />
                </View>
              </View>

              {/* Roommate Prefs */}
              {selectedListingType === 'Single Room' && (
                <View className="mb-4 space-y-2">
                  <Text className="font-semibold text-gray-700">Roommate Preferences</Text>
                  <View className="flex-row justify-between items-center">
                    <Text>Live with Family</Text>
                    <Switch value={liveWithFamily} onValueChange={setLiveWithFamily} />
                  </View>
                  <View className="flex-row justify-between items-center">
                    <Text>Women Only</Text>
                    <Switch value={womenOnly} onValueChange={setWomenOnly} />
                  </View>
                </View>
              )}

              {/* Pets */}
              <View className="mb-4 space-y-2">
                <Text className="font-semibold text-gray-700">Pets</Text>
                <View className="flex-row justify-between items-center">
                  <Text>Pets Allowed</Text>
                  <Switch
                    value={petsAllowed}
                    onValueChange={(val) => {
                      setPetsAllowed(val);
                      if (!val) {
                        setDogsAllowed(false);
                        setCatsAllowed(false);
                      }
                    }}
                  />
                </View>
                {petsAllowed && (
                  <>
                    <View className="flex-row justify-between items-center ml-4">
                      <Text>Dogs</Text>
                      <Switch value={dogsAllowed} onValueChange={setDogsAllowed} />
                    </View>
                    <View className="flex-row justify-between items-center ml-4">
                      <Text>Cats</Text>
                      <Switch value={catsAllowed} onValueChange={setCatsAllowed} />
                    </View>
                  </>
                )}
              </View>

              {/* Amenities */}
              <View className="mb-4">
                <Text className="font-semibold text-gray-700 mb-2">Amenities</Text>
                <View className="flex-row flex-wrap gap-2">
                  {allAmenities.map((a) => (
                    <Pressable
                      key={a}
                      onPress={() => toggleAmenity(a)}
                      className={twMerge(
                        'px-4 py-2 rounded-full border',
                        selectedAmenities.includes(a)
                          ? 'bg-forest border-forest'
                          : 'border-gray-300'
                      )}
                    >
                      <Text
                        className={twMerge(
                          'text-sm',
                          selectedAmenities.includes(a)
                            ? 'text-white'
                            : 'text-gray-700'
                        )}
                      >
                        {a.replace(/-/g, ' ')}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>

              {/* Features */}
              <View className="mb-4">
                <Text className="font-semibold text-gray-700 mb-2">Features</Text>
                <View className="flex-row flex-wrap gap-2">
                  {allFeatures.map((f) => (
                    <Pressable
                      key={f}
                      onPress={() => toggleFeature(f)}
                      className={twMerge(
                        'px-4 py-2 rounded-full border',
                        selectedFeatures.includes(f)
                          ? 'bg-forest border-forest'
                          : 'border-gray-300'
                      )}
                    >
                      <Text
                        className={twMerge(
                          'text-sm',
                          selectedFeatures.includes(f)
                            ? 'text-white'
                            : 'text-gray-700'
                        )}
                      >
                        {f.replace(/-/g, ' ')}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>
            </ScrollView>

            {/* Footer Buttons */}
            <View className="flex-row justify-between pt-4 border-t">
              <Pressable
                onPress={() => {
                  resetFilters();
                  fetchListings();
                  setShowFilterModal(false);
                }}
                className="px-6 py-3 border border-gray-300 rounded-lg"
              >
                <Text className="text-gray-700">Clear All</Text>
              </Pressable>
              <Pressable
                onPress={() => {
                  fetchListings();
                  setShowFilterModal(false);
                }}
                className="px-6 py-3 bg-forest rounded-lg"
              >
                <Text className="text-white">Apply</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* Date Pickers */}
      <DateTimePickerModal
        isVisible={startPickerVisible}
        mode="date"
        onConfirm={(date) => {
          setStartDate(date);
          setStartPickerVisible(false);
        }}
        onCancel={() => setStartPickerVisible(false)}
        minimumDate={new Date()}
      />
      <DateTimePickerModal
        isVisible={endPickerVisible}
        mode="date"
        onConfirm={(date) => {
          setEndDate(date);
          setEndPickerVisible(false);
        }}
        onCancel={() => setEndPickerVisible(false)}
        minimumDate={startDate || new Date()}
      />
    </>
  );
};

export default FilterModal;