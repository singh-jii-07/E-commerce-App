import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import Ionicons from "@expo/vector-icons/Ionicons";
import addressService from "../../services/addressService";

export default function EditAddress() {
  const { id } = useLocalSearchParams();

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [alternatePhone, setAlternatePhone] = useState("");
  const [addressLine1, setAddressLine1] = useState("");
  const [landmark, setLandmark] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [country, setCountry] = useState("India");
  const [postalCode, setPostalCode] = useState("");
  const [addressType, setAddressType] = useState("Home");
  const [isDefault, setIsDefault] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [submitLoading, setSubmitLoading] = useState(false);

  useEffect(() => {
    const fetchAddressDetails = async () => {
      if (!id) return;
      try {
        setFetchLoading(true);
        const response = await addressService.getAddressById(id);
        if (response && response.success && response.address) {
          const addr = response.address;
          setFullName(addr.fullName || "");
          setPhone(addr.phone || "");
          setAlternatePhone(addr.alternatePhone || "");
          setAddressLine1(addr.addressLine1 || "");
          setLandmark(addr.landmark || "");
          setCity(addr.city || "");
          setState(addr.state || "");
          setCountry(addr.country || "India");
          setPostalCode(addr.postalCode || "");
          setAddressType(addr.addressType || "Home");
          setIsDefault(!!addr.isDefault);
        }
      } catch (error) {
        console.log("Error loading address:", error);
        Alert.alert(
          "Error",
          error.response?.data?.message || "Failed to load address details."
        );
      } finally {
        setFetchLoading(false);
      }
    };

    fetchAddressDetails();
  }, [id]);

  const handleSubmit = async () => {
    if (!fullName.trim()) {
      Alert.alert("Validation Error", "Full Name is required.");
      return;
    }
    if (!phone.trim()) {
      Alert.alert("Validation Error", "Phone number is required.");
      return;
    }
    if (!addressLine1.trim()) {
      Alert.alert("Validation Error", "Address Line 1 is required.");
      return;
    }
    if (!city.trim()) {
      Alert.alert("Validation Error", "City is required.");
      return;
    }
    if (!state.trim()) {
      Alert.alert("Validation Error", "State is required.");
      return;
    }
    if (!postalCode.trim()) {
      Alert.alert("Validation Error", "Postal Code / Zip Code is required.");
      return;
    }

    try {
      setSubmitLoading(true);
      const payload = {
        fullName: fullName.trim(),
        phone: phone.trim(),
        alternatePhone: alternatePhone.trim(),
        addressLine1: addressLine1.trim(),
        landmark: landmark.trim(),
        city: city.trim(),
        state: state.trim(),
        country: country.trim() || "India",
        postalCode: postalCode.trim(),
        addressType,
        isDefault,
      };

      const response = await addressService.updateAddress(id, payload);

      if (response && response.success) {
        if (Platform.OS === "web") {
          window.alert("Address updated successfully!");
          router.back();
        } else {
          Alert.alert("Success", "Address updated successfully!", [
            {
              text: "OK",
              onPress: () => router.back(),
            },
          ]);
        }
      } else {
        Alert.alert("Error", response?.message || "Failed to update address.");
      }
    } catch (error) {
      console.log("Error updating address:", error);
      Alert.alert(
        "Error",
        error.response?.data?.message || "Failed to update address. Please try again."
      );
    } finally {
      setSubmitLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardView}
      >
        {fetchLoading ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color="#0F172A" />
          </View>
        ) : (
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* Circular Back Button */}
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => router.back()}
              activeOpacity={0.7}
            >
              <Ionicons name="arrow-back" size={20} color="#0F172A" />
            </TouchableOpacity>

            {/* Heading */}
            <View style={styles.headerContainer}>
              <Text style={styles.title}>Edit Address</Text>
              <Text style={styles.subtitle}>
                Update your address details below.
              </Text>
            </View>

            {/* Full Name Input */}
            <View style={styles.inputContainer}>
              <Ionicons name="person-outline" size={20} color="#94A3B8" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Enter Your Full Name *"
                placeholderTextColor="#94A3B8"
                value={fullName}
                onChangeText={setFullName}
              />
            </View>

            {/* Phone Input */}
            <View style={styles.inputContainer}>
              <Ionicons name="call-outline" size={20} color="#94A3B8" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Enter Your Phone Number *"
                placeholderTextColor="#94A3B8"
                keyboardType="phone-pad"
                value={phone}
                onChangeText={setPhone}
              />
            </View>

            {/* Alternate Phone Input */}
            <View style={styles.inputContainer}>
              <Ionicons name="call-outline" size={20} color="#94A3B8" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Alternate Phone Number (Optional)"
                placeholderTextColor="#94A3B8"
                keyboardType="phone-pad"
                value={alternatePhone}
                onChangeText={setAlternatePhone}
              />
            </View>

            {/* Address Line 1 Input */}
            <View style={styles.inputContainer}>
              <Ionicons name="home-outline" size={20} color="#94A3B8" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="House No, Street, Area *"
                placeholderTextColor="#94A3B8"
                value={addressLine1}
                onChangeText={setAddressLine1}
              />
            </View>

            {/* Landmark Input */}
            <View style={styles.inputContainer}>
              <Ionicons name="location-outline" size={20} color="#94A3B8" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Landmark (Optional)"
                placeholderTextColor="#94A3B8"
                value={landmark}
                onChangeText={setLandmark}
              />
            </View>

            {/* City and State Row */}
            <View style={styles.rowContainer}>
              <View style={[styles.inputContainer, styles.halfInput]}>
                <TextInput
                  style={styles.input}
                  placeholder="City *"
                  placeholderTextColor="#94A3B8"
                  value={city}
                  onChangeText={setCity}
                />
              </View>
              <View style={[styles.inputContainer, styles.halfInput]}>
                <TextInput
                  style={styles.input}
                  placeholder="State *"
                  placeholderTextColor="#94A3B8"
                  value={state}
                  onChangeText={setState}
                />
              </View>
            </View>

            {/* Postal Code and Country Row */}
            <View style={styles.rowContainer}>
              <View style={[styles.inputContainer, styles.halfInput]}>
                <TextInput
                  style={styles.input}
                  placeholder="Postal Code *"
                  placeholderTextColor="#94A3B8"
                  keyboardType="number-pad"
                  value={postalCode}
                  onChangeText={setPostalCode}
                />
              </View>
              <View style={[styles.inputContainer, styles.halfInput]}>
                <TextInput
                  style={styles.input}
                  placeholder="Country"
                  placeholderTextColor="#94A3B8"
                  value={country}
                  onChangeText={setCountry}
                />
              </View>
            </View>

            {/* Address Type Selector */}
            <Text style={styles.sectionLabel}>Address Type</Text>
            <View style={styles.typeContainer}>
              {["Home", "Work", "Other"].map((type) => (
                <TouchableOpacity
                  key={type}
                  style={[
                    styles.typePill,
                    addressType === type && styles.activeTypePill,
                  ]}
                  onPress={() => setAddressType(type)}
                  activeOpacity={0.7}
                >
                  <Ionicons
                    name={
                      type === "Home"
                        ? "home-outline"
                        : type === "Work"
                        ? "business-outline"
                        : "location-outline"
                    }
                    size={16}
                    color={addressType === type ? "#FFFFFF" : "#0F172A"}
                    style={{ marginRight: 6 }}
                  />
                  <Text
                    style={[
                      styles.typePillText,
                      addressType === type && styles.activeTypePillText,
                    ]}
                  >
                    {type}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Set as Default Address Checkbox */}
            <TouchableOpacity
              style={styles.checkboxRow}
              onPress={() => setIsDefault(!isDefault)}
              activeOpacity={0.7}
            >
              <Ionicons
                name={isDefault ? "checkbox-outline" : "square-outline"}
                size={22}
                color={isDefault ? "#0F172A" : "#94A3B8"}
              />
              <Text style={styles.checkboxLabel}>Make this my default delivery address</Text>
            </TouchableOpacity>
          </ScrollView>
        )}

        {/* Save Button */}
        {!fetchLoading && (
          <View style={styles.buttonContainer}>
            {submitLoading ? (
              <ActivityIndicator size="large" color="#0F172A" />
            ) : (
              <TouchableOpacity
                style={styles.saveButton}
                onPress={handleSubmit}
                activeOpacity={0.9}
              >
                <Text style={styles.saveButtonText}>Update Address</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
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
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 24,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
    backgroundColor: "#FFFFFF",
  },
  headerContainer: {
    marginBottom: 28,
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    color: "#0F172A",
    marginBottom: 8,
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
    marginBottom: 16,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: "#0F172A",
    fontWeight: "500",
  },
  rowContainer: {
    flexDirection: "row",
    gap: 12,
  },
  halfInput: {
    flex: 1,
  },
  sectionLabel: {
    fontSize: 15,
    fontWeight: "700",
    color: "#0F172A",
    marginTop: 8,
    marginBottom: 12,
  },
  typeContainer: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 20,
  },
  typePill: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: "#F1F5F9",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  activeTypePill: {
    backgroundColor: "#0F172A",
    borderColor: "#0F172A",
  },
  typePillText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#0F172A",
  },
  activeTypePillText: {
    color: "#FFFFFF",
  },
  checkboxRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 24,
  },
  checkboxLabel: {
    fontSize: 14,
    color: "#475569",
    marginLeft: 10,
    fontWeight: "500",
  },
  buttonContainer: {
    paddingHorizontal: 24,
    paddingBottom: Platform.OS === "ios" ? 10 : 24,
    paddingTop: 12,
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
});
