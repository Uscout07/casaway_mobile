import React from 'react';
import { View, Text, TouchableOpacity, Image } from 'react-native';
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { User } from '../../types/listingPageTypes'; // Ensure this path is correct

interface HostCardProps {
    user: User | null; // User can be null if host info not available
    onMessageHost: () => void; // Added for message host functionality
    onViewProfile: (userId: string) => void; // Added for viewing profile
}

const HostCard: React.FC<HostCardProps> = ({ user, onMessageHost, onViewProfile }) => {
    return (
        <View className="lg:col-span-1 bg-white p-6 rounded-xl shadow-md h-fit sticky top-7"> 
            <Text className="text-xl font-semibold text-gray-900 mb-4">Meet your Host</Text>
            {user ? (
                <TouchableOpacity onPress={() => onViewProfile(user._id)} className="flex-row items-center mb-4 active:opacity-80"> 
                    <View className="w-16 h-16 rounded-full overflow-hidden mr-4 border-2 border-green-800 bg-gray-200 justify-center items-center"> 
                        {user.profilePic ? (
                            <Image
                                source={{ uri: user.profilePic }}
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            <MaterialIcons name="person-outline" size={40} color="#9ca3af" />
                        )}
                    </View>
                    <View>
                        <Text className="font-bold text-lg text-gray-900">{user.name}</Text>
                        <Text className="text-gray-600 text-sm">@{user.username}</Text>
                    </View>
                </TouchableOpacity>
            ) : (
                <Text className="text-gray-600">Host information not available.</Text>
            )}

            <Text className="text-gray-700 text-sm mb-4">
                {user?.name || 'This host'} is a verified host on Casway, committed to providing great stays.
            </Text>
            <TouchableOpacity
                onPress={onMessageHost}
                className="w-full bg-green-800 text-white px-6 py-3 rounded-full font-medium flex-row items-center justify-center gap-2 disabled:opacity-50" // bg-forest hover:bg-teal-800
            >
                <MaterialIcons name="chat-bubble-outline" size={20} color="white" /> 
                <Text className="text-white text-base">Message Host</Text>
            </TouchableOpacity>
        </View>
    );
};

export default HostCard;