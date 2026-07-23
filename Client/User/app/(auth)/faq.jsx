import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import Ionicons from "@expo/vector-icons/Ionicons";
import faqService from "../../services/faqService";

export default function FaqScreen() {
  const [faqs, setFaqs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);

  // Fallback data matching the mockup exactly if server has no FAQs
  const fallbackFaqs = [
    {
      _id: "fb-1",
      question: "How do I order grocery from this mobile application?",
      answer: "You can pay with a credit card or via net banking (if you're in United States). We will renew your subscription automatically at the end of every billing cycle.",
    },
    {
      _id: "fb-2",
      question: "Are the prices different than at the shop?",
      answer: "Prices are generally identical, but special online-only offers or store-specific promotions may cause minor differences.",
    },
    {
      _id: "fb-3",
      question: "What if the restaurant has changed its prices?",
      answer: "We strive to update prices in real-time. If a price mismatch occurs, we will contact you before processing the order.",
    },
    {
      _id: "fb-4",
      question: "When are you getting more shop as partners?",
      answer: "We are actively partnering with new shops daily. Check the app frequently for updates on new vendors near you.",
    },
    {
      _id: "fb-5",
      question: "How can I put special requests on my online order?",
      answer: "You can add special notes or requests directly on the cart or checkout screen before placing your order.",
    },
  ];

  useEffect(() => {
    const fetchFaqs = async () => {
      try {
        const response = await faqService.getFaqs();
        if (response && response.success && Array.isArray(response.data) && response.data.length > 0) {
          setFaqs(response.data);
        } else {
          setFaqs(fallbackFaqs);
        }
      } catch (error) {
        console.log("Error loading FAQs:", error);
        setFaqs(fallbackFaqs);
      } finally {
        setLoading(false);
      }
    };
    fetchFaqs();
  }, []);

  const toggleExpand = (id) => {
    setExpandedId(expandedId === id ? null : id);
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
          <Text style={styles.headerTitle}>FAQs</Text>
          <View style={{ width: 40 }} /> {/* spacer to align title */}
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
            {faqs.map((item) => {
              const isExpanded = expandedId === item._id;
              return (
                <View key={item._id} style={styles.faqWrapper}>
                  <TouchableOpacity
                    style={[
                      styles.faqItem,
                      isExpanded && styles.faqItemExpanded
                    ]}
                    onPress={() => toggleExpand(item._id)}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.questionText}>{item.question}</Text>
                    <Ionicons
                      name={isExpanded ? "chevron-up" : "chevron-down"}
                      size={20}
                      color="#94A3B8"
                    />
                  </TouchableOpacity>

                  {isExpanded && (
                    <View style={styles.answerContainer}>
                      <Text style={styles.answerText}>{item.answer}</Text>
                    </View>
                  )}
                </View>
              );
            })}
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
    paddingTop: 28,
    paddingBottom: 40,
    gap: 12,
  },
  faqWrapper: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    overflow: "hidden",
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
  },
  faqItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
  },
  faqItemExpanded: {
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  questionText: {
    flex: 1,
    fontSize: 16,
    fontWeight: "600",
    color: "#1E293B",
    paddingRight: 16,
    lineHeight: 22,
  },
  answerContainer: {
    backgroundColor: "#F8FAFC",
    padding: 20,
  },
  answerText: {
    fontSize: 14,
    lineHeight: 22,
    color: "#64748B",
  },
});
