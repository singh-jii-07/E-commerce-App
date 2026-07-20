import { Tabs } from "expo-router";
import Entypo from "@expo/vector-icons/Entypo";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import Ionicons from "@expo/vector-icons/Ionicons";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,

        tabBarActiveTintColor: "black",
        tabBarInactiveTintColor: "#999",

        tabBarStyle: {
          backgroundColor: "#fff",
          height: 60,
          paddingBottom: 5,
        },
      }}
    >
      {/* Home */}
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",

          tabBarIcon: ({ color, size }) => (
            <Entypo
              name="home"
              size={size}
              color={color}
            />
          ),
        }}
      />

     
      <Tabs.Screen
        name="order"
        options={{
          title: "Order",

          tabBarIcon: ({ color, size }) => (
            <FontAwesome
              name="search"
              size={size}
              color={color}
            />
          ),
        }}
      />

      
      <Tabs.Screen
        name="myCard"
        options={{
          title: "My Card",

          tabBarIcon: ({ color, size }) => (
            <Ionicons
              name="bookmark"
              size={size}
              color={color}
            />
          ),
        }}
      />

   
      <Tabs.Screen
        name="More"
        options={{
          title: "More",

          tabBarIcon: ({ color, size }) => (
            <MaterialIcons
              name="person"
              size={size}
              color={color}
            />
          ),
        }}
      />
    </Tabs>
  );
}