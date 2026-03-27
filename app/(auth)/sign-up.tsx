// app/(auth)/sign-up.tsx
import CustomInput from "@/components/CustomInput";
import ErrorModal from "@/components/ErrorModal";
import OperationSuccesfull from "@/components/OperationSuccesfull";
import { Colors } from "@/constants/Colors";
import images from "@/constants/images";
import { uploadImage } from "@/lib/appwrite";
import useAuthStore from "@/store/auth.store";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
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
  const [showSuccess, setShowSuccess] = useState(false);
  const [errorModalVisible, setErrorModalVisible] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [formData, setFormData] = useState<FormData>({
    name: "",
    userMode: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    avatar: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const { signUp, user, isAuthenticated } = useAuthStore();

  // Redirect when user is authenticated
  React.useEffect(() => {
    if (user && isAuthenticated) {
      if (user.userMode === "tenant") {
        router.replace("/tenantHome");
      } else if (user.userMode === "landlord") {
        router.replace("/landHome");
      }
    }
  }, [user, isAuthenticated, router]);

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
        aspect: [1, 1],
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

  const handleSignUp = async () => {
    // Validate all fields
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

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      Alert.alert("Validation Error", "Please enter a valid email address");
      return;
    }

    setIsLoading(true);
    let uploadedAvatarUrl = "";

    try {
      // Upload avatar if selected
      if (formData.avatar) {
        setUploadingAvatar(true);
        try {
          console.log("📸 Uploading avatar...");
          uploadedAvatarUrl = await uploadImage({
            uri: formData.avatar,
            fileName: `avatar_${Date.now()}.jpg`,
            mimeType: "image/jpeg",
          });
          console.log("✅ Avatar uploaded:", uploadedAvatarUrl);
        } catch (uploadError) {
          console.error("Error uploading avatar:", uploadError);
          // Continue with sign-up even if avatar upload fails
          Alert.alert(
            "Warning",
            "Could not upload avatar. You can add one later.",
          );
        } finally {
          setUploadingAvatar(false);
        }
      }

      console.log("Attempting signup with:", formData.email);
      const result = await signUp({
        name: formData.name,
        email: formData.email,
        password: formData.password,
        phone: formData.phone,
        userMode: formData.userMode as "tenant" | "landlord",
        avatar: uploadedAvatarUrl, // Pass the uploaded URL
      });

      console.log("Signup result:", result);

      if (result.success) {
        setShowSuccess(true);
        // The useEffect will handle redirect when user is set
      } else {
        setErrorMessage(result.error || "Could not create account");
        setErrorModalVisible(true);
      }
    } catch (error: any) {
      console.error("Sign up error:", error);
      setErrorMessage(error?.message || "An unexpected error occurred");
      setErrorModalVisible(true);
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
          keyboardVerticalOffset={Platform.OS === "ios" ? 64 : 0}
          style={{ flex: 1 }}
        >
          <ScrollView
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{
              flexGrow: 1,
              paddingBottom: 40,
            }}
          >
            {/* House Banner */}
            <Image
              source={images.dayHouse}
              className="w-full h-96"
              resizeMode="cover"
            />

            {/* Content Container */}
            <View
              className="flex-1 px-6 pt-8 pb-8 -mt-8 rounded-t-3xl"
              style={{ backgroundColor: theme.navBackground }}
            >
              <Text
                className="text-3xl font-semibold text-gray-900 mb-2"
                style={{ color: theme.title }}
              >
                Create account
              </Text>
              <Text className="text-base mb-8" style={{ color: theme.title }}>
                Sign up to get started
              </Text>

              {/* Avatar Upload */}
              <TouchableOpacity
                onPress={pickImage}
                disabled={uploadingAvatar}
                className="items-center mb-8"
              >
                <View className="w-20 h-20 rounded-full bg-gray-300 items-center justify-center border border-gray-200 relative">
                  {uploadingAvatar ? (
                    <ActivityIndicator
                      size="small"
                      color={theme.primary[300]}
                    />
                  ) : formData.avatar ? (
                    <Image
                      source={{ uri: formData.avatar }}
                      className="w-20 h-20 rounded-full"
                    />
                  ) : (
                    <Ionicons name="camera-outline" size={24} color="#9CA3AF" />
                  )}
                </View>
                <Text className="text-sm text-gray-500 font-rubik-medium mt-2">
                  {uploadingAvatar ? "Uploading..." : "Add Profile photo"}
                </Text>
              </TouchableOpacity>

              {/* Form Fields */}
              <View className="space-y-4">
                <CustomInput
                  label="Full name"
                  value={formData.name}
                  onChangeText={(text) =>
                    setFormData({ ...formData, name: text })
                  }
                  placeholder="Enter your full name"
                />

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
                  <Text className="text-sm font-medium text-gray-500 font-rubik-medium mb-2">
                    Select Your User Mode
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
                        Tenant
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

                <CustomInput
                  label="Password"
                  value={formData.password}
                  onChangeText={(text) =>
                    setFormData({ ...formData, password: text })
                  }
                  placeholder="Create a password"
                  secureTextEntry
                />

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
                  disabled={isLoading || uploadingAvatar}
                  className={`w-full py-4 rounded-2xl mt-6 ${
                    isLoading || uploadingAvatar ? "bg-gray-400" : "bg-blue-600"
                  }`}
                >
                  {isLoading ? (
                    <View className="flex-row items-center justify-center">
                      <ActivityIndicator size="small" color="#FFFFFF" />
                      <Text className="text-white text-center font-semibold text-base ml-2">
                        Creating account...
                      </Text>
                    </View>
                  ) : (
                    <Text className="text-white text-center font-semibold text-base">
                      Sign Up
                    </Text>
                  )}
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

        {/* Success Modal */}
        <OperationSuccesfull
          visible={showSuccess}
          onClose={() => {
            setShowSuccess(false);
          }}
          title="Account Created!"
          message="Your account has been created successfully. Redirecting..."
        />

        {/* Error Modal */}
        <ErrorModal
          visible={errorModalVisible}
          onClose={() => setErrorModalVisible(false)}
          title="Sign Up Failed"
          message={errorMessage}
        />
      </View>
    </>
  );
};

export default SignUp;
