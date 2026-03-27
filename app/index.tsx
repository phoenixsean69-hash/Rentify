// app/index.tsx
import { Colors } from "@/constants/Colors";
import images from "@/constants/images";
import useAuthStore from "@/store/auth.store";
import NetInfo from "@react-native-community/netinfo";
import { router } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  Image,
  ScrollView,
  Text,
  TouchableOpacity,
  useColorScheme,
  View,
} from "react-native";

const { width, height } = Dimensions.get("window");

// Background images for the carousel
const backgroundImages = [
  require("@/assets/images/happyStudents.jpg"),
  require("@/assets/images/foundHome.jpg"),
  require("@/assets/images/manageProperty.jpg"),
  require("@/assets/images/meetingAgent.jpg"),
  require("@/assets/images/morning.jpg"),
  require("@/assets/images/sunset.jpg"),
];

export default function Index() {
  const { user, isLoading, isAuthenticated, fetchAuthenticatedUser } =
    useAuthStore();
  const [isConnected, setIsConnected] = useState<boolean | null>(null);
  const [offlineMessageShown, setOfflineMessageShown] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const fadeAnim = useRef(new Animated.Value(1)).current;

  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? "light"];
  const isTenant = user?.userMode === "tenant";

  // Auto-swipe background images every 5 seconds
  useEffect(() => {
    if (!offlineMessageShown) return;

    const interval = setInterval(() => {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }).start(() => {
        setCurrentImageIndex((prev) => (prev + 1) % backgroundImages.length);
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }).start();
      });
    }, 5000);

    return () => clearInterval(interval);
  }, [offlineMessageShown, fadeAnim]);

  // Load user from server
  useEffect(() => {
    fetchAuthenticatedUser();
  }, [fetchAuthenticatedUser]);

  // Check network connectivity and re-authenticate when coming back online
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      const connected = state.isConnected ?? true;
      setIsConnected(connected);

      if (!isConnected && connected) {
        console.log("🔄 Back online, re-authenticating...");
        fetchAuthenticatedUser();
        setOfflineMessageShown(false);
      }
    });
    return unsubscribe;
  }, [isConnected, fetchAuthenticatedUser]);

  // After loading and connectivity known, decide what to show
  useEffect(() => {
    if (isLoading || isConnected === null) return;

    if (!isConnected) {
      setOfflineMessageShown(true);
      return;
    }

    if (isAuthenticated && user?.userMode === "tenant") {
      router.replace("/tenantHome");
    } else if (isAuthenticated && user?.userMode === "landlord") {
      router.replace("/landHome");
    } else if (!isAuthenticated) {
      router.replace("/sign-up");
    }
  }, [isLoading, isConnected, isAuthenticated, user]);

  const handleRetry = () => {
    NetInfo.fetch().then((state) => {
      if (state.isConnected) {
        setOfflineMessageShown(false);
        fetchAuthenticatedUser();
      }
    });
  };

  // Offline screen with auto-swiping background
  if (offlineMessageShown) {
    // If user is authenticated and is a tenant, redirect to offline favorites
    if (isAuthenticated && isTenant) {
      router.replace("/offline-favorites" as any);
      return null;
    }

    // Otherwise show the offline welcome screen
    return (
      <View style={{ flex: 1, backgroundColor: theme.navBackground }}>
        {/* Animated Background Image */}
        <Animated.Image
          source={backgroundImages[currentImageIndex]}
          style={{
            position: "absolute",
            width: width,
            height: height,
            opacity: fadeAnim,
          }}
          resizeMode="cover"
        />

        {/* Dark Overlay */}
        <View
          style={{
            position: "absolute",
            width: width,
            height: height,
            backgroundColor: "rgba(0,0,0,0.6)",
          }}
        />

        <ScrollView
          contentContainerStyle={{ flexGrow: 1 }}
          showsVerticalScrollIndicator={false}
        >
          <View className="flex-1 items-center justify-center px-6 py-12 min-h-screen">
            {/* Logo/Icon */}
            <View className="w-24 h-24 rounded-full bg-white/20 backdrop-blur-lg items-center justify-center mb-6">
              <Image
                source={images.icon}
                className="w-12 h-12"
                style={{ tintColor: "#FFFFFF" }}
              />
            </View>

            {/* Main Title */}
            <Text
              className="text-3xl font-rubik-bold text-center mb-2 text-white"
              style={{ color: "#FFFFFF" }}
            >
              Welcome to Nookly
            </Text>

            {/* Subtitle */}
            <Text
              className="text-base text-center mb-8 text-white/90"
              style={{ color: "rgba(255,255,255,0.9)" }}
            >
              Your cozy corner in the world of renting
            </Text>

            {/* Story Section */}
            <View className="mb-8">
              <Text
                className="text-xl font-rubik-bold text-center mb-3 text-white"
                style={{ color: "#FFFFFF" }}
              >
                Our Story
              </Text>
              <Text
                className="text-sm text-center leading-6 text-white/90"
                style={{ color: "rgba(255,255,255,0.9)" }}
              >
                Nookly was born from a simple idea: finding a home
                shouldn&apos;t feel like a job. We believe everyone deserves a
                cozy nook to call their own.
              </Text>
            </View>

            {/* Mission Section */}
            <View className="mb-8">
              <Text
                className="text-xl font-rubik-bold text-center mb-3 text-white"
                style={{ color: "#FFFFFF" }}
              >
                Our Mission
              </Text>
              <Text
                className="text-sm text-center leading-6 text-white/90"
                style={{ color: "rgba(255,255,255,0.9)" }}
              >
                To connect tenants with their perfect space and empower
                landlords with tools that make property management effortless.
              </Text>
            </View>

            {/* Offline Message */}
            <View className="bg-white/20 backdrop-blur-lg rounded-2xl p-4 mb-8 w-full">
              <Text className="text-center text-sm text-white">
                You&apos;re currently offline
              </Text>
              <Text className="text-center text-xs mt-1 text-white/80">
                Connect to the internet to explore Nookly
              </Text>
            </View>

            {/* Retry Button */}
            <TouchableOpacity
              onPress={handleRetry}
              className="bg-primary-300 px-8 py-3 rounded-full"
            >
              <Text className="text-white font-rubik-bold">Retry</Text>
            </TouchableOpacity>

            {/* App Version */}
            <Text
              className="text-center text-xs mt-8 text-white/60"
              style={{ color: "rgba(255,255,255,0.6)" }}
            >
              Nookly v1.0.0 • Find Your Cozy Corner
            </Text>
          </View>
        </ScrollView>
      </View>
    );
  }

  // Default loading screen
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
        {isLoading ? "Please Wait" : "Loading Nookly..."}
      </Text>
    </View>
  );
}
