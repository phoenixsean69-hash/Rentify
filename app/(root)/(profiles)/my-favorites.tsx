import ProfileHeader from "@/components/ProfileHeader";
import icons from "@/constants/icons";
import { config, databases } from "@/lib/appwrite";
import useAuthStore from "@/store/auth.store";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Query } from "react-native-appwrite";
import Property from "../properties/[id]";

export default function MyFavorites() {
  const { user } = useAuthStore();
  const [favorites, setFavorites] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFavorites = async () => {
      if (!user?.accountId) {
        setLoading(false);
        return;
      }

      try {
        // Get all liked properties for this user
        const likedProperties = await databases.listDocuments(
          config.databaseId!,
          config.likesCollectionId!,
          [Query.equal("userId", user.accountId)],
        );

        // Get the actual property details for each like
        const propertyPromises = likedProperties.documents.map(async (like) => {
          const property = await databases.getDocument(
            config.databaseId!,
            config.propertiesCollectionId!,
            like.propertyId,
          );
          return property;
        });

        const properties = await Promise.all(propertyPromises);
        setFavorites(properties);
      } catch (err) {
        console.error("Error fetching favorites:", err);
        setFavorites([]);
      } finally {
        setLoading(false);
      }
    };

    fetchFavorites();
  }, [user]);

  const handleRemove = async (propertyId: string) => {
    if (!user?.accountId) return;

    try {
      // Find and delete the like record
      const likes = await databases.listDocuments(
        config.databaseId!,
        config.likesCollectionId!,
        [
          Query.equal("propertyId", propertyId),
          Query.equal("userId", user.accountId),
        ],
      );

      if (likes.documents.length > 0) {
        await databases.deleteDocument(
          config.databaseId!,
          config.likesCollectionId!,
          likes.documents[0].$id,
        );

        // Update local state
        setFavorites(favorites.filter((fav) => fav.$id !== propertyId));
      }
    } catch (err) {
      console.error("Error removing favorite:", err);
    }
  };

  const handlePropertyPress = (Id: string) => {
    router.push(`/properties/${Property}`);
  };

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-white">
        <ActivityIndicator size="large" className="text-primary-300" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-white">
      <ProfileHeader title="My Favorites" />

      <ScrollView className="px-6 pt-6">
        {favorites.length === 0 ? (
          <View className="items-center mt-20">
            <Image source={icons.heart} className="size-20 opacity-20" />
            <Text className="text-gray-400 text-center mt-4 text-lg">
              No favorites yet
            </Text>
            <Text className="text-gray-400 text-center mt-2">
              Tap the heart icon on properties you like
            </Text>
          </View>
        ) : (
          favorites.map((property) => (
            <TouchableOpacity
              key={property.$id}
              onPress={() => handlePropertyPress(property.$id)}
              className="bg-gray-50 p-6 rounded-3xl mb-4 border-l-4 border-primary-300"
            >
              <Text className="text-lg font-rubik-bold">
                {property.propertyName}
              </Text>
              <Text className="text-gray-500 mt-2">{property.type}</Text>

              {property.image1 && (
                <Image
                  source={{ uri: property.image1 }}
                  className="w-full h-40 rounded-xl mt-3"
                  resizeMode="cover"
                />
              )}

              <Text className="text-gray-700 mt-2">{property.address}</Text>
              <Text className="text-primary-300 mt-2 font-rubik-bold text-lg">
                ${property.price}/month
              </Text>

              {/* Remove button */}
              <TouchableOpacity
                onPress={() => handleRemove(property.$id)}
                className="mt-3 bg-red-500 py-3 rounded-full"
              >
                <Text className="text-white text-center font-rubik-bold">
                  Remove from Favorites
                </Text>
              </TouchableOpacity>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </View>
  );
}
