import React, { useState, useCallback } from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  Platform,
  RefreshControl,
} from "react-native";
import { router, useFocusEffect } from "expo-router";
import Ionicons from "@expo/vector-icons/Ionicons";
import addressService from "../../services/addressService";

export default function DeliveryAddress() {
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchAddresses = async () => {
    try {
      setLoading(true);
      const res = await addressService.getAddresses();
      if (res && res.success && Array.isArray(res.addresses)) {
        setAddresses(res.addresses);
      } else {
        setAddresses([]);
      }
    } catch (error) {
      console.log("Error fetching addresses:", error);
      setAddresses([]);
      Alert.alert(
        "Error",
        error.response?.data?.message || "Failed to load addresses."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchAddresses();
    }, [])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchAddresses();
  };

  const handleSetDefault = async (id) => {
    try {
      const res = await addressService.setDefaultAddress(id);
      if (res && res.success) {
        fetchAddresses();
      }
    } catch (error) {
      console.log("Error setting default address:", error);
      Alert.alert(
        "Error",
        error.response?.data?.message || "Failed to set default address."
      );
    }
  };

  const handleDelete = (id, label) => {
    const performDelete = async () => {
      try {
        const res = await addressService.deleteAddress(id);
        if (res && res.success) {
          fetchAddresses();
        }
      } catch (error) {
        console.log("Error deleting address:", error);
        Alert.alert(
          "Error",
          error.response?.data?.message || "Failed to delete address."
        );
      }
    };

    if (Platform.OS === "web") {
      if (window.confirm(`Are you sure you want to delete "${label}"?`)) {
        performDelete();
      }
    } else {
      Alert.alert("Delete Address", `Are you sure you want to delete "${label}"?`, [
        { text: "Cancel", style: "cancel" },
        { text: "Delete", style: "destructive", onPress: performDelete },
      ]);
    }
  };

  const getAddressIcon = (type) => {
    switch (type?.toLowerCase()) {
      case "work":
      case "office":
        return <Ionicons name="business" size={22} color="#0F172A" />;
      case "other":
        return <Ionicons name="location" size={22} color="#0F172A" />;
      case "home":
      default:
        return <Ionicons name="home" size={22} color="#0F172A" />;
    }
  };

  const formatAddress = (item) => {
    const parts = [
      item.addressLine1,
      item.landmark,
      item.city,
      item.state,
      item.country,
      item.postalCode,
    ].filter(Boolean);
    return parts.join(", ");
  };

  return (
    <View style={styles.container}>
      {/* Background Header */}
      <View style={styles.headerBackground}>
        <View style={styles.headerTop}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => {
              if (router.canGoBack()) {
                router.back();
              } else {
                router.replace("/(auth)/Profile");
              }
            }}
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={20} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Delivery Address</Text>
          <View style={{ width: 40 }} />
        </View>
      </View>

      {/* Main Content Card */}
      <View style={styles.contentCard}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>Address</Text>
          <TouchableOpacity
            onPress={() => router.push("/add-address")}
            activeOpacity={0.7}
          >
            <Text style={styles.addNewText}>+ Add new</Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#0F172A" />
          </View>
        ) : (
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
          >
            {!Array.isArray(addresses) || addresses.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Ionicons name="location-outline" size={64} color="#CBD5E1" />
                <Text style={styles.emptyTitle}>No Addresses Found</Text>
                <Text style={styles.emptySubtitle}>
                  You haven't added any delivery addresses yet. Add one to speed up checkout!
                </Text>
                <TouchableOpacity
                  style={styles.emptyButton}
                  onPress={() => router.push("/add-address")}
                  activeOpacity={0.8}
                >
                  <Text style={styles.emptyButtonText}>+ Add New Address</Text>
                </TouchableOpacity>
              </View>
            ) : (
              addresses.map((item) => (
                <View key={item._id} style={styles.addressCard}>
                  <View style={styles.addressTopRow}>
                    <View style={styles.titleWithIcon}>
                      <View style={styles.iconCircle}>
                        {getAddressIcon(item.addressType)}
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.addressTitle}>
                          {item.addressType || "Address"}{" "}
                          {item.fullName ? `(${item.fullName})` : ""}
                        </Text>
                        <Text style={styles.phoneText}>📞 {item.phone}</Text>
                      </View>
                    </View>

                    <TouchableOpacity
                      onPress={() => !item.isDefault && handleSetDefault(item._id)}
                      activeOpacity={0.7}
                      style={styles.checkButton}
                    >
                      {item.isDefault ? (
                        <View style={styles.selectedCheck}>
                          <Ionicons name="checkmark" size={16} color="#0F172A" />
                        </View>
                      ) : (
                        <View style={styles.unselectedCheck} />
                      )}
                    </TouchableOpacity>
                  </View>

                  <Text style={styles.addressText}>{formatAddress(item)}</Text>

                  {/* Address Action Bar */}
                  <View style={styles.actionRow}>
                    {item.isDefault ? (
                      <View style={styles.defaultBadge}>
                        <Text style={styles.defaultBadgeText}>Default Address</Text>
                      </View>
                    ) : (
                      <TouchableOpacity
                        onPress={() => handleSetDefault(item._id)}
                        style={styles.setDefaultLink}
                        activeOpacity={0.7}
                      >
                        <Text style={styles.setDefaultLinkText}>Set as default</Text>
                      </TouchableOpacity>
                    )}

                    <View style={styles.rightActions}>
                      <TouchableOpacity
                        style={styles.actionIconButton}
                        onPress={() =>
                          router.push({
                            pathname: "/edit-address",
                            params: { id: item._id },
                          })
                        }
                        activeOpacity={0.7}
                      >
                        <Ionicons name="create-outline" size={18} color="#0F172A" />
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.actionIconButton}
                        onPress={() =>
                          handleDelete(
                            item._id,
                            `${item.addressType || "Address"} - ${item.addressLine1}`
                          )
                        }
                        activeOpacity={0.7}
                      >
                        <Ionicons name="trash-outline" size={18} color="#EF4444" />
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              ))
            )}
          </ScrollView>
        )}

        {/* Bottom Floating Add Address Button */}
        {addresses.length > 0 && (
          <View style={styles.bottomContainer}>
            <TouchableOpacity
              style={styles.bottomAddButton}
              onPress={() => router.push("/add-address")}
              activeOpacity={0.9}
            >
              <Text style={styles.bottomAddButtonText}>+ Add Address</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0F172A",
  },
  headerBackground: {
    paddingTop: Platform.OS === "ios" ? 54 : 44,
    paddingBottom: 36,
    paddingHorizontal: 20,
    backgroundColor: "#0F172A",
  },
  headerTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.3)",
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "700",
  },
  contentCard: {
    flex: 1,
    backgroundColor: "#F8FAFC",
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    marginTop: -16,
    overflow: "hidden",
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 12,
  },
  cardTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: "#0F172A",
  },
  addNewText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#FF7A00",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 100,
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
    paddingHorizontal: 20,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#0F172A",
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: "#64748B",
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 24,
  },
  emptyButton: {
    backgroundColor: "#0F172A",
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 28,
  },
  emptyButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
  },
  addressCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  addressTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  titleWithIcon: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  addressTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#0F172A",
  },
  phoneText: {
    fontSize: 12,
    color: "#64748B",
    marginTop: 2,
  },
  checkButton: {
    padding: 4,
  },
  selectedCheck: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: "#E2E8F0",
    alignItems: "center",
    justifyContent: "center",
  },
  unselectedCheck: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 2,
    borderColor: "#CBD5E1",
    backgroundColor: "#FFFFFF",
  },
  addressText: {
    fontSize: 14,
    color: "#64748B",
    lineHeight: 22,
    marginBottom: 14,
  },
  actionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
    paddingTop: 12,
  },
  defaultBadge: {
    backgroundColor: "#EFF6FF",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  defaultBadgeText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#2563EB",
  },
  setDefaultLink: {
    paddingVertical: 4,
  },
  setDefaultLinkText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#FF7A00",
  },
  rightActions: {
    flexDirection: "row",
    gap: 8,
  },
  actionIconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#F8FAFC",
    alignItems: "center",
    justifyContent: "center",
  },
  bottomContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: Platform.OS === "ios" ? 28 : 20,
    borderTopWidth: 1,
    borderTopColor: "#E2E8F0",
  },
  bottomAddButton: {
    backgroundColor: "#0F172A",
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  bottomAddButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
});
