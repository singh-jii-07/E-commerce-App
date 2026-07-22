import React, { useEffect } from "react";
import {
  StyleSheet,
  View,
  Text,
  Modal,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

// Safely require react-native-webview only on native platforms (iOS / Android)
let WebView = null;
if (Platform.OS !== "web") {
  try {
    WebView = require("react-native-webview").WebView;
  } catch (e) {
    console.log("react-native-webview load error:", e.message);
  }
}

const RazorpayPaymentModal = ({
  visible,
  razorpayOrder,
  razorpayKey = process.env.EXPO_PUBLIC_RAZORPAY_KEY_ID || "rzp_test_TGDj02H1jVmfOn",
  userName = "Customer",
  userPhone = "",
  userEmail = "",
  onSuccess,
  onCancel,
  onError,
}) => {
  // WEB PLATFORM: Direct Razorpay Checkout JS Integration
  useEffect(() => {
    if (Platform.OS === "web" && visible && razorpayOrder) {
      const openRazorpayWeb = () => {
        const options = {
          key: razorpayKey,
          amount: razorpayOrder.amount || 0,
          currency: razorpayOrder.currency || "INR",
          name: "Grocery Food Store",
          description: "Order Checkout Payment",
          order_id: razorpayOrder.id || "",
          prefill: {
            name: userName || "Customer",
            contact: userPhone || "",
            email: userEmail || "",
          },
          theme: {
            color: "#0F172A",
          },
          handler: function (response) {
            onSuccess({
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_signature: response.razorpay_signature,
            });
          },
          modal: {
            ondismiss: function () {
              onCancel();
            },
          },
        };

        try {
          const rzp = new window.Razorpay(options);
          rzp.on("payment.failed", function (response) {
            onError(response.error);
          });
          rzp.open();
        } catch (err) {
          console.error("Razorpay Web Open Error:", err);
          onError({ description: err.message || "Failed to launch Razorpay gateway" });
        }
      };

      if (typeof window !== "undefined") {
        if (!window.Razorpay) {
          const script = document.createElement("script");
          script.src = "https://checkout.razorpay.com/v1/checkout.js";
          script.async = true;
          script.onload = () => openRazorpayWeb();
          script.onerror = () =>
            onError({ description: "Failed to load Razorpay payment script" });
          document.body.appendChild(script);
        } else {
          openRazorpayWeb();
        }
      }
    }
  }, [visible, razorpayOrder]);

  if (!visible || !razorpayOrder) return null;

  // On Web, Razorpay JS renders its own checkout iframe modal directly in browser
  if (Platform.OS === "web") {
    return null;
  }

  // NATIVE PLATFORMS (iOS & Android): Render WebView inside Modal
  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <style>
    body {
      margin: 0;
      padding: 0;
      display: flex;
      justify-content: center;
      align-items: center;
      height: 100vh;
      background-color: #F8FAFC;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    }
    .loading-box {
      text-align: center;
      color: #0F172A;
    }
    .spinner {
      border: 4px solid rgba(15, 23, 42, 0.1);
      width: 40px;
      height: 40px;
      border-radius: 50%;
      border-left-color: #0F172A;
      animation: spin 0.8s linear infinite;
      margin: 0 auto 16px;
    }
    @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
  </style>
  <script src="https://checkout.razorpay.com/v1/checkout.js"></script>
</head>
<body>
  <div class="loading-box">
    <div class="spinner"></div>
    <h3 style="margin: 0 0 8px; font-size: 18px; font-weight: 700;">Opening Razorpay Gateway...</h3>
    <p style="margin: 0; color: #64748B; font-size: 13px;">Please complete your payment in the checkout window.</p>
  </div>
  <script>
    window.onload = function() {
      var options = {
        key: "${razorpayKey}",
        amount: ${razorpayOrder?.amount || 0},
        currency: "${razorpayOrder?.currency || 'INR'}",
        name: "Grocery Food Store",
        description: "Order Checkout Payment",
        order_id: "${razorpayOrder?.id || ''}",
        prefill: {
          name: "${userName || 'Customer'}",
          contact: "${userPhone || ''}",
          email: "${userEmail || ''}"
        },
        theme: {
          color: "#0F172A"
        },
        handler: function (response) {
          window.ReactNativeWebView.postMessage(JSON.stringify({
            type: 'PAYMENT_SUCCESS',
            data: {
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_signature: response.razorpay_signature
            }
          }));
        },
        modal: {
          ondismiss: function() {
            window.ReactNativeWebView.postMessage(JSON.stringify({
              type: 'PAYMENT_CANCELLED'
            }));
          }
        }
      };
      
      try {
        var rzp = new Razorpay(options);
        rzp.on('payment.failed', function (response){
          window.ReactNativeWebView.postMessage(JSON.stringify({
            type: 'PAYMENT_FAILED',
            error: response.error
          }));
        });
        rzp.open();
      } catch(err) {
        window.ReactNativeWebView.postMessage(JSON.stringify({
          type: 'PAYMENT_FAILED',
          error: { description: err.message }
        }));
      }
    };
  </script>
</body>
</html>
`;

  const handleMessage = (event) => {
    try {
      const messageData = JSON.parse(event.nativeEvent.data);
      if (messageData.type === "PAYMENT_SUCCESS") {
        onSuccess(messageData.data);
      } else if (messageData.type === "PAYMENT_CANCELLED") {
        onCancel();
      } else if (messageData.type === "PAYMENT_FAILED") {
        onError(messageData.error);
      }
    } catch (err) {
      console.error("Razorpay WebView Message Parse Error:", err);
    }
  };

  if (!WebView) {
    return null;
  }

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onCancel}>
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <View style={styles.headerTitleRow}>
            <Ionicons name="shield-checkmark" size={20} color="#10B981" />
            <Text style={styles.headerTitle}>Secure Payment</Text>
          </View>

          <TouchableOpacity onPress={onCancel} style={styles.closeBtn}>
            <Ionicons name="close" size={22} color="#0F172A" />
          </TouchableOpacity>
        </View>

        <WebView
          originWhitelist={["*"]}
          source={{ html: htmlContent }}
          onMessage={handleMessage}
          style={{ flex: 1 }}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          startInLoadingState={true}
          renderLoading={() => (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#0F172A" />
              <Text style={styles.loadingText}>Initializing Payment Gateway...</Text>
            </View>
          )}
        />
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
    backgroundColor: "#FFFFFF",
  },
  headerTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#0F172A",
  },
  closeBtn: {
    padding: 6,
    borderRadius: 20,
    backgroundColor: "#F1F5F9",
  },
  loadingContainer: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: "#64748B",
    fontWeight: "600",
  },
});

export default RazorpayPaymentModal;
