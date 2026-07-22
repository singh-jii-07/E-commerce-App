import {
  StyleSheet,
  Text,
  View,
  Image,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import React, { useState, useEffect } from "react";
import { router } from "expo-router";
import { Ionicons, Feather } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { handleLogout } from "./Logout";

const Profile = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = await AsyncStorage.getItem("token");
        if (token) {
          const response = await axios.get(
            "http://localhost:5000/api/user/profile",
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            },
          );
          if (response.data && response.data.success) {
            setUser(response.data.user);
          }
        }
      } catch (error) {
        console.log("Error fetching profile:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const menuItems = [
    {
      id: 1,
      title: "Account Information",
      icon: <Feather name="user" size={20} color="#0F172A" />,
      route: "/account-info",
    },
    {
      id: 2,
      title: "Delivery Address",
      icon: <Ionicons name="location-outline" size={20} color="#0F172A" />,
      route: "/address",
    },
    {
      id: 3,
      title: "My Orders",
      icon: <Feather name="shopping-bag" size={20} color="#0F172A" />,
      route: "/(root)/(tabs)/order",
    },
  ];

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
                router.replace("/(root)/(tabs)");
              }
            }}
          >
            <Ionicons name="arrow-back" size={20} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Profile</Text>
          <View style={{ width: 40 }} /> {/* Spacer for centering */}
        </View>
      </View>

      {/* Main Content Card */}
      <View style={styles.contentCard}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#0F172A" />
          </View>
        ) : (
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Avatar Section */}
            <View style={styles.profileSection}>
              <View style={styles.avatarContainer}>
                {user?.avatar ? (
                  <Image source={{ uri: user.avatar }} style={styles.avatar} />
                ) : (
                  <Image
                    source={require("../../assets/images/favicon.png")}
                    style={styles.avatar}
                  />
                )}
              </View>
              <Text style={styles.userName}>
                {user?.username || "User Name"}
              </Text>
              <Text style={styles.userEmail}>
                {user?.email || "user@example.com"}
              </Text>
            </View>

            {/* Menu List */}
            <View style={styles.menuContainer}>
              {Array.isArray(menuItems) &&
                menuItems.map((item) => (
                  <TouchableOpacity
                    key={item.id}
                    style={styles.menuItem}
                    activeOpacity={0.8}
                    onPress={() => {
                      if (item.route) {
                        router.push(item.route);
                      }
                    }}
                  >
                    <View style={styles.menuItemLeft}>
                      {item.icon}
                      <Text style={styles.menuItemTitle}>{item.title}</Text>
                    </View>

                    <Feather name="chevron-right" size={20} color="#94A3B8" />
                  </TouchableOpacity>
                ))}
            </View>

            {/* Logout Button */}
            <TouchableOpacity
              style={styles.logoutButton}
              onPress={handleLogout}
            >
              <Text style={styles.logoutButtonText}>Log Out</Text>
            </TouchableOpacity>
          </ScrollView>
        )}
      </View>
    </View>
  );
};

export default Profile;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0F172A",
  },
  headerBackground: {
    paddingTop: 60,
    paddingBottom: 40,
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
    color: "#fff",
    fontSize: 20,
    fontWeight: "600",
  },
  contentCard: {
    flex: 1,
    backgroundColor: "#F8FAFC",
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    marginTop: -20,
    overflow: "hidden",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  scrollContent: {
    padding: 24,
    paddingBottom: 40,
  },
  profileSection: {
    alignItems: "center",
    marginBottom: 30,
  },
  avatarContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#E2E8F0",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
    overflow: "hidden",
    borderWidth: 3,
    borderColor: "#fff",
  },
  avatar: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  userName: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#0F172A",
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: "#94A3B8",
  },
  menuContainer: {
    marginBottom: 30,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
  },
  menuItemLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  menuItemTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#0F172A",
    marginLeft: 16,
  },
  logoutButton: {
    backgroundColor: "#0F172A",
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  logoutButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
});
