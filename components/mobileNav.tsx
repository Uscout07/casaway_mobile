import React from 'react';
import { View, Text, Pressable, Image } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { MaterialIcons, Ionicons, Feather, AntDesign } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

const MobileNav = () => {
  const navigation = useNavigation<any>();

  return (
    <SafeAreaView className="md:hidden absolute bottom-0 w-full flex-row justify-evenly bg-forest px-2 z-50 pt-4">
      <Pressable
        className="items-center"
        onPress={() => navigation.navigate('Search')}
      >
        <Ionicons name="search" size={24} color="#F8EFE0" />
        <Text className="text-[10px] text-ambient mt-1">Search</Text>
      </Pressable>

      <Pressable
        className="items-center"
        onPress={() => navigation.navigate('Upload')}
      >
        <AntDesign name="pluscircleo" size={24} color="#F8EFE0" />
        <Text className="text-[10px] text-ambient mt-1">Upload</Text>
      </Pressable>

      <Pressable
        className="items-center"
        onPress={() => navigation.navigate('Home')}
      >
        <Image
          source={require('../assets/ambientLogo.png')} // Make sure you put ambientLogo.png in assets/
          style={{ width: 24, height: 24 }}
          resizeMode="contain"
          className=''
        />
        <Text className="text-[10px] text-ambient mt-1">Home</Text>
      </Pressable>

      <Pressable
        className="items-center"
        onPress={() => navigation.navigate('messages')}
      >
        <Feather name="message-circle" size={24} color="#F8EFE0" />
        <Text className="text-[10px] text-ambient mt-1">Message</Text>
      </Pressable>

      <Pressable
        className="items-center"
        onPress={() => navigation.navigate('Settings')}
      >
        <MaterialIcons name="settings" size={24} color="#F8EFE0" />
        <Text className="text-[10px] text-ambient mt-1">Settings</Text>
      </Pressable>
    </SafeAreaView>
  );
};

export default MobileNav;
