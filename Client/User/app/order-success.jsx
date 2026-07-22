import React from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams } from "expo-router";

const { width } = Dimensions.get("window");

const OrderSuccessScreen = () => {
  const router = useRouter();
  const { orderId } = useLocalSearchParams();

  // Extract short ID for user display
  const displayOrderId = orderId
    ? String(orderId).slice(-8).toUpperCase()
    : "6578345";

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#0F172A" />

      <View style={styles.container}>
        {/* Floating Success Card overlay matching the mockup */}
        <View style={styles.successCard}>
          {/* Custom Illustration: Circle Bg + Shopping Bag with Checkmark */}
          <View style={styles.illustrationCircle}>
            <View style={styles.bagWrapper}>
              <Ionicons name="bag" size={72} color="#0F172A" />
              {/* Checkmark inside/on the bag */}
              <View style={styles.checkBadge}>
                <Ionicons name="checkmark" size={14} color="#0F172A" />
              </View>
            </View>
            {/* Orange Decorative Dots */}
            <View style={[styles.dot, styles.dotTop, { backgroundColor: "#FF6B35" }]} />
            <View style={[styles.dot, styles.dotRight, { backgroundColor: "#FF6B35" }]} />
            <View style={[styles.dot, styles.dotLeft, { backgroundColor: "#FF6B35" }]} />
            <View style={[styles.dot, styles.dotBottomRight, { backgroundColor: "#FF6B35" }]} />
          </View>

          {/* Success Title */}
          <Text style={styles.successTitle}>Order Successful</Text>

          {/* Success Subtitle with Short Order ID */}
          <Text style={styles.successSubtitle}>
            Your order #{displayOrderId} is successfully placed.
          </Text>

          {/* Action Buttons */}
          <View style={styles.btnGroup}>
            {/* 1. Track Order (Navigates to tracking details page) */}
            <TouchableOpacity
              style={styles.trackBtn}
              onPress={() => {
                if (orderId) {
                  router.replace(`/orders/${orderId}`);
                } else {
                  router.replace("/orders");
                }
              }}
              activeOpacity={0.8}
            >
              <Text style={styles.trackBtnText}>Track Order</Text>
            </TouchableOpacity>

            {/* 2. Go Back (Navigates back to all orders list) */}
            <TouchableOpacity
              style={styles.goBackBtn}
              onPress={() => router.replace("/order")}
              activeOpacity={0.7}
            >
              <Text style={styles.goBackBtnText}>Go Back</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#0F172A",
  },
  container: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.8)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },
  successCard: {
    width: "100%",
    backgroundColor: "#FFFFFF",
    borderRadius: 28,
    padding: 24,
    paddingVertical: 36,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 15,
    elevation: 10,
  },
  illustrationCircle: {
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: "#F1F5F9",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
    position: "relative",
  },
  bagWrapper: {
    position: "relative",
    justifyContent: "center",
    alignItems: "center",
  },
  checkBadge: {
    position: "absolute",
    bottom: 12,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2.5,
    borderColor: "#0F172A",
  },
  dot: {
    position: "absolute",
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  dotTop: {
    top: 20,
    left: 45,
  },
  dotRight: {
    top: 40,
    right: 20,
  },
  dotLeft: {
    bottom: 50,
    left: 15,
  },
  dotBottomRight: {
    bottom: 30,
    right: 25,
  },
  successTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: "#0F172A",
    textAlign: "center",
    marginBottom: 8,
  },
  successSubtitle: {
    fontSize: 14,
    fontWeight: "500",
    color: "#94A3B8",
    textAlign: "center",
    lineHeight: 20,
    paddingHorizontal: 16,
    marginBottom: 32,
  },
  btnGroup: {
    width: "100%",
    alignItems: "center",
    gap: 16,
  },
  trackBtn: {
    width: "100%",
    backgroundColor: "#0F172A",
    borderRadius: 25,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  trackBtnText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "800",
  },
  goBackBtn: {
    paddingVertical: 6,
  },
  goBackBtnText: {
    color: "#0F172A",
    fontSize: 14,
    fontWeight: "700",
  },
});

export default OrderSuccessScreen;
