// app/(auth)/sign-in.tsx (or src/screens/SignIn.tsx)
import CustomInput from "@/components/CustomInput";
import { Colors } from "@/constants/Colors";
import images from "@/constants/images";
import useAuthStore from "@/store/auth.store";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
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

const SignIn = () => {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { signIn } = useAuth();

  const fetchAuthenticatedUser = useAuthStore(
    (state) => state.fetchAuthenticatedUser,
  );

  const handleSignIn = async () => {
    if (!email || !password) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }

    setIsLoading(true);
    const result = await signIn(email, password);
    setIsLoading(false);

    if (result.success) {
      await fetchAuthenticatedUser();
      console.log("Signed in successfully");
    } else {
      Alert.alert("Error", result.error);
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
            {/* House Banner - Same as SignUp */}
            <Image
              source={images.nightHouse2}
              className="w-full h-96"
              resizeMode="cover"
            />

            {/* Content Container - Overlapping effect with rounded top corners */}
            <View
              className="flex-1 px-6 pt-8 pb-8 -mt-8 rounded-t-3xl"
              style={{ backgroundColor: theme.navBackground }}
            >
              {/* Back Button */}
              <TouchableOpacity
                onPress={() => router.back()}
                className="w-10 h-10 mb-4 items-center justify-center"
              >
                <Ionicons name="arrow-back" size={24} color={theme.title} />
              </TouchableOpacity>

              {/* Title */}
              <Text
                className="text-3xl font-semibold text-gray-900 mb-2"
                style={{ color: theme.title }}
              >
                Welcome Back
              </Text>
              <Text
                className="text-gray-500 text-base mb-8"
                style={{ color: theme.title }}
              >
                Sign in to continue to your account
              </Text>

              {/* Form */}
              <View className="space-y-4">
                {/* Email Field - Using CustomInput */}
                <CustomInput
                  label="Email"
                  value={email}
                  onChangeText={setEmail}
                  placeholder="Enter your email"
                  keyboardType="email-address"
                  autoCapitalize="none"
                />

                {/* Password Field - Using CustomInput */}
                <CustomInput
                  label="Password"
                  value={password}
                  onChangeText={setPassword}
                  placeholder="Enter your password"
                  secureTextEntry
                />

                {/* Forgot Password Link */}
                <TouchableOpacity className="self-end mt-2">
                  <Text className="text-sm text-blue-600 font-medium">
                    Forgot Password?
                  </Text>
                </TouchableOpacity>

                {/* Sign In Button */}
                <TouchableOpacity
                  onPress={handleSignIn}
                  disabled={isLoading}
                  className={`w-full py-4 rounded-2xl mt-6 ${
                    isLoading ? "bg-orange-500" : "bg-blue-600"
                  }`}
                >
                  <Text className="text-white text-center font-semibold text-base">
                    {isLoading ? "Signing In..." : "Sign In"}
                  </Text>
                </TouchableOpacity>

                {/* Sign Up Link */}
                <View className="flex-row justify-center mt-6">
                  <Text className="text-gray-600">Don't have an account? </Text>
                  <TouchableOpacity onPress={() => router.push("/sign-up")}>
                    <Text className="text-orange-500 font-semibold">
                      Sign Up
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

export default SignIn;
