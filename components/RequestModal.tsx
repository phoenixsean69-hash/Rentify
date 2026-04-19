// components/RequestModal.tsx
import { Colors } from "@/constants/Colors";
import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  useColorScheme,
  View,
} from "react-native";

export interface RequestData {
  proposedPrice: number;
  message: string;
  moveInDate?: string;
  leaseDuration?: string;
  questions: string[];
}

interface RequestModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (data: RequestData) => void;
  propertyName: string;
  currentPrice: number;
  isLoading?: boolean;
}

export const RequestModal = ({
  visible,
  onClose,
  onSubmit,
  propertyName,
  currentPrice,
  isLoading = false,
}: RequestModalProps) => {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? "light"];

  const [proposedPrice, setProposedPrice] = useState(currentPrice.toString());
  const [message, setMessage] = useState("");
  const [moveInDate, setMoveInDate] = useState("");
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [tempDate, setTempDate] = useState(new Date());
  const [leaseDuration, setLeaseDuration] = useState("");
  const [questions, setQuestions] = useState<string[]>([""]);
  const [selectedPriceOption, setSelectedPriceOption] = useState<
    "full" | "negotiate"
  >("full");

  const addQuestion = () => {
    setQuestions([...questions, ""]);
  };

  const removeQuestion = (index: number) => {
    const newQuestions = questions.filter((_, i) => i !== index);
    setQuestions(newQuestions);
  };

  const updateQuestion = (text: string, index: number) => {
    const newQuestions = [...questions];
    newQuestions[index] = text;
    setQuestions(newQuestions);
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      const formattedDate = selectedDate.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
      setMoveInDate(formattedDate);
      setTempDate(selectedDate);
    }
  };
  // components/RequestModal.tsx - Update the handleSubmit function
  const handleSubmit = () => {
    // Validate
    if (
      selectedPriceOption === "negotiate" &&
      (!proposedPrice || parseInt(proposedPrice) <= 0)
    ) {
      Alert.alert("Error", "Please enter a valid proposed price");
      return;
    }

    const filteredQuestions = questions.filter((q) => q.trim());

    onSubmit({
      proposedPrice:
        selectedPriceOption === "full" ? currentPrice : parseInt(proposedPrice),
      message: message.trim(),
      moveInDate: moveInDate || undefined,
      leaseDuration: leaseDuration || undefined,
      questions: filteredQuestions,
    });
  };

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View className="flex-1 bg-black/50 justify-end">
        <View
          className="rounded-t-3xl"
          style={{ backgroundColor: theme.background }}
        >
          <View className="flex-row items-center">
            <View className="w-8" />
            <Text
              className="flex-1 text-center text-white text-xl font-rubik-bold"
              style={{ color: theme.text }}
            >
              Request to Rent
            </Text>
            <TouchableOpacity onPress={onClose} className="p-1 mr-2">
              <Ionicons name="close" size={24} style={{ color: theme.text }} />
            </TouchableOpacity>
          </View>
          <Text
            className="text-white/80 text-center text-md font-rubik-medium mt-1"
            style={{ color: theme.muted }}
          >
            {propertyName}
          </Text>

          <ScrollView className="p-5" showsVerticalScrollIndicator={false}>
            {/* Price Negotiation */}
            <View className="mb-5">
              <Text
                className="text-base font-rubik-bold mb-2"
                style={{ color: theme.title }}
              >
                Price Negotiation
              </Text>

              {/* Price Options */}
              <View className="flex-row gap-3 mb-3">
                <TouchableOpacity
                  onPress={() => setSelectedPriceOption("full")}
                  className={`flex-1 p-3 rounded-xl border-2 ${
                    selectedPriceOption === "full"
                      ? "border-primary-300 bg-primary-50"
                      : "border-gray-300"
                  }`}
                >
                  <Text
                    className="text-center font-rubik-medium"
                    style={{ color: theme.text }}
                  >
                    Pay Full Price
                  </Text>
                  <Text className="text-center text-sm text-primary-300 font-rubik-bold mt-1">
                    ${currentPrice}/month
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => setSelectedPriceOption("negotiate")}
                  className={`flex-1 p-3 rounded-xl border-2 ${
                    selectedPriceOption === "negotiate"
                      ? "border-primary-300 bg-primary-50"
                      : "border-gray-300"
                  }`}
                >
                  <Text
                    className="text-center font-rubik-medium"
                    style={{ color: theme.text }}
                  >
                    Negotiate Price
                  </Text>
                  <Text className="text-center text-sm text-gray-500 mt-1">
                    Propose your offer
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Proposed Price Input */}
              {selectedPriceOption === "negotiate" && (
                <View
                  className="flex-row items-center border rounded-xl px-3 py-2 mt-2"
                  style={{
                    borderColor: theme.muted + "50",
                    backgroundColor: theme.surface,
                  }}
                >
                  <Text
                    className="text-lg font-rubik-bold"
                    style={{ color: theme.text }}
                  >
                    $
                  </Text>
                  <TextInput
                    value={proposedPrice}
                    onChangeText={setProposedPrice}
                    keyboardType="numeric"
                    placeholder={`Proposed price (Current: $${currentPrice})`}
                    placeholderTextColor={theme.muted}
                    className="flex-1 ml-2 text-base"
                    style={{ color: theme.text }}
                  />
                  <Text className="text-sm" style={{ color: theme.muted }}>
                    /month
                  </Text>
                </View>
              )}
            </View>

            {/* Move-in Date */}
            <View className="mb-5">
              <Text
                className="text-base font-rubik-bold mb-2"
                style={{ color: theme.title }}
              >
                Preferred Move-in Date
              </Text>
              <TouchableOpacity
                onPress={() => setShowDatePicker(true)}
                className="border rounded-xl px-4 py-3"
                style={{
                  borderColor: theme.muted + "50",
                  backgroundColor: theme.surface,
                }}
              >
                <Text style={{ color: moveInDate ? theme.text : theme.muted }}>
                  {moveInDate || "Select preferred move-in date"}
                </Text>
              </TouchableOpacity>

              {showDatePicker && (
                <DateTimePicker
                  value={tempDate}
                  mode="date"
                  display={Platform.OS === "ios" ? "spinner" : "default"}
                  onChange={handleDateChange}
                  minimumDate={new Date()}
                />
              )}
            </View>

            {/* Lease Duration */}
            <View className="mb-5">
              <Text
                className="text-base font-rubik-bold mb-2"
                style={{ color: theme.title }}
              >
                Lease Duration
              </Text>
              <View className="flex-row flex-wrap gap-2">
                {[
                  "3 months",
                  "6 months",
                  "9 months",
                  "12 months",
                  "24 months",
                ].map((duration) => (
                  <TouchableOpacity
                    key={duration}
                    onPress={() => setLeaseDuration(duration)}
                    className={`px-4 py-2 rounded-full ${
                      leaseDuration === duration ? "bg-primary-300" : "border"
                    }`}
                    style={{
                      borderColor: theme.muted + "50",
                      backgroundColor:
                        leaseDuration === duration ? undefined : theme.surface,
                    }}
                  >
                    <Text
                      className={
                        leaseDuration === duration
                          ? "text-white"
                          : "text-gray-600"
                      }
                    >
                      {duration}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Questions Section */}
            <View className="mb-5">
              <View className="flex-row justify-between items-center mb-2">
                <Text
                  className="text-base font-rubik-bold"
                  style={{ color: theme.title }}
                >
                  Questions for Landlord
                </Text>
                <TouchableOpacity
                  onPress={addQuestion}
                  className="flex-row items-center"
                >
                  <Ionicons
                    name="add-circle"
                    size={24}
                    color={theme.primary[300]}
                  />
                  <Text
                    className="text-xs ml-1"
                    style={{ color: theme.primary[300] }}
                  >
                    Add
                  </Text>
                </TouchableOpacity>
              </View>

              {questions.map((question, index) => (
                <View key={index} className="flex-row items-start mb-2 gap-2">
                  <View className="flex-1">
                    <TextInput
                      value={question}
                      onChangeText={(text) => updateQuestion(text, index)}
                      placeholder={`Question ${index + 1} (e.g., Is parking available?)`}
                      placeholderTextColor={theme.muted}
                      multiline
                      className="border rounded-xl px-3 py-2 text-base"
                      style={{
                        borderColor: theme.muted + "50",
                        backgroundColor: theme.surface,
                        color: theme.text,
                        minHeight: 60,
                      }}
                    />
                  </View>
                  {questions.length > 1 && (
                    <TouchableOpacity
                      onPress={() => removeQuestion(index)}
                      className="p-2"
                    >
                      <Ionicons
                        name="trash-outline"
                        size={20}
                        color={theme.danger}
                      />
                    </TouchableOpacity>
                  )}
                </View>
              ))}
            </View>

            {/* Personal Message */}
            <View className="mb-5">
              <Text
                className="text-base font-rubik-bold mb-2"
                style={{ color: theme.title }}
              >
                Personal Message
              </Text>
              <TextInput
                value={message}
                onChangeText={setMessage}
                placeholder="Introduce yourself and explain why you're interested..."
                placeholderTextColor={theme.muted}
                multiline
                numberOfLines={4}
                className="border rounded-xl px-4 py-3 text-base"
                style={{
                  borderColor: theme.muted + "50",
                  backgroundColor: theme.surface,
                  color: theme.text,
                  minHeight: 100,
                  textAlignVertical: "top",
                }}
              />
            </View>

            {/* Submit Button */}
            <TouchableOpacity
              onPress={handleSubmit}
              disabled={isLoading}
              className="py-4 rounded-xl mb-5"
              style={{ backgroundColor: theme.primary[300] }}
            >
              {isLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text className="text-white text-center font-rubik-bold text-lg">
                  Send Request
                </Text>
              )}
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};
