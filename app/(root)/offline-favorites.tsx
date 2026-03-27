// app/(root)/my-favorites.tsx
import { Colors } from "@/constants/Colors";
import icons from "@/constants/icons";
import { getFavorites } from "@/lib/localFavorites";
import useAuthStore from "@/store/auth.store";
import NetInfo from "@react-native-community/netinfo";
import { router, useFocusEffect } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  RefreshControl,
  Text,
  TouchableOpacity,
  useColorScheme,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function MyFavorites() {
  const { user } = useAuthStore();
  const [favorites, setFavorites] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isConnected, setIsConnected] = useState(true);
  const [offlineMode, setOfflineMode] = useState(false);

  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? "light"];
  const isTenant = user?.userMode === "tenant";

  // Check network connectivity and redirect when back online
  useEffect(() => {
    let redirectTimeout: ReturnType<typeof setTimeout>;

    const unsubscribe = NetInfo.addEventListener((state) => {
      const connected = state.isConnected ?? true;
      const wasOffline = !isConnected && connected;

      setIsConnected(connected);
      setOfflineMode(!connected);

      // If we were offline and now back online, redirect to tenant home
      if (wasOffline && connected && isTenant) {
        console.log("🔄 Connection restored! Redirecting to tenant home...");
        // Small delay to show the connection restored message
        redirectTimeout = setTimeout(() => {
          router.replace("/tenantHome");
        }, 1500);
      }
    });

    return () => {
      unsubscribe();
      if (redirectTimeout) clearTimeout(redirectTimeout);
    };
  }, [isConnected, isTenant]);

  const loadFavorites = async () => {
    try {
      setLoading(true);
      const storedFavorites = await getFavorites();
      setFavorites(storedFavorites);
    } catch (error) {
      console.error("Error loading favorites:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadFavorites();
    }, []),
  );

  const onRefresh = () => {
    setRefreshing(true);
    loadFavorites();
  };

  const handlePropertyPress = (id: string) => {
    router.push(`/properties/${id}`);
  };

  // Redirect if not a tenant
  if (!isTenant) {
    return (
      <SafeAreaView
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: theme.background,
        }}
      >
        <Image
          source={icons.lock}
          className="w-20 h-20 opacity-30 mb-4"
          style={{ tintColor: theme.muted }}
        />
        <Text
          className="text-lg font-rubik-medium text-center"
          style={{ color: theme.text }}
        >
          Favorites are for tenants
        </Text>
        <Text
          className="text-sm text-center mt-2 px-8"
          style={{ color: theme.muted }}
        >
          Only tenants can save and view favorite properties.
        </Text>
        <TouchableOpacity
          onPress={() => router.back()}
          className="mt-6 px-6 py-3 rounded-full bg-primary-300"
        >
          <Text className="text-white font-rubik-bold">Go Back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  if (loading) {
    return (
      <SafeAreaView
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: theme.background,
        }}
      >
        <ActivityIndicator size="large" color={theme.primary[300]} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.background }}>
      {/* Header */}
      <View
        className="flex-row items-center px-5 py-4 border-b"
        style={{ borderBottomColor: theme.muted + "30" }}
      >
        <TouchableOpacity onPress={() => router.back()} className="mr-4 p-2">
          <Image
            source={icons.backArrow}
            className="w-6 h-6"
            style={{ tintColor: theme.text }}
          />
        </TouchableOpacity>
        <Text
          className="text-2xl font-rubik-bold flex-1"
          style={{ color: theme.title }}
        >
          My Favorites
        </Text>

        {/* Offline Indicator */}
        {offlineMode && isTenant && (
          <View className="bg-orange-500 px-3 py-1 rounded-full">
            <Text className="text-white text-xs font-rubik-medium">
              Offline Mode
            </Text>
          </View>
        )}
      </View>

      {/* Connection Restored Banner - shows when coming back online */}
      {!offlineMode && !isConnected && (
        <View className="bg-green-100 mx-4 mt-4 p-3 rounded-xl">
          <Text className="text-green-800 text-sm text-center">
            ✅ Connection restored! Redirecting to home...
          </Text>
        </View>
      )}

      {/* Offline Banner */}
      {offlineMode && isTenant && (
        <View className="bg-orange-100 mx-4 mt-4 p-3 rounded-xl">
          <Text className="text-orange-800 text-sm text-center">
            📱 You're offline. Viewing saved favorites from local storage.
          </Text>
        </View>
      )}

      {favorites.length === 0 ? (
        <View className="flex-1 items-center justify-center px-5">
          <Image
            source={icons.heart}
            className="w-20 h-20 opacity-30 mb-4"
            style={{ tintColor: theme.muted }}
          />
          <Text
            className="text-lg font-rubik-medium text-center"
            style={{ color: theme.text }}
          >
            No favorites yet
          </Text>
          <Text
            className="text-sm text-center mt-2"
            style={{ color: theme.muted }}
          >
            {offlineMode
              ? "You need to be online to add favorites"
              : "Tap the heart icon on properties you love to save them here"}
          </Text>
          {offlineMode && (
            <TouchableOpacity
              onPress={() => router.back()}
              className="mt-4 px-4 py-2 rounded-full bg-primary-300"
            >
              <Text className="text-white">Go Back</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <FlatList
          data={favorites}
          keyExtractor={(item) => item.$id}
          contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[theme.primary[300]]}
              tintColor={theme.primary[300]}
            />
          }
          renderItem={({ item }) => (
            <View
              className="mb-4 rounded-xl overflow-hidden"
              style={{
                backgroundColor: theme.surface,
                borderWidth: 1,
                borderColor: theme.muted + "30",
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.05,
                shadowRadius: 3,
                elevation: 2,
              }}
            >
              <TouchableOpacity onPress={() => handlePropertyPress(item.$id)}>
                <Image
                  source={{ uri: item.image1 }}
                  className="w-full h-48"
                  resizeMode="cover"
                />
                <View className="p-4">
                  <Text
                    className="text-lg font-rubik-bold mb-1"
                    style={{ color: theme.title }}
                  >
                    {item.propertyName}
                  </Text>
                  <View className="flex-row items-center mb-2">
                    <View className="flex-row items-center px-3 py-1 bg-primary-100 rounded-full">
                      <Text className="text-xs font-rubik-medium text-primary-300">
                        {item.type || "Property"}
                      </Text>
                    </View>
                    {item.rating && item.rating > 0 && (
                      <View className="flex-row items-center ml-2">
                        <Image source={icons.star} className="w-3 h-3 mr-1" />
                        <Text
                          className="text-xs"
                          style={{ color: theme.muted }}
                        >
                          {item.rating}
                        </Text>
                      </View>
                    )}
                  </View>
                  <View className="flex-row items-center mb-2">
                    <Image
                      source={icons.location}
                      className="w-4 h-4 mr-1"
                      style={{ tintColor: theme.muted }}
                    />
                    <Text
                      className="text-sm flex-1"
                      style={{ color: theme.muted }}
                      numberOfLines={1}
                    >
                      {item.address}
                    </Text>
                  </View>
                  <Text
                    className="text-xl font-rubik-bold mt-2"
                    style={{ color: theme.primary[300] }}
                  >
                    ${item.price}
                    <Text style={{ color: theme.muted, fontSize: 12 }}>
                      /month
                    </Text>
                  </Text>

                  {/* Offline notice */}
                  {offlineMode && (
                    <View className="mt-3 p-2 bg-yellow-50 rounded-lg">
                      <Text className="text-xs text-yellow-700 text-center">
                        Viewing from offline cache. Some details may be
                        outdated.
                      </Text>
                    </View>
                  )}
                </View>
              </TouchableOpacity>
            </View>
          )}
        />
      )}
    </SafeAreaView>
  );
}
