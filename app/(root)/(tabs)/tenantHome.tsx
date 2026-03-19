// app/screens/Home.tsx
import FeaturedModal from "@/components/FeaturedModal";
import { useFocusEffect } from "@react-navigation/native";
import { router, useLocalSearchParams } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";

import { Card, FeaturedCard } from "@/components/Cards";
import Filters from "@/components/Filters";
import NoResults from "@/components/NoResults";
import Search from "@/components/Search";
import icons from "@/constants/icons";
import {
  ActivityIndicator,
  FlatList,
  Image,
  Text,
  TouchableOpacity,
  View,
  useColorScheme,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Colors } from "../../../constants/Colors";

import { getAvailableProperties, getLatestProperties } from "@/lib/appwrite"; // ✅ Updated import
import { useAppwrite } from "@/lib/useAppwrite";
import useAuthStore from "@/store/auth.store";
import { getSavedAvatar } from "@/utils/avatarStorage";

const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return "Good Morning";
  if (hour < 18) return "Good Afternoon";
  return "Good Evening";
};

const Home = () => {
  const { user } = useAuthStore();
  const [avatarId, setAvatarId] = useState<string | null>(null);
  const [loadingAvatar, setLoadingAvatar] = useState(true);
  const [featuredModalVisible, setFeaturedModalVisible] = useState(false);
  const [greeting, setGreeting] = useState(getGreeting());

  const params = useLocalSearchParams<{ query?: string; filter?: string }>();
  const [searchActive, setSearchActive] = useState(false);
  const [isSearching, setIsSearching] = useState(false);

  // Update greeting every minute
  useEffect(() => {
    const interval = setInterval(() => setGreeting(getGreeting()), 60_000);
    return () => clearInterval(interval);
  }, []);

  // Load avatar when screen focused
  useFocusEffect(
    useCallback(() => {
      let isActive = true;

      const loadAvatar = async () => {
        const saved = await getSavedAvatar();
        if (isActive) {
          setAvatarId(saved || "human-1");
          setLoadingAvatar(false);
        }
      };

      loadAvatar();

      return () => {
        isActive = false;
      };
    }, []),
  );

  // Get latest properties (also filter by availability)
  const { data: latestProperties, loading: latestPropertiesLoading } =
    useAppwrite({
      fn: async () => {
        const allLatest = await getLatestProperties();
        // Filter to only show available ones
        return allLatest.filter((p) => p.isAvailable === true);
      },
    });

  // ✅ Use getAvailableProperties instead of getProperties
  const {
    data: properties,
    refetch,
    loading,
  } = useAppwrite({
    fn: getAvailableProperties, // ✅ Updated function
    params: { filter: params.filter!, query: params.query!, limit: 6 },
    skip: true,
  });

  // Handle search query changes
  useEffect(() => {
    const fetchData = async () => {
      const hasSearchQuery = !!(params.query && params.query.trim() !== "");
      setSearchActive(hasSearchQuery);

      if (hasSearchQuery) setIsSearching(true);

      await refetch({
        filter: params.filter!,
        query: params.query!,
        limit: 6,
      });

      setIsSearching(false);
    };
    fetchData();
  }, [params.filter, params.query]);

  const handleCardPress = (id: string) => router.push(`/properties/${id}`);

  // Show featured section only if there are available properties
  const showFeatured =
    !searchActive && latestProperties && latestProperties.length > 0;
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? "light"];
  return (
    <SafeAreaView style={{ backgroundColor: theme.navBackground }}>
      <FlatList
        data={properties}
        numColumns={2}
        renderItem={({ item }) => (
          <Card item={item} onPress={() => handleCardPress(item.$id)} />
        )}
        keyExtractor={(item) => item.$id}
        contentContainerClassName="pb-32"
        columnWrapperClassName="flex gap-5 px-5"
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          loading && !isSearching ? (
            <ActivityIndicator size="large" className="text-primary-300 mt-5" />
          ) : !loading &&
            !isSearching &&
            (!properties || properties.length === 0) ? (
            <NoResults />
          ) : null
        }
        ListHeaderComponent={() => (
          <View className="px-5">
            {/* Top Header */}
            {!searchActive && (
              <View className="flex flex-row items-center justify-between mt-5">
                <View className="flex flex-row">
                  {!loadingAvatar ? (
                    <Image
                      source={
                        user?.avatar ? { uri: user.avatar } : icons.person
                      }
                      className="size-12 rounded-full"
                    />
                  ) : (
                    <ActivityIndicator
                      size="small"
                      className="text-primary-300"
                    />
                  )}
                  <View className="flex flex-col items-start ml-2 justify-center">
                    <Text
                      className="text-xs font-rubik text-black-100"
                      style={{ color: theme.title }}
                    >
                      {greeting}
                    </Text>
                    <Text
                      className="text-base font-rubik-medium text-black-300"
                      style={{ color: theme.title }}
                    >
                      {user?.name}
                    </Text>
                  </View>
                </View>
                <TouchableOpacity
                  className="flex flex-row items-center py-4"
                  onPress={() => router.push("/notifications")}
                >
                  <Image source={icons.bell} className="size-6" />
                </TouchableOpacity>
              </View>
            )}

            {/* Search Component */}
            <Search />

            {/* Featured Section - Only shows available properties */}
            {showFeatured && (
              <View className="my-5">
                <View className="flex flex-row items-center justify-between">
                  <Text
                    className="text-xl font-rubik-bold text-black-300"
                    style={{ color: theme.title }}
                  >
                    Featured
                  </Text>
                  {!searchActive && (
                    <TouchableOpacity
                      onPress={() => setFeaturedModalVisible(true)}
                    >
                      <Text className="text-base font-rubik-bold text-primary-300">
                        See all
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>

                {latestPropertiesLoading ? (
                  <ActivityIndicator
                    size="large"
                    className="text-primary-300"
                  />
                ) : (
                  <FlatList
                    data={latestProperties}
                    renderItem={({ item }) => (
                      <FeaturedCard
                        item={item}
                        onPress={() => handleCardPress(item.$id)}
                      />
                    )}
                    keyExtractor={(item) => item.$id}
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerClassName="flex gap-5 mt-5"
                  />
                )}
              </View>
            )}

            {/* Recommendations / Search Results - Only shows available properties */}
            <View className="mt-5">
              <View className="flex flex-row items-center justify-between">
                <Text
                  className="text-xl font-rubik-bold text-black-300"
                  style={{ color: theme.title }}
                >
                  {searchActive ? "Search Results" : "Our Recommendation"}
                </Text>
                {!searchActive && <TouchableOpacity></TouchableOpacity>}
              </View>

              {!searchActive && <Filters />}

              {searchActive &&
                !isSearching &&
                !loading &&
                (!properties || properties.length === 0) && (
                  <View className="mt-5 p-4 bg-primary-100 rounded-lg">
                    <Text className="text-center text-black-200 font-rubik">
                      {`No available properties found matching "${params.query}"`}
                    </Text>
                    <Text className="text-center text-black-100 text-sm mt-2">
                      Try adjusting your search
                    </Text>
                  </View>
                )}
            </View>
          </View>
        )}
      />

      {/* Featured Properties Modal - Only shows available properties */}
      <FeaturedModal
        visible={featuredModalVisible}
        onClose={() => setFeaturedModalVisible(false)}
        properties={latestProperties || []}
        onPropertyPress={handleCardPress}
      />

      {/* Searching Overlay */}
      {isSearching && searchActive && (
        <View className="absolute inset-0 bg-white/80 backdrop-blur-sm items-center justify-center z-50">
          <ActivityIndicator size="large" className="text-primary-300" />
          <Text className="text-black-300 font-rubik-medium mt-4 text-center">
            Searching...
          </Text>
        </View>
      )}
    </SafeAreaView>
  );
};

export default Home;
