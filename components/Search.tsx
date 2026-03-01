import React, { useEffect, useState } from "react";
import { Image, Text, TextInput, TouchableOpacity, View } from "react-native";

import icons from "@/constants/icons";
import { router, useLocalSearchParams } from "expo-router";

const Search = () => {
  const params = useLocalSearchParams<{ query?: string }>();
  const [search, setSearch] = useState(params.query || "");
  const [tempSearch, setTempSearch] = useState(params.query || "");

  // Check if we're in search mode (has query)
  const isSearching = !!(params.query && params.query.trim() !== "");

  // Update search when params change (e.g., when clearing from outside)
  useEffect(() => {
    setSearch(params.query || "");
    setTempSearch(params.query || "");
  }, [params.query]);

  // Handle Enter key press
  const handleSubmitEditing = () => {
    if (tempSearch.trim()) {
      router.setParams({ query: tempSearch.trim() });
    } else {
      router.setParams({ query: "" });
    }
  };

  const handleSearchChange = (text: string) => {
    setTempSearch(text); // Only update temp state, don't trigger search
  };

  const handleClearSearch = () => {
    setTempSearch("");
    setSearch("");
    router.setParams({ query: "" });
  };

  const handleExitSearch = () => {
    setTempSearch("");
    setSearch("");
    router.setParams({ query: "" });
    router.push("/");
  };

  return (
    <View>
      {/* Main Search Input */}
      <View className="flex flex-row items-center justify-between w-full px-4 rounded-lg bg-accent-100 border border-primary-100 mt-5 py-2">
        <View className="flex-1 flex flex-row items-center justify-start z-50">
          <Image source={icons.search} className="size-5" tintColor="#858585" />
          <TextInput
            value={tempSearch}
            onChangeText={handleSearchChange}
            onSubmitEditing={handleSubmitEditing}
            returnKeyType="search"
            placeholder="Search by name, location, or facilities..."
            placeholderTextColor="#9CA3AF"
            className="text-sm font-rubik text-black-300 ml-2 flex-1 py-2"
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>

        {/* Exit Search Button */}
        {isSearching && (
          <TouchableOpacity
            onPress={handleExitSearch}
            className="ml-2 bg-primary-300 px-4 py-2 rounded-lg"
          >
            <Text className="text-white font-rubik-medium text-sm">Exit</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

export default Search;
