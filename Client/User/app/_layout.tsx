import { useEffect } from "react";
import { Stack } from "expo-router";
import { CartProvider } from "../context/CartContext";
import { setupPushNotifications } from "../utils/notificationHelper";

export default function RootLayout() {
  useEffect(() => {
    setupPushNotifications();
  }, []);

  return (
    <CartProvider>
      <Stack
        screenOptions={{
          headerShown: false,
        }}
      />
    </CartProvider>
  );
}