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
import { PriceFilterButton } from "@/components/PriceFilterButton";
import SearchModal from "@/components/SearchModal";
import icons from "@/constants/icons";

import { Colors } from "@/constants/Colors";
import { getPropertiesWithPriceFilter, PriceRange } from "@/lib/appwrite";
import { useAppwrite } from "@/lib/useAppwrite";

const Explore = () => {
  const params = useLocalSearchParams<{ filter?: string; query?: string }>();
  const [searchModalVisible, setSearchModalVisible] = useState(false);
  const [selectedPriceRange, setSelectedPriceRange] = useState<
    PriceRange | undefined
  >();
  const [selectedCustomPrice, setSelectedCustomPrice] = useState<
    { min: number; max: number } | undefined
  >();
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? "light"];

  const {
    data: properties,
    refetch,
    loading,
  } = useAppwrite({
    fn: (params: any) => getPropertiesWithPriceFilter(params),
    params: {
      filter: params.filter || "",
      query: params.query || "",
      limit: 20,
      priceRange: selectedPriceRange as any,
      customPrice: selectedCustomPrice,
    },
    ttl: 30000,
    skip: false,
  });

  // Refetch when filter, query, or price range changes
  useEffect(() => {
    refetch({
      filter: params.filter || "",
      query: params.query || "",
      limit: 20,
      priceRange: selectedPriceRange as any,
      customPrice: selectedCustomPrice,
    });
  }, [params.filter, params.query, selectedPriceRange, selectedCustomPrice]);

  const handleCardPress = (id: string) => router.push(`/properties/${id}`);

  const handlePriceChange = (
    priceRange?: PriceRange,
    customPrice?: { min: number; max: number },
  ) => {
    setSelectedPriceRange(priceRange);
    setSelectedCustomPrice(customPrice);
  };

  // Get active filter count for badge
  const getActiveFilterCount = () => {
    let count = 0;
    if (params.filter && params.filter !== "All") count++;
    if (selectedPriceRange || selectedCustomPrice) count++;
    if (params.query) count++;
    return count;
  };

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
                Discover your next Property
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
                {params.query
                  ? `Search: "${params.query}"`
                  : "Search properties..."}
              </Text>
              {params.query && (
                <TouchableOpacity
                  onPress={() => {
                    router.setParams({ query: "" });
                  }}
                >
                  <Image
                    source={icons.close}
                    className="w-5 h-5"
                    style={{ tintColor: theme.muted }}
                  />
                </TouchableOpacity>
              )}
            </TouchableOpacity>

            {/* Filter Row - Type Filter and Price Filter */}
            <View className="flex-row items-center justify-between mb-3">
              <View className="flex-1">
                <Filters />
              </View>
              <View className="ml-2">
                <PriceFilterButton
                  onPriceChange={handlePriceChange}
                  currentPriceRange={selectedPriceRange}
                  currentCustomPrice={selectedCustomPrice}
                />
              </View>
            </View>

            {/* Active Filters Display */}
            {getActiveFilterCount() > 0 && (
              <View className="flex-row flex-wrap gap-2 mt-2 mb-3">
                {params.filter && params.filter !== "All" && (
                  <View
                    className="px-2 py-1 rounded-full"
                    style={{ backgroundColor: theme.primary[100] }}
                  ></View>
                )}
                {(selectedPriceRange || selectedCustomPrice) && (
                  <View
                    className="px-2 py-1 rounded-full flex-row items-center"
                    style={{ backgroundColor: theme.primary[100] }}
                  >
                    <Text
                      className="text-xs"
                      style={{ color: theme.primary[300] }}
                    >
                      {selectedCustomPrice
                        ? `$${selectedCustomPrice.min} - $${selectedCustomPrice.max}`
                        : selectedPriceRange?.label}
                    </Text>
                    <TouchableOpacity
                      onPress={() => handlePriceChange(undefined, undefined)}
                      className="ml-1"
                    >
                      <Image
                        source={icons.close}
                        className="w-3 h-3"
                        style={{ tintColor: theme.primary[300] }}
                      />
                    </TouchableOpacity>
                  </View>
                )}
                {params.query && (
                  <View
                    className="px-2 py-1 rounded-full flex-row items-center"
                    style={{ backgroundColor: theme.primary[100] }}
                  >
                    <Text
                      className="text-xs"
                      style={{ color: theme.primary[300] }}
                    >
                      {params.query}
                    </Text>
                    <TouchableOpacity
                      onPress={() => router.setParams({ query: "" })}
                      className="ml-1"
                    >
                      <Image
                        source={icons.close}
                        className="w-3 h-3"
                        style={{ tintColor: theme.primary[300] }}
                      />
                    </TouchableOpacity>
                  </View>
                )}
                <TouchableOpacity
                  onPress={() => {
                    router.setParams({ filter: "", query: "" });
                    handlePriceChange(undefined, undefined);
                  }}
                >
                  <Text
                    className="text-xs"
                    style={{ color: theme.primary[300] }}
                  >
                    Clear all
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Results Count */}
            <View className="flex-row justify-between items-center mt-2 mb-2">
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
