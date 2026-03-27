// app/(root)/landlord-requests.tsx
import { Colors } from "@/constants/Colors";
import { getAvatarSource } from "@/constants/data";
import icons from "@/constants/icons";
import { config, databases } from "@/lib/appwrite";
import useAuthStore from "@/store/auth.store";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  RefreshControl,
  Text,
  TouchableOpacity,
  useColorScheme,
  View,
} from "react-native";
import { Query } from "react-native-appwrite";
import { SafeAreaView } from "react-native-safe-area-context";

interface RentalRequest {
  $id: string;
  propertyId: string;
  propertyName: string;
  tenantId: string;
  tenantName: string;
  tenantAvatar?: string;
  status: "pending" | "accepted" | "rejected";
  createdAt: string;
  property?: any;
}

export default function LandlordRequests() {
  const { user } = useAuthStore();
  const [requests, setRequests] = useState<RentalRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? "light"];
  const isLandlord = user?.userMode === "landlord";

  // Fetch ONLY PENDING requests for landlord's properties
  const fetchRequests = async () => {
    if (!user?.accountId) return;

    try {
      setLoading(true);

      // First, get all properties owned by this landlord
      const properties = await databases.listDocuments(
        config.databaseId!,
        config.propertiesCollectionId!,
        [Query.equal("creatorId", user.accountId)],
      );

      const propertyIds = properties.documents.map((p) => p.$id);

      if (propertyIds.length === 0) {
        setRequests([]);
        return;
      }

      // Get ONLY PENDING requests for these properties
      const requestsResult = await databases.listDocuments(
        config.databaseId!,
        config.requestsCollectionId!,
        [
          Query.equal("propertyId", propertyIds),
          Query.equal("status", "pending"), // Only get pending requests
          Query.orderDesc("$createdAt"),
        ],
      );

      // Fetch tenant avatars for each request
      const formattedRequests = await Promise.all(
        requestsResult.documents.map(async (doc) => {
          let tenantAvatar = null;

          // Try to get tenant avatar from users collection
          try {
            const userDocs = await databases.listDocuments(
              config.databaseId!,
              config.usersCollectionId!,
              [Query.equal("accountId", doc.tenantId)],
            );

            if (userDocs.documents.length > 0) {
              tenantAvatar =
                userDocs.documents[0].avatar ||
                userDocs.documents[0].customAvatar;
            }
          } catch (error) {
            console.error("Error fetching tenant avatar:", error);
          }

          return {
            $id: doc.$id,
            propertyId: doc.propertyId,
            propertyName: doc.propertyName,
            tenantId: doc.tenantId,
            tenantName: doc.tenantName,
            tenantAvatar: tenantAvatar,
            status: doc.status,
            createdAt: doc.$createdAt,
          };
        }),
      );

      setRequests(formattedRequests);
    } catch (error) {
      console.error("Error fetching requests:", error);
      Alert.alert("Error", "Failed to load requests");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (isLandlord) {
      fetchRequests();
    }
  }, [isLandlord]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchRequests();
  };

  const handleRequestAction = async (
    requestId: string,
    action: "accepted" | "rejected",
  ) => {
    setProcessingId(requestId);

    try {
      // Update request status
      await databases.updateDocument(
        config.databaseId!,
        config.requestsCollectionId!,
        requestId,
        { status: action },
      );

      // Get the request details
      const request = requests.find((r) => r.$id === requestId);

      if (request) {
        // Create notification for tenant
        const notificationTitle =
          action === "accepted"
            ? "✅ Rental Request Accepted!"
            : "❌ Rental Request Declined";

        const notificationMessage =
          action === "accepted"
            ? `Your request for "${request.propertyName}" has been accepted! The landlord will contact you soon.`
            : `Your request for "${request.propertyName}" was declined. Keep looking for other great properties!`;

        await databases.createDocument(
          config.databaseId!,
          config.notificationsCollectionId!,
          "unique()",
          {
            userId: request.tenantId,
            title: notificationTitle,
            message: notificationMessage,
            type: "system",
            data: JSON.stringify({
              propertyId: request.propertyId,
              propertyName: request.propertyName,
              status: action,
            }),
            read: false,
          },
        );

        // REMOVE the request from the list immediately
        setRequests((prev) => prev.filter((r) => r.$id !== requestId));

        Alert.alert(
          "Success",
          `Request ${action === "accepted" ? "accepted" : "rejected"} successfully!`,
        );
      }
    } catch (error) {
      console.error("Error updating request:", error);
      Alert.alert("Error", "Failed to update request status");
    } finally {
      setProcessingId(null);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + " " + date.toLocaleTimeString();
  };

  // In your landlord-requests.tsx, update the getAvatarSourceImage function:

  const getAvatarSourceImage = (avatar: string | undefined, name: string) => {
    // If there's a custom avatar URL (uploaded image)
    if (avatar && avatar.startsWith("http")) {
      return { uri: avatar };
    }
    // If there's a custom avatar ID (from avatar picker)
    if (avatar && avatar !== "person") {
      // This might be an avatar ID like "human-1", etc.
      return getAvatarSource(avatar);
    }
    // Fallback to initials avatar based on name
    return {
      uri: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random&color=fff&size=100`,
    };
  };

  if (!isLandlord) {
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
          Landlord Access Only
        </Text>
        <Text
          className="text-sm text-center mt-2 px-8"
          style={{ color: theme.muted }}
        >
          Only landlords can manage rental requests.
        </Text>
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
          Rental Requests
        </Text>
        <TouchableOpacity onPress={fetchRequests} className="p-2">
          <Image
            source={icons.refresh}
            className="w-5 h-5"
            style={{ tintColor: theme.primary[300] }}
          />
        </TouchableOpacity>
      </View>

      {requests.length === 0 ? (
        <View className="flex-1 items-center justify-center px-5">
          <Image
            source={icons.check}
            className="w-20 h-20 opacity-30 mb-4"
            style={{ tintColor: theme.muted }}
          />
          <Text
            className="text-lg font-rubik-medium text-center"
            style={{ color: theme.text }}
          >
            All Caught Up!
          </Text>
          <Text
            className="text-sm text-center mt-2"
            style={{ color: theme.muted }}
          >
            No pending requests at the moment
          </Text>
        </View>
      ) : (
        <FlatList
          data={requests}
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
              <View className="p-4">
                {/* Header with Tenant Avatar and Name */}
                <View className="flex-row items-start mb-3">
                  {/* Tenant Avatar */}
                  <Image
                    source={getAvatarSourceImage(
                      item.tenantAvatar,
                      item.tenantName,
                    )}
                    className="w-12 h-12 rounded-full mr-3"
                    style={{
                      borderWidth: 1,
                      borderColor: theme.muted + "30",
                    }}
                  />

                  <View className="flex-1">
                    <View className="flex-row justify-between items-start">
                      <View className="flex-1">
                        <Text
                          className="text-lg font-rubik-bold"
                          style={{ color: theme.title }}
                        >
                          {item.propertyName}
                        </Text>
                        <Text
                          className="text-sm mt-1"
                          style={{ color: theme.muted }}
                        >
                          Request from: {item.tenantName}
                        </Text>
                        <Text
                          className="text-xs mt-1"
                          style={{ color: theme.muted }}
                        >
                          {formatDate(item.createdAt)}
                        </Text>
                      </View>
                      <View
                        className="px-3 py-1 rounded-full ml-2"
                        style={{ backgroundColor: "#F59E0B20" }}
                      >
                        <Text
                          className="text-xs font-rubik-bold"
                          style={{ color: "#92400E" }}
                        >
                          Pending
                        </Text>
                      </View>
                    </View>
                  </View>
                </View>

                {/* Property Info Row */}
                <View
                  className="flex-row items-center mt-2 pt-2 border-t"
                  style={{ borderTopColor: theme.muted + "20" }}
                >
                  <Image
                    source={icons.house}
                    className="w-4 h-4 mr-2"
                    style={{ tintColor: theme.muted }}
                  />
                  <Text
                    className="text-sm flex-1"
                    style={{ color: theme.muted }}
                    numberOfLines={1}
                  >
                    {item.propertyName}
                  </Text>
                </View>

                {/* Action Buttons */}
                <View className="flex-row gap-3 mt-4">
                  <TouchableOpacity
                    onPress={() => handleRequestAction(item.$id, "accepted")}
                    disabled={processingId === item.$id}
                    className="flex-1 py-2 rounded-full bg-green-500"
                  >
                    <Text className="text-white text-center font-rubik-bold">
                      {processingId === item.$id ? "Processing..." : "✓ Accept"}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => handleRequestAction(item.$id, "rejected")}
                    disabled={processingId === item.$id}
                    className="flex-1 py-2 rounded-full bg-red-500"
                  >
                    <Text className="text-white text-center font-rubik-bold">
                      {processingId === item.$id
                        ? "Processing..."
                        : "✗ Decline"}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          )}
        />
      )}
    </SafeAreaView>
  );
}
