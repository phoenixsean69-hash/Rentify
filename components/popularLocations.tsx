// components/PopularLocations.tsx
import { Colors } from "@/constants/Colors";
import icons from "@/constants/icons";
import { useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
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

// Module-level cache (persists across component instances)
let cachedLocations: PopularLocation[] | null = null;
let lastFetchTime = 0;
let isFetching = false; // Module-level fetch lock
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

const PopularLocations = ({ limit = 4 }: PopularLocationsProps) => {
  const router = useRouter();
  const [locations, setLocations] = useState<PopularLocation[]>(
    cachedLocations || [],
  );
  const [loading, setLoading] = useState(!cachedLocations);
  const [error, setError] = useState<string | null>(null);
  const isMounted = useRef(true);

  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? "light"];

  useEffect(() => {
    // Set initial locations from cache immediately
    if (cachedLocations) {
      setLocations(cachedLocations);
      setLoading(false);
    }

    // Only fetch if cache is expired or doesn't exist
    const now = Date.now();
    const cacheExpired = !cachedLocations || now - lastFetchTime >= CACHE_TTL;

    if (cacheExpired && !isFetching) {
      loadPopularLocations();
    }

    return () => {
      isMounted.current = false;
    };
  }, []); // Empty dependency array - runs once

  const loadPopularLocations = async () => {
    // Prevent multiple simultaneous fetches
    if (isFetching) return;

    isFetching = true;

    // Double-check cache again (in case it was populated while waiting)
    const now = Date.now();
    if (cachedLocations && now - lastFetchTime < CACHE_TTL) {
      console.log("📦 Cache populated during wait, using cached data");
      if (isMounted.current) {
        setLocations(cachedLocations);
        setLoading(false);
      }
      isFetching = false;
      return;
    }

    console.log("🌐 Fetching fresh popular locations (once only)");

    try {
      if (isMounted.current) {
        setLoading(true);
        setError(null);
      }

      const data = await locationService.getPopularLocations(limit);

      if (isMounted.current) {
        setLocations(data);
        // Update module-level cache
        cachedLocations = data;
        lastFetchTime = Date.now();
      }
    } catch (err) {
      console.error("Failed to load locations:", err);
      if (isMounted.current && !cachedLocations) {
        setError("Could not load locations");
      } else if (isMounted.current && cachedLocations) {
        // Use cached data if available
        setLocations(cachedLocations);
      }
    } finally {
      if (isMounted.current) {
        setLoading(false);
      }
      isFetching = false;
    }
  };

  const handleLocationPress = (location: PopularLocation) => {
    router.push({
      pathname: "/properties-by-location" as any,
      params: { city: location.name },
    });
  };

  const handleViewAll = () => {
    router.push("/all-locations" as any);
  };

  // Manual retry
  const handleRetry = () => {
    // Reset cache to force fresh fetch
    cachedLocations = null;
    lastFetchTime = 0;
    loadPopularLocations();
  };

  if (loading && !cachedLocations) {
    return (
      <View className="py-8 items-center justify-center">
        <ActivityIndicator size="large" color={theme.primary[300]} />
        <Text className="text-gray-500 mt-2" style={{ color: theme.muted }}>
          Loading popular locations...
        </Text>
      </View>
    );
  }

  if (error && !cachedLocations) {
    return (
      <View className="py-8 items-center justify-center">
        <Text className="text-red-500 mb-2" style={{ color: theme.danger }}>
          {error}
        </Text>
        <TouchableOpacity onPress={handleRetry}>
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
          Popular Locations
        </Text>

        <TouchableOpacity onPress={handleViewAll}>
          <Text
            className="font-rubik-medium"
            style={{ color: theme.primary[300] }}
          >
            View All
          </Text>
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

              <Text className="text-sm" style={{ color: theme.muted }}>
                {location.propertyCount}{" "}
                {location.propertyCount === 1 ? "property" : "properties"}
              </Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

export default PopularLocations;
