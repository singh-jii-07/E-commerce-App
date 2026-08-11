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

    const formattedDate = (item.createdAt
      ? new Date(item.createdAt).toLocaleDateString("en-GB", {
          day: "numeric",
          month: "short",
          year: "numeric",
        })
      : "20 Sep 2023").toLowerCase();

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
            {product.unit ? <Text style={styles.unitText}>/{product.unit.toLowerCase()}</Text> : null}
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
            <Ionicons name="search-outline" size={24} color="#0F172A" />
          </TouchableOpacity>
        </View>

        {/* Horizontal Status Filters (Image Mockup UI) */}
        <View style={{ height: 55, marginVertical: 12 }}>
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
              {`There are no orders matching "${selectedFilter}".`}
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
  filterListContainer: {
    paddingRight: 10,
    alignItems: "center",
  },
  filterBtn: {
    paddingHorizontal: 22,
    paddingVertical: 12,
    backgroundColor: "#F8FAFC",
    borderRadius: 25,
    marginRight: 10,
    borderWidth: 1,
    borderColor: "#F1F5F9",
    justifyContent: "center",
    alignItems: "center",
  },
  filterBtnActive: {
    backgroundColor: "#0F172A",
    borderColor: "#0F172A",
  },
  filterText: {
    color: "#475569",
    fontWeight: "600",
    fontSize: 15,
  },
  filterTextActive: {
    color: "#FFFFFF",
    fontWeight: "700",
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
    backgroundColor: "#F5F7FA",
    borderRadius: 28,
    padding: 16,
    marginBottom: 16,
    borderWidth: 0,
  },
  productImage: {
    width: 70,
    height: 70,
  },
  cardContent: {
    flex: 1,
    marginLeft: 16,
  },
  productTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#0F172A",
  },
  orderDate: {
    fontSize: 13,
    color: "#94A3B8",
    marginVertical: 4,
  },
  priceText: {
    fontSize: 18,
    fontWeight: "800",
    color: "#FF6B35",
  },
  unitText: {
    fontSize: 13,
    color: "#94A3B8",
    fontWeight: "normal",
  },
  statusPill: {
    backgroundColor: "#EBEFF5",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  statusPillText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#475569",
  },
});
