// components/HotDeals.tsx
import { Colors } from "@/constants/Colors";
import icons from "@/constants/icons";
import { config, databases } from "@/lib/appwrite";
import { router } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Text,
  TouchableOpacity,
  useColorScheme,
  View,
} from "react-native";
import { Query } from "react-native-appwrite";

interface HotDeal {
  title: string;
  description: string;
  icon: any;
  color: string;
  bgColor: string;
  count: number;
  type: string;
  route?: string;
  filter?: string;
  sort?: string;
}

// Module-level cache (persists across component instances)
let cachedDeals: HotDeal[] | null = null;
let lastFetchTime = 0;
let isFetching = false; // Module-level fetch lock
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

const HotDeals = () => {
  const [deals, setDeals] = useState<HotDeal[]>(cachedDeals || []);
  const [loading, setLoading] = useState(!cachedDeals);
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? "light"];
  const isDark = colorScheme === "dark";
  const isMounted = useRef(true);

  useEffect(() => {
    // Set initial deals from cache immediately
    if (cachedDeals) {
      setDeals(cachedDeals);
      setLoading(false);
    }

    // Only fetch if cache is expired or doesn't exist
    const now = Date.now();
    const cacheExpired = !cachedDeals || now - lastFetchTime >= CACHE_TTL;

    if (cacheExpired && !isFetching) {
      fetchHotDeals();
    }

    return () => {
      isMounted.current = false;
    };
  }, []); // Empty dependency array - runs once

  const fetchHotDeals = async () => {
    // Prevent multiple simultaneous fetches
    if (isFetching) return;

    isFetching = true;

    // Double-check cache again (in case it was populated while waiting)
    const now = Date.now();
    if (cachedDeals && now - lastFetchTime < CACHE_TTL) {
      console.log(
        "📦 Hot deals cache populated during wait, using cached data",
      );
      if (isMounted.current) {
        setDeals(cachedDeals);
        setLoading(false);
      }
      isFetching = false;
      return;
    }

    console.log("🌐 Fetching fresh hot deals");

    try {
      if (isMounted.current) {
        setLoading(true);
      }

      const realDeals: HotDeal[] = [];

      // Calculate date 15 days ago
      const fifteenDaysAgo = new Date();
      fifteenDaysAgo.setDate(fifteenDaysAgo.getDate() - 15);

      // Use Promise.all for parallel requests to improve performance
      const [
        newListingsResult,
        availableResult,
        boardingResult,
        trendingResult,
        allPropertiesResult,
        openPropertiesResult,
      ] = await Promise.allSettled([
        // 1. New Listings (last 15 days)
        databases.listDocuments(
          config.databaseId!,
          config.propertiesCollectionId!,
          [
            Query.greaterThan("$createdAt", fifteenDaysAgo.toISOString()),
            Query.limit(100),
          ],
        ),
        // 2. Available Now
        databases.listDocuments(
          config.databaseId!,
          config.propertiesCollectionId!,
          [
            Query.equal("isAvailable", true),
            Query.greaterThan("$createdAt", fifteenDaysAgo.toISOString()),
            Query.limit(100),
          ],
        ),
        // 3. Boarding Houses
        databases.listDocuments(
          config.databaseId!,
          config.propertiesCollectionId!,
          [
            Query.equal("type", "Boarding"),
            Query.equal("isAvailable", true),
            Query.limit(100),
          ],
        ),
        // 4. Trending properties
        databases.listDocuments(
          config.databaseId!,
          config.propertiesCollectionId!,
          [Query.orderDesc("likes"), Query.limit(3)],
        ),
        // 5. All available properties (for price drops)
        databases.listDocuments(
          config.databaseId!,
          config.propertiesCollectionId!,
          [Query.equal("isAvailable", true), Query.limit(100)],
        ),
        // 6. Open properties
        databases.listDocuments(
          config.databaseId!,
          config.propertiesCollectionId!,
          [Query.equal("isAvailable", true), Query.limit(100)],
        ),
      ]);

      // Process New Listings
      if (newListingsResult.status === "fulfilled") {
        const newListingsCount = newListingsResult.value.total;
        if (newListingsCount > 0) {
          realDeals.push({
            title: "New Listings",
            description: `${newListingsCount} propert${newListingsCount > 1 ? "ies" : "y"} added this month`,
            icon: icons.plus,
            color: "#10B981",
            bgColor: "#ECFDF5",
            count: newListingsCount,
            type: "new_listing",
            sort: "newest",
            route: "/filtered-properties",
          });
        }
      }

      // Process Available Now
      if (availableResult.status === "fulfilled") {
        const availableCount = availableResult.value.total;
        if (availableCount > 0) {
          realDeals.push({
            title: "Available Now",
            description: `${availableCount} new propert${availableCount > 1 ? "ies" : "y"} added recently`,
            icon: icons.house,
            color: "#10B981",
            bgColor: "#D1FAE5",
            count: availableCount,
            type: "available",
            filter: "available",
            route: "/filtered-properties",
          });
        }
      }

      // Process Student Deals
      if (boardingResult.status === "fulfilled") {
        const boardingCount = boardingResult.value.total;
        if (boardingCount > 0) {
          realDeals.push({
            title: "Student Deals",
            description: `${boardingCount} boarding house${boardingCount > 1 ? "s" : ""} for students`,
            icon: icons.student || icons.house,
            color: "#8B5CF6",
            bgColor: "#EDE9FE",
            count: boardingCount,
            type: "boarding",
            filter: "boarding",
            route: "/filtered-properties",
          });
        }
      }

      // Process Trending
      if (trendingResult.status === "fulfilled") {
        const actualTrending = trendingResult.value.documents.filter(
          (p) => (p.likes || 0) > 0,
        );
        if (actualTrending.length > 0) {
          realDeals.push({
            title: "Trending",
            description: `${actualTrending.length} most liked propert${actualTrending.length > 1 ? "ies" : "y"}`,
            icon: icons.like,
            color: "#F59E0B",
            bgColor: "#FEF3C7",
            count: actualTrending.length,
            type: "trending",
            sort: "trending",
            route: "/trending-properties",
          });
        }
      }

      // Process Price Drops
      if (allPropertiesResult.status === "fulfilled") {
        const allProperties = allPropertiesResult.value.documents;
        let priceDropCount = allProperties.filter(
          (p) => p.hasPriceDrop === true,
        ).length;

        if (priceDropCount === 0) {
          const priceReducedProperties = allProperties.filter((p) => {
            if (
              p.priceHistory &&
              Array.isArray(p.priceHistory) &&
              p.priceHistory.length > 1
            ) {
              const previousPrice =
                p.priceHistory[p.priceHistory.length - 2]?.price ||
                p.originalPrice;
              const currentPrice = p.price;
              return currentPrice < previousPrice;
            }
            return false;
          });
          priceDropCount = priceReducedProperties.length;
        }

        if (priceDropCount > 0) {
          realDeals.push({
            title: "Price Drop!",
            description: `${priceDropCount} property${priceDropCount > 1 ? "s" : ""} reduced`,
            icon: icons.downTrend,
            color: "#EF4444",
            bgColor: "#FEF2F2",
            count: priceDropCount,
            type: "price_drop",
            filter: "price_drop",
            route: "/filtered-properties",
          });
        }
      }

      // Process Open Properties
      if (openPropertiesResult.status === "fulfilled") {
        const openPropertiesCount = openPropertiesResult.value.total;
        realDeals.push({
          title: "Open Properties",
          description:
            openPropertiesCount > 0
              ? `${openPropertiesCount} propert${openPropertiesCount > 1 ? "ies" : ""} available now`
              : "No properties available at the moment",
          icon: icons.house,
          color: "#3B82F6",
          bgColor: "#EFF6FF",
          count: openPropertiesCount,
          type: "open_properties",
          filter: "available",
          route: "/filtered-properties",
        });
      }

      // Sort deals by priority
      const priorityOrder = [
        "new_listing",
        "available",
        "boarding",
        "trending",
        "price_drop",
        "open_properties",
      ];

      const sortedDeals = [...realDeals].sort((a, b) => {
        return priorityOrder.indexOf(a.type) - priorityOrder.indexOf(b.type);
      });

      const finalDeals = sortedDeals.slice(0, 3);

      if (isMounted.current) {
        setDeals(finalDeals);
        // Update module-level cache
        cachedDeals = finalDeals;
        lastFetchTime = Date.now();
      }
    } catch (error) {
      console.error("Error fetching hot deals:", error);
      if (isMounted.current && cachedDeals) {
        // Use cached data if available
        setDeals(cachedDeals);
      } else if (isMounted.current) {
        // Return fallback deals
        setDeals([
          {
            title: "New Listings",
            description: "Check out fresh properties",
            icon: icons.plus,
            color: "#10B981",
            bgColor: "#ECFDF5",
            count: 0,
            type: "new_listing",
            route: "/filtered-properties",
          },
          {
            title: "Available Now",
            description: "New properties added recently",
            icon: icons.house,
            color: "#10B981",
            bgColor: "#D1FAE5",
            count: 0,
            type: "available",
            route: "/filtered-properties",
          },
          {
            title: "Open Properties",
            description: "Properties available now",
            icon: icons.house,
            color: "#3B82F6",
            bgColor: "#EFF6FF",
            count: 0,
            type: "open_properties",
            route: "/filtered-properties",
          },
        ]);
      }
    } finally {
      if (isMounted.current) {
        setLoading(false);
      }
      isFetching = false;
    }
  };

  const handleDealPress = (deal: HotDeal) => {
    switch (deal.type) {
      case "price_drop":
        router.push({
          pathname: "/filtered-properties",
          params: { type: deal.type, title: "Price Drop Properties" },
        });
        break;
      case "new_listing":
        router.push({
          pathname: "/filtered-properties",
          params: { type: deal.type, title: "New Listings" },
        });
        break;
      case "boarding":
        router.push({
          pathname: "/filtered-properties",
          params: {
            type: "boarding",
            title: "Student Deals - Boarding Houses",
          },
        });
        break;
      case "open_properties":
        router.push({
          pathname: "/filtered-properties",
          params: { type: "open_properties", title: "Open Properties" },
        });
        break;
      case "trending":
        router.push("/trending-properties");
        break;
      case "available":
        router.push({
          pathname: "/filtered-properties",
          params: { type: "available", title: "New Properties (Last 15 Days)" },
        });
        break;
      default:
        console.log("Unknown deal type:", deal.type);
        break;
    }
  };

  if (loading && !cachedDeals) {
    return (
      <View className="py-4">
        <View className="flex-row items-center justify-between mb-4">
          <View>
            <Text
              className="text-2xl font-rubik-bold"
              style={{ color: theme.text }}
            >
              Hot Deals
            </Text>
            <Text className="text-sm text-gray-500 font-rubik">
              Loading deals...
            </Text>
          </View>
        </View>
        <View className="flex-row justify-between gap-3">
          {[1, 2, 3].map((_, index) => (
            <View
              key={index}
              className="flex-1 rounded-xl p-3 items-center"
              style={{
                backgroundColor: theme.navBackground,
                borderWidth: 1,
                borderColor: isDark ? "#374151" : "#E5E7EB",
              }}
            >
              <ActivityIndicator size="small" color={theme.primary[300]} />
              <Text className="text-xs text-gray-500 text-center mt-2">
                Loading...
              </Text>
            </View>
          ))}
        </View>
      </View>
    );
  }

  return (
    <View className="py-4">
      <View className="flex-row items-center justify-between mb-4">
        <View>
          <Text
            className="text-2xl font-rubik-bold"
            style={{ color: theme.text }}
          >
            Hot Deals
          </Text>
          <Text className="text-sm text-gray-500 font-rubik">
            Don&apos;t miss out on these
          </Text>
        </View>
      </View>

      <View className="flex-row justify-between gap-3">
        {deals.map((deal, index) => (
          <TouchableOpacity
            key={index}
            onPress={() => handleDealPress(deal)}
            className="flex-1 rounded-xl p-3 items-center"
            style={{
              backgroundColor: theme.navBackground,
              borderWidth: 1,
              borderColor: isDark ? "#374151" : "#E5E7EB",
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.05,
              shadowRadius: 2,
              elevation: 1,
            }}
          >
            <View
              className="w-10 h-10 rounded-full items-center justify-center mb-2"
              style={{ backgroundColor: deal.color + "20" }}
            >
              <Image
                source={deal.icon}
                className="w-5 h-5"
                style={{ tintColor: deal.color }}
              />
            </View>
            <Text
              className="text-sm font-rubik-medium text-center"
              style={{ color: theme.text }}
            >
              {deal.title}
            </Text>
            <Text className="text-xs text-gray-500 text-center mt-1">
              {deal.description}
            </Text>
            {deal.count > 0 && (
              <View className="absolute -top-2 -right-2 bg-red-500 rounded-full w-5 h-5 items-center justify-center">
                <Text className="text-white text-xs font-bold">
                  {deal.count}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

export default HotDeals;
