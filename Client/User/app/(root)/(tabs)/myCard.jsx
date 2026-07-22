import React, { useState, useCallback } from "react";
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
  SafeAreaView,
  Platform,
  StatusBar,
  Modal,
  TextInput,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, useFocusEffect } from "expo-router";
import cartService from "../../../services/cartService";
import orderService from "../../../services/orderService";
import addressService from "../../../services/addressService";

const MyCart = () => {
  const router = useRouter();

  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);
  const [checkoutLoading, setCheckoutLoading] = useState(false);

  const fetchCart = async () => {
    try {
      setLoading(true);
      const res = await cartService.getMyCart();
      if (res && res.success && Array.isArray(res.data)) {
        setCartItems(res.data);
      } else {
        setCartItems([]);
      }
    } catch (error) {
      console.log("Error fetching cart:", error);
      setCartItems([]);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchCart();
    }, [])
  );

  const calculateTotal = () => {
    return cartItems.reduce((acc, item) => {
      const price = item.product?.price || 0;
      return acc + price * item.quantity;
    }, 0);
  };

  const handleUpdateQuantity = async (cartItem, change) => {
    const newQty = cartItem.quantity + change;
    if (newQty <= 0) return;

    try {
      setUpdatingId(cartItem._id);
      const res = await cartService.updateCartItem(cartItem._id, newQty);
      if (res && res.success) {
        setCartItems((prev) =>
          prev.map((item) =>
            item._id === cartItem._id ? { ...item, quantity: newQty } : item
          )
        );
      } else {
        Alert.alert("Notice", res?.message || "Could not update quantity.");
      }
    } catch (err) {
      console.log("Update quantity error:", err);
      Alert.alert("Error", err?.response?.data?.message || "Could not update item.");
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDeleteItem = async (cartItemId) => {
    try {
      setUpdatingId(cartItemId);
      const res = await cartService.deleteCartItem(cartItemId);
      if (res && res.success) {
        setCartItems((prev) => prev.filter((item) => item._id !== cartItemId));
      } else {
        Alert.alert("Notice", res?.message || "Failed to remove item.");
      }
    } catch (err) {
      console.log("Delete cart item error:", err);
      Alert.alert("Error", err?.response?.data?.message || "Could not remove item.");
    } finally {
      setUpdatingId(null);
    }
  };

  const handleCheckout = () => {
    if (cartItems.length === 0) {
      Alert.alert("Empty Cart", "Your cart is empty. Add products before checking out.");
      return;
    }
    router.push("/checkout");
  };

  const renderCartItem = ({ item }) => {
    const prod = item.product || {};
    const isItemUpdating = updatingId === item._id;

    return (
      <View style={styles.cardWrapper}>
        <View style={styles.card}>
          <Image
            source={{
              uri:
                prod.images && prod.images.length > 0
                  ? prod.images[0]
                  : "https://via.placeholder.com/150",
            }}
            style={styles.productImage}
            resizeMode="contain"
          />

          <View style={styles.detailsContainer}>
            <Text numberOfLines={1} style={styles.productName}>
              {prod.name || "Product"}
            </Text>
            <Text style={styles.productSubText}>
              {prod.stock ? `Stock: ${prod.stock}` : "75 cal"}
            </Text>
            <Text style={styles.productPrice}>
              ₹{prod.price || 0}
              {prod.unit ? <Text style={styles.unitText}>/{prod.unit}</Text> : null}
            </Text>
          </View>

          {/* Right Quantity Control Vertical Stack */}
          <View style={styles.quantityCol}>
            <TouchableOpacity
              style={styles.qtyActionBtn}
              onPress={() => handleUpdateQuantity(item, 1)}
              disabled={isItemUpdating}
              activeOpacity={0.7}
            >
              <Ionicons name="add" size={16} color="#0F172A" />
            </TouchableOpacity>

            <View style={styles.qtyBadge}>
              <Text style={styles.qtyBadgeText}>
                {item.quantity < 10 ? `0${item.quantity}` : item.quantity}
              </Text>
            </View>

            <TouchableOpacity
              style={styles.qtyActionBtn}
              onPress={() => handleUpdateQuantity(item, -1)}
              disabled={isItemUpdating}
              activeOpacity={0.7}
            >
              <Ionicons name="remove" size={16} color="#0F172A" />
            </TouchableOpacity>
          </View>

          {/* Delete Action Button (Image 1 & 2 UI) */}
          <TouchableOpacity
            style={styles.deleteSideBtn}
            onPress={() => handleDeleteItem(item._id)}
            disabled={isItemUpdating}
            activeOpacity={0.8}
          >
            <Ionicons name="trash-outline" size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Top Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>Daily</Text>
            <Text style={styles.headerTitleBold}>Grocery Food</Text>
          </View>

          <TouchableOpacity
            style={styles.searchIconBtn}
            onPress={() => router.push("/product")}
            activeOpacity={0.8}
          >
            <Ionicons name="search-outline" size={22} color="#0F172A" />
          </TouchableOpacity>
        </View>

        {/* Cart List */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#FF6B35" />
            <Text style={{ marginTop: 10, color: "#64748B" }}>Loading cart...</Text>
          </View>
        ) : cartItems.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="basket-outline" size={60} color="#CBD5E1" />
            <Text style={styles.emptyTitle}>Your Cart is Empty</Text>
            <Text style={styles.emptySubtitle}>
              Looks like you haven't added anything to your cart yet.
            </Text>
            <TouchableOpacity
              style={styles.shopNowBtn}
              onPress={() => router.replace("/(root)/(tabs)")}
              activeOpacity={0.8}
            >
              <Text style={styles.shopNowText}>Shop Now</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <FlatList
            data={cartItems}
            keyExtractor={(item) => item._id}
            renderItem={renderCartItem}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          />
        )}

        {/* Bottom Total & Checkout Bar (Image 1 & 2 UI design) */}
        {cartItems.length > 0 && (
          <View style={styles.bottomCheckoutCard}>
            <Text style={styles.totalAmountText}>
              Total amount ₹{calculateTotal().toFixed(2)}
            </Text>

            <TouchableOpacity
              style={[
                styles.checkoutBtn,
                checkoutLoading && { opacity: 0.7 },
              ]}
              onPress={handleCheckout}
              disabled={checkoutLoading}
              activeOpacity={0.85}
            >
              {checkoutLoading ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.checkoutBtnText}>Checkout</Text>
              )}
            </TouchableOpacity>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
};

export default MyCart;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0,
  },
  container: {
    flex: 1,
    paddingHorizontal: 18,
    paddingTop: 10,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "400",
    color: "#0F172A",
    lineHeight: 32,
  },
  headerTitleBold: {
    fontSize: 28,
    fontWeight: "800",
    color: "#0F172A",
    lineHeight: 32,
  },
  searchIconBtn: {
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#F1F5F9",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingBottom: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#0F172A",
    marginTop: 14,
  },
  emptySubtitle: {
    fontSize: 14,
    color: "#64748B",
    marginTop: 6,
    textAlign: "center",
    paddingHorizontal: 30,
  },
  shopNowBtn: {
    marginTop: 20,
    backgroundColor: "#0F172A",
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 30,
  },
  shopNowText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
  },
  listContent: {
    paddingBottom: 150,
  },
  cardWrapper: {
    marginBottom: 14,
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FAFAFA",
    borderRadius: 24,
    padding: 14,
    borderWidth: 1,
    borderColor: "#F1F5F9",
    overflow: "hidden",
  },
  productImage: {
    width: 70,
    height: 70,
  },
  detailsContainer: {
    flex: 1,
    marginLeft: 14,
  },
  productName: {
    fontSize: 17,
    fontWeight: "700",
    color: "#0F172A",
  },
  productSubText: {
    fontSize: 12,
    color: "#94A3B8",
    marginVertical: 3,
  },
  productPrice: {
    fontSize: 16,
    fontWeight: "800",
    color: "#FF6B35",
  },
  unitText: {
    fontSize: 12,
    color: "#94A3B8",
    fontWeight: "400",
  },
  quantityCol: {
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  qtyActionBtn: {
    padding: 4,
  },
  qtyBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#0F172A",
    justifyContent: "center",
    alignItems: "center",
    marginVertical: 2,
  },
  qtyBadgeText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "800",
  },
  deleteSideBtn: {
    backgroundColor: "#FF6B35",
    padding: 12,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 4,
  },
  bottomCheckoutCard: {
    position: "absolute",
    bottom: 10,
    left: 18,
    right: 18,
    backgroundColor: "#F8FAFC",
    borderRadius: 28,
    padding: 18,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 5,
  },
  totalAmountText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#0F172A",
    marginBottom: 12,
  },
  checkoutBtn: {
    width: "100%",
    backgroundColor: "#0F172A",
    borderRadius: 30,
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  checkoutBtnText: {
    color: "#FFFFFF",
    fontSize: 16,
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
    padding: 24,
    paddingBottom: 36,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#0F172A",
  },
  closeBtnCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
  },
  modalSubtitle: {
    fontSize: 13,
    color: "#64748B",
    marginBottom: 16,
  },
  paymentOptionCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#F8FAFC",
    borderRadius: 18,
    padding: 14,
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
    marginBottom: 12,
  },
  paymentOptionSelected: {
    borderColor: "#0F172A",
    backgroundColor: "#F1F5F9",
  },
  paymentOptionLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  paymentIconBg: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#E2E8F0",
    alignItems: "center",
    justifyContent: "center",
  },
  paymentOptionTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#0F172A",
  },
  paymentOptionSub: {
    fontSize: 12,
    color: "#64748B",
    marginTop: 2,
  },
  confirmPayBtn: {
    backgroundColor: "#0F172A",
    borderRadius: 30,
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 12,
  },
  confirmPayBtnText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "800",
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: "#0F172A",
    marginBottom: 6,
  },
  cardInput: {
    backgroundColor: "#F8FAFC",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: "#0F172A",
    marginBottom: 14,
  },
  cardInputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    paddingHorizontal: 14,
    marginBottom: 14,
  },
});