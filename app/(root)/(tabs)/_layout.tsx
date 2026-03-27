import { Tabs } from "expo-router";
import {
  Image,
  ImageSourcePropType,
  LogBox,
  Text,
  View,
  useColorScheme,
} from "react-native";

import icons from "@/constants/icons";
import { Colors } from "../../../constants/Colors";

// Ignore specific warnings that are not critical
LogBox.ignoreLogs([
  "JSON Parse error",
  "Error parsing reviews",
  "Setting a timer",
]);

// Optional: Ignore all warnings in production
if (!__DEV__) {
  LogBox.ignoreAllLogs();
}
// Ignore specific Appwrite-related errors
LogBox.ignoreLogs([
  "JSON Parse error: Unexpected character: G",
  "Error parsing reviews",
  "Error fetchingagent",
  "Error checking like status",
]);

const TabIcon = ({
  focused,
  icon,
  title,
}: {
  focused: boolean;
  icon: ImageSourcePropType;
  title: string;
}) => (
  <View className="flex-1 mt-3 flex flex-col items-center">
    <Image
      source={icon}
      tintColor={focused ? "#0061FF" : "#666876"}
      resizeMode="contain"
      className="size-6"
    />
    <Text
      className={`${
        focused
          ? "text-primary-300 font-rubik-medium"
          : "text-black-200 font-rubik"
      } text-xs w-full text-center mt-1`}
    >
      {title}
    </Text>
  </View>
);

const TabsLayout = () => {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? "light"];

  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: theme.navBackground },
        headerTintColor: theme.title,
        tabBarShowLabel: false,
        tabBarStyle: {
          backgroundColor: theme.navBackground,

          position: "absolute",
          borderTopColor: "#0061FF1A",
          borderTopWidth: 1,
          minHeight: 70,
        },
      }}
    >
      <Tabs.Screen
        name="tenantHome"
        options={{
          title: "Home",
          headerShown: false,
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused} icon={icons.home} title="Home" />
          ),
        }}
      />

      <Tabs.Screen
        name="about"
        options={{
          href: null,
          title: "about",
          headerShown: false,
        }}
      />

      <Tabs.Screen
        name="help"
        options={{
          href: null,
          title: "help",
          headerShown: false,
        }}
      />
      <Tabs.Screen
        name="calendar"
        options={{
          href: null,
          title: "help",
          headerShown: false,
        }}
      />
      <Tabs.Screen
        name="language"
        options={{
          href: null,
          title: "language",
          headerShown: false,
        }}
      />
      <Tabs.Screen
        name="notifications"
        options={{
          href: null,
          title: "notifications",
          headerShown: false,
        }}
      />

      <Tabs.Screen
        name="properties-by-location"
        options={{
          href: null,
          title: "notifications",
          headerShown: false,
        }}
      />
      <Tabs.Screen
        name="trending-properties"
        options={{
          href: null,
          title: "notifications",
          headerShown: false,
        }}
      />

      <Tabs.Screen
        name="filtered-properties"
        options={{
          href: null,
          title: "notifications",
          headerShown: false,
        }}
      />

      <Tabs.Screen
        name="settings"
        options={{
          href: null,
          title: "settings",
          headerShown: false,
        }}
      />
      <Tabs.Screen
        name="my-favorites"
        options={{
          href: null,
          title: "my-favorites",
          headerShown: false,
        }}
      />

      <Tabs.Screen
        name="message"
        options={{
          href: null,
          title: "my-favorites",
          headerShown: false,
          tabBarStyle: { display: "none" },
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          headerShown: false,
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused} icon={icons.person} title="Profile" />
          ),
        }}
      />

      <Tabs.Screen
        name="explore"
        options={{
          title: "Explore",
          headerShown: false,
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused} icon={icons.search} title="Explore" />
          ),
        }}
      />
    </Tabs>
  );
};

export default TabsLayout;
