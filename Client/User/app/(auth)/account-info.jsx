import React, { useState, useCallback } from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Platform,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useFocusEffect } from "expo-router";
import Ionicons from "@expo/vector-icons/Ionicons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import API_CONFIG from "../../config/apiConfig";
import addressService from "../../services/addressService";

export default function AccountInfo() {
  const [userProfile, setUserProfile] = useState(null);
  const [defaultAddress, setDefaultAddress] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchAccountData = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem("token");

      // 1. Fetch Profile Data
      let profileData = null;
      if (token) {
        try {
          const profileRes = await axios.get(
            `${API_CONFIG.AUTH_BASE_URL}/user/profile`,
            {
              headers: { Authorization: `Bearer ${token}` },
            }
          );
          if (profileRes.data && profileRes.data.success) {
            profileData = profileRes.data.user;
            setUserProfile(profileData);
          }
        } catch (err) {
          console.log("Error fetching profile:", err);
        }
      }

      // 2. Fetch Address Data
      try {
        const addressRes = await addressService.getAddresses();
        if (addressRes && addressRes.success && Array.isArray(addressRes.addresses)) {
          const addresses = addressRes.addresses;
          // Find the one explicitly marked as default
          const defaultAddr = addresses.find((a) => a.isDefault === true) || null;
          setDefaultAddress(defaultAddr);
        } else {
          setDefaultAddress(null);
        }
      } catch (err) {
        console.log("Error fetching addresses:", err);
        setDefaultAddress(null);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchAccountData();
    }, [])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchAccountData();
  };

  const formatDefaultAddress = (item) => {
    if (!item) return "No default address set";
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

  const getPhoneNumber = () => {
    if (userProfile?.phone) return userProfile.phone;
    if (userProfile?.mobile) return userProfile.mobile;
    if (defaultAddress?.phone) return defaultAddress.phone;
    return "Not Provided";
  };

  return (
    <View style={styles.container}>
      {/* Dark Header Background */}
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
          <Text style={styles.headerTitle}>Account Information</Text>
          <View style={{ width: 40 }} />
        </View>
      </View>

      {/* Content Sheet */}
      <View style={styles.contentCard}>
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
            {/* User Avatar Circle */}
            <View style={styles.avatarSection}>
              <View style={styles.avatarCircle}>
                <Ionicons name="person" size={42} color="#0F172A" />
              </View>
              <Text style={styles.userNameText}>
                {userProfile?.username || defaultAddress?.fullName || "User Account"}
              </Text>
              <Text style={styles.userRoleBadge}>Member</Text>
            </View>

            {/* Information Cards List */}
            <View style={styles.infoList}>
              {/* 1. Full Name */}
              <View style={styles.infoCard}>
                <View style={styles.iconBox}>
                  <Ionicons name="person-outline" size={22} color="#0F172A" />
                </View>
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Full Name</Text>
                  <Text style={styles.infoValue}>
                    {userProfile?.username || defaultAddress?.fullName || "Not Available"}
                  </Text>
                </View>
              </View>

              {/* 2. Email Address */}
              <View style={styles.infoCard}>
                <View style={styles.iconBox}>
                  <Ionicons name="mail-outline" size={22} color="#0F172A" />
                </View>
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Email Address</Text>
                  <Text style={styles.infoValue}>
                    {userProfile?.email || "Not Available"}
                  </Text>
                </View>
              </View>

              {/* 3. Phone Number */}
              <View style={styles.infoCard}>
                <View style={styles.iconBox}>
                  <Ionicons name="call-outline" size={22} color="#0F172A" />
                </View>
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Phone Number</Text>
                  <Text style={styles.infoValue}>{getPhoneNumber()}</Text>
                </View>
              </View>

              {/* 4. Default Delivery Address */}
              <View style={styles.infoCard}>
                <View style={styles.iconBox}>
                  <Ionicons name="location-outline" size={22} color="#0F172A" />
                </View>
                <View style={styles.infoContent}>
                  <View style={styles.addressLabelRow}>
                    <Text style={styles.infoLabel}>Default Delivery Address</Text>
                    {defaultAddress && (
                      <View style={styles.defaultPill}>
                        <Text style={styles.defaultPillText}>Default</Text>
                      </View>
                    )}
                  </View>
                  <Text
                    style={[
                      styles.infoValue,
                      !defaultAddress && styles.emptyValue,
                    ]}
                  >
                    {formatDefaultAddress(defaultAddress)}
                  </Text>
                </View>
              </View>
            </View>
          </ScrollView>
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
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 40,
  },
  avatarSection: {
    alignItems: "center",
    marginBottom: 28,
  },
  avatarCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#E2E8F0",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
    borderWidth: 3,
    borderColor: "#FFFFFF",
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 4,
  },
  userNameText: {
    fontSize: 22,
    fontWeight: "800",
    color: "#0F172A",
    marginBottom: 4,
  },
  userRoleBadge: {
    fontSize: 12,
    fontWeight: "600",
    color: "#64748B",
    backgroundColor: "#E2E8F0",
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
  },
  infoList: {
    gap: 16,
  },
  infoCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#64748B",
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: "700",
    color: "#0F172A",
    lineHeight: 22,
  },
  emptyValue: {
    color: "#94A3B8",
    fontWeight: "500",
    fontStyle: "italic",
  },
  addressLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  defaultPill: {
    backgroundColor: "#EFF6FF",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  defaultPillText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#2563EB",
  },
});
