// app/chat-support.tsx
import { Colors } from "@/constants/Colors";
import useAuthStore from "@/store/auth.store";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useRef, useState } from "react";
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Text,
  TextInput,
  TouchableOpacity,
  useColorScheme,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
}

// Simple AI response generator
const getAIResponse = (userMessage: string): string => {
  const message = userMessage.toLowerCase();

  // Greetings
  if (message.match(/^(hi|hello|hey|greetings)/)) {
    return "Hello! 👋 How can I help you with Rentify today?";
  }

  // Property listings
  if (message.match(/list|post|add property/)) {
    return "To list a property:\n\n1. Go to your profile\n2. Tap 'My Properties'\n3. Click the + button\n4. Fill in property details\n5. Upload photos\n6. Publish!\n\nNeed more help? Let me know!";
  }

  // Finding properties
  if (message.match(/find|search|look for|rent/)) {
    return "To find properties:\n\n🔍 Use the search bar on home screen\n📍 Filter by location\n💰 Set price range\n🏠 Choose property type\n\nYou can also save favorites by tapping the heart icon! ❤️";
  }

  // Favorites
  if (message.match(/favorite|save|heart|bookmark/)) {
    return "💖 Favorites:\n\n• Tap the heart icon on any property\n• View all favorites in 'My Favorites'\n• Remove by tapping heart again\n\nYour favorites are saved across devices!";
  }

  // Contact landlord
  if (message.match(/contact|message|landlord|owner/)) {
    return "📱 To contact a landlord:\n\n1. Open property listing\n2. Tap 'Contact Landlord'\n3. Send your message\n4. Wait for response\n\nLandlords typically reply within 24 hours!";
  }

  // Profile/Account
  if (message.match(/profile|account|update|change/)) {
    return "👤 Profile Management:\n\n• Edit profile picture\n• Update contact info\n• Change password in Settings\n• View your listings\n\nWhat would you like to update?";
  }

  // Payment/Pricing
  if (message.match(/pay|payment|price|cost|free/)) {
    return "💰 Rentify is FREE to use!\n\n• No listing fees\n• No commission\n• Direct communication\n\nPremium features coming soon!";
  }

  // Technical issues
  if (message.match(/bug|error|crash|not working|issue/)) {
    return "🐛 Sorry you're experiencing issues!\n\nPlease try:\n• Restart the app\n• Clear cache\n• Update to latest version\n• Check internet connection\n\nIf problem persists, contact support@rentify.com";
  }

  // Password/Login
  if (message.match(/password|login|sign in|forgot/)) {
    return "🔐 Account Access:\n\n• Forgot password? Tap 'Forgot Password' on login\n• Check your email for reset link\n• Still having issues? Contact support@rentify.com";
  }

  // Reviews
  if (message.match(/review|rating|rate|feedback/)) {
    return "⭐ Reviews:\n\n• Rate properties you've visited\n• Leave feedback for landlords\n• Help others make informed decisions\n\nYour ratings help improve the community!";
  }

  // Notifications
  if (message.match(/notification|alert|bell/)) {
    return "🔔 Notifications:\n\n• Tap bell icon for alerts\n• Get updates on favorites\n• New property alerts\n• Message notifications\n\nEnable notifications for best experience!";
  }

  // Safety
  if (message.match(/safe|security|scam|trust/)) {
    return "🛡️ Safety Tips:\n\n• Verify property before payment\n• Never share sensitive info\n• Use in-app messaging\n• Report suspicious listings\n• Meet in public places\n\nYour safety is our priority!";
  }

  // Help
  if (message.match(/help|support|assist/)) {
    return "🤝 I can help you with:\n\n• Finding/listing properties\n• Account management\n• Favorites & saved searches\n• Contacting landlords\n• Technical issues\n\nWhat would you like to know?";
  }

  // Thank you
  if (message.match(/thank|thanks|appreciate/)) {
    return "You're welcome! 😊 Glad I could help! Anything else you'd like to know?";
  }

  // Goodbye
  if (message.match(/bye|goodbye|see you|later/)) {
    return "👋 Thanks for chatting!\n\nRemember, you can always reach us at:\n📧 support@rentify.com\n📞 +263 77 114 4469\n\ +263 77 600 6288 \nHave a great day! 🏠✨";
  }

  // Default response
  return "Thanks for your message! 🤔 I'm still learning. For urgent help:\n\n📧 Email: support@rentify.com\n\+263 77 600 6288 \n📞 Phone: +263 77 114 4469\n💬 Or check our FAQ section!\n\nWhat else can I help with?";
};

