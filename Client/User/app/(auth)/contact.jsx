import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import Ionicons from "@expo/vector-icons/Ionicons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import contactService from "../../services/contactService";
import authService from "../../services/authService";

export default function ContactScreen() {
  const [subject, setSubject] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [profileLoading, setProfileLoading] = useState(true);

  // Pre-fill user details from Auth service profile
  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const token = await AsyncStorage.getItem("token");
        if (token) {
          const profileRes = await authService.getProfile();
          if (profileRes && profileRes.success && profileRes.user) {
            setEmail(profileRes.user.email || "");
            setName(profileRes.user.username || "");
          }
        }
      } catch (error) {
        console.log("Error loading user profile details:", error);
      } finally {
        setProfileLoading(false);
      }
    };
    fetchUserProfile();
  }, []);

  const handleSubmit = async () => {
    if (!subject.trim()) {
      Alert.alert("Required", "Please enter a subject.");
      return;
    }
    if (!email.trim()) {
      Alert.alert("Required", "Please enter your email address.");
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      Alert.alert("Error", "Please enter a valid email address.");
      return;
    }
    if (!message.trim()) {
      Alert.alert("Required", "Please enter a message.");
      return;
    }

    try {
      setLoading(true);
      const res = await contactService.createContact({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        subject: subject.trim(),
        message: message.trim(),
      });

      if (res && res.success) {
        Alert.alert("Success", res.message || "Message sent successfully.", [
          {
            text: "OK",
            onPress: () => {
              router.back();
            },
          },
        ]);
        setSubject("");
        setMessage("");
      } else {
        Alert.alert("Error", res.message || "Failed to send message.");
      }
    } catch (error) {
      console.log("Submit contact error:", error);
      Alert.alert(
        "Error",
        error.response?.data?.message || "Failed to send message. Please try again."
      );
    } finally {
      setLoading(false);
    }
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
          <Text style={styles.headerTitle}>Contact us</Text>
          <View style={{ width: 40 }} />
        </View>
      </View>

      {/* Main Content Card */}
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardView}
      >
        <View style={styles.contentCard}>
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* Header Text Section */}
            <View style={styles.infoSection}>
              <Text style={styles.infoTitle}>How can we help you?</Text>
              <Text style={styles.infoSubtitle}>
                It looks like you have problems with our product. we are here to help you, so, please get in touch with us.
              </Text>
            </View>

            {/* Form Fields */}
            <View style={styles.formContainer}>
              {/* Subject Field */}
              <View style={styles.fieldWrapper}>
                <Text style={styles.label}>Subject</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter Your problem's subject"
                  placeholderTextColor="#94A3B8"
                  value={subject}
                  onChangeText={setSubject}
                  autoCapitalize="sentences"
                />
              </View>

              {/* Email Field */}
              <View style={styles.fieldWrapper}>
                <Text style={styles.label}>Email</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter Your email"
                  placeholderTextColor="#94A3B8"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>

              {/* Message Field */}
              <View style={styles.fieldWrapper}>
                <Text style={styles.label}>Message</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  placeholder="Enter Your message"
                  placeholderTextColor="#94A3B8"
                  value={message}
                  onChangeText={setMessage}
                  multiline
                  numberOfLines={5}
                  textAlignVertical="top"
                />
              </View>
            </View>

            {/* Submit Button */}
            <View style={styles.buttonWrapper}>
              {loading ? (
                <ActivityIndicator size="large" color="#0F172A" />
              ) : (
                <TouchableOpacity
                  style={styles.submitButton}
                  onPress={handleSubmit}
                  activeOpacity={0.9}
                >
                  <Text style={styles.submitButtonText}>Submit</Text>
                </TouchableOpacity>
              )}
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0F172A",
  },
  keyboardView: {
    flex: 1,
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
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 28,
    paddingBottom: 40,
  },
  infoSection: {
    marginBottom: 28,
  },
  infoTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#1E293B",
    marginBottom: 10,
    textAlign: "left",
  },
  infoSubtitle: {
    fontSize: 14,
    color: "#94A3B8",
    lineHeight: 22,
    textAlign: "left",
  },
  formContainer: {
    gap: 20,
  },
  fieldWrapper: {
    gap: 8,
  },
  label: {
    fontSize: 15,
    fontWeight: "600",
    color: "#334155",
  },
  input: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 16,
    paddingHorizontal: 16,
    height: 56,
    fontSize: 15,
    color: "#0F172A",
    fontWeight: "500",
  },
  textArea: {
    height: 120,
    paddingTop: 16,
    paddingBottom: 16,
  },
  buttonWrapper: {
    marginTop: 32,
    justifyContent: "center",
    alignItems: "center",
  },
  submitButton: {
    backgroundColor: "#0F172A",
    height: 56,
    width: "100%",
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  submitButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
});
