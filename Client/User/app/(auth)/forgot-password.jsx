import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import Ionicons from "@expo/vector-icons/Ionicons";
import authService from "../../services/authService";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const handleNext = async () => {
    if (!email.trim()) {
      Alert.alert("Error", "Please enter your email address.");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      Alert.alert("Error", "Please enter a valid email address.");
      return;
    }

    try {
      setLoading(true);
      const data = await authService.forgotPassword({
        email: email.trim().toLowerCase(),
      });

      if (data.success) {
        await AsyncStorage.setItem("resetEmail", email.trim().toLowerCase());
        Alert.alert("Success", data.message || "OTP sent successfully.");
        router.push({
          pathname: "/(auth)/verify-otp",
          params: { email: email.trim().toLowerCase() },
        });
      } else {
        Alert.alert("Error", data.message || "Failed to send OTP.");
      }
    } catch (error) {
      console.log("Forgot Password Error: ", error);
      Alert.alert(
        "Error",
        error.response?.data?.message || "Something went wrong. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header Circular Back Button */}
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={20} color="#0F172A" />
          </TouchableOpacity>

          {/* Heading */}
          <View style={styles.headerContainer}>
            <Text style={styles.title}>Forgot Password</Text>
            <Text style={styles.subtitle}>
              Provide the email address associated with your account in the designated field.
            </Text>
          </View>

          {/* Input field */}
          <View style={styles.inputContainer}>
            <Ionicons
              name="mail-outline"
              size={20}
              color="#94A3B8"
              style={styles.inputIcon}
            />
            <TextInput
              style={styles.input}
              placeholder="Enter Email Address"
              placeholderTextColor="#94A3B8"
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={setEmail}
            />
          </View>
        </ScrollView>

        {/* Next Button at bottom */}
        <View style={styles.buttonContainer}>
          {loading ? (
            <View style={styles.loaderContainer}>
              <ActivityIndicator size="large" color="#0F172A" />
            </View>
          ) : (
            <TouchableOpacity
              style={styles.nextButton}
              onPress={handleNext}
              activeOpacity={0.9}
            >
              <Text style={styles.nextButtonText}>Next</Text>
            </TouchableOpacity>
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 16,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 36,
    backgroundColor: "#FFFFFF",
  },
  headerContainer: {
    marginBottom: 36,
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    color: "#0F172A",
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 15,
    color: "#64748B",
    lineHeight: 22,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F3F4F6",
    borderRadius: 16,
    paddingHorizontal: 20,
    height: 56,
    marginBottom: 24,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: "#0F172A",
    fontWeight: "500",
  },
  buttonContainer: {
    paddingHorizontal: 24,
    paddingBottom: Platform.OS === "ios" ? 10 : 24,
    backgroundColor: "#FFFFFF",
  },
  nextButton: {
    backgroundColor: "#0F172A",
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  nextButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
  loaderContainer: {
    height: 56,
    justifyContent: "center",
    alignItems: "center",
  },
});
