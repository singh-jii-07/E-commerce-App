import React, { useState, useRef, useEffect } from "react";
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

export default function VerifyOtp() {
  const { email: paramEmail } = useLocalSearchParams();
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [timer, setTimer] = useState(60);
  const inputsRef = useRef([]);

  useEffect(() => {
    const getEmail = async () => {
      const storedEmail = await AsyncStorage.getItem("resetEmail");
      if (storedEmail) {
        setEmail(storedEmail);
      } else if (paramEmail) {
        setEmail(paramEmail);
      }
    };
    getEmail();
  }, [paramEmail]);

  const maskEmail = (emailStr) => {
    if (!emailStr) return "";
    const [name, domain] = emailStr.split("@");
    if (name.length <= 3) return `${name[0]}***@${domain}`;
    return `${name.substring(0, 2)}*****${name.charAt(name.length - 1)}@${domain}`;
  };

  useEffect(() => {
    if (timer > 0) {
      const interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [timer]);

  const handleChangeText = (text, index) => {
    const cleanText = text.replace(/[^0-9]/g, "");
    const newOtp = [...otp];

    if (cleanText.length > 1) {
      const chars = cleanText.split("").slice(0, 6 - index);
      for (let i = 0; i < chars.length; i++) {
        newOtp[index + i] = chars[i];
      }
      setOtp(newOtp);
      const nextFocusIndex = Math.min(index + chars.length, 5);
      inputsRef.current[nextFocusIndex]?.focus();
      return;
    }

    newOtp[index] = cleanText;
    setOtp(newOtp);

    if (cleanText && index < 5) {
      inputsRef.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (e, index) => {
    if (e.nativeEvent.key === "Backspace") {
      if (otp[index] === "" && index > 0) {
        const newOtp = [...otp];
        newOtp[index - 1] = "";
        setOtp(newOtp);
        inputsRef.current[index - 1]?.focus();
      }
    }
  };

  const handleVerify = async () => {
    const otpString = otp.join("");
    if (otpString.length < 6) {
      Alert.alert("Error", "Please enter the complete 6-digit OTP code.");
      return;
    }

    console.log("Sending verify OTP request with:", {
      email,
      otp: otpString,
    });

    try {
      setLoading(true);
      const data = await authService.verifyOtp({
        email,
        otp: otpString,
      });

      if (data.success) {
        Alert.alert("Success", data.message || "OTP verified successfully.");
        router.push({
          pathname: "/(auth)/reset-password",
          params: { email },
        });
      } else {
        Alert.alert("Error", data.message || "Invalid OTP.");
      }
    } catch (error) {
      console.log("Verify OTP Error: ", error);
      console.log("Verify OTP Error Response Data: ", error.response?.data);
      Alert.alert(
        "Verification Failed",
        error.response?.data?.message || "Invalid OTP. Please check and try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (timer > 0 || resendLoading) return;

    try {
      setResendLoading(true);
      const data = await authService.forgotPassword({
        email,
      });

      if (data.success) {
        Alert.alert("Success", "A new OTP code has been sent to your email.");
        setTimer(60);
        setOtp(["", "", "", "", "", ""]);
        inputsRef.current[0]?.focus();
      } else {
        Alert.alert("Error", data.message || "Failed to resend OTP.");
      }
    } catch (error) {
      console.log("Resend OTP Error: ", error);
      Alert.alert(
        "Error",
        error.response?.data?.message || "Failed to resend OTP. Please try again."
      );
    } finally {
      setResendLoading(false);
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
            <Text style={styles.title}>Verification Code</Text>
            <Text style={styles.subtitle}>
              {"We've sent the code to your email address that you include: "}
              <Text style={styles.emailText}>{maskEmail(email)}</Text>
            </Text>
          </View>

          {/* OTP Digit Boxes */}
          <View style={styles.otpContainer}>
            {otp.map((digit, index) => (
              <TextInput
                key={index}
                ref={(ref) => (inputsRef.current[index] = ref)}
                style={styles.otpInput}
                keyboardType="number-pad"
                maxLength={2}
                value={digit}
                onChangeText={(text) => handleChangeText(text, index)}
                onKeyPress={(e) => handleKeyPress(e, index)}
                textAlign="center"
                placeholder="-"
                placeholderTextColor="#94A3B8"
                selectTextOnFocus
              />
            ))}
          </View>

          {/* Resend Code Button */}
          <View style={styles.resendContainer}>
            {timer > 0 ? (
              <Text style={styles.timerText}>
                Resend Code in <Text style={styles.timerCount}>{timer}s</Text>
              </Text>
            ) : (
              <TouchableOpacity
                onPress={handleResend}
                disabled={resendLoading}
                style={styles.resendButton}
                activeOpacity={0.7}
              >
                {resendLoading ? (
                  <ActivityIndicator size="small" color="#0F172A" />
                ) : (
                  <Text style={styles.resendText}>Resend Code</Text>
                )}
              </TouchableOpacity>
            )}
          </View>
        </ScrollView>

        {/* Verify Button at bottom */}
        <View style={styles.buttonContainer}>
          {loading ? (
            <View style={styles.loaderContainer}>
              <ActivityIndicator size="large" color="#0F172A" />
            </View>
          ) : (
            <TouchableOpacity
              style={styles.verifyButton}
              onPress={handleVerify}
              activeOpacity={0.9}
            >
              <Text style={styles.verifyButtonText}>Verify</Text>
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
  emailText: {
    fontWeight: "600",
    color: "#334155",
  },
  otpContainer: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
    marginBottom: 36,
  },
  otpInput: {
    width: 44,
    height: 56,
    backgroundColor: "#F3F4F6",
    borderRadius: 16,
    fontSize: 20,
    fontWeight: "800",
    color: "#0F172A",
  },
  resendContainer: {
    alignItems: "center",
    marginTop: 8,
  },
  timerText: {
    fontSize: 15,
    color: "#64748B",
  },
  timerCount: {
    fontWeight: "700",
    color: "#0F172A",
  },
  resendButton: {
    padding: 8,
  },
  resendText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#0F172A",
    textDecorationLine: "underline",
  },
  buttonContainer: {
    paddingHorizontal: 24,
    paddingBottom: Platform.OS === "ios" ? 10 : 24,
    backgroundColor: "#FFFFFF",
  },
  verifyButton: {
    backgroundColor: "#0F172A",
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  verifyButtonText: {
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
