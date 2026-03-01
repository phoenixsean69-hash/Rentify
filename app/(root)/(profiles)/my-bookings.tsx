import ProfileHeader from "@/components/ProfileHeader";
import { ScrollView, Text, View } from "react-native";

export default function MyBookings() {
  return (
    <View className="flex-1 bg-white">
      <ProfileHeader title="My Favorites" />

      <ScrollView className="px-6 pt-6">
        <View className="bg-gray-50 p-6 rounded-3xl mb-4 border-l-4 border-blue-500">
          <Text className="text-lg font-rubik-bold">Borrowdale Apartment</Text>
          <Text className="text-gray-500 mt-2">Active Booking</Text>
        </View>

        <View className="bg-gray-50 p-6 rounded-3xl border-l-4 border-orange-400">
          <Text className="text-lg font-rubik-bold">Avondale Studio</Text>
          <Text className="text-gray-500 mt-2">Pending Approval</Text>
        </View>
      </ScrollView>
    </View>
  );
}
