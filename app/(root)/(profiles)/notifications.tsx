import ProfileHeader from "@/components/ProfileHeader";
import { useState } from "react";
import { ScrollView, Switch, Text, View } from "react-native";

export default function Notifications() {
  const [push, setPush] = useState(true);
  const [email, setEmail] = useState(false);

  return (
    <View className="flex-1 bg-white">
      <ProfileHeader title="Notifications" />

      <ScrollView className="px-6 pt-6">
        <View className="bg-gray-50 rounded-3xl p-6 mb-4 flex-row justify-between items-center">
          <Text className="text-gray-900 font-rubik-medium">
            Push Notifications
          </Text>
          <Switch
            value={push}
            onValueChange={setPush}
            trackColor={{ true: "#2563eb" }}
          />
        </View>

        <View className="bg-gray-50 rounded-3xl p-6 flex-row justify-between items-center">
          <Text className="text-gray-900 font-rubik-medium">
            Email Notifications
          </Text>
          <Switch
            value={email}
            onValueChange={setEmail}
            trackColor={{ true: "#f97316" }}
          />
        </View>
      </ScrollView>
    </View>
  );
}
