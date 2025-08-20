import React from 'react';
import { View, Image, TouchableOpacity, Text, ScrollView, Dimensions } from 'react-native';

interface ListingGalleryProps {
  images: string[];
  mainImage: string;
  setMainImage: (image: string) => void;
  title: string;
}

// screenWidth is still useful for dynamic height based on viewport width
const screenWidth = Dimensions.get('window').width;

const ListingGallery: React.FC<ListingGalleryProps> = ({ images, mainImage, setMainImage, title }) => {
  return (
    <View className="mb-8 flex items-center">
      {mainImage ? (
        <View style={{ height: screenWidth * 0.9, width: "90%" }} className="w-full rounded-xl overflow-hidden shadow-lg mb-4 bg-gray-100">
          <Image
            source={{ uri: mainImage }}
            alt={title || 'Listing main image'}
            className="w-[90vw] h-full"
            resizeMode="cover"
          />
        </View>
      ) : (
        <View style={{ height: screenWidth * 0.6 }} className="w-full rounded-xl bg-gray-200 justify-center items-center mb-4">
          <Text className="text-gray-600">No Image Available</Text>
        </View>
      )}

      <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row px-1">
        {images.map((image, index) => (
          <TouchableOpacity
            key={index}
            onPress={() => setMainImage(image)}
            className={`w-24 h-24 mr-3 rounded-lg border-2 overflow-hidden ${mainImage === image ? 'border-forest' : 'border-gray-300'}`}
          >
            <Image
              source={{ uri: image }}
              alt={`Listing thumbnail ${index + 1}`}
              className="w-full h-full"
              resizeMode="cover"
            />
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
};

export default ListingGallery;