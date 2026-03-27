// app/(root)/explore.tsx
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useState } from "react";
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

import { Card } from "@/components/Cards";
import Filters from "@/components/Filters";
import NoResults from "@/components/NoResults";
import SearchModal from "@/components/SearchModal";
import icons from "@/constants/icons";

import { Colors } from "@/constants/Colors";
import { getAvailableProperties } from "@/lib/appwrite";
import { useAppwrite } from "@/lib/useAppwrite";

const Explore = () => {
  const params = useLocalSearchParams<{ filter?: string }>();
  const [searchModalVisible, setSearchModalVisible] = useState(false);
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? "light"];

  const {
    data: properties,
    refetch,
    loading,
  } = useAppwrite({
    fn: getAvailableProperties,
    params: { filter: params.filter || "", query: "", limit: 20 },
    ttl: 30000,
    skip: false,
  });

  // Refetch when filter changes (manual to ensure it's immediate)
  useEffect(() => {
    refetch({
      filter: params.filter || "",
      query: "",
      limit: 20,
    });
  }, [params.filter]);

  const handleCardPress = (id: string) => router.push(`/properties/${id}`);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.background }}>
      <FlatList
        data={properties}
        numColumns={2}
        renderItem={({ item }) => (
          <Card item={item} onPress={() => handleCardPress(item.$id)} />
        )}
        keyExtractor={(item) => item.$id}
        contentContainerStyle={{ paddingBottom: 100 }}
        columnWrapperStyle={{ gap: 20, paddingHorizontal: 20 }}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          loading ? (
            <View className="items-center justify-center py-20">
              <ActivityIndicator size="large" color={theme.primary[300]} />
              <Text className="mt-4 text-center" style={{ color: theme.muted }}>
                Loading properties...
              </Text>
            </View>
          ) : !properties || properties.length === 0 ? (
            <NoResults />
          ) : null
        }
        ListHeaderComponent={() => (
          <View className="px-5 pt-5 pb-2">
            {/* Hero Section */}
            <View className="mb-4">
              <Text
                className="text-xl text-center font-rubik-bold mt-1"
                style={{ color: theme.muted }}
              >
                Discover your next home
              </Text>
            </View>

            {/* Search Button (opens modal) */}
            <TouchableOpacity
              onPress={() => setSearchModalVisible(true)}
              className="flex-row items-center px-4 py-3 rounded-full mb-3"
              style={{
                backgroundColor: theme.surface,
                borderWidth: 1,
                borderColor: theme.muted + "40",
              }}
            >
              <Image
                source={icons.search}
                className="w-5 h-5"
                style={{ tintColor: theme.muted }}
              />
              <Text
                className="flex-1 ml-2 text-base"
                style={{ color: theme.muted }}
              >
                Search properties...
              </Text>
            </TouchableOpacity>

            {/* Filters */}
            <View className="mt-5">
              <Filters />
            </View>

            {/* Results Count */}
            <View className="flex-row justify-between items-center mt-5 mb-2">
              <Text
                className="text-xl font-rubik-bold"
                style={{ color: theme.title }}
              >
                {properties?.length || 0} Properties
              </Text>
              {loading && (
                <Text className="text-sm" style={{ color: theme.muted }}>
                  Refreshing...
                </Text>
              )}
            </View>
          </View>
        )}
      />

      <SearchModal
        visible={searchModalVisible}
        onClose={() => setSearchModalVisible(false)}
      />
    </SafeAreaView>
  );
};

export default Explore;
