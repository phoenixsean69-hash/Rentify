import { useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { useEffect, useState } from "react";
import {
  ImageBackground,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

export default function Security() {
  const [storedPassword, setStoredPassword] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [unlocked, setUnlocked] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  const [lockWholeApp, setLockWholeApp] = useState(true);

  // Security question state
  const [securityQuestion, setSecurityQuestion] = useState("");
  const [securityAnswer, setSecurityAnswer] = useState("");
  const [answerInput, setAnswerInput] = useState("");
  const [showReset, setShowReset] = useState(false);

  useEffect(() => {
    (async () => {
      const savedPassword = await SecureStore.getItemAsync("userPassword");
      const savedQuestion = await SecureStore.getItemAsync("securityQuestion");
      const savedAnswer = await SecureStore.getItemAsync("securityAnswer");
      const savedToggle = await SecureStore.getItemAsync("lockWholeApp");

      setStoredPassword(savedPassword);
      setSecurityQuestion(savedQuestion || "");
      setSecurityAnswer(savedAnswer || "");
      setLockWholeApp(savedToggle === "true");
    })();
  }, []);

  async function handleSetPassword() {
    if (input.length < 4) {
      setError("Password must be at least 4 characters");
      return;
    }
    if (!securityQuestion || !securityAnswer) {
      setError("Please set a security question and answer");
      return;
    }
    await SecureStore.setItemAsync("userPassword", input);
    await SecureStore.setItemAsync("securityQuestion", securityQuestion);
    await SecureStore.setItemAsync("securityAnswer", securityAnswer);
    setStoredPassword(input);
    setUnlocked(true);
    setError("");
  }

  async function handleUnlock() {
    if (input === storedPassword) {
      setUnlocked(true);
      setError("");
    } else {
      setError("Incorrect password");
    }
  }

  async function handleChangePassword() {
    if (input !== storedPassword) {
      setError("Old password is incorrect");
      return;
    }
    if (newPassword.length < 4) {
      setError("New password must be at least 4 characters");
      return;
    }
    await SecureStore.setItemAsync("userPassword", newPassword);
    setStoredPassword(newPassword);
    setError("");
    setInput("");
    setNewPassword("");
    alert("Password changed successfully!");
  }

  async function handleReset() {
    const savedAnswer = await SecureStore.getItemAsync("securityAnswer");
    if (answerInput === savedAnswer) {
      await SecureStore.deleteItemAsync("userPassword");
      setStoredPassword(null);
      setUnlocked(false);
      setInput("");
      setAnswerInput("");
      alert("Correct answer. Please set a new password.");
      setShowReset(false);
    } else {
      setError("Incorrect answer to security question");
    }
  }

  function handleLockAgain() {
    setUnlocked(false);
    router.replace("/profile");
  }

  async function toggleLockWholeApp(value: boolean) {
    setLockWholeApp(value);
    await SecureStore.setItemAsync("lockWholeApp", value ? "true" : "false");
  }

  const cardStyle = "bg-white/90 p-6 rounded-3xl shadow-lg w-full";

  return (
    <ImageBackground
      source={require("../../../assets/images/onboarding.png")}
      className="flex-1"
      resizeMode="cover"
    >
      <View className="flex-1 justify-center items-center px-6">
        {/* CASE 1: No password set yet */}
        {!storedPassword && !unlocked && (
          <View className={cardStyle}>
            <Text className="text-xl font-bold text-gray-900 mb-4">
              Set a Password
            </Text>
            <TextInput
              secureTextEntry
              value={input}
              onChangeText={setInput}
              placeholder="New password"
              className="border border-gray-300 rounded-xl px-4 py-3 mb-3"
            />
            <TextInput
              value={securityQuestion}
              onChangeText={setSecurityQuestion}
              placeholder="Security question (e.g. Your pet's name?)"
              className="border border-gray-300 rounded-xl px-4 py-3 mb-3"
            />
            <TextInput
              secureTextEntry
              value={securityAnswer}
              onChangeText={setSecurityAnswer}
              placeholder="Answer"
              className="border border-gray-300 rounded-xl px-4 py-3 mb-3"
            />
            {error ? <Text className="text-red-500 mb-2">{error}</Text> : null}
            <TouchableOpacity
              className="bg-orange-500 rounded-xl py-3"
              onPress={handleSetPassword}
            >
              <Text className="text-white text-center font-bold">
                Save Password
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* CASE 2: Password exists but not unlocked */}
        {storedPassword && !unlocked && !showReset && (
          <View className={cardStyle}>
            <Text className="text-xl font-bold text-gray-900 mb-4">
              Unlock Security
            </Text>
            <TextInput
              secureTextEntry
              value={input}
              onChangeText={setInput}
              placeholder="Password"
              className="border border-gray-300 rounded-xl px-4 py-3 mb-3"
            />
            {error ? <Text className="text-red-500 mb-2">{error}</Text> : null}
            <TouchableOpacity
              className="bg-orange-500 rounded-xl py-3 mb-4"
              onPress={handleUnlock}
            >
              <Text className="text-white text-center font-bold">Unlock</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => setShowReset(true)}>
              <Text className="text-blue-600 text-center">
                Forgot Password?
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* CASE 2b: Reset via security question */}
        {showReset && (
          <View className={cardStyle}>
            <Text className="text-xl font-bold text-gray-900 mb-4">
              Reset Password
            </Text>
            <Text className="text-gray-700 mb-2">{securityQuestion}</Text>
            <TextInput
              value={answerInput}
              onChangeText={setAnswerInput}
              placeholder="Your answer"
              className="border border-gray-300 rounded-xl px-4 py-3 mb-3"
            />
            {error ? <Text className="text-red-500 mb-2">{error}</Text> : null}
            <TouchableOpacity
              className="bg-orange-500 rounded-xl py-3"
              onPress={handleReset}
            >
              <Text className="text-white text-center font-bold">Reset</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* CASE 3: Unlocked → show Security UI */}
        {unlocked && (
          <View className={cardStyle}>
            <Text className="text-xl font-bold text-gray-900 mb-4">
              🔓 Security Page
            </Text>

            <Text className="text-gray-700 mb-2">Change Password</Text>
            <TextInput
              secureTextEntry
              value={input}
              onChangeText={setInput}
              placeholder="Old password"
              className="border border-gray-300 rounded-xl px-4 py-3 mb-3"
            />
            <TextInput
              secureTextEntry
              value={newPassword}
              onChangeText={setNewPassword}
              placeholder="New password"
              className="border border-gray-300 rounded-xl px-4 py-3 mb-3"
            />
            {error ? <Text className="text-red-500 mb-2">{error}</Text> : null}
            <TouchableOpacity
              className="bg-orange-500 rounded-xl py-3 mb-4"
              onPress={handleChangePassword}
            >
              <Text className="text-white text-center font-bold">
                Update Password
              </Text>
            </TouchableOpacity>

            {/* Toggle + Lock Again */}
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-gray-700">Lock whole app</Text>
              <Switch
                value={lockWholeApp}
                onValueChange={toggleLockWholeApp}
                thumbColor={lockWholeApp ? "#f97316" : "#ccc"}
              />
            </View>

            <TouchableOpacity
              className="bg-gray-100 rounded-xl py-3"
              onPress={handleLockAgain}
            >
              <Text className="text-gray-900 text-center font-bold">Back</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </ImageBackground>
  );
}
