// app/properties/[id].tsx
import { facilities } from "@/constants/data";
import icons from "@/constants/icons";
import images from "@/constants/images";
import {
  account,
  checkUserLiked,
  config,
  databases,
  deleteProperty,
  getLikeCount,
  getPropertyById,
  toggleLike,
} from "@/lib/appwrite";
import {
  addToFavorites,
  isFavorite,
  removeFromFavorites,
} from "@/lib/localFavorites";
import { router, useLocalSearchParams } from "expo-router";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  FlatList,
  Image,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import { useAppwrite } from "@/lib/useAppwrite";
import useAuthStore from "@/store/auth.store";
import { useEffect, useState } from "react";

// ============================================================================
// TYPES
// ============================================================================
interface PropertyData {
  $id: string;
  propertyName?: string;
  type: string;
  description: string;
  address: string;
  price: number;
  area: number;
  rating: number;
  bedrooms: number;
  bathrooms: number;
  facilities: string | string[] | object;
  image1?: string;
  image2?: string;
  image3?: string;
  agent?: {
    $id: string;
    name: string;
    email: string;
    phone?: string;
    avatar?: string;
  };
  reviews?: string; // This is a JSON string in the database
}

interface Review {
  id: string;
  userName: string;
  userAvatar: string | null;
  review: string;
  rating: number;
  date: string;
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================
const Property = () => {
  // ============================================================================
  // HOOKS & STATE
  // ============================================================================
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { user } = useAuthStore();
  const windowHeight = Dimensions.get("window").height;
  const [isFav, setIsFav] = useState(false);
  // Fetch property data
  const { data: property, loading } = useAppwrite({
    fn: getPropertyById,
    params: { id: id! },
  }) as { data: PropertyData | null; loading: boolean };

  // ============================================================================
  // REVIEWS STATE
  // ============================================================================
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewText, setReviewText] = useState("");
  const [rating, setRating] = useState(5);
  const [reviewsExpanded, setReviewsExpanded] = useState(false);

