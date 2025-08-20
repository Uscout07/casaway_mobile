import React from 'react';
import { View } from 'react-native'; // Only View is needed for the skeleton structure

const ListingDetailSkeleton: React.FC = () => {
    return (
        <View className="flex-1 bg-green-50 pt-4 pb-12 animate-pulse"> {/* Using flex-1 for full height, and classNames */}
            <View className="max-w-6xl self-center px-4 sm:px-6 lg:px-8 py-8">
                {/* Gallery Section Skeleton */}
                <View className="mb-8">
                    <View className="w-full h-[300px] md:h-[500px] rounded-xl bg-gray-300 shadow-lg mb-4 relative overflow-hidden">
                        {/* Shimmer effect placeholder */}
                        <View className="absolute inset-0 bg-gradient-to-r from-transparent via-gray-200 to-transparent opacity-0 animate-shimmer"></View>
                    </View>
                    <View className="flex flex-row flex-wrap gap-4 justify-center">
                        {Array.from({ length: 4 }).map((_, index) => (
                            <View key={index} className="w-24 h-24 rounded-lg bg-gray-300 border-2 border-gray-200 relative overflow-hidden">
                                {/* Shimmer effect placeholder */}
                                <View className="absolute inset-0 bg-gradient-to-r from-transparent via-gray-200 to-transparent opacity-0 animate-shimmer"></View>
                            </View>
                        ))}
                    </View>
                </View>

                {/* Main Content Area Skeleton (Listing Details Card + Host Card) */}
                <View className="flex-col lg:flex-row gap-8">
                    {/* Listing Details Card Skeleton */}
                    <View className="flex-2 bg-white p-6 rounded-xl shadow-md mb-8">
                        <View className="h-8 bg-gray-300 rounded w-3/4 mb-4"></View> {/* Title */}
                        <View className="h-5 bg-gray-300 rounded w-1/4 mb-4"></View> {/* Location */}
                        <View className="h-4 bg-gray-300 rounded w-full mb-3"></View> {/* Availability */}
                        <View className="h-4 bg-gray-300 rounded w-5/6 mb-4"></View> {/* Price/Details */}

                        {/* Amenities */}
                        <View className="flex-row flex-wrap gap-2 mb-4">
                            {Array.from({ length: 3 }).map((_, index) => (
                                <View key={index} className="h-8 w-24 bg-gray-300 rounded-full"></View>
                            ))}
                        </View>

                        {/* Description */}
                        <View className="h-4 bg-gray-300 rounded w-full mb-2"></View>
                        <View className="h-4 bg-gray-300 rounded w-full mb-2"></View>
                        <View className="h-4 bg-gray-300 rounded w-2/3 mb-4"></View>
                    </View>

                    {/* Host Card Skeleton */}
                    <View className="flex-1 bg-white p-6 rounded-xl shadow-md h-fit lg:sticky lg:top-28">
                        <View className="h-7 bg-gray-300 rounded w-1/2 mb-4"></View> {/* "Meet your Host" */}
                        <View className="flex-row items-center mb-4">
                            <View className="w-16 h-16 rounded-full bg-gray-300 mr-4"></View> {/* Profile Pic */}
                            <View>
                                <View className="h-5 bg-gray-300 rounded w-32 mb-1"></View> {/* Host Name */}
                                <View className="h-4 bg-gray-300 rounded w-24"></View> {/* Username */}
                            </View>
                        </View>
                        <View className="h-4 bg-gray-300 rounded w-full mb-4"></View> {/* Host description */}
                        <View className="h-12 bg-gray-300 rounded-full w-full"></View> {/* Message Host Button */}
                    </View>
                </View>

                {/* Comments Section Skeleton */}
                <View className="my-6 border-b border-gray-200"></View> {/* Divider */}
                <View className="mt-8">
                    <View className="h-7 bg-gray-300 rounded w-1/4 mb-4"></View> {/* Comments title */}
                    <View className="flex-row gap-2 mb-6">
                        <View className="flex-1 border border-gray-300 rounded-lg px-4 py-2 bg-gray-200 h-10"></View> {/* Comment Input */}
                        <View className="w-20 bg-gray-300 rounded-lg h-10"></View> {/* Post Button */}
                    </View>
                    {Array.from({ length: 2 }).map((_, index) => (
                        <View key={index} className="flex-row mb-4">
                            <View className="w-10 h-10 rounded-full bg-gray-300 flex-shrink-0 mr-4"></View> {/* Avatar */}
                            <View className="flex-1">
                                <View className="h-4 bg-gray-300 rounded w-1/3 mb-2"></View> {/* Username */}
                                <View className="h-4 bg-gray-300 rounded w-full mb-1"></View> {/* Comment text line 1 */}
                                <View className="h-4 bg-gray-300 rounded w-2/3"></View> {/* Comment text line 2 */}
                            </View>
                        </View>
                    ))}
                </View>
            </View>
        </View>
    );
};

export default ListingDetailSkeleton;