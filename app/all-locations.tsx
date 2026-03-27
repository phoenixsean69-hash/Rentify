// app/properties-by-location.tsx
import { Colors } from "@/constants/Colors";
import { getAvatarSource } from "@/constants/data";
import icons from "@/constants/icons";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  Image,
  Text,
  TouchableOpacity,
  useColorScheme,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import locationService from "./../services/location.service";

const { width } = Dimensions.get("window");

const PropertiesByLocation = () => {
  const { city } = useLocalSearchParams();
  const router = useRouter();
  const [properties, setProperties] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadProperties = useCallback(async () => {
    setLoading(true);
    const data = await locationService.getPropertiesByCity(city as string);

    // Log the data structure to debug
    console.log("Property data sample:", data[0]);

    setProperties(data);
    setLoading(false);
  }, [city]);

  useEffect(() => {
    loadProperties();
  }, [loadProperties]);

  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? "light"];

  const renderProperty = ({ item }: { item: any }) => {
    const images = [item.image1, item.image2, item.image3].filter(Boolean);

    // Get creator info - try different possible field names
    const creator = {
      name:
        item.creatorName ||
        item.agentName ||
        item.landlordName ||
        item.ownerName ||
        (item.agent && item.agent.name) ||
        "Property Owner",
      email:
        item.creatorEmail ||
        item.agentEmail ||
        (item.agent && item.agent.email) ||
        "Not available",
      phone:
        item.creatorPhone ||
        item.agentPhone ||
        (item.agent && item.agent.phone) ||
        "Not available",
      avatar:
        item.creatorAvatar ||
        item.agentAvatar ||
        (item.agent && item.agent.avatar) ||
        null,
    };

    // Calculate average rating if reviews exist
    const calculateAverageRating = () => {
      if (item.reviews && typeof item.reviews === "string") {
        try {
          const reviews = JSON.parse(item.reviews);
          if (reviews && reviews.length > 0) {
            const sum = reviews.reduce(
              (acc: number, rev: any) => acc + (rev.rating || 0),
              0,
            );
            return (sum / reviews.length).toFixed(1);
          }
        } catch (e) {
          return "0.0";
        }
      }
      return item.rating?.toFixed(1) || "0.0";
    };

    const avgRating = calculateAverageRating();

    return (
      <View
        className="rounded-3xl mb-8 overflow-hidden"
        style={{
          backgroundColor: theme.navBackground,
          borderWidth: 1,
          borderColor: theme.muted + "30",
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.1,
          shadowRadius: 12,
          elevation: 8,
        }}
      >
        {/* IMAGE CAROUSEL */}
        <View>
          <FlatList
            data={images.length ? images : ["https://via.placeholder.com/400"]}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            keyExtractor={(_, index) => index.toString()}
            renderItem={({ item: img }) => (
              <Image
                source={{ uri: img }}
                style={{ width: width, height: 280 }}
                resizeMode="cover"
              />
            )}
          />

          {/* Dark gradient overlay for text visibility */}
          <LinearGradient
            colors={["transparent", "rgba(0,0,0,0.3)", "rgba(0,0,0,0.7)"]}
            start={{ x: 0, y: 0.8 }}
            end={{ x: 0, y: 1 }}
            className="absolute bottom-0 left-0 right-0 h-32"
          />

          {/* Pagination Dots */}
          {images.length > 1 && (
            <View className="absolute bottom-3 left-0 right-0 flex-row justify-center z-10">
              <View className="flex-row gap-1.5 bg-black/40 px-2 py-1 rounded-full">
                {images.map((_, idx) => (
                  <View
                    key={idx}
                    className="w-1.5 h-1.5 rounded-full"
                    style={{
                      backgroundColor:
                        idx === 0 ? "#FFFFFF" : "rgba(255,255,255,0.5)",
                    }}
                  />
                ))}
              </View>
            </View>
          )}

          {/* Rating Badge - Top Right */}
          <View className="absolute top-4 right-4 bg-white/90 px-3 py-1.5 rounded-full z-10 flex-row items-center">
            <Image source={icons.star} className="size-3.5" />
            <Text className="text-xs font-rubik-bold text-primary-300 ml-1">
              {avgRating}
            </Text>
          </View>

          {/* Like Button */}
          <TouchableOpacity
            className="absolute top-4 right-20 bg-white/95 p-2 rounded-full shadow-md z-10"
            onPress={() => console.log("Liked:", item.$id)}
            style={{
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.2,
              shadowRadius: 4,
              elevation: 3,
            }}
          >
            <Ionicons name="heart-outline" size={18} color="#EF4444" />
          </TouchableOpacity>

          {/* Type Badge - Top Left */}
          <View className="absolute top-4 left-4 bg-black/60 backdrop-blur-md px-3 py-1 rounded-full z-10">
            <Text className="text-white text-xs font-rubik-medium uppercase tracking-wide">
              {item.type || "Property"}
            </Text>
          </View>

          {/* Property details overlay at bottom */}
          <View className="absolute bottom-4 left-4 right-4 z-10">
            <Text
              className="text-white text-xl font-rubik-bold"
              numberOfLines={1}
            >
              {item.propertyName || "Untitled Property"}
            </Text>
            <Text
              className="text-white/80 text-sm font-rubik mt-1"
              numberOfLines={1}
            >
              {item.address || "No address provided"}
            </Text>
            <View className="flex-row justify-between items-center mt-2">
              <Text className="text-white text-2xl font-rubik-bold">
                ${item.price || "0"}
                <Text className="text-white/70 text-sm font-rubik">/month</Text>
              </Text>
            </View>
          </View>
        </View>

        {/* DETAILS SECTION */}
        <View className="p-4">
          {/* Property Specs */}
          <View
            className="flex-row justify-between mb-4 pb-3 border-b"
            style={{ borderBottomColor: theme.muted + "20" }}
          >
            <View className="flex-row items-center">
              <Ionicons name="bed-outline" size={18} color={theme.muted} />
              <Text
                className="text-sm ml-2 font-rubik"
                style={{ color: theme.text }}
              >
                {item.bedrooms || 0} {item.bedrooms === 1 ? "Bed" : "Beds"}
              </Text>
            </View>

            <View className="flex-row items-center">
              <Ionicons name="water-outline" size={18} color={theme.muted} />
              <Text
                className="text-sm ml-2 font-rubik"
                style={{ color: theme.text }}
              >
                {item.bathrooms || 0} {item.bathrooms === 1 ? "Bath" : "Baths"}
              </Text>
            </View>

            {item.area && (
              <View className="flex-row items-center">
                <Ionicons name="resize-outline" size={18} color={theme.muted} />
                <Text
                  className="text-sm ml-2 font-rubik"
                  style={{ color: theme.text }}
                >
                  {item.area} m²
                </Text>
              </View>
            )}
          </View>

          {/* CREATOR/LANDLORD INFO */}
          <View>
            <Text
              className="text-xs font-rubik-medium mb-2 uppercase tracking-wide"
              style={{ color: theme.muted }}
            >
              Listed by
            </Text>

            <View
              className="flex-row items-center rounded-xl p-3"
              style={{
                backgroundColor: theme.surface,
                borderWidth: 1,
                borderColor: theme.muted + "20",
              }}
            >
              {/* Avatar */}
              <View
                className="w-12 h-12 rounded-full overflow-hidden mr-3 items-center justify-center"
                style={{ backgroundColor: theme.primary[100] }}
              >
                {creator.avatar ? (
                  <Image
                    source={
                      creator.avatar.startsWith("http")
                        ? { uri: creator.avatar }
                        : getAvatarSource(creator.avatar)
                    }
                    className="w-full h-full"
                  />
                ) : (
                  <Ionicons
                    name="person"
                    size={24}
                    color={theme.primary[300]}
                  />
                )}
              </View>

              {/* Info */}
              <View className="flex-1">
                <Text
                  className="text-base font-rubik-bold"
                  style={{ color: theme.title }}
                >
                  {creator.name}
                </Text>

                {/* Email */}
                {creator.email !== "Not available" && (
                  <View className="flex-row items-center mt-1">
                    <Ionicons
                      name="mail-outline"
                      size={14}
                      color={theme.muted}
                    />
                    <Text
                      className="text-xs ml-1.5 font-rubik"
                      style={{ color: theme.muted }}
                      numberOfLines={1}
                    >
                      {creator.email}
                    </Text>
                  </View>
                )}

                {/* Phone */}
                {creator.phone !== "Not available" && (
                  <View className="flex-row items-center mt-1">
                    <Ionicons
                      name="call-outline"
                      size={14}
                      color={theme.muted}
                    />
                    <Text
                      className="text-xs ml-1.5 font-rubik"
                      style={{ color: theme.muted }}
                    >
                      {creator.phone}
                    </Text>
                  </View>
                )}
              </View>

              {/* Contact Button (optional) */}
              <TouchableOpacity
                className="px-3 py-1.5 rounded-full"
                style={{ backgroundColor: theme.primary[100] }}
              >
                <Text
                  className="text-xs font-rubik-medium"
                  style={{ color: theme.primary[300] }}
                >
                  Contact
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Facilities Tags */}
          {item.facilities && (
            <View className="flex-row flex-wrap gap-2 mt-4">
              {typeof item.facilities === "string" &&
                item.facilities
                  .split(",")
                  .slice(0, 3)
                  .map((facility: string, idx: number) => (
                    <View
                      key={idx}
                      className="px-3 py-1 rounded-full"
                      style={{ backgroundColor: theme.primary[100] }}
                    >
                      <Text
                        className="text-xs font-rubik-medium"
                        style={{ color: theme.primary[300] }}
                      >
                        {facility.trim()}
                      </Text>
                    </View>
                  ))}
              {typeof item.facilities === "string" &&
                item.facilities.split(",").length > 3 && (
                  <View
                    className="px-3 py-1 rounded-full"
                    style={{ backgroundColor: theme.muted + "20" }}
                  >
                    <Text className="text-xs" style={{ color: theme.muted }}>
                      +{item.facilities.split(",").length - 3} more
                    </Text>
                  </View>
                )}
            </View>
          )}
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View
        className="flex-1 items-center justify-center"
        style={{ backgroundColor: theme.background }}
      >
        <ActivityIndicator size="large" color={theme.primary[300]} />
      </View>
    );
  }

  return (
    <SafeAreaView
      className="flex-1"
      style={{ backgroundColor: theme.background }}
    >
      {/* HEADER */}
      <View
        className="px-5 pt-4 pb-5 border-b"
        style={{
          borderBottomColor: theme.muted + "20",
          backgroundColor: theme.navBackground,
        }}
      >
        <View className="flex-row items-center">
          <TouchableOpacity
            onPress={() => router.back()}
            className="mr-4 p-2 -ml-2"
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={28} color={theme.title} />
          </TouchableOpacity>

          <View className="flex-1">
            <Text
              className="text-3xl font-rubik-bold"
              style={{ color: theme.title }}
            >
              {city}
            </Text>

            <Text
              className="text-sm font-rubik mt-1"
              style={{ color: theme.muted }}
            >
              {properties.length}{" "}
              {properties.length === 1 ? "property" : "properties"} available
            </Text>
          </View>
        </View>
      </View>

      {/* LIST */}
      <FlatList
        data={properties}
        renderItem={renderProperty}
        keyExtractor={(item, index) => item.$id?.toString() || index.toString()}
        contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View className="py-16 items-center justify-center">
            <Ionicons
              name="home-outline"
              size={64}
              color={theme.muted + "50"}
            />
            <Text
              className="text-base font-rubik mt-4 mb-2"
              style={{ color: theme.muted }}
            >
              No properties found
            </Text>
            <Text
              className="text-sm font-rubik"
              style={{ color: theme.muted + "80" }}
            >
              in {city}
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
};

export default PropertiesByLocation;
