import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    TextInput,
    ActivityIndicator,
    ScrollView,
    Alert, // Using Alert for native pop-ups
    Platform, // To handle clipboard differently for web/native
    Share, // For native sharing
    Image, // For displaying images
    Linking
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants'; // For accessing expoConfig.extra
// Removed: import { useTailwind } from 'nativewind'; // For NativeWind styling
import { MaterialCommunityIcons } from '@expo/vector-icons'; // For icons

// Define the API base URL using expo-constants
// In a real Expo app, you'd define NEXT_PUBLIC_API_URL in app.config.ts or app.json
// For this example, we'll use a fallback.
const API_BASE_URL = Constants.expoConfig?.extra?.API_BASE_URL || 'http://localhost:5000';

interface Reward {
    brandKey: string;
    displayName: string;
    imageUrls?: string[];
    cost: number;
}

const brandNameMap: Record<string, string> = {
    B916708: 'Amazon.com',
    B795341: 'Uber',
};

export default function ReferralPage() {
    // Removed: const tailwind = useTailwind(); // Initialize NativeWind
    const [userId, setUserId] = useState<string>('');
    const [referralCode, setReferralCode] = useState('');
    const [referralLink, setReferralLink] = useState('');
    const [points, setPoints] = useState(0);
    const [referralCount, setReferralCount] = useState(0);
    const [copySuccess, setCopySuccess] = useState('');
    const [message, setMessage] = useState<string | null>(null);
    const [rewards, setRewards] = useState<Reward[]>([]);
    const [rewardsLoading, setRewardsLoading] = useState(true);
    const [enteredRefCode, setEnteredRefCode] = useState('');
    const [user, setUser] = useState<any>(null);
    const navigation = useNavigation();

    useEffect(() => {
        const loadUser = async () => {
            try {
                const storedUser = await AsyncStorage.getItem('user');
                if (storedUser) {
                    const parsedUser = JSON.parse(storedUser);
                    setUserId(parsedUser._id);
                    fetchUserData(parsedUser._id);
                }
            } catch (e) {
                console.error('Failed to load user from AsyncStorage', e);
            }
        };
        loadUser();
    }, []);

    const fetchUserData = async (id: string) => {
        try {
            const storedToken = await AsyncStorage.getItem('token');
            if (!storedToken) throw new Error('Token missing');

            const res = await fetch(`${API_BASE_URL}/api/users/${id}`, {
                headers: { Authorization: `Bearer ${storedToken}` },
            });

            if (!res.ok) throw new Error('Failed to fetch profile data');

            const userData = await res.json();
            setUser(userData);
        } catch (err: any) {
            Alert.alert('Error', err.message || 'Something went wrong.');
        }
    };

    // Fetch referral data when userId is available
    useEffect(() => {
        if (!userId) return;

        const fetchReferralData = async () => {
            try {
                const res = await fetch(`${API_BASE_URL}/api/referral/${userId}`);
                const data = await res.json();
                if (res.ok) {
                    setReferralCode(data.referralCode);
                    setReferralLink(data.referralLink);
                    setPoints(data.points);
                    setReferralCount(data.referralCount);
                } else {
                    console.error('Error fetching referral data:', data.message || 'Unknown error');
                }
            } catch (err) {
                console.error('Error fetching referral data:', err);
            }
        };
        fetchReferralData();
    }, [userId]);

    // Fetch rewards catalog on component mount
    useEffect(() => {
        const fetchRewards = async () => {
            try {
                const res = await fetch(`${API_BASE_URL}/api/rewards/catalog`);
                const data: {
                    message: string; brands: Reward[]
                } = await res.json();
                if (res.ok) {
                    setRewards(data.brands);
                } else {
                    console.error('Error fetching catalog:', data.message || 'Unknown error');
                }
            } catch (err) {
                console.error('Error fetching catalog:', err);
            } finally {
                setRewardsLoading(false);
            }
        };
        fetchRewards();
    }, []);

    // Handle copying text to clipboard
    const handleCopy = async (text: string) => {
        if (!text) return;

        try {
            if (Platform.OS === 'web' && navigator.clipboard) {
                await navigator.clipboard.writeText(text);
            } else {
                // In a real React Native app, you'd use:
                // import * as Clipboard from 'expo-clipboard';
                // Clipboard.setString(text);
                console.log(`Copied to clipboard (simulated): ${text}`);
            }
            setCopySuccess('Copied!');
            setTimeout(() => setCopySuccess(''), 2000);
        } catch (e) {
            setCopySuccess('Copy failed.');
            setTimeout(() => setCopySuccess(''), 2000);
            console.error('Failed to copy:', e);
        }
    };

    const handleUseReferralCode = async () => {
        if (!enteredRefCode) {
            Alert.alert('Error', 'Please enter a referral code.');
            return;
        }

        try {
            const res = await fetch(`${API_BASE_URL}/api/referral/use`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ refCode: enteredRefCode, userId }),
            });

            const data = await res.json();

            if (res.ok) {
                Alert.alert('Success', 'Referral code applied successfully.');
                setEnteredRefCode('');
            } else {
                Alert.alert('Error', data.msg || 'Failed to apply referral code.');
            }
        } catch (err) {
            Alert.alert('Error', 'An error occurred while applying the referral code.');
        }
    };

    // Handle sharing referral link using React Native's Share API
    const handleShare = async (platform: string) => {
        try {
            await Share.share({
                message: `Check out this awesome app! Use my referral link: ${referralLink}`,
                url: referralLink, // For platforms that support sharing URLs directly
                title: 'Referral Link',
            }, {
                dialogTitle: `Share via ${platform}`,
                excludedActivityTypes: [], // Specify types to exclude if needed
            });
        } catch (error: any) {
            Alert.alert('Share Failed', error.message);
        }
    };

    // Handle reward redemption
    const handleRedeem = async (brandKey: string, cost: number) => {
        if (!userId) {
            Alert.alert('Authentication Required', 'Please log in first.');
            return;
        }

        if (points < cost) {
            Alert.alert('Not Enough Points', 'You do not have enough points to redeem this reward.');
            return;
        }

        try {
            const res = await fetch(`${API_BASE_URL}/api/redeem`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId, brandKey, value: cost }),
            });

            const data = await res.json();
            if (!res.ok) {
                throw new Error(data.message || 'Redemption failed');
            }

            setMessage('Redemption successful!');
            setPoints(prev => prev - cost);
            setTimeout(() => setMessage(null), 3000);
        } catch (err: any) {
            setMessage(err.message || 'Something went wrong');
            setTimeout(() => setMessage(null), 3000);
        }
    };

    if (user && user.role !== 'ambassador') {
        Alert.alert('Access Denied', 'This page is only available for ambassadors.');
        navigation.goBack();
        return null;
    }

    return (
        <ScrollView className="flex-1 bg-ambient pt-12 px-4">
            <Text className="text-2xl font-bold text-green-800 mb-6 mt-4">Referral Program</Text>

            {message && (
                <View className="p-3 rounded-lg bg-yellow-100 border border-yellow-200 mb-4">
                    <Text className="text-yellow-800 font-medium">{message}</Text>
                </View>
            )}

            <View className="bg-white rounded-lg p-6 mb-6 shadow-md">
                <Text className="text-xl font-semibold text-green-800 mb-4">Your Referral Code</Text>
                <View className="flex-row items-center mb-3">
                    <TextInput
                        value={referralCode}
                        editable={false}
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-700"
                        placeholder="Loading referral code..."
                    />
                    <TouchableOpacity
                        onPress={() => handleCopy(referralCode)}
                        className="ml-3 bg-green-600 px-4 py-2 rounded-lg active:bg-green-700"
                    >
                        <Text className="text-white font-medium">{copySuccess || 'Copy'}</Text>
                    </TouchableOpacity>
                </View>
            </View>

            <View className="bg-white rounded-lg p-6 mb-6 shadow-md">
                <Text className="text-xl font-semibold text-green-800 mb-4">Enter Referral Code</Text>
                <View className="flex-row items-center mb-3">
                    <TextInput
                        onChangeText={setEnteredRefCode}
                        value={enteredRefCode}
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-700"
                        placeholder="Enter referral code"
                    />
                    <TouchableOpacity
                        onPress={handleUseReferralCode}
                        className="ml-3 bg-green-600 px-4 py-2 rounded-lg active:bg-green-700"
                    >
                        <Text className="text-white font-medium">Submit</Text>
                    </TouchableOpacity>
                </View>
            </View>

            <View className="bg-white rounded-lg p-6 mb-6 shadow-md">
                <Text className="text-xl font-semibold text-green-800 mb-4">Your Referral Link</Text>
                <View className="flex-row items-center mb-3">
                    <TextInput
                        value={referralLink}
                        editable={false} // Make it read-only
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-700"
                        placeholder="Loading referral link..."
                        selectTextOnFocus={true} // Allows easy selection on focus
                    />
                    <TouchableOpacity
                        onPress={() => handleCopy(referralLink)}
                        className="ml-3 bg-green-600 px-4 py-2 rounded-lg active:bg-green-700"
                    >
                        <Text className="text-white font-medium">{copySuccess || 'Copy'}</Text>
                    </TouchableOpacity>
                </View>
                {referralLink ? (
                    <View className="flex-row justify-around mt-4">
                        <TouchableOpacity
                            onPress={() => {
                                const url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(referralLink)}`;
                                Linking.openURL(url);
                            }}
                        >
                            <MaterialCommunityIcons name="facebook" size={32} color="#1877F2" />
                        </TouchableOpacity>

                        <TouchableOpacity
                            onPress={() => {
                                const url = `https://api.whatsapp.com/send?text=${encodeURIComponent("Check this app: " + referralLink)}`;
                                Linking.openURL(url);
                            }}
                        >
                            <MaterialCommunityIcons name="whatsapp" size={32} color="#25D366" />
                        </TouchableOpacity>

                        <TouchableOpacity
                            onPress={() => {
                                const url = `https://www.instagram.com`;
                                Linking.openURL(url);
                            }}
                        >
                            <MaterialCommunityIcons name="instagram" size={32} color="#E1306C" />
                        </TouchableOpacity>

                        <TouchableOpacity
                            onPress={() => {
                                const url = `https://twitter.com/intent/tweet?url=${encodeURIComponent(referralLink)}&text=Check%20out%20this%20app!`;
                                Linking.openURL(url);
                            }}
                        >
                            <MaterialCommunityIcons name="twitter" size={32} color="#1DA1F2" />
                        </TouchableOpacity>
                        <TouchableOpacity
  onPress={() => handleShare('Generic')}
  className="items-center p-2"
>
  <MaterialCommunityIcons name="share-variant" size={32} color="#6B7280" />
  <Text className="text-xs text-gray-600 mt-1">Share</Text>
</TouchableOpacity>

                    </View>
                ) : (
                    <ActivityIndicator size="small" color="#059669" className="mt-4" />
                )}
            </View>

            <View className="flex-col gap-6 mb-6">
                <View className="rounded-lg p-6 bg-white shadow-md">
                    <Text className="text-xl font-semibold mb-2 text-green-800">Your Stats</Text>
                    <Text className="text-gray-700 text-base mb-1"><Text className="font-bold">Referrals:</Text> {referralCount}</Text>
                    <Text className="text-gray-700 text-base"><Text className="font-bold">Points:</Text> {points}</Text>
                </View>

                <View className="rounded-lg p-6 bg-white shadow-md">
                    <Text className="text-xl font-semibold mb-4 text-green-800 text-center">Rewards Catalog</Text>
                    {rewardsLoading ? (
                        <ActivityIndicator size="large" color="#059669" className="mt-4" />
                    ) : rewards.length === 0 ? (
                        <Text className="text-red-500 text-center">No rewards available.</Text>
                    ) : (
                        <View className="flex-col gap-6 mb-[18vh] ">
                            {rewards.map((reward, idx) => {
                                const lastImage = reward.imageUrls?.[reward.imageUrls.length - 1];
                                const name = brandNameMap[reward.brandKey] || reward.displayName;
                                return (
                                    <View
                                        key={idx}
                                        className="border border-gray-200 p-6 rounded-lg flex-col items-center text-center gap-4 bg-green-50 shadow-sm"
                                    >
                                        {lastImage && (
                                            <Image
                                                source={{ uri: lastImage }}
                                                className='w-64 h-32 object-contain rounded'// Use Tailwind for sizing
                                                resizeMode="contain" // Ensure the image fits
                                            />
                                        )}
                                        <Text className="text-lg font-semibold text-green-800">{name}</Text>
                                        <Text className="text-gray-600 text-sm">$10 <Text className="font-bold">{name}</Text> Gift Card</Text>
                                        <TouchableOpacity
                                            onPress={() => handleRedeem(reward.brandKey, reward.cost)}
                                            disabled={points < reward.cost}
                                            className={`px-4 py-2 rounded-lg ${points < reward.cost
                                                    ? 'bg-gray-400 opacity-70'
                                                    : 'bg-green-600 active:bg-green-700'
                                                }`}
                                        >
                                            <Text className="text-white text-sm font-medium ">
                                                Redeem ({reward.cost} pts)
                                            </Text>
                                        </TouchableOpacity>
                                    </View>
                                );
                            })}
                        </View>
                    )}
                </View>
            </View>
        </ScrollView>
    );
}
