import React, { useState, useEffect } from "react";
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
import { router, useLocalSearchParams } from "expo-router";
import Ionicons from "@expo/vector-icons/Ionicons";
import authService from "../../services/authService";

export default function ResetPassword() {
  const { email: paramEmail } = useLocalSearchParams();
  const [email, setEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const getEmail = async () => {
      const storedEmail = await AsyncStorage.getItem("resetEmail");
      if (storedEmail) {
        setEmail(storedEmail);
      } else if (paramEmail) {
        const extracted = Array.isArray(paramEmail) ? paramEmail[0] : paramEmail;
        setEmail(extracted ? extracted.trim().toLowerCase() : "");
      }
    };
    getEmail();
  }, [paramEmail]);

  const handleSave = async () => {
    if (!newPassword.trim() || !confirmPassword.trim()) {
      Alert.alert("Error", "Please fill in both password fields.");
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert("Error", "Passwords do not match.");
      return;
    }

    if (newPassword.length < 6) {
      Alert.alert("Error", "Password must be at least 6 characters long.");
      return;
    }

    console.log("Sending change password request with:", {
      email,
      newPassword: newPassword.trim(),
      confirmPassword: confirmPassword.trim(),
    });

    try {
      setLoading(true);
      const data = await authService.resetPassword({
        email,
        newPassword: newPassword.trim(),
        confirmPassword: confirmPassword.trim(),
      });

      if (data.success) {
        if (Platform.OS === "web") {
          window.alert(data.message || "Password reset successfully.");
          router.replace("/(auth)/sign-in");
        } else {
          Alert.alert("Success", data.message || "Password reset successfully.", [
            {
              text: "Go to Sign In",
              onPress: () => {
                router.replace("/(auth)/sign-in");
              },
            },
          ]);
        }
      } else {
        if (Platform.OS === "web") {
          window.alert(data.message || "Failed to reset password.");
        } else {
          Alert.alert("Error", data.message || "Failed to reset password.");
        }
      }
    } catch (error) {
      console.log("Reset Password Error: ", error);
      console.log("Reset Password Error Response Data: ", error.response?.data);
      Alert.alert(
        "Error",
        error.response?.data?.message || "Failed to reset password. Please try again."
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
          {/* Header Back Button */}
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={20} color="#0F172A" />
          </TouchableOpacity>

          {/* Heading */}
          <View style={styles.headerContainer}>
            <Text style={styles.title}>Reset Password</Text>
            <Text style={styles.subtitle}>
              Ensure the security of your account by selecting a robust and fortified password.
            </Text>
          </View>

          {/* New Password Input */}
          <View style={styles.inputContainer}>
            <Ionicons
              name="lock-closed-outline"
              size={20}
              color="#94A3B8"
              style={styles.inputIcon}
            />
            <TextInput
              style={styles.input}
              placeholder="New Password"
              placeholderTextColor="#94A3B8"
              secureTextEntry={!showNewPassword}
              value={newPassword}
              onChangeText={setNewPassword}
              autoCapitalize="none"
            />
            <TouchableOpacity
              onPress={() => setShowNewPassword(!showNewPassword)}
              style={styles.toggleButton}
              activeOpacity={0.5}
            >
              <Ionicons
                name={showNewPassword ? "eye-off-outline" : "eye-outline"}
                size={20}
                color="#94A3B8"
              />
            </TouchableOpacity>
          </View>

          {/* Confirm Password Input */}
          <View style={styles.inputContainer}>
            <Ionicons
              name="lock-closed-outline"
              size={20}
              color="#94A3B8"
              style={styles.inputIcon}
            />
            <TextInput
              style={styles.input}
              placeholder="Confirm Password"
              placeholderTextColor="#94A3B8"
              secureTextEntry={!showConfirmPassword}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              autoCapitalize="none"
            />
            <TouchableOpacity
              onPress={() => setShowConfirmPassword(!showConfirmPassword)}
              style={styles.toggleButton}
              activeOpacity={0.5}
            >
              <Ionicons
                name={showConfirmPassword ? "eye-off-outline" : "eye-outline"}
                size={20}
                color="#94A3B8"
              />
            </TouchableOpacity>
          </View>
        </ScrollView>

        {/* Save Button at bottom */}
        <View style={styles.buttonContainer}>
          {loading ? (
            <View style={styles.loaderContainer}>
              <ActivityIndicator size="large" color="#0F172A" />
            </View>
          ) : (
            <TouchableOpacity
              style={styles.saveButton}
              onPress={handleSave}
              activeOpacity={0.9}
            >
              <Text style={styles.saveButtonText}>Save</Text>
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
    marginBottom: 20,
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
  toggleButton: {
    padding: 8,
  },
  buttonContainer: {
    paddingHorizontal: 24,
    paddingBottom: Platform.OS === "ios" ? 10 : 24,
    backgroundColor: "#FFFFFF",
  },
  saveButton: {
    backgroundColor: "#0F172A",
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  saveButtonText: {
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
