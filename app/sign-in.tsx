// app/sign-up.tsx
import nightHouse2 from "@/assets/images/nightHouse2.jpg";
import CustomInput from "@/components/CustomInput";
import { createUser } from "@/lib/appwrite";
import { router, usePathname } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  ImageBackground,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";

const SignUp = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [userMode, setUserMode] = useState<"landlord" | "tenant">("tenant");

  // ✅ Call hook at component level
  const pathname = usePathname();

  const submit = async () => {
    const { name, email, password } = form;

    if (!name || !email || !password) {
      return Alert.alert("Error", "Please fill in all fields.");
    }

    setIsSubmitting(true);

    try {
      await createUser({ email, password, name, userMode });

      // ✅ Use pathname here`
      if (userMode === "landlord") {
        router.replace("/landHome");
      } else {
        router.replace("/tenantHome");
      }
    } catch (error: any) {
      Alert.alert("Error", error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={{ flex: 1, backgroundColor: "white" }}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ flexGrow: 1 }}
          style={{ backgroundColor: "white" }}
        >
          {/* Top Graphic */}
          <View style={{ height: Dimensions.get("screen").height / 2.25 }}>
            <ImageBackground
              source={nightHouse2}
              style={{
                flex: 1,
                justifyContent: "center",
                alignItems: "center",
              }}
              resizeMode="cover"
              imageStyle={{
                borderBottomLeftRadius: 16,
                borderBottomRightRadius: 16,
              }}
            >
              <Text
                style={{
                  fontSize: 32,
                  fontWeight: "bold",
                  color: "white",
                  textAlign: "center",
                  marginTop: 10,
                }}
              >
                Welcome to Rentify
              </Text>
            </ImageBackground>
          </View>

          {/* Form Section */}
          <View
            style={{
              gap: 24,
              backgroundColor: "white",
              borderRadius: 12,
              padding: 24,
              marginTop: 20,
            }}
          >
            <Text
              style={{
                fontSize: 20,
                fontWeight: "700",
                textAlign: "center",
                marginBottom: 16,
              }}
            >
              Create Your Account
            </Text>

            <CustomInput
              placeholder="Enter your full name"
              value={form.name}
              onChangeText={(text) =>
                setForm((prev) => ({ ...prev, name: text }))
              }
              label="Full Name"
            />
            <CustomInput
              placeholder="Enter your email"
              value={form.email}
              onChangeText={(text) =>
                setForm((prev) => ({ ...prev, email: text }))
              }
              label="Email"
              keyboardType="email-address"
            />
            <CustomInput
              placeholder="Enter your password"
              value={form.password}
              onChangeText={(text) =>
                setForm((prev) => ({ ...prev, password: text }))
              }
              label="Password"
              secureTextEntry={true}
            />

            {/* User Mode Toggler */}
            <View
              style={{
                flexDirection: "row",
                justifyContent: "center",
                gap: 16,
                marginTop: 16,
              }}
            >
              {["tenant", "landlord"].map((mode) => (
                <TouchableOpacity
                  key={mode}
                  onPress={() => setUserMode(mode as "landlord" | "tenant")}
                  style={{
                    paddingHorizontal: 24,
                    paddingVertical: 12,
                    borderRadius: 24,
                    borderWidth: 1,
                    backgroundColor: userMode === mode ? "#007BFF" : "white",
                    borderColor: userMode === mode ? "#007BFF" : "#ccc",
                  }}
                >
                  <Text
                    style={{
                      fontWeight: "700",
                      color: userMode === mode ? "white" : "#666",
                    }}
                  >
                    {mode.charAt(0).toUpperCase() + mode.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Submit Button */}
            <TouchableOpacity
              onPress={submit}
              disabled={isSubmitting}
              style={{
                width: "100%",
                backgroundColor: "#007BFF",
                borderRadius: 8,
                padding: 16,
                alignItems: "center",
                marginTop: 24,
                opacity: isSubmitting ? 0.5 : 1,
              }}
            >
              {isSubmitting ? (
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                  <ActivityIndicator color="white" style={{ marginRight: 8 }} />
                  <Text
                    style={{ color: "white", fontWeight: "700", fontSize: 18 }}
                  >
                    Creating Account...
                  </Text>
                </View>
              ) : (
                <Text
                  style={{ color: "white", fontWeight: "700", fontSize: 18 }}
                >
                  Sign Up
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
};

export default SignUp;
