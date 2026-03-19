// screens/Profile.tsx
import { logout } from "@/lib/appwrite";
import {
  clearSavedAvatar,
  getSavedAvatar,
  saveSelectedAvatar,
} from "@/utils/avatarStorage";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import { Image, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import AvatarSuccessModal from "@/components/AvatarSuccessModal";
import BlueAvatarModal from "@/components/BlueAvatarModal";
import { getAvatarSource } from "@/constants/data";
import icons from "@/constants/icons";
import useAuthStore from "@/store/auth.store";

const Profile = () => {
  const { user } = useAuthStore();
  const [modalVisible, setModalVisible] = useState(false);
  const [avatarId, setAvatarId] = useState<string | null>(null);
  const [loadingAvatar, setLoadingAvatar] = useState(true);
  const [showSuccess, setShowSuccess] = useState(false);

  // Load avatar on mount
  useEffect(() => {
    const loadAvatar = async () => {
      const saved = await getSavedAvatar();
      setAvatarId(saved || "human-1");
      setLoadingAvatar(false);
    };
    loadAvatar();
  }, []);

  // Handle avatar selection
  const handleSelectAvatar = async (newAvatarId: string) => {
    setAvatarId(newAvatarId);
    await saveSelectedAvatar(newAvatarId);
    setModalVisible(false);
    setShowSuccess(true);
  };

  // Logout
  const handleLogout = async () => {
    const result = await logout();
    if (result) {
      await clearSavedAvatar();
      router.replace("/sign-in");
    } else {
      alert("Failed to logout");
    }
  };

  return (
    <SafeAreaView className="h-full bg-white">
      <ScrollView contentContainerClassName="pb-32 px-7">
        {/* Header */}
        <View className="flex flex-row items-center justify-between mt-5">
          <Text className="text-xl font-rubik-bold">Profile</Text>
        </View>

        {/* Avatar Section */}
        <View className="flex items-center mt-10">
          <View className="relative">
            {!loadingAvatar && (
              <Image
                source={getAvatarSource(avatarId)}
                className="w-40 h-40 rounded-full border-4 border-white shadow-lg"
              />
            )}
            <TouchableOpacity
              className="absolute bottom-0 right-0 bg-[#0066FF] p-3 rounded-full border-2 border-white"
              onPress={() => setModalVisible(true)}
            >
              <Image
                source={icons.edit}
                className="w-5 h-5"
                tintColor="white"
              />
            </TouchableOpacity>
          </View>
          <Text className="text-2xl font-rubik-bold mt-4">{user?.name}</Text>
          <Text className="text-base font-rubik text-black-200 mt-1">
            {user?.email}
          </Text>
        </View>

        {/* Profile Options */}
        <View className="flex flex-col mt-10">
          <TouchableOpacity
            className="flex flex-row items-center py-4"
            onPress={() => router.push("/my-favorites")}
          >
            <Image source={icons.calendar} className="size-6" />
            <Text className="text-lg font-rubik-medium text-black-300 ml-4">
              My Favorites
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            className="flex flex-row items-center py-4"
            onPress={() => router.push("/help")}
          >
            <Image source={icons.info} className="size-6" />
            <Text className="text-lg font-rubik-medium text-black-300 ml-4">
              Help Center
            </Text>
          </TouchableOpacity>
        </View>

        {/* Logout Button */}
        <TouchableOpacity
          onPress={handleLogout}
          className="flex flex-row items-center py-4 border-t border-gray-200 mt-5"
        >
          <Image source={icons.logout} className="size-6" />
          <Text className="text-lg font-rubik-medium text-red-500 ml-4">
            Logout
          </Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Blue Avatar Modal */}
      <BlueAvatarModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onSelect={handleSelectAvatar}
        currentAvatarId={avatarId || "human-1"}
      />

      {/* Avatar Success Modal */}
      <AvatarSuccessModal
        visible={showSuccess}
        onClose={() => setShowSuccess(false)}
        message="Avatar updated!"
      />
    </SafeAreaView>
  );
};

export default Profile;
