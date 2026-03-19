// app/(auth)/sign-up.tsx
import CustomInput from "@/components/CustomInput";
import { Colors } from "@/constants/Colors";
import images from "@/constants/images";
import useAuthStore from "@/store/auth.store";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  Text,
  TouchableOpacity,
  useColorScheme,
  View,
} from "react-native";
import { useAuth } from "../../context/AuthContext";

interface FormData {
  name: string;
  userMode: "tenant" | "landlord" | "";
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
  avatar: string;
}

const SignUp = () => {
  const router = useRouter();
  const [formData, setFormData] = useState<FormData>({
    name: "",
    userMode: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    avatar: "",
  });
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const { signUp, user } = useAuth();

  useEffect(() => {
    if (user) {
      if (user.userMode === "tenant") {
        router.replace("/tenantHome");
      } else if (user.userMode === "landlord") {
        router.replace("/landHome");
      }
    }
  }, [user, router]);

  const pickImage = async () => {
    try {
      const { status } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permission required",
          "Please allow photo access to upload avatar.",
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.7,
      });

      if (!result.canceled) {
        const uri = result.assets[0]?.uri;
        if (uri) {
          setFormData((prev) => ({ ...prev, avatar: uri }));
        }
      }
    } catch (error) {
      console.error("ImagePicker error:", error);
      Alert.alert("Error", "Could not open image library.");
    }
  };

  const fetchAuthenticatedUser = useAuthStore(
    (state) => state.fetchAuthenticatedUser,
  );

  // app/(auth)/sign-up.tsx (updated handleSignUp)
  const handleSignUp = async () => {
    // Validate required fields
    if (!formData.name?.trim()) {
      Alert.alert("Validation Error", "Please enter your full name");
      return;
    }

    if (!formData.userMode) {
      Alert.alert(
        "Validation Error",
        "Please select whether you're a renter or landlord",
      );
      return;
    }

    if (!formData.email?.trim()) {
      Alert.alert("Validation Error", "Please enter your email");
      return;
    }

    if (!formData.phone?.trim()) {
      Alert.alert("Validation Error", "Please enter your phone number");
      return;
    }

    if (!formData.password) {
      Alert.alert("Validation Error", "Please create a password");
      return;
    }

    if (formData.password.length < 8) {
      Alert.alert("Validation Error", "Password must be at least 8 characters");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      Alert.alert("Validation Error", "Passwords do not match");
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      Alert.alert("Validation Error", "Please enter a valid email address");
      return;
    }

    setIsLoading(true);

    try {
      console.log("Attempting signup with:", formData.email);
      const result = await signUp({
        ...formData,
        userMode: formData.userMode as "tenant" | "landlord",
      });

      console.log("Signup result:", result);

      if (result.success) {
        Alert.alert("Success", "Account created successfully!", [
          { text: "OK" },
        ]);
        await fetchAuthenticatedUser();
      } else {
        Alert.alert(
          "Sign Up Failed",
          result.error ||
            "Could not create account. Please check your information and try again.",
        );
      }
    } catch (error) {
      console.error("Sign up error:", error);
      Alert.alert(
        "Error",
        "An unexpected error occurred. Please check your internet connection and try again.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? "light"];

  return (
    <>
      <StatusBar
        barStyle="light-content"
        backgroundColor="transparent"
        translucent
      />
      <View className="flex-1" style={{ backgroundColor: theme.navBackground }}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          className="flex-1"
        >
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ flexGrow: 1 }}
            className="flex-1"
          >
            {/* House Banner - Now from the very top */}
            <Image
              source={images.dayHouse}
              className="w-full h-96"
              resizeMode="cover"
            />

            {/* Content Container - Overlapping effect with rounded top corners */}
            <View
              className="flex-1 px-6 pt-8 pb-8 -mt-8 rounded-t-3xl"
              style={{ backgroundColor: theme.navBackground }}
            >
              {/* Title */}
              <Text
                className="text-3xl font-semibold text-gray-900 mb-2"
                style={{ color: theme.title }}
              >
                Create account
              </Text>
              <Text className=" text-base mb-8" style={{ color: theme.title }}>
                Sign up to get started
              </Text>

              {/* Avatar Upload */}
              <TouchableOpacity
                onPress={pickImage}
                className="items-center mb-8"
              >
                <View className="w-20 h-20 rounded-full bg-gray-100 items-center justify-center border border-gray-200">
                  {formData.avatar ? (
                    <Image
                      source={{ uri: formData.avatar }}
                      className="w-20 h-20 rounded-full"
                    />
                  ) : (
                    <Ionicons name="camera-outline" size={24} color="#9CA3AF" />
                  )}
                </View>
                <Text className="text-sm text-gray-500 mt-2">
                  Add photo (optional)
                </Text>
              </TouchableOpacity>

              {/* Form */}
              <View className="space-y-4">
                {/* Full Name */}
                <CustomInput
                  label="Full name"
                  value={formData.name}
                  onChangeText={(text) =>
                    setFormData({ ...formData, name: text })
                  }
                  placeholder="Enter your full name"
                />

                {/* Email */}
                <CustomInput
                  label="Email"
                  value={formData.email}
                  onChangeText={(text) =>
                    setFormData({ ...formData, email: text })
                  }
                  placeholder="Enter your email"
                  keyboardType="email-address"
                  autoCapitalize="none"
                />

                {/* Phone */}
                <CustomInput
                  label="Phone number"
                  value={formData.phone}
                  onChangeText={(text) =>
                    setFormData({ ...formData, phone: text })
                  }
                  placeholder="Enter your phone number"
                  keyboardType="phone-pad"
                />

                {/* User Mode Toggle */}
                <View className="mb-4">
                  <Text className="text-sm font-medium text-gray-700 mb-2">
                    User Mode
                  </Text>
                  <View className="flex-row justify-between bg-gray-100 rounded-2xl p-1.5">
                    <TouchableOpacity
                      onPress={() =>
                        setFormData({ ...formData, userMode: "tenant" })
                      }
                      className={`flex-1 py-3 rounded-xl items-center ${
                        formData.userMode === "tenant" ? "bg-blue-600" : ""
                      }`}
                    >
                      <Text
                        className={`font-semibold ${
                          formData.userMode === "tenant"
                            ? "text-white"
                            : "text-gray-700"
                        }`}
                      >
                        Renter
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={() =>
                        setFormData({ ...formData, userMode: "landlord" })
                      }
                      className={`flex-1 py-3 rounded-xl items-center ${
                        formData.userMode === "landlord" ? "bg-blue-600" : ""
                      }`}
                    >
                      <Text
                        className={`font-semibold ${
                          formData.userMode === "landlord"
                            ? "text-white"
                            : "text-gray-700"
                        }`}
                      >
                        Landlord
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Password */}
                <CustomInput
                  label="Password"
                  value={formData.password}
                  onChangeText={(text) =>
                    setFormData({ ...formData, password: text })
                  }
                  placeholder="Create a password"
                  secureTextEntry
                />

                {/* Confirm Password */}
                <CustomInput
                  label="Confirm password"
                  value={formData.confirmPassword}
                  onChangeText={(text) =>
                    setFormData({ ...formData, confirmPassword: text })
                  }
                  placeholder="Confirm your password"
                  secureTextEntry
                />

                {/* Sign Up Button */}
                <TouchableOpacity
                  onPress={handleSignUp}
                  disabled={isLoading}
                  className={`w-full py-4 rounded-2xl mt-6 ${
                    isLoading ? "bg-orange-500" : "bg-blue-600"
                  }`}
                >
                  <Text className="text-white text-center font-semibold text-base">
                    {isLoading ? "Creating account..." : "Sign Up"}
                  </Text>
                </TouchableOpacity>

                {/* Sign In Link */}
                <View className="flex-row justify-center mt-6">
                  <Text className="text-gray-600">
                    Already have an account?{" "}
                  </Text>
                  <TouchableOpacity onPress={() => router.push("/sign-in")}>
                    <Text className="text-orange-500 font-semibold">
                      Sign In
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </View>
    </>
  );
};

export default SignUp;
