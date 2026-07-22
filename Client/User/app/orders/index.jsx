import React, { useEffect, useState, useMemo } from "react";
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  SafeAreaView,
  Platform,
  StatusBar,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, useFocusEffect } from "expo-router";
import orderService from "../../services/orderService";

const statusFilters = ["All Order", "Pending", "Processing", "Delivered", "Cancelled"];

const OrdersList = () => {
  const router = useRouter();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedFilter, setSelectedFilter] = useState("All Order");

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const res = await orderService.getMyOrders();
      if (res && res.success && Array.isArray(res.data)) {
        setOrders(res.data);
      } else {
        setOrders([]);
      }
    } catch (error) {
      console.log("Error fetching orders:", error);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      fetchOrders();
    }, [])
  );

  const filteredOrders = useMemo(() => {
    if (selectedFilter === "All Order") return orders;

    return orders.filter((order) => {
      const status = order.orderStatus?.toLowerCase() || "";
      const filter = selectedFilter.toLowerCase();

      if (filter === "processing") {
        return ["processing", "confirmed", "packed", "shipped"].includes(status);
      }
      return status === filter;
    });
  }, [orders, selectedFilter]);

  const renderOrderItem = ({ item }) => {
    const firstItem = item.items && item.items.length > 0 ? item.items[0] : null;
    const product = firstItem?.product || {};

    const imageUri =
      product.images && product.images.length > 0
        ? product.images[0]
        : "https://via.placeholder.com/150";

    const formattedDate = item.createdAt
      ? new Date(item.createdAt).toLocaleDateString("en-GB", {
          day: "numeric",
          month: "short",
          year: "numeric",
        })
      : "20 Sep 2023";

    // Format display status (e.g. "Processing" for Confirmed/Packed/Shipped)
    let displayStatus = item.orderStatus || "Pending";
    if (["Confirmed", "Packed", "Shipped"].includes(displayStatus)) {
      displayStatus = "Processing";
    }

    return (
      <TouchableOpacity
        style={styles.card}
        activeOpacity={0.85}
        onPress={() => router.push(`/orders/${item._id}`)}
      >
        <Image
          source={{ uri: imageUri }}
          style={styles.productImage}
          resizeMode="contain"
        />

        <View style={styles.cardContent}>
          <Text numberOfLines={1} style={styles.productTitle}>
            {product.name || `Order #${item._id.slice(-6).toUpperCase()}`}
          </Text>

          <Text style={styles.orderDate}>{formattedDate}</Text>

          <Text style={styles.priceText}>
            ₹{(item.totalAmount || product.price || 0).toFixed(2)}
            {product.unit ? <Text style={styles.unitText}>/{product.unit}</Text> : null}
          </Text>
        </View>

        <View style={styles.statusPill}>
          <Text style={styles.statusPillText}>{displayStatus}</Text>
        </View>
      </TouchableOpacity>
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

        {/* Horizontal Status Filters (Image Mockup UI) */}
        <View style={{ height: 48, marginVertical: 12 }}>
          <FlatList
            horizontal
            showsHorizontalScrollIndicator={false}
            data={statusFilters}
            keyExtractor={(item) => item}
            contentContainerStyle={styles.filterListContainer}
            renderItem={({ item }) => {
              const isSelected = selectedFilter === item;
              return (
                <TouchableOpacity
                  style={[
                    styles.filterBtn,
                    isSelected && styles.filterBtnActive,
                  ]}
                  onPress={() => setSelectedFilter(item)}
                  activeOpacity={0.8}
                >
                  <Text
                    style={[
                      styles.filterText,
                      isSelected && styles.filterTextActive,
                    ]}
                  >
                    {item}
                  </Text>
                </TouchableOpacity>
              );
            }}
          />
        </View>

        {/* Orders List */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#FF6B35" />
            <Text style={{ marginTop: 10, color: "#64748B" }}>Loading orders...</Text>
          </View>
        ) : filteredOrders.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="receipt-outline" size={54} color="#CBD5E1" />
            <Text style={styles.emptyTitle}>No Orders Found</Text>
            <Text style={styles.emptySubtitle}>
              There are no orders matching "{selectedFilter}".
            </Text>
          </View>
        ) : (
          <FlatList
            data={filteredOrders}
            keyExtractor={(item) => item._id}
            renderItem={renderOrderItem}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>
    </SafeAreaView>
  );
};

export default OrdersList;

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
    marginBottom: 6,
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
  filterListContainer: {
    paddingRight: 10,
    alignItems: "center",
  },
  filterBtn: {
    paddingHorizontal: 22,
    paddingVertical: 10,
    backgroundColor: "#F1F5F9",
    borderRadius: 24,
    marginRight: 10,
  },
  filterBtnActive: {
    backgroundColor: "#0F172A",
  },
  filterText: {
    color: "#0F172A",
    fontWeight: "600",
    fontSize: 14,
  },
  filterTextActive: {
    color: "#FFFFFF",
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
    fontSize: 18,
    fontWeight: "700",
    color: "#0F172A",
    marginTop: 12,
  },
  emptySubtitle: {
    fontSize: 14,
    color: "#64748B",
    marginTop: 4,
    textAlign: "center",
  },
  listContent: {
    paddingBottom: 100,
    paddingTop: 6,
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FAFAFA",
    borderRadius: 22,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#F1F5F9",
  },
  productImage: {
    width: 65,
    height: 65,
  },
  cardContent: {
    flex: 1,
    marginLeft: 14,
  },
  productTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#0F172A",
  },
  orderDate: {
    fontSize: 13,
    color: "#94A3B8",
    marginVertical: 3,
  },
  priceText: {
    fontSize: 16,
    fontWeight: "800",
    color: "#FF6B35",
  },
  unitText: {
    fontSize: 12,
    color: "#94A3B8",
    fontWeight: "400",
  },
  statusPill: {
    backgroundColor: "#E2E8F0",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  statusPillText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#0F172A",
  },
});
