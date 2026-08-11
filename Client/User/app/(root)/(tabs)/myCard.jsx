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
  Platform,
  StatusBar,
  Modal,
  TextInput,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, useFocusEffect } from "expo-router";
import cartService from "../../../services/cartService";
import orderService from "../../../services/orderService";
import addressService from "../../../services/addressService";
import { useCart } from "../../../context/CartContext";

const getCalories = (item) => {
  const name = (item.name || "").toLowerCase().trim();
  if (name.includes("apple")) return "55 cal";
  if (name.includes("orange")) return "75 cal";
  if (name.includes("capsicum")) return "52 cal";
  if (name.includes("dragon")) return "69 cal";
  if (name.includes("strawberry")) return "75 cal";
  if (name.includes("lemon")) return "20 cal";
  if (name.includes("potato")) return "87 cal";
  if (name.includes("onion")) return "40 cal";
  if (name.includes("fries")) return "312 cal";

  // Fallback deterministic calculation based on product name hash
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const cal = Math.abs(hash % 40) + 45;
  return `${cal} cal`;
};

const MyCart = () => {
  const router = useRouter();
  const { fetchCartCount } = useCart();
  const insets = useSafeAreaInsets();

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
      fetchCartCount();
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
        fetchCartCount();
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
        fetchCartCount();
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
              {getCalories(prod)}
            </Text>
            <Text style={styles.productPrice}>
              ₹{prod.price || 0}
              {prod.unit ? <Text style={styles.unitText}>/{prod.unit.toLowerCase()}</Text> : null}
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
            <Ionicons name="search-outline" size={24} color="#0F172A" />
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
              {`Looks like you haven't added anything to your cart yet.`}
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
      </View>

      {/* Bottom Total & Checkout Bar (Image 1 & 2 UI design) */}
      {cartItems.length > 0 && (
        <View
          style={[
            styles.bottomCheckoutCard,
            { bottom: 70 + insets.bottom },
          ]}
        >
          <View style={styles.priceContainer}>
            <Text style={styles.totalLabel}>Total Price</Text>
            <Text style={styles.totalAmountText}>
              ₹{calculateTotal().toFixed(2)}
            </Text>
          </View>

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
    </SafeAreaView>
  );
};

export default MyCart;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 15,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#0F172A",
    lineHeight: 36,
  },
  headerTitleBold: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#0F172A",
    lineHeight: 36,
  },
  searchIconBtn: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#F1F5F9",
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
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
    fontWeight: "bold",
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
    fontWeight: "bold",
  },
  listContent: {
    paddingBottom: 160,
  },
  cardWrapper: {
    marginBottom: 16,
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F5F7FA",
    borderRadius: 28,
    paddingVertical: 16,
    paddingLeft: 16,
    paddingRight: 76,
    borderWidth: 0,
    overflow: "hidden",
    position: "relative",
  },
  productImage: {
    width: 70,
    height: 70,
  },
  detailsContainer: {
    flex: 1,
    marginLeft: 16,
  },
  productName: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#0F172A",
  },
  productSubText: {
    fontSize: 13,
    color: "#94A3B8",
    marginVertical: 4,
  },
  productPrice: {
    fontSize: 18,
    fontWeight: "800",
    color: "#FF6B35",
  },
  unitText: {
    fontSize: 13,
    color: "#94A3B8",
    fontWeight: "normal",
  },
  quantityCol: {
    alignItems: "center",
    justifyContent: "center",
  },
  qtyActionBtn: {
    padding: 6,
  },
  qtyBadge: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: "#0F172A",
    justifyContent: "center",
    alignItems: "center",
    marginVertical: 4,
  },
  qtyBadgeText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "bold",
  },
  deleteSideBtn: {
    backgroundColor: "#FF6B35",
    position: "absolute",
    right: 0,
    top: 0,
    height: "100%",
    width: 60,
    justifyContent: "center",
    alignItems: "center",
    borderTopRightRadius: 28,
    borderBottomRightRadius: 28,
  },
  bottomCheckoutCard: {
    position: "absolute",
    left: 0,
    right: 0,
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 24,
    paddingVertical: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderColor: "#E2E8F0",
    elevation: 8,
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
  },
  priceContainer: {
    flexDirection: "column",
    justifyContent: "center",
  },
  totalLabel: {
    fontSize: 13,
    color: "#64748B",
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  totalAmountText: {
    fontSize: 22,
    fontWeight: "800",
    color: "#0F172A",
    marginTop: 2,
  },
  checkoutBtn: {
    backgroundColor: "#0F172A",
    borderRadius: 20,
    paddingVertical: 14,
    paddingHorizontal: 32,
    alignItems: "center",
    justifyContent: "center",
    minWidth: 140,
    elevation: 2,
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  checkoutBtnText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold",
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