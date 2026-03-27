// app/(root)/change-email.tsx
import { Colors } from "@/constants/Colors";
import icons from "@/constants/icons";
import { account } from "@/lib/appwrite";
import useAuthStore from "@/store/auth.store";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  Image,
  Text,
  TextInput,
  TouchableOpacity,
  useColorScheme,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function ChangeEmailScreen() {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? "light"];
  const { user, updateUser } = useAuthStore(); // ✅ Use updateUser instead of setUser
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");

  const handleChangeEmail = async () => {
    if (!email.trim()) {
      Alert.alert("Error", "Please enter an email address");
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      Alert.alert("Error", "Please enter a valid email address");
      return;
    }

    if (email.trim() === user?.email) {
      Alert.alert("Error", "New email is the same as current email");
      return;
    }

    if (!currentPassword) {
      Alert.alert("Error", "Please enter your current password");
      return;
    }

    setLoading(true);
    try {
      // First, update the email in Appwrite Auth
      await account.updateEmail(email.trim(), currentPassword);

      // Update user document in database using the updateUser method
      if (user?.$id) {
        const result = await updateUser({ email: email.trim() });

        if (!result.success) {
          throw new Error(result.error);
        }
      }

      Alert.alert("Success", "Email updated successfully", [
        { text: "OK", onPress: () => router.back() },
      ]);
    } catch (error: any) {
      console.error("Error updating email:", error);

      // Handle specific error messages
      if (error?.message?.includes("Invalid credentials")) {
        Alert.alert("Error", "Current password is incorrect");
      } else if (error?.message?.includes("Email already exists")) {
        Alert.alert("Error", "This email is already in use");
      } else if (error?.message?.includes("Email not allowed")) {
        Alert.alert("Error", "This email domain is not allowed");
      } else {
        Alert.alert("Error", "Failed to update email. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.background }}>
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
          Change Email
        </Text>
      </View>

      <View className="p-5">
        {/* Current Email Display */}
        <View className="mb-4">
          <Text
            className="text-sm font-rubik-medium mb-2"
            style={{ color: theme.muted }}
          >
            Current Email
          </Text>
          <View
            className="border rounded-lg px-4 py-3"
            style={{
              backgroundColor: theme.surface,
              borderColor: theme.muted + "50",
            }}
          >
            <Text style={{ color: theme.text }}>
              {user?.email || "Not set"}
            </Text>
          </View>
        </View>

        {/* Current Password Input */}
        <View className="mb-4">
          <Text
            className="text-sm font-rubik-medium mb-2"
            style={{ color: theme.muted }}
          >
            Current Password <Text className="text-red-500">*</Text>
          </Text>
          <TextInput
            value={currentPassword}
            onChangeText={setCurrentPassword}
            placeholder="Enter your current password"
            secureTextEntry
            className="border rounded-lg px-4 py-3"
            style={{
              backgroundColor: theme.surface,
              borderColor: theme.muted + "50",
              color: theme.text,
            }}
            placeholderTextColor={theme.muted}
          />
        </View>

        {/* New Email Input */}
        <View className="mb-4">
          <Text
            className="text-sm font-rubik-medium mb-2"
            style={{ color: theme.muted }}
          >
            New Email Address <Text className="text-red-500">*</Text>
          </Text>
          <TextInput
            value={email}
            onChangeText={setEmail}
            placeholder="Enter your new email"
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            className="border rounded-lg px-4 py-3"
            style={{
              backgroundColor: theme.surface,
              borderColor: theme.muted + "50",
              color: theme.text,
            }}
            placeholderTextColor={theme.muted}
          />
          <Text className="text-xs mt-1" style={{ color: theme.muted }}>
            You&apos;ll need to use this email for future logins
          </Text>
        </View>

        {/* Update Button */}
        <TouchableOpacity
          onPress={handleChangeEmail}
          disabled={loading || !email.trim() || !currentPassword}
          className={`py-3 rounded-lg ${
            loading || !email.trim() || !currentPassword
              ? "bg-gray-400"
              : "bg-primary-300"
          }`}
        >
          <Text className="text-white text-center font-rubik-bold">
            {loading ? "Updating..." : "Update Email"}
          </Text>
        </TouchableOpacity>

        {/* Info Note */}
        <View
          className="mt-6 p-4 rounded-lg"
          style={{ backgroundColor: theme.primary[100] + "30" }}
        >
          <Text className="text-xs text-center" style={{ color: theme.muted }}>
            Note: After changing your email, you&apos;ll need to use the new
            email address to sign in. A verification email may be sent to your
            new email address.
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}
