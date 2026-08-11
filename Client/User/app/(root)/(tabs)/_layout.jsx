import { View } from "react-native";
import { Tabs } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Ionicons from "@expo/vector-icons/Ionicons";
import Feather from "@expo/vector-icons/Feather";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { useCart } from "../../../context/CartContext";

export default function TabLayout() {
  const { cartCount } = useCart();
  const insets = useSafeAreaInsets();

  const tabBarHeight = 70 + insets.bottom;

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: "#FFFFFF",
      }}
    >
      <Tabs
        screenOptions={{
          headerShown: false,

          tabBarActiveTintColor: "#FFFFFF",
          tabBarInactiveTintColor: "#94A3B8",

          tabBarStyle: {
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,

            backgroundColor: "#0F172A",

            height: tabBarHeight,

            paddingBottom: 10 + insets.bottom,
            paddingTop: 10,

            borderTopWidth: 0,

            // TOP CURVES ONLY (to match image)
            borderTopLeftRadius: 30,
            borderTopRightRadius: 30,

            overflow: "hidden",

            elevation: 0,
            shadowOpacity: 0,
          },

          tabBarLabelStyle: {
            fontSize: 12,
            fontWeight: "500",
            marginTop: 4,
          },
        }}

        sceneContainerStyle={{
          backgroundColor: "#FFFFFF",

          // Keep content above the tab bar
          marginBottom: tabBarHeight,

          overflow: "hidden",
        }}
      >
        {/* Home */}
        <Tabs.Screen
          name="index"
          options={{
            title: "Home",

            tabBarIcon: ({ color, size }) => (
              <Ionicons
                name="home"
                size={24}
                color={color}
              />
            ),
          }}
        />

        {/* Order */}
        <Tabs.Screen
          name="order"
          options={{
            title: "Order",

            tabBarIcon: ({ color, size }) => (
              <MaterialCommunityIcons
                name="storefront-outline"
                size={26}
                color={color}
              />
            ),
          }}
        />

        {/* My Cart */}
        <Tabs.Screen
          name="myCard"
          options={{
            title: "My Cart",

            tabBarBadge:
              cartCount > 0 ? cartCount : undefined,

            tabBarBadgeStyle: {
              backgroundColor: "#FF6B35",
              color: "#FFFFFF",
            },

            tabBarIcon: ({ color, size }) => (
              <Ionicons
                name="basket-outline"
                size={28}
                color={color}
              />
            ),
          }}
        />

        {/* More */}
        <Tabs.Screen
          name="More"
          options={{
            title: "More",

            tabBarIcon: ({ color, size }) => (
              <Feather
                name="grid"
                size={24}
                color={color}
              />
            ),
          }}
        />
      </Tabs>
    </View>
  );
}