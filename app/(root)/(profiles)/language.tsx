import ProfileHeader from "@/components/ProfileHeader";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";

export default function Language() {
  return (
    <View className="flex-1 bg-white">
      <ProfileHeader title="Language" />

      <ScrollView className="px-6 pt-6">
        <TouchableOpacity className="bg-blue-50 p-6 rounded-3xl mb-4">
          <Text className="text-blue-600 font-rubik-bold">
            English (Selected)
          </Text>
        </TouchableOpacity>

        <TouchableOpacity className="bg-gray-50 p-6 rounded-3xl">
          <Text className="text-gray-900">Shona</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}
