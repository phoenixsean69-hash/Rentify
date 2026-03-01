import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type Props = {
  title: string;
};

export default function ProfileHeader({ title }: Props) {
  const router = useRouter();

  return (
    <SafeAreaView edges={["top"]} className="bg-white">
      <View className="flex-row items-center justify-between px-6 py-4 border-b border-gray-100">
        {/* Back Arrow */}
        <TouchableOpacity onPress={() => router.push("/profile")}>
          <Ionicons name="arrow-back" size={24} color="#111" />
        </TouchableOpacity>

        {/* Title */}
        <Text className="text-xl font-rubik-bold">{title}</Text>

        {/* Spacer for symmetry */}
        <View style={{ width: 24 }} />
      </View>
    </SafeAreaView>
  );
}
