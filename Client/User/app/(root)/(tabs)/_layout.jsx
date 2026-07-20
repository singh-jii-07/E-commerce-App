import { Tabs } from "expo-router";
import Ionicons from "@expo/vector-icons/Ionicons";
import Feather from "@expo/vector-icons/Feather";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: "#FFFFFF",
        tabBarInactiveTintColor: "#94A3B8",
        tabBarStyle: {
          backgroundColor: "#0F172A",
          height: 70,
          paddingBottom: 10,
          paddingTop: 10,
          borderTopWidth: 0,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: "500",
          marginTop: 4,
        },
      }}
    >
      {/* Home */}
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home" size={24} color={color} />
          ),
        }}
      />

      {/* Order */}
      <Tabs.Screen
        name="order"
        options={{
          title: "Order",
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="storefront-outline" size={26} color={color} />
          ),
        }}
      />

      {/* My Cart */}
      <Tabs.Screen
        name="myCard"
        options={{
          title: "My Cart",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="basket-outline" size={28} color={color} />
          ),
        }}
      />

      {/* More */}
      <Tabs.Screen
        name="More"
        options={{
          title: "More",
          tabBarIcon: ({ color, size }) => (
            <Feather name="grid" size={24} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}