// app/landlord/myDashboard.tsx
import MyPropertiesModal from "@/components/myPropertiesModal";
import icons from "@/constants/icons";
import { config, databases, getRecentActivities } from "@/lib/appwrite";
import useAuthStore from "@/store/auth.store";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  RefreshControl,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Query } from "react-native-appwrite";
import { SafeAreaView } from "react-native-safe-area-context";

interface PropertySummary {
  $id: string;
  propertyName: string;
  type: string;
  address: string;
  price: number;
  isAvailable?: boolean;
  description?: string;
  bedrooms?: number;
  bathrooms?: number;
  area?: number;
  image1?: string;
  image2?: string;
  image3?: string;
  rating?: number;
  likes?: number;
  views?: number;
  createdAt: string;
}

interface DashboardStats {
  totalProperties: number;
  totalLikes: number;
  averageRating: number;
  totalViews: number;
}

export default function LandlordDashboard() {
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [properties, setProperties] = useState<PropertySummary[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    totalProperties: 0,
    totalLikes: 0,
    averageRating: 0,
    totalViews: 0,
  });
  const [recentActivity, setRecentActivity] = useState<any[]>([]);

  // Modal States
  const [propertiesModalVisible, setPropertiesModalVisible] = useState(false);

  // Edit Modal State
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingProperty, setEditingProperty] =
    useState<PropertySummary | null>(null);
  const [editForm, setEditForm] = useState({
    propertyName: "",
    description: "",
    price: "",
    bedrooms: "",
    bathrooms: "",
    area: "",
    type: "",
    isAvailable: true,
    address: "",
  });
  const [savingEdit, setSavingEdit] = useState(false);

  // ============================================================================
  // FETCH DASHBOARD DATA
  // ============================================================================
  const fetchDashboardData = async () => {
    if (!user?.accountId) return;

    try {
      // Get all properties for this landlord
      const propertiesResult = await databases.listDocuments(
        config.databaseId!,
        config.propertiesCollectionId!,
        [
          Query.equal("creatorId", user.accountId),
          Query.orderDesc("$createdAt"),
          Query.limit(10),
        ],
      );

      const propertyList = propertiesResult.documents.map((doc) => ({
        $id: doc.$id,
        propertyName: doc.propertyName || "Unnamed Property",
        type: doc.type || "Property",
        address: doc.address || "",
        price: doc.price || 0,
        description: doc.description || "",
        bedrooms: doc.bedrooms || 0,
        bathrooms: doc.bathrooms || 0,
        area: doc.area || 0,
        image1: doc.image1,
        image2: doc.image2,
        image3: doc.image3,
        rating: doc.rating || 0,
        likes: doc.likes || 0,
        views: Math.floor(Math.random() * 100), // Placeholder - replace with real view tracking
        createdAt: doc.$createdAt,
      }));

      setProperties(propertyList);

      // Calculate stats
      const totalLikes = propertyList.reduce(
        (sum, p) => sum + (p.likes || 0),
        0,
      );
      const avgRating =
        propertyList.length > 0
          ? propertyList.reduce((sum, p) => sum + (p.rating || 0), 0) /
            propertyList.length
          : 0;

      setStats({
        totalProperties: propertyList.length,
        totalLikes,
        averageRating: Number(avgRating.toFixed(1)),
        totalViews: propertyList.reduce((sum, p) => sum + (p.views || 0), 0),
      });

      // ✅ GET REAL ACTIVITIES FROM DATABASE
      const activities = await getRecentActivities(user.accountId, 10);
      setRecentActivity(activities);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchDashboardData();
  };

  const handlePropertyPress = (propertyId: string) => {
    router.push(`/properties/${propertyId}`);
  };

  const handleAddProperty = () => {
    router.push("/addProperty");
  };

  // ============================================================================
  // EDIT MODAL FUNCTIONS
  // ============================================================================
  const openEditModal = (property: PropertySummary) => {
    setEditingProperty(property);
    setEditForm({
      propertyName: property.propertyName || "",
      description: property.description || "",
      price: property.price?.toString() || "",
      bedrooms: property.bedrooms?.toString() || "",
      bathrooms: property.bathrooms?.toString() || "",
      area: property.area?.toString() || "",
      type: property.type || "",
      address: property.address || "",
      isAvailable: property.isAvailable !== false,
    });
    setEditModalVisible(true);
  };

  const closeEditModal = () => {
    setEditModalVisible(false);
    setEditingProperty(null);
    setEditForm({
      propertyName: "",
      description: "",
      price: "",
      bedrooms: "",
      bathrooms: "",
      area: "",
      type: "",
      address: "",
      isAvailable: true,
    });
  };

  const handleEditChange = (field: string, value: string) => {
    setEditForm({ ...editForm, [field]: value });
  };

  const toggleAvailability = () => {
    setEditForm({ ...editForm, isAvailable: !editForm.isAvailable });
  };

  const handleSaveEdit = async () => {
    if (!editingProperty) return;

    // Validation
    if (!editForm.propertyName.trim() || !editForm.price.trim()) {
      Alert.alert("Error", "Property name and price are required");
      return;
    }

    setSavingEdit(true);
    try {
      await databases.updateDocument(
        config.databaseId!,
        config.propertiesCollectionId!,
        editingProperty.$id,
        {
          propertyName: editForm.propertyName,
          description: editForm.description,
          price: Number(editForm.price),
          bedrooms: Number(editForm.bedrooms) || 0,
          bathrooms: Number(editForm.bathrooms) || 0,
          area: Number(editForm.area) || 0,
          type: editForm.type,
          address: editForm.address,
          isAvailable: editForm.isAvailable,
        },
      );

      // Update local state
      const updatedProperties = properties.map((p) =>
        p.$id === editingProperty.$id
          ? {
              ...p,
              propertyName: editForm.propertyName,
              description: editForm.description,
              price: Number(editForm.price),
              bedrooms: Number(editForm.bedrooms) || 0,
              bathrooms: Number(editForm.bathrooms) || 0,
              area: Number(editForm.area) || 0,
              type: editForm.type,
              address: editForm.address,
              isAvailable: editForm.isAvailable,
            }
          : p,
      );
      setProperties(updatedProperties);

      Alert.alert("Success", "Property updated successfully");
      closeEditModal();
    } catch (error) {
      console.error("Error updating property:", error);
      Alert.alert("Error", "Failed to update property");
    } finally {
      setSavingEdit(false);
    }
  };

  // ============================================================================
  // STAT CARD COMPONENT
  // ============================================================================
  const StatCard = ({ title, value, icon, color }: any) => (
    <View className="bg-white p-4 rounded-xl flex-1 shadow-sm border border-gray-100">
      <View className="flex-row items-center mb-2">
        <View
          style={{ backgroundColor: color + "20" }}
          className="p-2 rounded-lg"
        >
          <Image
            source={icon}
            className="size-5"
            style={{ tintColor: color }}
          />
        </View>
      </View>
      <Text className="text-2xl font-rubik-bold text-black-300">{value}</Text>
      <Text className="text-xs text-gray-500 font-rubik">{title}</Text>
    </View>
  );

  // ============================================================================
  // EDIT MODAL RENDER
  // ============================================================================
  const renderEditModal = () => (
    <Modal
      animationType="slide"
      transparent={true}
      visible={editModalVisible}
      onRequestClose={closeEditModal}
    >
      <View className="flex-1 justify-end bg-black/50">
        <View className="bg-white rounded-t-3xl h-5/6">
          <View className="flex-row justify-between items-center p-6 border-b border-gray-200">
            <Text className="text-xl font-rubik-bold text-black-300">
              Edit Property
            </Text>
            <TouchableOpacity onPress={closeEditModal}>
              <Text className="text-2xl">✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView className="p-6" showsVerticalScrollIndicator={false}>
            {/* Property Name */}
            <View className="mb-4">
              <Text className="text-sm font-rubik-medium text-gray-700 mb-1">
                Property Name <Text className="text-red-500">*</Text>
              </Text>
              <TextInput
                value={editForm.propertyName}
                onChangeText={(text) => handleEditChange("propertyName", text)}
                className="border border-gray-300 px-4 py-3 rounded-lg bg-gray-50"
                placeholder="e.g. Sunset Apartments"
              />
            </View>

            {/* Type */}
            <View className="mb-4">
              <Text className="text-sm font-rubik-medium text-gray-700 mb-1">
                Property Type
              </Text>
              <TextInput
                value={editForm.type}
                onChangeText={(text) => handleEditChange("type", text)}
                className="border border-gray-300 px-4 py-3 rounded-lg bg-gray-50"
                placeholder="e.g. Apartment, House"
              />
            </View>

            {/* Address */}
            <View className="mb-4">
              <Text className="text-sm font-rubik-medium text-gray-700 mb-1">
                Address
              </Text>
              <TextInput
                value={editForm.address}
                onChangeText={(text) => handleEditChange("address", text)}
                className="border border-gray-300 px-4 py-3 rounded-lg bg-gray-50"
                placeholder="Full address"
              />
            </View>

            {/* Price */}
            <View className="mb-4">
              <Text className="text-sm font-rubik-medium text-gray-700 mb-1">
                Price (per month) <Text className="text-red-500">*</Text>
              </Text>
              <View className="flex-row items-center border border-gray-300 rounded-lg bg-gray-50">
                <Text className="px-3 text-gray-500 font-rubik-medium">$</Text>
                <TextInput
                  value={editForm.price}
                  onChangeText={(text) => handleEditChange("price", text)}
                  keyboardType="numeric"
                  className="flex-1 px-4 py-3"
                  placeholder="1500"
                />
              </View>
            </View>

            {/* Bedrooms & Bathrooms row */}
            <View className="flex-row gap-4 mb-4">
              <View className="flex-1">
                <Text className="text-sm font-rubik-medium text-gray-700 mb-1">
                  Bedrooms
                </Text>
                <TextInput
                  value={editForm.bedrooms}
                  onChangeText={(text) => handleEditChange("bedrooms", text)}
                  keyboardType="numeric"
                  className="border border-gray-300 px-4 py-3 rounded-lg bg-gray-50"
                  placeholder="2"
                />
              </View>
              <View className="flex-1">
                <Text className="text-sm font-rubik-medium text-gray-700 mb-1">
                  Bathrooms
                </Text>
                <TextInput
                  value={editForm.bathrooms}
                  onChangeText={(text) => handleEditChange("bathrooms", text)}
                  keyboardType="numeric"
                  className="border border-gray-300 px-4 py-3 rounded-lg bg-gray-50"
                  placeholder="1"
                />
              </View>
            </View>

            {/* Area */}
            <View className="mb-4">
              <Text className="text-sm font-rubik-medium text-gray-700 mb-1">
                Area (sq ft)
              </Text>
              <TextInput
                value={editForm.area}
                onChangeText={(text) => handleEditChange("area", text)}
                keyboardType="numeric"
                className="border border-gray-300 px-4 py-3 rounded-lg bg-gray-50"
                placeholder="850"
              />
            </View>

            {/* Description */}
            <View className="mb-6">
              <Text className="text-sm font-rubik-medium text-gray-700 mb-1">
                Description
              </Text>
              <TextInput
                value={editForm.description}
                onChangeText={(text) => handleEditChange("description", text)}
                className="border border-gray-300 px-4 py-3 rounded-lg bg-gray-50 h-24"
                multiline
                numberOfLines={4}
                textAlignVertical="top"
                placeholder="Describe your property..."
              />
            </View>

            {/* AVAILABILITY TOGGLE */}
            <View className="mb-6">
              <Text className="text-sm font-rubik-medium text-gray-700 mb-3">
                Availability Status
              </Text>

              <TouchableOpacity
                onPress={toggleAvailability}
                className={`flex-row items-center justify-between p-4 rounded-xl border ${
                  editForm.isAvailable
                    ? "bg-green-50 border-green-300"
                    : "bg-red-50 border-red-300"
                }`}
              >
                <View className="flex-row items-center">
                  <View
                    className={`w-10 h-10 rounded-full items-center justify-center ${
                      editForm.isAvailable ? "bg-green-100" : "bg-red-100"
                    }`}
                  >
                    <Text
                      className={`text-xl ${
                        editForm.isAvailable ? "text-green-600" : "text-red-600"
                      }`}
                    >
                      {editForm.isAvailable ? "✓" : "✕"}
                    </Text>
                  </View>
                  <View className="ml-3">
                    <Text className="text-base font-rubik-bold text-black-300">
                      {editForm.isAvailable
                        ? "Available for Rent"
                        : "Not Available"}
                    </Text>
                    <Text className="text-xs text-gray-500">
                      {editForm.isAvailable
                        ? "Property is visible to tenants"
                        : "Property is hidden from search"}
                    </Text>
                  </View>
                </View>

                {/* Toggle Switch */}
                <View
                  className={`w-12 h-6 rounded-full ${
                    editForm.isAvailable ? "bg-green-500" : "bg-gray-300"
                  }`}
                >
                  <View
                    className={`w-5 h-5 rounded-full bg-white absolute top-0.5 ${
                      editForm.isAvailable ? "right-0.5" : "left-0.5"
                    }`}
                  />
                </View>
              </TouchableOpacity>
            </View>

            {/* Action Buttons */}
            <View className="flex-row gap-3 mb-10">
              <TouchableOpacity
                onPress={closeEditModal}
                className="flex-1 border border-gray-300 py-4 rounded-full"
              >
                <Text className="text-center text-gray-600 font-rubik-bold">
                  Cancel
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleSaveEdit}
                disabled={savingEdit}
                className={`flex-1 py-4 rounded-full ${
                  savingEdit ? "bg-gray-400" : "bg-primary-300"
                }`}
              >
                <Text className="text-white text-center font-rubik-bold">
                  {savingEdit ? "Saving..." : "Save Changes"}
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );

  // ============================================================================
  // MAIN RENDER
  // ============================================================================
  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-white justify-center items-center">
        <ActivityIndicator size="large" className="text-primary-300" />
        <Text className="mt-4 text-gray-600">Loading dashboard...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Header */}
        <View className="px-6 pt-4 pb-2 bg-white">
          <View className="flex-row justify-between items-center">
            <View>
              <Text className="text-2xl font-rubik-bold text-black-300">
                Welcome back,
              </Text>
              <Text className="text-xl font-rubik-medium text-primary-300">
                {user?.name}
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => router.push("/notifications")}
              className="bg-gray-100 p-2 rounded-full"
            >
              <Image source={icons.bell} className="size-6" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Stats Section */}
        <View className="px-6 mt-6">
          <Text className="text-lg font-rubik-bold text-black-300 mb-4">
            Overview
          </Text>
          <View className="flex-row gap-3">
            <StatCard
              title="Total Properties"
              value={stats.totalProperties}
              icon={icons.home}
              color="#0066CC"
            />
            <StatCard
              title="Total Likes"
              value={stats.totalLikes}
              icon={icons.heart}
              color="#FF69B4"
            />
          </View>
          <View className="flex-row gap-3 mt-3">
            <StatCard
              title="Avg Rating"
              value={stats.averageRating}
              icon={icons.star}
              color="#FDB241"
            />
            <StatCard
              title="Total Views"
              value={stats.totalViews}
              icon={icons.eye}
              color="#10B981"
            />
          </View>
        </View>

        {/* Quick Actions */}
        <View className="px-6 mt-6">
          <Text className="text-lg font-rubik-bold text-black-300 mb-3">
            Quick Actions
          </Text>
          <View className="flex-row gap-3">
            <TouchableOpacity
              onPress={handleAddProperty}
              className="flex-1 bg-primary-300 p-4 rounded-xl flex-row items-center justify-center"
            >
              <Image
                source={icons.plus}
                className="size-5 mr-2"
                style={{ tintColor: "white" }}
              />
              <Text className="text-white font-rubik-bold">Add Property</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Properties List */}
        <View className="px-6 mt-6">
          <View className="flex-row justify-between items-center mb-3">
            <Text className="text-lg font-rubik-bold text-black-300">
              Your Properties
            </Text>
            {properties.length > 0 && (
              <TouchableOpacity onPress={() => setPropertiesModalVisible(true)}>
                <Text className="text-primary-300 font-rubik-medium">
                  See All
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {properties.length === 0 ? (
            <View className="bg-white p-8 rounded-xl items-center border border-dashed border-gray-300">
              <Image source={icons.home} className="size-16 mb-4 opacity-30" />
              <Text className="text-gray-500 text-center font-rubik-medium mb-2">
                No properties yet
              </Text>
              <Text className="text-gray-400 text-center text-sm mb-4">
                Start by adding your first property
              </Text>
              <TouchableOpacity
                onPress={handleAddProperty}
                className="bg-primary-300 px-6 py-3 rounded-full"
              >
                <Text className="text-white font-rubik-bold">Add Property</Text>
              </TouchableOpacity>
            </View>
          ) : (
            properties.slice(0, 3).map((property) => (
              <View
                key={property.$id}
                className="bg-white p-4 rounded-xl mb-3 shadow-sm border border-gray-100"
              >
                <TouchableOpacity
                  onPress={() => handlePropertyPress(property.$id)}
                  activeOpacity={0.7}
                >
                  <View className="flex-row">
                    {/* Property Image */}
                    <View className="w-20 h-20 bg-gray-200 rounded-lg overflow-hidden mr-3">
                      {property.image1 ? (
                        <Image
                          source={{ uri: property.image1 }}
                          className="w-full h-full"
                          resizeMode="cover"
                        />
                      ) : (
                        <View className="w-full h-full items-center justify-center">
                          <Image
                            source={icons.home}
                            className="size-8 opacity-30"
                          />
                        </View>
                      )}
                    </View>

                    {/* Property Details */}
                    <View className="flex-1">
                      <View className="flex-row justify-between">
                        <Text className="text-base font-rubik-bold text-black-300 flex-1">
                          {property.propertyName}
                        </Text>
                        <View className="flex-row items-center">
                          <Image source={icons.star} className="size-3 mr-1" />
                          <Text className="text-sm text-gray-600">
                            {property.rating?.toFixed(1) || "0.0"}
                          </Text>
                        </View>
                      </View>

                      <Text
                        className="text-xs text-gray-500 mt-1"
                        numberOfLines={1}
                      >
                        {property.address}
                      </Text>

                      <View className="flex-row justify-between items-center mt-2">
                        <Text className="text-primary-300 font-rubik-bold">
                          ${property.price.toLocaleString()}
                          <Text className="text-primary-300 text-xs">
                            {property.type === "Boarding" ? "/head" : "/mo"}
                          </Text>
                        </Text>
                        <View className="flex-row items-center">
                          <Image
                            source={icons.heart}
                            className="size-4 mr-1"
                            style={{ tintColor: "#FF69B4" }}
                          />
                          <Text className="text-xs text-gray-600 mr-3">
                            {property.likes || 0}
                          </Text>
                          <Image
                            source={icons.eye}
                            className="size-4 mr-1"
                            style={{ tintColor: "#10B981" }}
                          />
                          <Text className="text-xs text-gray-600">
                            {property.views || 0}
                          </Text>
                        </View>
                      </View>
                    </View>
                  </View>
                </TouchableOpacity>

                {/* Edit Button */}
                <TouchableOpacity
                  onPress={() => openEditModal(property)}
                  className="mt-3 border border-primary-300 py-2 rounded-full"
                >
                  <Text className="text-primary-300 text-center font-rubik-bold text-sm">
                    Edit Property
                  </Text>
                </TouchableOpacity>
              </View>
            ))
          )}
        </View>
      </ScrollView>

      {/* Properties Modal */}
      <MyPropertiesModal
        visible={propertiesModalVisible}
        onClose={() => setPropertiesModalVisible(false)}
        properties={properties}
        onPropertyPress={handlePropertyPress}
      />

      {/* Edit Modal */}
      {renderEditModal()}
    </SafeAreaView>
  );
}
