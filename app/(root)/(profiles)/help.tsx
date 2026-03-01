import ProfileHeader from "@/components/ProfileHeader";
import { ScrollView, Text, View } from "react-native";

export default function Help() {
  return (
    <View className="flex-1 bg-white">
      <ProfileHeader title="Help & Support" />

      <ScrollView className="px-6 pt-6">
        <View className="bg-blue-50 p-6 rounded-3xl mb-4">
          <Text className="text-lg font-rubik-bold text-gray-900">
            Need Assistance?
          </Text>
          <Text className="text-blue-600 mt-2">
            We're here to help you anytime.
          </Text>
        </View>

        <View className="bg-gray-50 p-6 rounded-3xl">
          <Text className="text-gray-600">support@rentify.com</Text>
        </View>
      </ScrollView>
    </View>
  );
}
