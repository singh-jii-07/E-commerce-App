import * as Device from "expo-device";
import { Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import Constants from "expo-constants";
import API_CONFIG from "../config/apiConfig";

export const setupPushNotifications = async () => {
  try {
    const isExpoGo = Constants.appOwnership === "expo";
    if (isExpoGo) {
      console.log("Expo Go environment detected: Remote push notifications skipped (Use a Standalone / Development Build for push).");
      return null;
    }

    // Require expo-notifications dynamically only outside Expo Go
    const Notifications = require("expo-notifications");

    try {
      Notifications.setNotificationHandler({
        handleNotification: async () => ({
          shouldShowAlert: true,
          shouldPlaySound: true,
          shouldSetBadge: true,
        }),
      });
    } catch (e) {
      console.log("Notification handler setup notice:", e.message);
    }

    // Android Channel Setup for Lockscreen & Sound
    if (Platform.OS === "android") {
      const importance = Notifications.AndroidImportance?.MAX ?? 5;
      const lockscreenVisibility = Notifications.AndroidLockScreenVisibility?.PUBLIC ?? 1;

      await Notifications.setNotificationChannelAsync("orders", {
        name: "Order Updates",
        importance,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: "#4F46E5",
        lockscreenVisibility,
        sound: "default",
      }).catch((err) => console.log("Notification channel notice:", err.message));
    }

    if (!Device.isDevice) {
      console.log("Push notifications require a physical device.");
      return null;
    }

    if (isExpoGo) {
      return null;
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== "granted") {
      console.log("Push notification permission not granted.");
      return null;
    }

    let pushToken = null;
    try {
      const tokenResponse = await Notifications.getExpoPushTokenAsync();
      pushToken = tokenResponse?.data;
      console.log("Expo Push Token obtained:", pushToken);
    } catch (tokenErr) {
      console.log("Push token notice:", tokenErr.message);
    }

    // Save token to backend if logged in and token is available
    if (pushToken) {
      const authToken = await AsyncStorage.getItem("token");
      if (authToken) {
        await axios
          .post(
            `${API_CONFIG.ECOMMERCE_BASE_URL}/adminuser/push-token`,
            { pushToken },
            {
              headers: {
                Authorization: `Bearer ${authToken}`,
                "Content-Type": "application/json",
              },
            }
          )
          .catch((err) => console.log("Failed to register push token with backend:", err.message));
      }
    }

    return pushToken;
  } catch (error) {
    console.log("Push notification setup notice:", error.message);
    return null;
  }
};

export default setupPushNotifications;