  // ============================================================================
  // LIKE STATE
  // ============================================================================
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);

  // ============================================================================
  // OTHER STATE
  // ============================================================================
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [deleting, setDeleting] = useState(false);
  const [agentData, setAgentData] = useState<any>(null);
  const [loadingAgent, setLoadingAgent] = useState(false);

  useEffect(() => {
    const checkFavorite = async () => {
      if (property) {
        const fav = await isFavorite(property.$id);
        setIsFav(fav);
      }
    };

    checkFavorite();
  }, [property]);

  const handleFavoriteToggle = async () => {
    if (!property) return;

    try {
      if (isFav) {
        await removeFromFavorites(property.$id);
        setIsFav(false);
        Alert.alert("Removed", "Property removed from favorites");
      } else {
        // Create a clean property object for storage
        const favoriteProperty = {
          $id: property.$id,
          propertyName: property.propertyName,
          type: property.type,
          address: property.address,
          price: property.price,
          image1: property.image1,
          image2: property.image2,
          image3: property.image3,
          rating: property.rating,
        };

        await addToFavorites(favoriteProperty);
        setIsFav(true);
        Alert.alert("Added", "Property added to favorites");
      }
    } catch (error) {
      console.error("Error toggling favorite:", error);
      Alert.alert("Error", "Failed to update favorites");
    }
  };

  // ============================================================================
  // LOAD REVIEWS WHEN PROPERTY LOADS
  // ============================================================================
  useEffect(() => {
    if (property?.reviews) {
      try {
        // Parse the JSON string from database into an array
        const parsedReviews = JSON.parse(property.reviews);
        setReviews(parsedReviews);
        console.log("✅ Reviews loaded:", parsedReviews.length);
      } catch (e) {
        console.log("No reviews or error parsing:", e);
        setReviews([]);
      }
    } else {
      setReviews([]);
    }
  }, [property]);

  // ============================================================================
  // CHECK LIKE STATUS WHEN PROPERTY LOADS
  // ============================================================================
  useEffect(() => {
    const checkLikeStatus = async () => {
      if (property && user?.accountId) {
        try {
          const userLiked = await checkUserLiked(property.$id, user.accountId);
          const count = await getLikeCount(property.$id);
          setLiked(userLiked);
          setLikeCount(count);
        } catch (error) {
          console.error("Error checking like status:", error);
        }
      }
    };

    checkLikeStatus();
  }, [property, user]);

  // ============================================================================
  // LOAD AGENT WHEN PROPERTY LOADS
  // ============================================================================
  useEffect(() => {
    const fetchAgent = async () => {
      if (property?.agent && typeof property.agent === "string") {
        setLoadingAgent(true);
        try {
          const agent = await databases.getDocument(
            config.databaseId!,
            config.usersCollectionId!,
            property.agent,
          );
          setAgentData(agent);
        } catch (error) {
          console.error("Error fetching agent:", error);
          setAgentData(null);
        } finally {
          setLoadingAgent(false);
        }
      }
    };

    fetchAgent();
  }, [property?.agent]);

  // ============================================================================
  // HANDLE ADD REVIEW
  // ============================================================================
  const handleAddReview = async () => {
    if (!property || !reviewText.trim() || user?.userMode !== "tenant") return;

    try {
      // Get current user
      const currentUser = await account.get();

      // Create a simple review object
      const newReview: Review = {
        id: Date.now().toString(),
        userName: currentUser.name,
        userAvatar: currentUser.prefs?.avatar || null,
        review: reviewText,
        rating: rating,
        date: new Date().toISOString(),
      };

      console.log("📝 New review:", newReview);

      // Get current reviews from property
      let currentReviews: Review[] = [];
      if (property.reviews) {
        try {
          // Parse the existing reviews string into an array
          currentReviews = JSON.parse(property.reviews);
        } catch (e) {
          currentReviews = [];
        }
      }

      // Add new review to the array
      const updatedReviews = [...currentReviews, newReview];

      // IMPORTANT: Stringify the array before saving
      const reviewsString = JSON.stringify(updatedReviews);

      // Save back to the database
      await databases.updateDocument(
        config.databaseId!,
        config.propertiesCollectionId!,
        property.$id,
        {
          reviews: reviewsString, // This is a string, not an array
        },
      );

      // Update local state with the array
      setReviews(updatedReviews);

      // Clear form
      setReviewText("");
      setRating(5);

      Alert.alert("Success", "Review added!");
    } catch (err) {
      console.error("Error adding review:", err);
      Alert.alert("Error", "Failed to add review");
    }
  };

  // ============================================================================
  // HANDLE LIKE/UNLIKE
  // ============================================================================
  const handleLike = async () => {
    if (!property || !user?.accountId || user?.userMode !== "tenant") return;

    try {
      const result = await toggleLike(property.$id, user.accountId);
      setLiked(result.liked);
      setLikeCount(result.likeCount);
      Alert.alert(
        "Success",
        result.liked ? "Added to favorites!" : "Removed from favorites",
      );
    } catch (err) {
      console.error("Error toggling like:", err);
      Alert.alert("Error", "Failed to update like");
    }
  };

  // ============================================================================
  // HELPER FUNCTIONS
  // ============================================================================
  const getPropertyImages = (): string[] => {
    if (!property) return [];
    return [property.image1, property.image2, property.image3].filter(
      (img): img is string => Boolean(img),
    );
  };

  const normalizeFacilities = (): string[] => {
    if (!property?.facilities) return [];

    const facilities_data = property.facilities;

    if (Array.isArray(facilities_data)) {
      return facilities_data;
    }

    if (typeof facilities_data === "string") {
      try {
        const parsed = JSON.parse(facilities_data);
        if (Array.isArray(parsed)) return parsed;
      } catch {
        return facilities_data.includes(",")
          ? facilities_data.split(",").map((i) => i.trim())
          : [facilities_data];
      }
    }

    if (typeof facilities_data === "object") {
      return Object.values(facilities_data);
    }

    return [];
  };

  const calculateAverageRating = (): string => {
    if (!reviews || reviews.length === 0) return "0.0";
    const sum = reviews.reduce((acc, rev) => acc + (rev.rating || 0), 0);
    return (sum / reviews.length).toFixed();
  };

  // ============================================================================
  // OTHER HANDLERS
  // ============================================================================
  const handleDeleteProperty = () => {
    if (!property) return;

    Alert.alert(
      "Delete Property",
      "Are you sure you want to delete this property? This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            setDeleting(true);
            try {
              await deleteProperty(property.$id);
              Alert.alert("Success", "Property deleted successfully", [
                { text: "OK", onPress: () => router.replace("/landHome") },
              ]);
            } catch (error) {
              console.error("Error deleting property:", error);
              Alert.alert("Error", "Failed to delete property");
              setDeleting(false);
            }
          },
        },
      ],
    );
  };

  const handleBackPress = () => {
    router.replace(user?.userMode === "landlord" ? "/landHome" : "/tenantHome");
  };

  const handleImageNavigation = (direction: "prev" | "next") => {
    const images = getPropertyImages();
    if (images.length === 0) return;

    if (direction === "prev") {
      setCurrentImageIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1));
    } else {
      setCurrentImageIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0));
    }
  };

  // ============================================================================
  // RENDER HELPERS
  // ============================================================================
  const renderImageGallery = () => {
    const propertyImages = getPropertyImages();
    const mainImage =
      propertyImages[currentImageIndex] || property?.image1 || "";

    return (
      <View className="relative w-full" style={{ height: windowHeight / 2 }}>
        {/* Main Image */}
        {mainImage ? (
          <Image
            source={{ uri: mainImage }}
            className="size-full"
            resizeMode="cover"
          />
        ) : (
          <View className="size-full bg-gray-200 items-center justify-center">
            <Image source={icons.info} className="size-12 opacity-30" />
            <Text className="text-gray-400 mt-2">No image available</Text>
          </View>
        )}

        {/* Gradient Overlay */}
        <Image
          source={images.whiteGradient}
          className="absolute top-0 w-full z-40"
        />

        {/* Top bar */}
        <View
          className="z-50 absolute inset-x-7"
          style={{ top: Platform.OS === "ios" ? 70 : 20 }}
        >
          <View className="flex flex-row items-center w-full justify-between">
            <TouchableOpacity
              onPress={handleBackPress}
              className="flex flex-row bg-primary-200 rounded-full mt-5 size-11 items-center justify-center"
            >
              <Image source={icons.backArrow} className="size-5" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Image Gallery Controls */}
        {propertyImages.length > 1 && (
          <>
            {/* Image Counter */}
            <View className="absolute bottom-20 right-5 bg-black/60 px-3 py-1.5 rounded-full z-50">
              <Text className="text-white font-rubik-medium">
                {currentImageIndex + 1} / {propertyImages.length}
              </Text>
            </View>

            {/* Navigation Arrows */}
            <View className="absolute bottom-20 left-5 right-5 flex-row justify-between z-50">
              <TouchableOpacity
                onPress={() => handleImageNavigation("prev")}
                className="bg-black/60 rounded-full p-2"
              >
                <Image source={icons.backArrow} className="size-5 tint-white" />
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => handleImageNavigation("next")}
                className="bg-black/60 rounded-full p-2"
              >
                <Image
                  source={icons.rightArrow}
                  className="size-5 tint-white"
                />
              </TouchableOpacity>
            </View>

            {/* Image Dots */}
            <View className="absolute bottom-10 flex-row justify-center w-full z-50">
              {propertyImages.map((_, index) => (
                <TouchableOpacity
                  key={index}
                  onPress={() => setCurrentImageIndex(index)}
                  className={`mx-1 rounded-full ${
                    currentImageIndex === index
                      ? "w-6 h-2 bg-white"
                      : "w-2 h-2 bg-white/50"
                  }`}
                />
              ))}
            </View>
          </>
        )}
      </View>
    );
  };

  const renderTenantView = () => {
    if (!property) return null;

    const propertyImages = getPropertyImages();
    const facilityList = normalizeFacilities();
    const avgRating = calculateAverageRating();

    return (
      <>
        {/* Property details */}
        <View className="px-5 mt-7 flex gap-2">
          <Text className="text-2xl font-rubik-extrabold">
            {property.propertyName || "Property"}
          </Text>

          {/* Type + Rating */}
          <View className="flex flex-row items-center gap-3">
            <View className="flex flex-row items-center px-4 py-2 bg-primary-100 rounded-full">
              <Text className="text-xs font-rubik-bold text-primary-300">
                {property.type}
              </Text>
            </View>
            <Image source={icons.star} className="size-3.5" />
            <Text className="text-black-200 text-sm mt-1 font-rubik-medium">
              {avgRating}
            </Text>
          </View>

          {/* Beds, Baths, Area */}
          <View className="flex flex-row items-center mt-5">
            <View className="flex flex-row items-center justify-center bg-primary-100 rounded-full size-10">
              <Image source={icons.bed} className="size-4" />
            </View>
            <Text className="text-black-300 text-sm font-rubik-medium ml-2">
              {property.bedrooms || 0} Beds
            </Text>

            <View className="flex flex-row items-center justify-center bg-primary-100 rounded-full size-10 ml-7">
              <Image source={icons.bath} className="size-4" />
            </View>
            <Text className="text-black-300 text-sm font-rubik-medium ml-2">
              {property.bathrooms || 0} Baths
            </Text>

            <View className="flex flex-row items-center justify-center bg-primary-100 rounded-full size-10 ml-7">
              <Image source={icons.area} className="size-4" />
            </View>
            <Text className="text-black-300 text-sm font-rubik-medium ml-2">
              {property.area || 0} sqft
            </Text>
          </View>

          {/* Agent Section */}
          {agentData && (
            <View className="w-full border-t border-primary-200 pt-7 mt-5">
              <Text className="text-black-300 text-xl font-rubik-bold">
                Agent
              </Text>
              <View className="flex flex-row items-start mt-4">
                <Image
                  source={{ uri: agentData.avatar }}
                  className="size-14 rounded-full"
                />
                <View className="flex flex-col items-start ml-3 flex-1">
                  <Text className="text-lg text-black-300 font-rubik-bold">
                    {agentData.name}
                  </Text>
                  <View className="flex flex-row items-center mt-1">
                    <Image
                      source={icons.mail}
                      className="size-4 mr-2"
                      tintColor="#666"
                    />
                    <Text className="text-sm text-black-200 font-rubik-medium">
                      {agentData.email}
                    </Text>
                  </View>
                  {agentData.phone && (
                    <View className="flex flex-row items-center mt-1">
                      <Image
                        source={icons.phone}
                        className="size-4 mr-2"
                        tintColor="#666"
                      />
                      <Text className="text-sm text-black-200 font-rubik-medium">
                        {agentData.phone}
                      </Text>
                    </View>
                  )}
                </View>
              </View>
            </View>
          )}

          {/* Overview */}
          <View className="mt-7">
            <Text className="text-black-300 text-xl font-rubik-bold">
              Overview
            </Text>
            <Text className="text-black-200 text-base font-rubik mt-2">
              {property.description || "No description available"}
            </Text>
          </View>

          {/* Facilities */}
          <View className="mt-7">
            <Text className="text-black-300 text-xl font-rubik-bold">
              Facilities
            </Text>
            {facilityList.length > 0 ? (
              <View className="flex flex-row flex-wrap mt-2 gap-5">
                {facilityList.map((item, index) => {
                  const facility = facilities.find((f) => f.title === item);
                  return (
                    <View
                      key={index}
                      className="flex flex-col items-center min-w-16 max-w-20"
                    >
                      <View className="size-14 bg-primary-100 rounded-full flex items-center justify-center">
                        <Image
                          source={facility ? facility.icon : icons.info}
                          className="size-6"
                        />
                      </View>
                      <Text
                        numberOfLines={1}
                        ellipsizeMode="tail"
                        className="text-black-300 text-sm text-center font-rubik mt-1.5"
                      >
                        {item}
                      </Text>
                    </View>
                  );
                })}
              </View>
            ) : (
              <Text className="text-black-200 text-base font-rubik mt-2">
                No facilities listed
              </Text>
            )}
          </View>

          {/* Thumbnail Gallery */}
          {propertyImages.length > 1 && (
            <View className="mt-7">
              <Text className="text-black-300 text-xl font-rubik-bold mb-3">
                All Photos
              </Text>
              <FlatList
                data={propertyImages}
                horizontal
                showsHorizontalScrollIndicator={false}
                keyExtractor={(_, index) => index.toString()}
                renderItem={({ item, index }) => (
                  <TouchableOpacity
                    onPress={() => setCurrentImageIndex(index)}
                    className="mr-3"
                  >
                    <Image
                      source={{ uri: item }}
                      className="w-24 h-24 rounded-xl"
                    />
                    {index === currentImageIndex && (
                      <View className="absolute inset-0 bg-primary-300/30 rounded-xl border-2 border-primary-300" />
                    )}
                  </TouchableOpacity>
                )}
              />
            </View>
          )}

          {/* Location */}
          <View className="mt-7">
            <Text className="text-black-300 text-xl font-rubik-bold">
              Location
            </Text>
            <View className="flex flex-row items-center mt-4 gap-2">
              <Image source={icons.location} className="w-7 h-7" />
              <Text className="text-black-200 text-sm font-rubik-medium">
                {property.address || "Address not available"}
              </Text>
            </View>
          </View>

          {/* ======================================== */}
          {/* REVIEWS SECTION */}
          {/* ======================================== */}
          <View className="mt-7">
            <Text className="text-black-300 text-xl font-rubik-bold">
              Reviews ({reviews.length})
            </Text>

            <TouchableOpacity
              onPress={() => setReviewsExpanded(!reviewsExpanded)}
              className="mt-2"
            >
              <Text className="text-primary-300 font-rubik-medium">
                {reviewsExpanded ? "Hide Reviews" : "Show Reviews"}
              </Text>
            </TouchableOpacity>

            {reviewsExpanded && (
              <View className="mt-3">
                {reviews.length > 0 ? (
                  reviews.map((rev) => (
                    <View
                      key={rev.id}
                      className="mt-3 pb-3 border-b border-primary-100"
                    >
                      <View className="flex-row items-center">
                        <Image
                          source={{
                            uri:
                              rev.userAvatar ||
                              "https://via.placeholder.com/40",
                          }}
                          className="w-8 h-8 rounded-full mr-2"
                        />
                        <View className="flex-1">
                          <Text className="text-black-300 font-rubik-bold">
                            {rev.userName}
                          </Text>
                          <View className="flex-row items-center">
                            <Text className="text-yellow-500 font-rubik-bold mr-1">
                              {rev.rating}
                            </Text>
                            <Image source={icons.star} className="size-3.5" />
                          </View>
                        </View>
                      </View>
                      <Text className="text-black-200 mt-2 ml-10">
                        {rev.review}
                      </Text>
                      <Text className="text-gray-400 text-xs mt-1 ml-10">
                        {new Date(rev.date).toLocaleDateString()}
                      </Text>
                    </View>
                  ))
                ) : (
                  <Text className="text-gray-500 mt-2">No reviews yet</Text>
                )}
              </View>
            )}
          </View>

          {/* ======================================== */}
          {/* ADD REVIEW FORM */}
          {/* ======================================== */}
          <View className="mt-7 mb-5">
            <Text className="text-black-300 text-xl font-rubik-bold">
              Add a Review
            </Text>
            <TextInput
              value={reviewText}
              onChangeText={setReviewText}
              placeholder="Write your review..."
              className="border border-gray-300 rounded-xl p-3 mt-3"
              multiline
              numberOfLines={3}
              placeholderTextColor="#9CA3AF"
            />
            <View className="flex flex-row gap-3 mt-3">
              {[1, 2, 3, 4, 5].map((star) => (
                <TouchableOpacity key={star} onPress={() => setRating(star)}>
                  <Text
                    className="text-3xl"
                    style={{ color: rating >= star ? "#facc15" : "#9ca3af" }}
                  >
                    ★
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity
              onPress={handleAddReview}
              className="bg-primary-300 py-3 rounded-full mt-3"
            >
              <Text className="text-white text-center font-rubik-bold">
                Submit Review
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </>
    );
  };

  const renderLandlordView = () => {
    if (!property) return null;

    const propertyImages = getPropertyImages();
    const facilityList = normalizeFacilities();
    const avgRating = calculateAverageRating();

    return (
      <>
        <View className="px-5 mt-7 flex gap-2">
          <View className="mb-2">
            <Text className="text-3xl font-rubik-bold text-primary-300">
              {property.propertyName}
            </Text>
          </View>

          <Text className="text-2xl font-rubik-bold">
            {property.type === "Boarding"
              ? `$${property.price} /head`
              : `$${property.price} /month`}
          </Text>

          <View className="flex flex-row items-center gap-3">
            <View className="flex flex-row items-center px-4 py-2 bg-primary-100 rounded-full">
              <Text className="text-xs font-rubik-bold text-primary-300">
                {property.type}
              </Text>
            </View>
            <Image source={icons.star} className="size-3.5" />
            <Text className="text-black-200 text-sm mt-1 font-rubik-medium">
              {avgRating}
            </Text>
          </View>

          <View className="flex flex-row items-center mt-5">
            <View className="flex flex-row items-center justify-center bg-primary-100 rounded-full size-10">
              <Image source={icons.bed} className="size-4" />
            </View>
            <Text className="text-black-300 text-sm font-rubik-medium ml-2">
              {property.bedrooms || 0} Beds
            </Text>

            <View className="flex flex-row items-center justify-center bg-primary-100 rounded-full size-10 ml-7">
              <Image source={icons.bath} className="size-4" />
            </View>
            <Text className="text-black-300 text-sm font-rubik-medium ml-2">
              {property.bathrooms || 0} Baths
            </Text>

            <View className="flex flex-row items-center justify-center bg-primary-100 rounded-full size-10 ml-7">
              <Image source={icons.area} className="size-4" />
            </View>
            <Text className="text-black-300 text-sm font-rubik-medium ml-2">
              {property.area || 0} sqft
            </Text>
          </View>

          <View className="mt-7">
            <Text className="text-black-300 text-xl font-rubik-bold">
              Overview
            </Text>
            <Text className="text-black-200 text-base font-rubik mt-2">
              {property.description || "No description available"}
            </Text>
          </View>

          {/* ======================================== */}
          {/* REVIEWS SECTION - MATCHING TENANT VIEW WITHOUT COLLAPSE */}
          {/* ======================================== */}
          <View className="mt-7">
            <Text className="text-black-300 text-xl font-rubik-bold mb-3">
              Reviews ({reviews.length})
            </Text>

            <View className="mt-1">
              {reviews.length > 0 ? (
                reviews.map((rev, index) => (
                  <View
                    key={rev.id}
                    className={`p-4 rounded-xl mb-3 ${
                      index % 2 === 0 ? "bg-blue-50" : "bg-gray-50"
                    }`}
                  >
                    {/* Review Header - User Info */}
                    <View className="flex-row items-center mb-2">
                      <Image
                        source={{
                          uri:
                            rev.userAvatar || "https://via.placeholder.com/40",
                        }}
                        className="w-10 h-10 rounded-full mr-3"
                      />
                      <View className="flex-1">
                        <View className="flex-row justify-between items-center">
                          <Text className="text-black-300 font-rubik-bold text-base">
                            {rev.userName}
                          </Text>
                          <View className="flex-row items-center bg-white px-2 py-1 rounded-full">
                            <Text className="text-yellow-500 font-rubik-bold mr-1">
                              {rev.rating}
                            </Text>
                            <Image source={icons.star} className="size-3.5" />
                          </View>
                        </View>
                        <Text className="text-gray-400 text-xs">
                          {new Date(rev.date).toLocaleDateString()}
                        </Text>
                      </View>
                    </View>

                    {/* Review Content */}
                    <View className="ml-2">
                      <Text className="text-black-200 text-base leading-5">
                        {rev.review}
                      </Text>
                    </View>
                  </View>
                ))
              ) : (
                <View className="bg-gray-50 p-8 rounded-xl items-center">
                  <Image
                    source={icons.chat}
                    className="size-12 mb-3 opacity-30"
                  />
                  <Text className="text-gray-500 text-center font-rubik-medium">
                    No reviews yet from Viewers
                  </Text>
                </View>
              )}
            </View>
          </View>

          <View className="mt-7">
            <Text className="text-black-300 text-xl font-rubik-bold">
              Facilities
            </Text>
            {facilityList.length > 0 ? (
              <View className="flex flex-row flex-wrap mt-2 gap-5">
                {facilityList.map((item, index) => {
                  const facility = facilities.find((f) => f.title === item);
                  return (
                    <View
                      key={index}
                      className="flex flex-col items-center min-w-16 max-w-20"
                    >
                      <View className="size-14 bg-primary-100 rounded-full flex items-center justify-center">
                        <Image
                          source={facility ? facility.icon : icons.info}
                          className="size-6"
                        />
                      </View>
                      <Text
                        numberOfLines={1}
                        ellipsizeMode="tail"
                        className="text-black-300 text-sm text-center font-rubik mt-1.5"
                      >
                        {item}
                      </Text>
                    </View>
                  );
                })}
              </View>
            ) : (
              <Text className="text-black-200 text-base font-rubik mt-2">
                No facilities listed
              </Text>
            )}
          </View>

          {propertyImages.length > 1 && (
            <View className="mt-7">
              <Text className="text-black-300 text-xl font-rubik-bold mb-3">
                All Photos
              </Text>
              <FlatList
                data={propertyImages}
                horizontal
                showsHorizontalScrollIndicator={false}
                keyExtractor={(_, index) => index.toString()}
                renderItem={({ item, index }) => (
                  <TouchableOpacity
                    onPress={() => setCurrentImageIndex(index)}
                    className="mr-3"
                  >
                    <Image
                      source={{ uri: item }}
                      className="w-24 h-24 rounded-xl"
                    />
                    {index === currentImageIndex && (
                      <View className="absolute inset-0 bg-primary-300/30 rounded-xl border-2 border-primary-300" />
                    )}
                  </TouchableOpacity>
                )}
              />
            </View>
          )}

          <View className="mt-7">
            <Text className="text-black-300 text-xl font-rubik-bold">
              Location
            </Text>
            <View className="flex flex-row items-center mt-4 gap-2">
              <Image source={icons.location} className="w-7 h-7" />
              <Text className="text-black-200 text-sm font-rubik-medium">
                {property.address || "Address not available"}
              </Text>
            </View>
          </View>

          <View className="mt-7 mb-10">
            <TouchableOpacity
              onPress={handleDeleteProperty}
              disabled={deleting}
              className={`py-4 rounded-full border border-red-600 shadow-md ${
                deleting ? "bg-red-300" : "bg-red-500"
              }`}
            >
              <Text className="text-white text-center text-lg font-rubik-bold">
                {deleting ? "Deleting..." : "Delete Property"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </>
    );
  };

  // ============================================================================
  // MAIN RENDER
  // ============================================================================
  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-white">
        <ActivityIndicator size="large" className="text-primary-300" />
        <Text className="mt-2 text-gray-600 font-rubik">
          Loading property...
        </Text>
      </View>
    );
  }

  if (!property) {
    return (
      <View className="flex-1 justify-center items-center bg-white">
        <Image source={icons.info} className="size-16 mb-4 opacity-50" />
        <Text className="text-black-300 text-lg font-rubik-medium mb-2">
          Property not found
        </Text>
        <TouchableOpacity
          onPress={() => router.back()}
          className="bg-primary-300 px-8 py-3 rounded-full"
        >
          <Text className="text-white font-rubik-medium">Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const isTenant = user?.userMode === "tenant";
  const isLandlord = user?.userMode === "landlord";

  return (
    <View className="flex-1 bg-white">
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerClassName="pb-32"
      >
        {renderImageGallery()}
        {isTenant && renderTenantView()}
        {isLandlord && renderLandlordView()}
      </ScrollView>

      {/* ======================================== */}
      {/* BOTTOM BAR - ONLY FOR TENANTS */}
      {/* ======================================== */}
      {isTenant && (
        <View className="absolute bg-white bottom-0 w-full rounded-t-2xl border-t border-r border-l border-primary-200 p-4">
          <View className="flex flex-row items-center justify-between">
            {/* Price */}
            <View className="flex flex-col items-start">
              <Text className="text-black-200 text-xs font-rubik-medium">
                Price
              </Text>
              <Text className="text-lg font-rubik-bold text-primary-300">
                ${property.price || 0}
                <Text className="text-black-300 text-sm"> /month</Text>
              </Text>
            </View>

            <View className="flex-row items-center gap-2">
              {/* Like Button - Icon with count */}
              <TouchableOpacity
                onPress={handleLike}
                className="flex-row items-center bg-gray-100 px-3 py-2 rounded-full"
              >
                <Image
                  source={liked ? icons.like : icons.like}
                  className="size-5 mr-1"
                  style={{ tintColor: liked ? "#ff69b4" : "#666" }}
                />
                <Text
                  className={`text-base font-rubik-bold ${liked ? "text-pink-500" : "text-gray-600"}`}
                >
                  {likeCount}
                </Text>
              </TouchableOpacity>

              {/* Favorite Button */}
              <TouchableOpacity
                onPress={handleFavoriteToggle}
                className={`flex-row items-center px-3 py-2 rounded-full ${
                  isFav ? "bg-pink-500" : "bg-primary-300"
                }`}
              >
                <Image
                  source={isFav ? icons.heart : icons.star}
                  className="size-5 mr-1"
                  style={{ tintColor: "white" }}
                />
                <Text className="text-white text-base font-rubik-bold">
                  {isFav ? "Saved" : "Save"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
    </View>
  );
};

export default Property;
