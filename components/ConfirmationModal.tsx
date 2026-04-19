import { Colors } from "@/constants/Colors";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import {
  Modal,
  Text,
  TouchableOpacity,
  useColorScheme,
  View,
} from "react-native";

interface ConfirmationModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  message?: string;
  confirmText?: string;
  cancelText?: string;
  danger?: boolean;
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  visible,
  onClose,
  onConfirm,
  title = "Confirm Action",
  message = "Are you sure you want to proceed?",
  confirmText = "Confirm",
  cancelText = "Cancel",
  danger = false,
}) => {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? "light"];

  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View className="flex-1 justify-center items-center bg-black/50">
        <View
          className="w-80 rounded-2xl p-6"
          style={{ backgroundColor: theme.surface }}
        >
          <View
            className="w-16 h-16 rounded-full items-center justify-center mb-4 self-center"
            style={{
              backgroundColor: danger
                ? theme.danger + "20"
                : theme.primary[100],
            }}
          >
            <Ionicons
              name={danger ? "warning" : "help-circle"}
              size={40}
              color={danger ? theme.danger : theme.primary[300]}
            />
          </View>

          <Text
            className="text-lg font-rubik-bold mb-2 text-center"
            style={{ color: theme.title }}
          >
            {title}
          </Text>

          <Text
            className="text-sm text-center mb-6"
            style={{ color: theme.muted }}
          >
            {message}
          </Text>

          <View className="flex-row gap-3">
            <TouchableOpacity
              onPress={onClose}
              className="flex-1 py-3 rounded-xl"
              style={{
                backgroundColor: theme.surface,
                borderWidth: 1,
                borderColor: theme.muted + "40",
              }}
            >
              <Text
                className="text-center font-rubik-medium"
                style={{ color: theme.text }}
              >
                {cancelText}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleConfirm}
              className="flex-1 py-3 rounded-xl"
              style={{
                backgroundColor: danger ? theme.danger : theme.primary[300],
              }}
            >
              <Text className="text-white text-center font-rubik-medium">
                {confirmText}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default ConfirmationModal;