const ChatSupport = () => {
  const { user } = useAuthStore();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      text: "👋 Hi there! I'm your Rentify assistant.\n\nI can help you with:\n🏠 Finding or listing properties\n🔐 Account & security\n⚡ Technical support\n💰 Pricing & features\n📝 Reviews & ratings\n\nWhat can I help you with today?",
      isUser: false,
      timestamp: new Date(),
    },
  ]);
  const [inputText, setInputText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([
    "How to list a property?",
    "Find apartments near me",
    "Can't login to account",
    "Safety tips",
    "How to contact landlord?",
  ]);
  const flatListRef = useRef<FlatList>(null);

  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? "light"];

  const sendMessage = async (text?: string) => {
    const messageText = text || inputText;
    if (!messageText.trim()) return;

    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      text: messageText,
      isUser: true,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMessage]);
    setInputText("");
    setIsTyping(true);

    // Simulate AI typing
    setTimeout(() => {
      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        text: getAIResponse(messageText),
        isUser: false,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, aiResponse]);
      setIsTyping(false);
      flatListRef.current?.scrollToEnd({ animated: true });

      // Update suggestions based on context
      const message = messageText.toLowerCase();
      if (message.includes("list") || message.includes("post")) {
        setSuggestions([
          "How to add photos",
          "Pricing tips",
          "Featured listing",
        ]);
      } else if (message.includes("find") || message.includes("search")) {
        setSuggestions([
          "Filter by price",
          "Save favorites",
          "Contact landlord",
        ]);
      } else {
        setSuggestions([
          "Find properties",
          "Account help",
          "Safety tips",
          "Contact support",
        ]);
      }
    }, 800);
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const renderMessage = ({ item }: { item: Message }) => (
    <View
      className={`flex-row mb-3 ${item.isUser ? "justify-end" : "justify-start"}`}
    >
      <View
        className={`max-w-[85%] p-3 rounded-2xl ${
          item.isUser ? "rounded-br-none" : "rounded-bl-none"
        }`}
        style={{
          backgroundColor: item.isUser ? theme.primary[300] : theme.surface,
        }}
      >
        <Text
          className={`text-base leading-5 ${item.isUser ? "text-white" : ""}`}
          style={{ color: item.isUser ? "#fff" : theme.text }}
        >
          {item.text}
        </Text>
        <Text
          className={`text-xs mt-1 ${item.isUser ? "text-blue-100" : ""}`}
          style={{ color: item.isUser ? "#e0f2fe" : theme.muted }}
        >
          {formatTime(item.timestamp)}
        </Text>
      </View>
    </View>
  );

  const renderSuggestion = ({ item }: { item: string }) => (
    <TouchableOpacity
      onPress={() => {
        setInputText(item);
        setTimeout(() => sendMessage(item), 100);
      }}
      className="mr-2 px-4 py-2.5 rounded-xl"
      style={{
        backgroundColor: theme.primary[300] + "15",
        borderWidth: 0.5,
        borderColor: theme.primary[300] + "40",
      }}
    >
      <Text
        style={{ color: theme.primary[300] }}
        className="text-sm font-rubik-medium"
      >
        {item}
      </Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.background }}>
      {/* Header */}
      <LinearGradient
        colors={[theme.background, theme.surface]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        className="px-4 py-3 flex-row items-center"
      >
        <TouchableOpacity
          onPress={() => {
            router.replace(
              user?.userMode === "landlord" ? "/landHome" : "/tenantHome",
            );
          }}
          className="mr-3 p-1"
        >
          <Ionicons name="arrow-back" size={24} color={theme.title} />
        </TouchableOpacity>
        <View className="flex-1 flex-row items-center">
          <View className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 items-center justify-center mr-3">
            <Ionicons name="chatbubble-ellipses" size={20} color="#fff" />
          </View>
          <View>
            <Text
              className="text-lg font-rubik-bold"
              style={{ color: theme.title }}
            >
              Rentify Assistant
            </Text>
            <View className="flex-row items-center">
              <View className="w-2 h-2 rounded-full items-center  mr-1" />
              <Text className="text-xs " style={{ color: theme.muted }}>
                Online • Assistant
              </Text>
            </View>
          </View>
        </View>
        <TouchableOpacity onPress={() => router.push("/help")}>
          <Ionicons name="help-circle-outline" size={24} color={theme.title} />
        </TouchableOpacity>
      </LinearGradient>

      {/* Messages */}
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={renderMessage}
        contentContainerStyle={{ padding: 16, paddingBottom: 8 }}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd()}
      />

      {/* Typing Indicator */}
      {isTyping && (
        <View className="px-4 py-2">
          <View
            className="p-3 rounded-2xl rounded-bl-none self-start"
            style={{ backgroundColor: theme.surface }}
          >
            <View className="flex-row space-x-1">
              <View className="w-2 h-2 rounded-full bg-gray-400 animate-pulse" />
              <View className="w-2 h-2 rounded-full bg-gray-400 animate-pulse delay-75" />
              <View className="w-2 h-2 rounded-full bg-gray-400 animate-pulse delay-150" />
            </View>
          </View>
        </View>
      )}

      {/* Suggestions Section */}
      {!isTyping && messages.length > 0 && (
        <View className="px-4 py-3">
          <Text
            className="text-xs font-rubik-medium mb-2 px-1"
            style={{ color: theme.muted }}
          >
            Suggested questions
          </Text>
          <FlatList
            data={suggestions}
            renderItem={renderSuggestion}
            keyExtractor={(item, index) => index.toString()}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{
              paddingRight: 16,
            }}
          />
        </View>
      )}

      {/* Input Area */}
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
      >
        <View
          className="flex-row items-end p-4 border-t"
          style={{
            backgroundColor: theme.background,
            borderTopColor: theme.muted + "30",
          }}
        >
          <View
            className="flex-1 rounded-2xl px-4 py-2 mr-2"
            style={{
              backgroundColor: theme.surface,
              borderWidth: 1,
              borderColor: theme.muted + "30",
            }}
          >
            <TextInput
              value={inputText}
              onChangeText={setInputText}
              placeholder="Ask me anything about Rentify..."
              placeholderTextColor={theme.muted}
              multiline
              className="max-h-32"
              style={{ color: theme.text, fontSize: 16 }}
            />
          </View>
          <TouchableOpacity
            onPress={() => sendMessage()}
            disabled={!inputText.trim()}
            className={`w-10 h-10 rounded-full items-center justify-center ${
              inputText.trim() ? "" : "opacity-50"
            }`}
            style={{
              backgroundColor: inputText.trim()
                ? theme.primary[300]
                : theme.muted,
            }}
          >
            <Ionicons name="send" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default ChatSupport;
