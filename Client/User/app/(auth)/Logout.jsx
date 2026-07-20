import React from "react";
import { TouchableOpacity, Text, StyleSheet, Alert, Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import axios from "axios";

export const handleLogout = async () => {
  try {
    const token = await AsyncStorage.getItem("token");

    if (token) {
      await axios.post(
        "http://localhost:5000/api/user/logout",
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
    }
  } catch (error) {
    console.log("Logout API error:", error);
  } finally {
    // Clear storage on client regardless of server API result
    await AsyncStorage.removeItem("token");
    await AsyncStorage.removeItem("userId");
    try {
      router.replace("/sign-in");
    } catch (e) {
      console.log("Failed navigating to /sign-in, trying fallback group path:", e);
      router.replace("/(auth)/sign-in");
    }
  }
};

export default function Logout() {
  const triggerLogout = () => {
    if (Platform.OS === "web") {
      const confirmLogout = window.confirm("Are you sure you want to log out?");
      if (confirmLogout) {
        handleLogout();
      }
    } else {
      Alert.alert("Confirm Logout", "Are you sure you want to log out?", [
        { text: "Cancel", style: "cancel" },
        { text: "Logout", style: "destructive", onPress: handleLogout },
      ]);
    }
  };

  return (
    <TouchableOpacity style={styles.button} onPress={triggerLogout} activeOpacity={0.7}>
      <Text style={styles.text}>Logout</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    marginTop: 20,
    backgroundColor: "#1E293B",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  text: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
});