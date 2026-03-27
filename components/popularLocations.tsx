// components/PopularLocations.tsx
import { Colors } from "@/constants/Colors";
import icons from "@/constants/icons";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Text,
  TouchableOpacity,
  useColorScheme,
  View,
} from "react-native";
import locationService, { PopularLocation } from "../services/location.service";

interface PopularLocationsProps {
  limit?: number;
}

// Simple cache for popular locations
let cachedLocations: PopularLocation[] | null = null;
let lastFetchTime = 0;
const CACHE_TTL = 300000; // 5 minutes for locations (they don't change often)

const PopularLocations = ({ limit = 4 }: PopularLocationsProps) => {
  const router = useRouter();
  const [locations, setLocations] = useState<PopularLocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const isMounted = useRef(true);

  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? "light"];

  const loadPopularLocations = useCallback(async () => {
    try {
      // Check cache first
      const now = Date.now();
      if (cachedLocations && now - lastFetchTime < CACHE_TTL) {
        console.log("📦 Using cached popular locations");
        if (isMounted.current) {
          setLocations(cachedLocations);
          setLoading(false);
        }
        return;
      }

      console.log("🌐 Fetching fresh popular locations");
      setLoading(true);
      setError(null);

      const data = await locationService.getPopularLocations(limit);

      if (isMounted.current) {
        setLocations(data);
        // Update cache
        cachedLocations = data;
        lastFetchTime = Date.now();
      }
    } catch (err) {
      console.error("Failed to load locations:", err);
      // Use cached data if available
      if (cachedLocations && isMounted.current) {
        setLocations(cachedLocations);
      } else if (isMounted.current) {
        setError("Could not load locations");
      }
    } finally {
      if (isMounted.current) {
        setLoading(false);
      }
    }
  }, [limit]);

  useEffect(() => {
    loadPopularLocations();

    return () => {
      isMounted.current = false;
    };
  }, [loadPopularLocations]);

  const handleLocationPress = (location: PopularLocation) => {
    router.push({
      pathname: "/properties-by-location" as any,
      params: { city: location.name },
    });
  };

  const handleViewAll = () => {
    router.push("/all-locations" as any);
  };

  if (loading) {
    return (
      <View className="py-8 items-center justify-center">
        <ActivityIndicator size="large" color={theme.title} />
        <Text className="text-gray-500 mt-2">Loading popular locations...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View className="py-8 items-center justify-center">
        <Text className="text-red-500 mb-2">{error}</Text>
        <TouchableOpacity onPress={loadPopularLocations}>
          <Text className="text-blue-600 font-rubik-medium">Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (locations.length === 0) {
    return null;
  }

  return (
    <View className="py-4">
      <View className="flex-row items-center justify-between mb-4 px-4">
        <Text
          className="text-2xl font-rubik-bold"
          style={{ color: theme.text }}
        >
          Popular Locations 📍
        </Text>

        <TouchableOpacity onPress={handleViewAll}>
          <Text className="text-blue-600 font-rubik-medium">View All</Text>
        </TouchableOpacity>
      </View>

      {/* Locations Grid */}
      <View className="flex-row flex-wrap justify-between px-4">
        {locations.map((location) => (
          <TouchableOpacity
            key={location.id}
            onPress={() => handleLocationPress(location)}
            className="w-[48%] mb-4 rounded-xl overflow-hidden"
            style={{
              backgroundColor: location.color + "10",
              borderWidth: 1,
              borderColor: location.color + "30",
            }}
          >
            <View className="p-4">
              <View
                className="w-10 h-10 rounded-full items-center justify-center mb-2"
                style={{ backgroundColor: location.color + "20" }}
              >
                <Image
                  source={icons.location}
                  className="w-5 h-5"
                  style={{ tintColor: location.color }}
                />
              </View>

              <Text
                className="text-lg font-rubik-bold"
                style={{ color: theme.text }}
              >
                {location.name}
              </Text>

              <Text className="text-sm text-gray-500 font-rubik">
                {location.propertyCount}{" "}
                {location.propertyCount === 1 ? "property" : "properties"}
              </Text>

              {/* Show sample properties (optional) */}
              {location.properties.length > 0 && (
                <View className="mt-2">
                  <Text className="text-xs text-gray-400">
                    {location.properties
                      .map((p) => p.name)
                      .slice(0, 2)
                      .join(" ")}
                    {location.properties.length > 2 && "..."}
                  </Text>
                </View>
              )}
            </View>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

export default PopularLocations;
