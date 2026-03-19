import icons from "@/constants/icons";
import { Tabs } from "expo-router";
import {
  Image,
  ImageSourcePropType,
  Text,
  View,
  useColorScheme,
} from "react-native";
import { Colors } from "../../../constants/Colors";

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
      tintColor={focused ? "#ff7b00" : "#FFFFFF"}
      resizeMode="contain"
      className="size-6"
    />
    <Text
      className={`${
        focused ? "text-[#ff8400] font-rubik-medium" : "text-white font-rubik"
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
          backgroundColor: "#0061FF",
          position: "absolute",
          borderTopColor: "#0061FF1A",
          borderTopWidth: 1,
          minHeight: 70,
        },
      }}
    >
      <Tabs.Screen
        name="landHome"
        options={{
          title: "Home",
          headerShown: false,
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused} icon={icons.home} title="Home" />
          ),
        }}
      />
      <Tabs.Screen
        name="landProfile"
        options={{
          title: "Profile",
          headerShown: false,
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused} icon={icons.person} title="Profile" />
          ),
        }}
      />

      <Tabs.Screen
        name="myDashboard"
        options={{
          title: "Dashboard",
          headerShown: false,
          tabBarIcon: ({ focused }) => (
            <TabIcon
              focused={focused}
              icon={icons.dashboard}
              title="Dashboard"
            />
          ),
        }}
      />
    </Tabs>
  );
};

export default TabsLayout;
