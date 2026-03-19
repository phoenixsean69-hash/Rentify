import { Colors } from "@/constants/Colors";
import useAuthStore from "@/store/auth.store";
import { router } from "expo-router";
import React, { useEffect } from "react";

import { ActivityIndicator, Text, useColorScheme, View } from "react-native";

export default function Index() {
  const { user, isLoading, isAuthenticated, fetchAuthenticatedUser } =
    useAuthStore();

  useEffect(() => {
    fetchAuthenticatedUser();
  }, [fetchAuthenticatedUser]);

  useEffect(() => {
    if (!isLoading) {
      if (isAuthenticated && user?.userMode === "tenant") {
        router.replace("/tenantHome");
      } else if (isAuthenticated && user?.userMode === "landlord") {
        router.replace("/landHome");
      } else if (!isAuthenticated) {
        router.replace("/sign-up");
      }
    }
  }, [isLoading, isAuthenticated, user]);
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? "light"];
  return (
    <View
      className="flex-1 items-center justify-center"
      style={{ backgroundColor: theme.navBackground }}
    >
      <ActivityIndicator size="large" color="#2196F3" />
      <Text
        className="mt-4 text-lg font-rubik-medium text-black-300"
        style={{ color: theme.title }}
      >
        {isLoading ? "Please Wait" : "Loading..."}
      </Text>
    </View>
  );
}
