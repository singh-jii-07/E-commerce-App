import React, { useState, useEffect, useCallback } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
  SafeAreaView,
  StatusBar,
  Platform,
  Modal,
  FlatList,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import cartService from "../services/cartService";
import addressService from "../services/addressService";
import orderService from "../services/orderService";
import paymentService from "../services/paymentService";
import RazorpayPaymentModal from "../components/RazorpayPaymentModal";

const CheckoutScreen = () => {
  const router = useRouter();

  // State Management
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [cartItems, setCartItems] = useState([]);
  const [addresses, setAddresses] = useState([]);
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState("COD"); // "COD" | "Razorpay"

  // Address Modal State
  const [addressModalVisible, setAddressModalVisible] = useState(false);

  // Razorpay Gateway Modal State
  const [razorpayModalVisible, setRazorpayModalVisible] = useState(false);
  const [razorpayOrderData, setRazorpayOrderData] = useState(null);
  const [createdDbOrder, setCreatedDbOrder] = useState(null);

  // Initial Data Fetch
  const fetchCheckoutData = async () => {
    try {
      setLoading(true);

      // Fetch Cart Items & Addresses in parallel
      const [cartRes, addressRes] = await Promise.all([
        cartService.getMyCart(),
        addressService.getAddresses(),
      ]);

      // Cart Items
      if (cartRes && cartRes.success && Array.isArray(cartRes.data)) {
        setCartItems(cartRes.data);
      } else {
        setCartItems([]);
      }

      // User Addresses
      const addrList = addressRes?.addresses || addressRes?.data || [];
      if (Array.isArray(addrList) && addrList.length > 0) {
        setAddresses(addrList);
        const defaultAddr = addrList.find((a) => a.isDefault) || addrList[0];
        setSelectedAddress(defaultAddr);
      } else {
        setAddresses([]);
        setSelectedAddress(null);
      }
    } catch (error) {
      console.error("Fetch Checkout Data Error:", error);
      Alert.alert(
        "Error",
        error?.response?.data?.message || "Failed to load checkout details."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCheckoutData();
  }, []);

  // Calculation Utilities
  const calculateSubtotal = () => {
    return cartItems.reduce((acc, item) => {
      const price = item.product?.price || 0;
      return acc + price * item.quantity;
    }, 0);
  };

  const subtotal = calculateSubtotal();
  const deliveryCharge = subtotal > 500 || subtotal === 0 ? 0 : 40;
  const totalAmount = subtotal + deliveryCharge;

  // Handle Place Order Button
  const handlePlaceOrder = async () => {
    if (cartItems.length === 0) {
      Alert.alert("Empty Cart", "Your cart is empty. Add products to proceed.", [
        { text: "Go to Shop", onPress: () => router.replace("/") },
      ]);
      return;
    }

    if (!selectedAddress || !selectedAddress._id) {
      Alert.alert(
        "Address Required",
        "Please select or add a delivery address before placing your order.",
        [
          { text: "Cancel", style: "cancel" },
          { text: "Add Address", onPress: () => router.push("/add-address") },
        ]
      );
      return;
    }

    if (paymentMethod === "COD") {
      await handleCODCheckout();
    } else if (paymentMethod === "Razorpay") {
      await handleRazorpayCheckout();
    }
  };

  // 1. Cash on Delivery Checkout Flow
  const handleCODCheckout = async () => {
    try {
      setSubmitting(true);

      const res = await orderService.createOrder({
        address: selectedAddress._id,
        paymentMethod: "COD",
      });

      if (res && res.success && res.data) {
        const newOrder = res.data;
        router.replace(
          `/order-success?orderId=${newOrder._id}&paymentMethod=COD`
        );
      } else {
        Alert.alert("Checkout Failed", res?.message || "Could not create order.");
      }
    } catch (error) {
      console.error("COD Checkout Error:", error);
      Alert.alert(
        "Checkout Error",
        error?.response?.data?.message || error.message || "Failed to place order."
      );
    } finally {
      setSubmitting(false);
    }
  };

  // 2. Razorpay Online Payment Checkout Flow
  const handleRazorpayCheckout = async () => {
    try {
      setSubmitting(true);

      // Step 1: Call backend API to initiate Razorpay order
      let res;
      if (createdDbOrder && createdDbOrder._id) {
        // Retry paying for existing order
        res = await paymentService.createRazorpayOrder({
          orderId: createdDbOrder._id,
        });
      } else {
        // Create new Razorpay order from cart
        res = await paymentService.createRazorpayOrder({
          address: selectedAddress._id,
        });
      }

      if (res && res.success && res.order) {
        setRazorpayOrderData(res.order);
        setCreatedDbOrder(res.data);
        setRazorpayModalVisible(true);
      } else {
        Alert.alert(
          "Payment Error",
          res?.message || "Failed to initiate online payment."
        );
      }
    } catch (error) {
      console.error("Razorpay Initiate Error:", error);
      Alert.alert(
        "Payment Initialization Failed",
        error?.response?.data?.message ||
          error.message ||
          "Failed to connect to payment server."
      );
    } finally {
      setSubmitting(false);
    }
  };

  // 3. Handle Razorpay Success Callback
  const handleRazorpaySuccess = async (paymentResponse) => {
    setRazorpayModalVisible(false);
    setSubmitting(true);

    try {
      const orderIdToVerify =
        createdDbOrder?._id || paymentResponse.razorpay_order_id;

      // Step 4: Call backend to verify payment
      const verifyRes = await paymentService.verifyPayment({
        orderId: orderIdToVerify,
        razorpay_order_id: paymentResponse.razorpay_order_id,
        razorpay_payment_id: paymentResponse.razorpay_payment_id,
        razorpay_signature: paymentResponse.razorpay_signature,
      });

      if (verifyRes && verifyRes.success) {
        router.replace(
          `/order-success?orderId=${orderIdToVerify}&paymentMethod=Razorpay`
        );
      } else {
        Alert.alert(
          "Verification Pending",
          verifyRes?.message || "Payment received, but verification is pending."
        );
      }
    } catch (error) {
      console.error("Payment Verification Error:", error);
      Alert.alert(
        "Payment Verification Error",
        error?.response?.data?.message ||
          "Payment was processed, but server verification failed. Please contact support."
      );
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Razorpay Payment Cancellation
  const handleRazorpayCancel = () => {
    setRazorpayModalVisible(false);
    Alert.alert(
      "Payment Cancelled",
      "You cancelled the payment process. You can retry paying anytime or choose Cash on Delivery.",
      [{ text: "OK" }]
    );
  };

  // Handle Razorpay Payment Failure
  const handleRazorpayError = (error) => {
    setRazorpayModalVisible(false);
    Alert.alert(
      "Payment Failed",
      error?.description || "Payment failed. Please check your payment details or try again.",
      [{ text: "Try Again", onPress: handleRazorpayCheckout }, { text: "Cancel", style: "cancel" }]
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#0F172A" />
        <Text style={styles.loadingText}>Preparing Checkout...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Top Navigation Bar */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backBtn}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={22} color="#0F172A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Order Checkout</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* 1. Delivery Address Card */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleRow}>
              <Ionicons name="location-sharp" size={20} color="#0F172A" />
              <Text style={styles.sectionTitle}>Delivery Address</Text>
            </View>
            <TouchableOpacity
              onPress={() => setAddressModalVisible(true)}
              activeOpacity={0.7}
            >
              <Text style={styles.changeActionText}>Change</Text>
            </TouchableOpacity>
          </View>

          {selectedAddress ? (
            <View style={styles.addressBox}>
              <View style={styles.addressBoxTop}>
                <Text style={styles.addressName}>{selectedAddress.fullName}</Text>
                <View style={styles.typeBadge}>
                  <Text style={styles.typeBadgeText}>
                    {selectedAddress.addressType || "HOME"}
                  </Text>
                </View>
              </View>

              <Text style={styles.addressText}>
                {selectedAddress.addressLine1}
                {selectedAddress.addressLine2 ? `, ${selectedAddress.addressLine2}` : ""}
              </Text>
              {selectedAddress.landmark ? (
                <Text style={styles.addressTextSub}>
                  Landmark: {selectedAddress.landmark}
                </Text>
              ) : null}
              <Text style={styles.addressTextSub}>
                {selectedAddress.city}, {selectedAddress.state} -{" "}
                {selectedAddress.postalCode}
              </Text>
              <Text style={styles.addressPhone}>
                📞 Phone: {selectedAddress.phone}
              </Text>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.addAddressPrompt}
              onPress={() => router.push("/add-address")}
              activeOpacity={0.8}
            >
              <Ionicons name="add-circle-outline" size={24} color="#0F172A" />
              <Text style={styles.addAddressText}>Add New Delivery Address</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* 2. Ordered Products Summary */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleRow}>
              <Ionicons name="bag-handle" size={20} color="#0F172A" />
              <Text style={styles.sectionTitle}>Ordered Items ({cartItems.length})</Text>
            </View>
          </View>

          {cartItems.map((item, index) => {
            const prod = item.product || {};
            return (
              <View key={item._id || index} style={styles.productRow}>
                <Image
                  source={{
                    uri:
                      prod.images && prod.images.length > 0
                        ? prod.images[0]
                        : "https://via.placeholder.com/80",
                  }}
                  style={styles.productThumb}
                  resizeMode="contain"
                />
                <View style={styles.productMeta}>
                  <Text numberOfLines={1} style={styles.productTitle}>
                    {prod.name || "Product"}
                  </Text>
                  <Text style={styles.productUnit}>
                    Qty: {item.quantity} {prod.unit ? `• ${prod.unit}` : ""}
                  </Text>
                  <Text style={styles.productPriceText}>₹{prod.price || 0}</Text>
                </View>
                <Text style={styles.productSubtotal}>
                  ₹{(prod.price || 0) * item.quantity}
                </Text>
              </View>
            );
          })}
        </View>

        {/* 3. Payment Method Selection */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleRow}>
              <Ionicons name="card" size={20} color="#0F172A" />
              <Text style={styles.sectionTitle}>Payment Method</Text>
            </View>
          </View>

          {/* Option A: Cash on Delivery */}
          <TouchableOpacity
            style={[
              styles.paymentOptionCard,
              paymentMethod === "COD" && styles.paymentOptionSelected,
            ]}
            onPress={() => setPaymentMethod("COD")}
            activeOpacity={0.8}
          >
            <View style={styles.paymentLeftGroup}>
              <View
                style={[
                  styles.radioCircle,
                  paymentMethod === "COD" && styles.radioCircleActive,
                ]}
              >
                {paymentMethod === "COD" ? (
                  <View style={styles.radioInnerCircle} />
                ) : null}
              </View>
              <View style={styles.paymentIconWrapper}>
                <Ionicons name="cash-outline" size={22} color="#0F172A" />
              </View>
              <View>
                <Text style={styles.paymentTitle}>Cash on Delivery (COD)</Text>
                <Text style={styles.paymentSub}>Pay cash when order is delivered</Text>
              </View>
            </View>
          </TouchableOpacity>

          {/* Option B: Razorpay */}
          <TouchableOpacity
            style={[
              styles.paymentOptionCard,
              paymentMethod === "Razorpay" && styles.paymentOptionSelected,
            ]}
            onPress={() => setPaymentMethod("Razorpay")}
            activeOpacity={0.8}
          >
            <View style={styles.paymentLeftGroup}>
              <View
                style={[
                  styles.radioCircle,
                  paymentMethod === "Razorpay" && styles.radioCircleActive,
                ]}
              >
                {paymentMethod === "Razorpay" ? (
                  <View style={styles.radioInnerCircle} />
                ) : null}
              </View>
              <View
                style={[
                  styles.paymentIconWrapper,
                  { backgroundColor: "#EFF6FF" },
                ]}
              >
                <Ionicons name="globe-outline" size={22} color="#2563EB" />
              </View>
              <View>
                <Text style={styles.paymentTitle}>Razorpay Online Payment</Text>
                <Text style={styles.paymentSub}>UPI, Credit/Debit Card, NetBanking</Text>
              </View>
            </View>
          </TouchableOpacity>
        </View>

        {/* 4. Price Summary */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Price Summary</Text>

          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>Item Subtotal</Text>
            <Text style={styles.priceVal}>₹{subtotal}</Text>
          </View>

          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>Delivery Charge</Text>
            <Text style={[styles.priceVal, deliveryCharge === 0 && styles.freeText]}>
              {deliveryCharge === 0 ? "FREE" : `₹${deliveryCharge}`}
            </Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.priceRowTotal}>
            <Text style={styles.totalLabel}>Total Payable</Text>
            <Text style={styles.totalVal}>₹{totalAmount}</Text>
          </View>
        </View>
      </ScrollView>

      {/* Bottom Sticky Action Bar */}
      <View style={styles.bottomBar}>
        <View style={styles.bottomTotalContainer}>
          <Text style={styles.bottomTotalLabel}>Total Amount</Text>
          <Text style={styles.bottomTotalValue}>₹{totalAmount}</Text>
        </View>

        <TouchableOpacity
          style={[styles.placeOrderBtn, submitting && styles.btnDisabled]}
          onPress={handlePlaceOrder}
          disabled={submitting}
          activeOpacity={0.85}
        >
          {submitting ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <>
              <Text style={styles.placeOrderBtnText}>
                {paymentMethod === "COD" ? "Place Order" : "Proceed to Pay"}
              </Text>
              <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
            </>
          )}
        </TouchableOpacity>
      </View>

      {/* Select Address Modal */}
      <Modal
        visible={addressModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setAddressModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Delivery Address</Text>
              <TouchableOpacity
                onPress={() => setAddressModalVisible(false)}
                style={styles.modalCloseBtn}
              >
                <Ionicons name="close" size={20} color="#0F172A" />
              </TouchableOpacity>
            </View>

            <FlatList
              data={addresses}
              keyExtractor={(item) => item._id}
              renderItem={({ item }) => {
                const isSelected = selectedAddress?._id === item._id;
                return (
                  <TouchableOpacity
                    style={[
                      styles.addressItemCard,
                      isSelected && styles.addressItemCardSelected,
                    ]}
                    onPress={() => {
                      setSelectedAddress(item);
                      setAddressModalVisible(false);
                    }}
                  >
                    <View style={styles.addressItemHeader}>
                      <Text style={styles.addressItemName}>{item.fullName}</Text>
                      <View style={styles.typeBadge}>
                        <Text style={styles.typeBadgeText}>
                          {item.addressType || "HOME"}
                        </Text>
                      </View>
                    </View>
                    <Text style={styles.addressItemBody}>
                      {item.addressLine1}, {item.city}, {item.state} - {item.postalCode}
                    </Text>
                    <Text style={styles.addressItemPhone}>Phone: {item.phone}</Text>
                  </TouchableOpacity>
                );
              }}
              ListFooterComponent={
                <TouchableOpacity
                  style={styles.addNewAddressBtnModal}
                  onPress={() => {
                    setAddressModalVisible(false);
                    router.push("/add-address");
                  }}
                >
                  <Ionicons name="add" size={20} color="#0F172A" />
                  <Text style={styles.addNewAddressBtnModalText}>
                    Add New Address
                  </Text>
                </TouchableOpacity>
              }
            />
          </View>
        </View>
      </Modal>

      {/* Razorpay WebView Payment Modal */}
      <RazorpayPaymentModal
        visible={razorpayModalVisible}
        razorpayOrder={razorpayOrderData}
        razorpayKey={process.env.EXPO_PUBLIC_RAZORPAY_KEY_ID || "rzp_test_TGDj02H1jVmfOn"}
        userName={selectedAddress?.fullName}
        userPhone={selectedAddress?.phone}
        onSuccess={handleRazorpaySuccess}
        onCancel={handleRazorpayCancel}
        onError={handleRazorpayError}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  centerContainer: {
    flex: 1,
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
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#F1F5F9",
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#0F172A",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 100,
  },
  sectionCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  sectionTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#0F172A",
  },
  changeActionText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#2563EB",
  },
  addressBox: {
    backgroundColor: "#F8FAFC",
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  addressBoxTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  addressName: {
    fontSize: 15,
    fontWeight: "700",
    color: "#0F172A",
  },
  typeBadge: {
    backgroundColor: "#E2E8F0",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  typeBadgeText: {
    fontSize: 10,
    fontWeight: "800",
    color: "#475569",
  },
  addressText: {
    fontSize: 13,
    color: "#334155",
    lineHeight: 18,
  },
  addressTextSub: {
    fontSize: 12,
    color: "#64748B",
    marginTop: 2,
  },
  addressPhone: {
    fontSize: 12,
    fontWeight: "600",
    color: "#0F172A",
    marginTop: 6,
  },
  addAddressPrompt: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 18,
    borderWidth: 1.5,
    borderStyle: "dashed",
    borderColor: "#CBD5E1",
    borderRadius: 14,
    backgroundColor: "#F8FAFC",
  },
  addAddressText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#0F172A",
  },
  productRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  productThumb: {
    width: 48,
    height: 48,
    borderRadius: 10,
    backgroundColor: "#F8FAFC",
  },
  productMeta: {
    flex: 1,
    marginLeft: 12,
  },
  productTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#0F172A",
  },
  productUnit: {
    fontSize: 12,
    color: "#64748B",
    marginTop: 2,
  },
  productPriceText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#475569",
    marginTop: 2,
  },
  productSubtotal: {
    fontSize: 14,
    fontWeight: "800",
    color: "#0F172A",
  },
  paymentOptionCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#F8FAFC",
    borderRadius: 16,
    padding: 14,
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
    marginBottom: 10,
  },
  paymentOptionSelected: {
    borderColor: "#0F172A",
    backgroundColor: "#F1F5F9",
  },
  paymentLeftGroup: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    gap: 12,
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "#94A3B8",
    alignItems: "center",
    justifyContent: "center",
  },
  radioCircleActive: {
    borderColor: "#0F172A",
  },
  radioInnerCircle: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#0F172A",
  },
  paymentIconWrapper: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#E2E8F0",
    alignItems: "center",
    justifyContent: "center",
  },
  paymentTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#0F172A",
  },
  paymentSub: {
    fontSize: 11,
    color: "#64748B",
    marginTop: 1,
  },
  priceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
  },
  priceLabel: {
    fontSize: 13,
    color: "#64748B",
  },
  priceVal: {
    fontSize: 13,
    fontWeight: "700",
    color: "#0F172A",
  },
  freeText: {
    color: "#10B981",
  },
  divider: {
    height: 1,
    backgroundColor: "#E2E8F0",
    marginVertical: 12,
  },
  priceRowTotal: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  totalLabel: {
    fontSize: 15,
    fontWeight: "800",
    color: "#0F172A",
  },
  totalVal: {
    fontSize: 18,
    fontWeight: "800",
    color: "#0F172A",
  },
  bottomBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 20,
    paddingVertical: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: "#E2E8F0",
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
  },
  bottomTotalContainer: {
    flexDirection: "column",
  },
  bottomTotalLabel: {
    fontSize: 12,
    color: "#64748B",
  },
  bottomTotalValue: {
    fontSize: 20,
    fontWeight: "800",
    color: "#0F172A",
  },
  placeOrderBtn: {
    backgroundColor: "#0F172A",
    borderRadius: 30,
    paddingHorizontal: 24,
    paddingVertical: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  btnDisabled: {
    opacity: 0.7,
  },
  placeOrderBtnText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "800",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 20,
    maxHeight: "75%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#0F172A",
  },
  modalCloseBtn: {
    padding: 6,
    borderRadius: 16,
    backgroundColor: "#F1F5F9",
  },
  addressItemCard: {
    padding: 14,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
    marginBottom: 10,
    backgroundColor: "#F8FAFC",
  },
  addressItemCardSelected: {
    borderColor: "#0F172A",
    backgroundColor: "#F1F5F9",
  },
  addressItemHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  addressItemName: {
    fontSize: 14,
    fontWeight: "700",
    color: "#0F172A",
  },
  addressItemBody: {
    fontSize: 12,
    color: "#475569",
  },
  addressItemPhone: {
    fontSize: 12,
    color: "#64748B",
    marginTop: 4,
  },
  addNewAddressBtnModal: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#0F172A",
    gap: 6,
    marginTop: 10,
  },
  addNewAddressBtnModalText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#0F172A",
  },
});

export default CheckoutScreen;
