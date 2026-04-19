// app/properties-by-location.tsx
import { Colors } from "@/constants/Colors";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  Text,
  TouchableOpacity,
  useColorScheme,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import locationService from "../../../services/location.service";

const PropertiesByLocation = () => {
  const { city } = useLocalSearchParams();
  const router = useRouter();
  const [properties, setProperties] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadProperties = useCallback(async () => {
    setLoading(true);
    const data = await locationService.getPropertiesByCity(city as string);
    setProperties(data);
    setLoading(false);
  }, [city]);

  useEffect(() => {
    loadProperties();
  }, [loadProperties]);
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? "light"];
  const renderProperty = ({ item }: { item: any }) => (
    <TouchableOpacity
      className="flex-row bg-white rounded-xl shadow-sm mb-3 p-3 border border-gray-100"
      style={{ backgroundColor: theme.navBackground }}
      onPress={() =>
        router.push({
          pathname: "/properties/[id]",
          params: { id: item.$id },
        })
      }
    >
      <Image
        source={{ uri: item.image1 || "https://via.placeholder.com/100" }}
        className="w-20 h-20 rounded-lg"
      />
      <View className="flex-1 ml-3">
        <Text
          className="text-lg font-rubik-bold text-gray-900"
          style={{ color: theme.title }}
        >
          {item.propertyName}
        </Text>
        <Text
          className="text-sm text-gray-500 font-rubik"
          style={{ color: theme.title }}
        >
          {item.type}
        </Text>
        <Text
          className="text-sm text-gray-400 font-rubik mt-1"
          numberOfLines={2}
          style={{ color: theme.title }}
        >
          {item.address}
        </Text>
        <Text
          className="text-blue-600 font-rubik-bold mt-1"
          style={{ color: theme.title }}
        >
          ${item.price}
        </Text>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" color="#3B82F6" />
      </View>
    );
  }

  return (
    <SafeAreaView
      className="flex-1"
      style={{ backgroundColor: theme.navBackground }}
    >
      {/* Header */}
      <View className="flex-row items-center px-4 py-3 border-b border-gray-200">
        <TouchableOpacity
          onPress={() => router.replace("/all-locations")}
          className="mr-3"
        >
          <Ionicons name="arrow-back" size={24} color={theme.title} />
        </TouchableOpacity>
        <View>
          <Text
            className="text-2xl font-rubik-bold text-gray-900"
            style={{ color: theme.title }}
          >
            {city}
          </Text>
          <Text
            className="text-gray-500 font-rubik"
            style={{ color: theme.title }}
          >
            {properties.length} properties found
          </Text>
        </View>
      </View>

      {/* Properties List */}
      <FlatList
        data={properties}
        renderItem={renderProperty}
        keyExtractor={(item) => item.$id}
        contentContainerClassName="p-4"
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View className="py-8 items-center">
            <Ionicons name="sad-outline" size={48} color="#9CA3AF" />
            <Text className="text-gray-500 font-rubik mt-2">
              No properties found in {city}
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
};

export default PropertiesByLocation;
