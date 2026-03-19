// app/screens/AddListing.tsx
import icons from "@/constants/icons";
import { AddListing, uploadImage } from "@/lib/appwrite";
import * as ImagePicker from "expo-image-picker";
import { ImagePickerAsset } from "expo-image-picker";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";

import { categories, facilities } from "@/constants/data";
import useAuthStore from "@/store/auth.store";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Modal,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const AddPropertyScreen = () => {
  const { user } = useAuthStore();
  const [loadingUser, setLoadingUser] = useState(true);

  // Form state
  const [propertyName, setPropertyName] = useState("");
  const [type, setType] = useState("");
  const [typeModalVisible, setTypeModalVisible] = useState(false);
  const [description, setDescription] = useState("");

  // Address breakdown
  const [houseNumber, setHouseNumber] = useState("");
  const [streetName, setStreetName] = useState("");
  const [neighbourhood, setNeighbourhood] = useState("");
  const [cityTown, setCityTown] = useState("");

  const [price, setPrice] = useState("");
  const [area, setArea] = useState("");
  const [bedrooms, setBedrooms] = useState("");
  const [roomFor, setRoomFor] = useState("");
  const [bathrooms, setBathrooms] = useState("");

  // Curfew state
  const [curfew, setCurfew] = useState("");
  const [curfewAmPm, setCurfewAmPm] = useState<"AM" | "PM" | "">("");
  const [curfewModalVisible, setCurfewModalVisible] = useState(false);

  // Facilities state
  const [selectedFacilities, setSelectedFacilities] = useState<string[]>([]);
  const [facilitiesModalVisible, setFacilitiesModalVisible] = useState(false);

  const [images, setImages] = useState<ImagePickerAsset[]>([]);
  const [loading, setLoading] = useState(false);

  // Check if user is loaded
  useEffect(() => {
    if (user) {
      console.log("User from auth store:", user);
      setLoadingUser(false);
    }
  }, [user]);

  // Check if property type is Boarding House
  const isBoardingHouse = type === "Boarding";

  // Combine address parts into CSV
  const getFullAddress = () => {
    const parts = [houseNumber, streetName, neighbourhood, cityTown].filter(
      (part) => part.trim() !== "",
    );
    return parts.join(", ");
  };

  const pickImage = async () => {
    if (images.length >= 3) {
      Alert.alert("Limit Reached", "You can only upload up to 3 images");
      return;
    }

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.7,
        allowsMultipleSelection: true,
        selectionLimit: 3 - images.length,
      });

      if (!result.canceled) {
        setImages((prev) => [...prev, ...result.assets]);
      }
    } catch (error) {
      Alert.alert("Error", "Failed to pick images");
      console.error(error);
    }
  };

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const toggleFacility = (facilityTitle: string) => {
    setSelectedFacilities((prev) => {
      if (prev.includes(facilityTitle)) {
        return prev.filter((f) => f !== facilityTitle);
      } else {
        return [...prev, facilityTitle];
      }
    });
  };

  const validateForm = () => {
    // Basic required fields
    if (
      !propertyName.trim() ||
      !type ||
      !description.trim() ||
      !getFullAddress() ||
      !price ||
      !area ||
      !bedrooms ||
      !bathrooms ||
      selectedFacilities.length === 0
    ) {
      Alert.alert("Error", "Please fill all required fields");
      return false;
    }

    // Boarding house specific validations
    if (isBoardingHouse) {
      if (!roomFor || !curfew || !curfewAmPm) {
        Alert.alert("Error", "Please fill all boarding house fields");
        return false;
      }
    }

    if (images.length === 0) {
      Alert.alert("Error", "Please upload at least one image");
      return false;
    }

    // Validate numeric fields
    if (isNaN(Number(price)) || Number(price) <= 0) {
      Alert.alert("Error", "Please enter a valid price");
      return false;
    }

    if (isNaN(Number(area)) || Number(area) <= 0) {
      Alert.alert("Error", "Please enter a valid area");
      return false;
    }

    if (isNaN(Number(bedrooms)) || Number(bedrooms) < 0) {
      Alert.alert("Error", "Please enter a valid number of bedrooms");
      return false;
    }

    if (isNaN(Number(bathrooms)) || Number(bathrooms) < 0) {
      Alert.alert("Error", "Please enter a valid number of bathrooms");
      return false;
    }

    if (isBoardingHouse) {
      if (isNaN(Number(roomFor)) || Number(roomFor) < 0) {
        Alert.alert("Error", "Please enter a valid number of people");
        return false;
      }
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    if (!user) {
      Alert.alert("Error", "You must be logged in to add a listing");
      return;
    }

    if (!user.accountId) {
      Alert.alert("Error", "User account ID not found");
      return;
    }

    setLoading(true);
    try {
      // Upload images
      const uploadedImageUrls: string[] = [];
      for (let i = 0; i < images.length; i++) {
        const img = images[i];
        try {
          console.log(`Uploading image ${i + 1}/${images.length}...`);
          const imageUrl = await uploadImage(img);
          uploadedImageUrls.push(imageUrl);
        } catch (error) {
          console.error(`Failed to upload image ${i + 1}:`, error);
          Alert.alert("Upload Error", `Failed to upload image ${i + 1}`);
          setLoading(false);
          return;
        }
      }

      // Prepare listing data
      const listingData: any = {
        propertyName: propertyName.trim(),
        type: type,
        description: description.trim(),
        address: getFullAddress(),
        price: Number(price),
        area: Number(area),
        bedrooms: Number(bedrooms),
        bathrooms: Number(bathrooms),
        facilities: selectedFacilities.join(", "),
        agent: user.$id,
        creatorId: user.accountId,
      };

      // Add boarding house specific fields
      if (isBoardingHouse) {
        listingData.roomFor = Number(roomFor);
        listingData.curfew = curfewAmPm ? `${curfew} ${curfewAmPm}` : "";
      }

      // Assign image URLs to individual fields
      if (uploadedImageUrls[0]) listingData.image1 = uploadedImageUrls[0];
      if (uploadedImageUrls[1]) listingData.image2 = uploadedImageUrls[1];
      if (uploadedImageUrls[2]) listingData.image3 = uploadedImageUrls[2];

      console.log("Full listing data:", listingData);
      await AddListing(listingData);

      Alert.alert("Success", "Listing added successfully!", [
        { text: "OK", onPress: () => router.replace("/landHome") },
      ]);
    } catch (error) {
      console.error("Error saving listing:", error);
      Alert.alert("Error", "Failed to save listing. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Property Type Modal
  const renderTypeModal = () => (
    <Modal
      animationType="slide"
      transparent={true}
      visible={typeModalVisible}
      onRequestClose={() => setTypeModalVisible(false)}
    >
      <View className="flex-1 justify-end bg-black/50">
        <View className="bg-white rounded-t-3xl p-6 h-2/3">
          <View className="flex-row justify-between items-center mb-4">
            <Text className="text-xl font-rubik-bold">
              Select Property Type
            </Text>
            <TouchableOpacity onPress={() => setTypeModalVisible(false)}>
              <Text className="text-2xl">✕</Text>
            </TouchableOpacity>
          </View>

          <FlatList
            data={categories.filter((c) => c.category !== "All")}
            keyExtractor={(item) => item.category}
            renderItem={({ item }) => (
              <TouchableOpacity
                onPress={() => {
                  setType(item.category);
                  setTypeModalVisible(false);
                }}
                className={`p-4 mb-2 rounded-xl border ${
                  type === item.category
                    ? "bg-primary-100 border-primary-300"
                    : "bg-white border-gray-200"
                }`}
              >
                <Text
                  className={`text-lg font-rubik-medium ${
                    type === item.category
                      ? "text-primary-300"
                      : "text-black-300"
                  }`}
                >
                  {item.title}
                </Text>
              </TouchableOpacity>
            )}
          />
        </View>
      </View>
    </Modal>
  );

  // Curfew Modal
  const renderCurfewModal = () => (
    <Modal
      animationType="slide"
      transparent={true}
      visible={curfewModalVisible}
      onRequestClose={() => setCurfewModalVisible(false)}
    >
      <View className="flex-1 justify-end bg-black/50">
        <View className="bg-white rounded-t-3xl p-6">
          <View className="flex-row justify-between items-center mb-4">
            <Text className="text-xl font-rubik-bold">Select Curfew Time</Text>
            <TouchableOpacity onPress={() => setCurfewModalVisible(false)}>
              <Text className="text-2xl">✕</Text>
            </TouchableOpacity>
          </View>

          <View className="flex-row gap-4 mb-4">
            <View className="flex-1">
              <Text className="text-sm font-rubik-medium text-gray-700 mb-2">
                Hour
              </Text>
              <FlatList
                data={[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]}
                numColumns={3}
                keyExtractor={(item) => item.toString()}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    onPress={() => {
                      setCurfew(item.toString());
                      setCurfewModalVisible(false);
                    }}
                    className={`m-1 p-3 rounded-lg border ${
                      curfew === item.toString()
                        ? "bg-primary-100 border-primary-300"
                        : "bg-white border-gray-200"
                    }`}
                  >
                    <Text
                      className={`text-center ${
                        curfew === item.toString()
                          ? "text-primary-300"
                          : "text-black-300"
                      }`}
                    >
                      {item}
                    </Text>
                  </TouchableOpacity>
                )}
              />
            </View>
          </View>

          <View className="flex-row gap-4">
            <TouchableOpacity
              onPress={() => {
                setCurfewAmPm("AM");
                setCurfewModalVisible(false);
              }}
              className={`flex-1 p-4 rounded-xl border ${
                curfewAmPm === "AM"
                  ? "bg-primary-100 border-primary-300"
                  : "bg-white border-gray-200"
              }`}
            >
              <Text
                className={`text-center font-rubik-bold ${
                  curfewAmPm === "AM" ? "text-primary-300" : "text-black-300"
                }`}
              >
                AM
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => {
                setCurfewAmPm("PM");
                setCurfewModalVisible(false);
              }}
              className={`flex-1 p-4 rounded-xl border ${
                curfewAmPm === "PM"
                  ? "bg-primary-100 border-primary-300"
                  : "bg-white border-gray-200"
              }`}
            >
              <Text
                className={`text-center font-rubik-bold ${
                  curfewAmPm === "PM" ? "text-primary-300" : "text-black-300"
                }`}
              >
                PM
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  // Facilities Modal
  const renderFacilitiesModal = () => (
    <Modal
      animationType="slide"
      transparent={true}
      visible={facilitiesModalVisible}
      onRequestClose={() => setFacilitiesModalVisible(false)}
    >
      <View className="flex-1 justify-end bg-black/50">
        <View className="bg-white rounded-t-3xl p-6 h-3/4">
          <View className="flex-row justify-between items-center mb-4">
            <Text className="text-xl font-rubik-bold">Select Facilities</Text>
            <TouchableOpacity onPress={() => setFacilitiesModalVisible(false)}>
              <Text className="text-primary-300 font-rubik-bold">Done</Text>
            </TouchableOpacity>
          </View>

          <FlatList
            data={facilities}
            keyExtractor={(item) => item.title}
            numColumns={2}
            renderItem={({ item }) => {
              const isSelected = selectedFacilities.includes(item.title);
              return (
                <TouchableOpacity
                  onPress={() => toggleFacility(item.title)}
                  className={`flex-1 m-2 p-4 rounded-xl border items-center ${
                    isSelected
                      ? "bg-primary-100 border-primary-300"
                      : "bg-white border-gray-200"
                  }`}
                >
                  <Image
                    source={item.icon}
                    className="w-8 h-8 mb-2"
                    style={{ tintColor: isSelected ? "#0066CC" : "#666666" }}
                  />
                  <Text
                    className={`text-sm font-rubik-medium text-center ${
                      isSelected ? "text-primary-300" : "text-black-300"
                    }`}
                  >
                    {item.title}
                  </Text>
                </TouchableOpacity>
              );
            }}
          />
        </View>
      </View>
    </Modal>
  );

  if (loadingUser) {
    return (
      <SafeAreaView className="flex-1 bg-white justify-center items-center">
        <ActivityIndicator size="large" className="text-primary-300" />
        <Text className="mt-2 text-gray-600">Loading user...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerClassName="pb-10"
      >
        {/* Header */}
        <View className="flex flex-row items-center w-full justify-between px-6">
          <TouchableOpacity
            onPress={() => router.replace("/landHome")}
            className="flex flex-row bg-primary-200 rounded-full mt-5 size-11 items-center justify-center"
          >
            <Image source={icons.backArrow} className="size-5" />
          </TouchableOpacity>
        </View>

        <View className="px-6 pt-4 pb-2">
          <Text className="text-2xl font-rubik-bold text-gray-800">
            Add New Listing
          </Text>
          <Text className="text-sm font-rubik text-gray-500 mt-1">
            Fill in the details below
          </Text>
        </View>

        {/* Form Fields */}
        <View className="px-6">
          {/* Property Name */}
          <View className="mb-4">
            <Text className="text-sm font-rubik-medium text-gray-700 mb-1">
              Property Name <Text className="text-red-500">*</Text>
            </Text>
            <TextInput
              placeholder="e.g. Sunset Apartments, Green Villa"
              value={propertyName}
              onChangeText={setPropertyName}
              className="border border-gray-300 px-4 py-3 rounded-lg bg-gray-50"
              placeholderTextColor="#9CA3AF"
            />
          </View>

          {/* Property Type - Dropdown */}
          <View className="mb-4">
            <Text className="text-sm font-rubik-medium text-gray-700 mb-1">
              Property Type <Text className="text-red-500">*</Text>
            </Text>
            <TouchableOpacity
              onPress={() => setTypeModalVisible(true)}
              className="border border-gray-300 px-4 py-3 rounded-lg bg-gray-50 flex-row justify-between items-center"
            >
              <Text className={type ? "text-black-300" : "text-gray-400"}>
                {type || "Select property type"}
              </Text>
              <Text className="text-gray-400">▼</Text>
            </TouchableOpacity>
          </View>

          {/* Description */}
          <View className="mb-4">
            <Text className="text-sm font-rubik-medium text-gray-700 mb-1">
              Description <Text className="text-red-500">*</Text>
            </Text>
            <TextInput
              placeholder="Describe your property features, condition, etc."
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={4}
              className="border border-gray-300 px-4 py-3 rounded-lg bg-gray-50 h-24"
              textAlignVertical="top"
              placeholderTextColor="#9CA3AF"
            />
          </View>

          {/* Address Breakdown */}
          <View className="mb-4">
            <Text className="text-sm font-rubik-medium text-gray-700 mb-2">
              Address <Text className="text-red-500">*</Text>
            </Text>

            {/* House Number */}
            <TextInput
              placeholder="House Number (e.g. 22)"
              value={houseNumber}
              onChangeText={setHouseNumber}
              className="border border-gray-300 px-4 py-3 rounded-lg bg-gray-50 mb-2"
              placeholderTextColor="#9CA3AF"
            />

            {/* Street Name */}
            <TextInput
              placeholder="Street Name (e.g. Hay Rd)"
              value={streetName}
              onChangeText={setStreetName}
              className="border border-gray-300 px-4 py-3 rounded-lg bg-gray-50 mb-2"
              placeholderTextColor="#9CA3AF"
            />

            {/* Neighbourhood */}
            <TextInput
              placeholder="Neighbourhood (e.g. ShashiView)"
              value={neighbourhood}
              onChangeText={setNeighbourhood}
              className="border border-gray-300 px-4 py-3 rounded-lg bg-gray-50 mb-2"
              placeholderTextColor="#9CA3AF"
            />

            {/* City/Town */}
            <TextInput
              placeholder="City/Town (e.g. Bindura)"
              value={cityTown}
              onChangeText={setCityTown}
              className="border border-gray-300 px-4 py-3 rounded-lg bg-gray-50"
              placeholderTextColor="#9CA3AF"
            />

            {/* Preview of combined address */}
            {getFullAddress() && (
              <Text className="text-xs text-gray-500 mt-2">
                Full address: {getFullAddress()}
              </Text>
            )}
          </View>

          {/* Price - changes based on property type */}
          <View className="mb-4">
            <Text className="text-sm font-rubik-medium text-gray-700 mb-1">
              {isBoardingHouse ? "Price (per head)" : "Price (per month)"}{" "}
              <Text className="text-red-500">*</Text>
            </Text>
            <View className="flex-row items-center border border-gray-300 rounded-lg bg-gray-50">
              <Text className="px-3 text-gray-500 font-rubik-medium">$</Text>
              <TextInput
                placeholder="1500"
                value={price}
                onChangeText={setPrice}
                keyboardType="numeric"
                className="flex-1 px-4 py-3"
                placeholderTextColor="#9CA3AF"
              />
            </View>
          </View>

          {/* Area */}
          <View className="mb-4">
            <Text className="text-sm font-rubik-medium text-gray-700 mb-1">
              Property Area (sq m.) <Text className="text-red-500">*</Text>
            </Text>
            <View className="flex-row items-center border border-gray-300 rounded-lg bg-gray-50">
              <TextInput
                placeholder="850"
                value={area}
                onChangeText={setArea}
                keyboardType="numeric"
                className="flex-1 px-4 py-3"
                placeholderTextColor="#9CA3AF"
              />
              <Text className="px-3 text-gray-500 font-rubik-medium">
                sq ft
              </Text>
            </View>
          </View>

          {/* Bedrooms & Bathrooms row */}
          <View className="flex-row gap-4 mb-4">
            <View className="flex-1">
              <Text className="text-sm font-rubik-medium text-gray-700 mb-1">
                Bedrooms <Text className="text-red-500">*</Text>
              </Text>
              <TextInput
                placeholder="2"
                value={bedrooms}
                onChangeText={setBedrooms}
                keyboardType="numeric"
                className="border border-gray-300 px-4 py-3 rounded-lg bg-gray-50"
                placeholderTextColor="#9CA3AF"
              />
            </View>
            <View className="flex-1">
              <Text className="text-sm font-rubik-medium text-gray-700 mb-1">
                Bathrooms <Text className="text-red-500">*</Text>
              </Text>
              <TextInput
                placeholder="1"
                value={bathrooms}
                onChangeText={setBathrooms}
                keyboardType="numeric"
                className="border border-gray-300 px-4 py-3 rounded-lg bg-gray-50"
                placeholderTextColor="#9CA3AF"
              />
            </View>
          </View>

          {/* Boarding House Specific Fields */}
          {isBoardingHouse && (
            <>
              {/* Room For (Number of people) */}
              <View className="mb-4">
                <Text className="text-sm font-rubik-medium text-gray-700 mb-1">
                  Room For (people) <Text className="text-red-500">*</Text>
                </Text>
                <TextInput
                  placeholder="3"
                  value={roomFor}
                  onChangeText={setRoomFor}
                  keyboardType="numeric"
                  className="border border-gray-300 px-4 py-3 rounded-lg bg-gray-50"
                  placeholderTextColor="#9CA3AF"
                />
              </View>

              {/* Curfew */}
              <View className="mb-4">
                <Text className="text-sm font-rubik-medium text-gray-700 mb-1">
                  Curfew <Text className="text-red-500">*</Text>
                </Text>
                <TouchableOpacity
                  onPress={() => setCurfewModalVisible(true)}
                  className="border border-gray-300 px-4 py-3 rounded-lg bg-gray-50 flex-row justify-between items-center"
                >
                  <Text className={curfew ? "text-black-300" : "text-gray-400"}>
                    {curfew && curfewAmPm
                      ? `${curfew} ${curfewAmPm}`
                      : "Select curfew time"}
                  </Text>
                  <Text className="text-gray-400">▼</Text>
                </TouchableOpacity>
              </View>
            </>
          )}

          {/* Facilities - Multi-select Dropdown */}
          <View className="mb-6">
            <Text className="text-sm font-rubik-medium text-gray-700 mb-1">
              Facilities <Text className="text-red-500">*</Text>
            </Text>
            <TouchableOpacity
              onPress={() => setFacilitiesModalVisible(true)}
              className="border border-gray-300 px-4 py-3 rounded-lg bg-gray-50"
            >
              {selectedFacilities.length > 0 ? (
                <View className="flex-row flex-wrap">
                  {selectedFacilities.slice(0, 3).map((facility, index) => (
                    <View
                      key={index}
                      className="bg-primary-100 px-2 py-1 rounded-full mr-2 mb-1"
                    >
                      <Text className="text-primary-300 text-xs font-rubik-medium">
                        {facility}
                      </Text>
                    </View>
                  ))}
                  {selectedFacilities.length > 3 && (
                    <View className="bg-gray-200 px-2 py-1 rounded-full">
                      <Text className="text-gray-600 text-xs font-rubik-medium">
                        +{selectedFacilities.length - 3} more
                      </Text>
                    </View>
                  )}
                </View>
              ) : (
                <Text className="text-gray-400">Select facilities</Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Image Upload Section */}
          <View className="mb-6">
            <Text className="text-sm font-rubik-medium text-gray-700 mb-2">
              Property Images <Text className="text-red-500">*</Text> (max 3)
            </Text>

            <TouchableOpacity
              onPress={pickImage}
              className="bg-gray-100 py-6 rounded-lg border-2 border-dashed border-gray-300 mb-3 items-center justify-center"
              disabled={images.length >= 3}
            >
              <Text className="text-3xl mb-2">📸</Text>
              <Text className="text-center text-gray-600 font-rubik-medium">
                {images.length === 0
                  ? "Tap to upload images"
                  : `Add more images (${images.length}/3)`}
              </Text>
              <Text className="text-center text-gray-500 text-xs mt-1">
                Supported: JPG, PNG, GIF
              </Text>
            </TouchableOpacity>

            {/* Image Previews */}
            {images.length > 0 && (
              <View>
                <Text className="text-sm font-rubik-medium text-gray-700 mb-2">
                  Selected Images:
                </Text>
                <View className="flex-row flex-wrap gap-3">
                  {images.map((img, idx) => (
                    <View key={idx} className="relative">
                      <Image
                        source={{ uri: img.uri }}
                        className="w-24 h-24 rounded-lg border border-gray-200"
                      />
                      <TouchableOpacity
                        onPress={() => removeImage(idx)}
                        className="absolute -top-2 -right-2 bg-red-500 rounded-full w-6 h-6 items-center justify-center shadow-md"
                      >
                        <Text className="text-white font-bold text-lg">×</Text>
                      </TouchableOpacity>
                      <View className="absolute bottom-1 left-1 bg-black/60 px-2 py-0.5 rounded">
                        <Text className="text-white text-xs font-rubik">
                          {idx === 0 ? "Main" : `#${idx + 1}`}
                        </Text>
                      </View>
                    </View>
                  ))}
                </View>
              </View>
            )}
          </View>

          {/* Submit Button */}
          <TouchableOpacity
            onPress={handleSubmit}
            disabled={loading}
            className={`py-4 rounded-lg mb-8 ${loading ? "bg-gray-400" : "bg-primary-300"}`}
          >
            {loading ? (
              <View className="flex-row items-center justify-center">
                <ActivityIndicator size="small" color="#FFFFFF" />
                <Text className="text-white text-center text-lg font-rubik-bold ml-2">
                  Saving...
                </Text>
              </View>
            ) : (
              <Text className="text-white text-center text-lg font-rubik-bold">
                Save Listing
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Modals */}
      {renderTypeModal()}
      {renderFacilitiesModal()}
      {renderCurfewModal()}
    </SafeAreaView>
  );
};

export default AddPropertyScreen;
