import React, { useEffect, useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Modal,
  TextInput,
  Alert,
  SafeAreaView,
  Platform,
  StatusBar,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import orderService from "../../services/orderService";
import reviewService from "../../services/reviewService";

const OrderDetails = () => {
  const { orderId } = useLocalSearchParams();
  const router = useRouter();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  // Review Modal State
  const [reviewModalVisible, setReviewModalVisible] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);
  const [modalMessage, setModalMessage] = useState("");
  const [modalMessageType, setModalMessageType] = useState("error"); // "error" | "success"

  useEffect(() => {
    if (orderId) {
      fetchOrderDetails();
    }
  }, [orderId]);

  const fetchOrderDetails = async () => {
    try {
      setLoading(true);
      const res = await orderService.getOrderById(orderId);
      if (res && res.success && res.data) {
        setOrder(res.data);
      }
    } catch (error) {
      console.log("Error loading order details:", error);
    } finally {
      setLoading(false);
    }
  };

  const openReviewModal = (product) => {
    setSelectedProduct(product);
    setRating(5);
    setComment("");
    setModalMessage("");
    setReviewModalVisible(true);
  };

  const handleRatingSelect = (selectedStar) => {
    setRating(selectedStar);
    setModalMessage("");
  };

  const handleSubmitReview = async () => {
    if (!selectedProduct) {
      setModalMessage("No product selected.");
      setModalMessageType("error");
      return;
    }

    const prodId =
      typeof selectedProduct === "object" ? selectedProduct._id : selectedProduct;

    if (!prodId) {
      setModalMessage("Invalid product ID.");
      setModalMessageType("error");
      return;
    }

    try {
      setSubmittingReview(true);
      setModalMessage("");

      const res = await reviewService.addReview({
        product: prodId,
        rating: Number(rating),
        comment: comment ? comment.trim() : "",
      });

      if (res && res.success) {
        setModalMessage("Review submitted successfully!");
        setModalMessageType("success");
        setTimeout(() => {
          setReviewModalVisible(false);
          setModalMessage("");
        }, 1500);
      } else {
        setModalMessage(res?.message || "Could not submit review.");
        setModalMessageType("error");
      }
    } catch (err) {
      console.log("Submit review error:", err);
      const errMsg =
        err?.response?.data?.message || err.message || "Failed to submit review.";
      setModalMessage(errMsg);
      setModalMessageType("error");
    } finally {
      setSubmittingReview(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF6B35" />
        <Text style={{ marginTop: 10, color: "#64748B" }}>Loading order...</Text>
      </SafeAreaView>
    );
  }

  if (!order) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <Ionicons name="alert-circle-outline" size={54} color="#CBD5E1" />
        <Text style={{ fontSize: 18, color: "#0F172A", marginTop: 10 }}>
          Order Not Found
        </Text>
        <TouchableOpacity style={styles.backBtnPill} onPress={() => router.back()}>
          <Text style={{ color: "#fff" }}>Go Back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => router.back()}
            activeOpacity={0.8}
          >
            <Ionicons name="arrow-back" size={20} color="#0F172A" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Order Details</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Order Summary Card */}
          <View style={styles.card}>
            <View style={styles.rowBetween}>
              <Text style={styles.orderIdText}>
                Order #{order._id?.slice(-8).toUpperCase()}
              </Text>
              <View style={styles.statusBadge}>
                <Text style={styles.statusText}>{order.orderStatus}</Text>
              </View>
            </View>

            <Text style={styles.dateText}>
              Placed on:{" "}
              {order.createdAt
                ? new Date(order.createdAt).toLocaleDateString("en-US", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })
                : "N/A"}
            </Text>

            <View style={styles.divider} />

            <Text style={styles.sectionHeader}>Shipping Address</Text>
            {order.address ? (
              <View style={styles.addressBox}>
                <Text style={styles.addressName}>{order.address.fullName}</Text>
                <Text style={styles.addressText}>
                  {order.address.addressLine1},{" "}
                  {order.address.addressLine2 ? `${order.address.addressLine2}, ` : ""}
                  {order.address.city}, {order.address.state} - {order.address.postalCode}
                </Text>
                <Text style={styles.addressPhone}>Phone: {order.address.phone}</Text>
              </View>
            ) : (
              <Text style={styles.addressText}>Address info unavailable</Text>
            )}
          </View>

          {/* Purchased Items List */}
          <View style={styles.sectionMargin}>
            <Text style={styles.sectionTitle}>Purchased Products</Text>

            {order.items?.map((item, idx) => {
              const prod = item.product || {};
              const prodImage =
                prod.images && prod.images.length > 0
                  ? prod.images[0]
                  : "https://via.placeholder.com/100";

              return (
                <View key={item._id || idx} style={styles.productCard}>
                  <Image
                    source={{ uri: prodImage }}
                    style={styles.productThumb}
                    resizeMode="contain"
                  />

                  <View style={styles.productDetails}>
                    <Text numberOfLines={1} style={styles.productName}>
                      {prod.name || "Product"}
                    </Text>
                    <Text style={styles.qtyPriceText}>
                      Qty: {item.quantity} x ₹{item.price}
                    </Text>
                    <Text style={styles.itemTotal}>
                      Subtotal: ₹{(item.quantity * item.price).toFixed(2)}
                    </Text>
                  </View>

                  <TouchableOpacity
                    style={styles.rateBtn}
                    onPress={() => openReviewModal(prod)}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="star" size={14} color="#FFFFFF" style={{ marginRight: 4 }} />
                    <Text style={styles.rateBtnText}>Rate</Text>
                  </TouchableOpacity>
                </View>
              );
            })}
          </View>

          {/* Total Amount Summary */}
          <View style={styles.card}>
            <View style={styles.rowBetween}>
              <Text style={styles.totalLabel}>Payment Method</Text>
              <Text style={styles.totalVal}>{order.paymentMethod || "COD"}</Text>
            </View>
            <View style={[styles.rowBetween, { marginTop: 8 }]}>
              <Text style={styles.grandTotalLabel}>Total Amount</Text>
              <Text style={styles.grandTotalVal}>₹{order.totalAmount?.toFixed(2)}</Text>
            </View>
          </View>
        </ScrollView>

        {/* Rate and Review Modal */}
        <Modal
          animationType="slide"
          transparent={true}
          visible={reviewModalVisible}
          onRequestClose={() => setReviewModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              {/* Modal Header */}
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Rate and Review</Text>
                <TouchableOpacity
                  style={styles.closeBtnCircle}
                  onPress={() => setReviewModalVisible(false)}
                >
                  <Ionicons name="close" size={20} color="#0F172A" />
                </TouchableOpacity>
              </View>

              {/* Subtitle */}
              <Text style={styles.modalSubtitle}>
                Please rate this service using stars to indicate your level of satisfaction.
              </Text>

              {/* Star Rating Selector */}
              <View style={styles.starsRow}>
                {[1, 2, 3, 4, 5].map((starIndex) => (
                  <TouchableOpacity
                    key={starIndex}
                    onPress={() => handleRatingSelect(starIndex)}
                    activeOpacity={0.7}
                    style={{ padding: 4 }}
                  >
                    <Ionicons
                      name="star"
                      size={36}
                      color={starIndex <= rating ? "#FF6B35" : "#E2E8F0"}
                    />
                  </TouchableOpacity>
                ))}
              </View>

              {/* Product Thumbnail Display */}
              <Text style={styles.inputLabel}>Product</Text>
              <View style={styles.modalProductPreview}>
                <Image
                  source={{
                    uri:
                      selectedProduct?.images?.[0] ||
                      "https://via.placeholder.com/100",
                  }}
                  style={styles.modalProdImage}
                  resizeMode="contain"
                />
                <Text style={styles.modalProdTitle} numberOfLines={1}>
                  {selectedProduct?.name || "Selected Product"}
                </Text>
              </View>

              {/* Feedback Input */}
              <Text style={styles.inputLabel}>Feedback</Text>
              <TextInput
                placeholder="Type something..."
                placeholderTextColor="#94A3B8"
                value={comment}
                onChangeText={(txt) => {
                  setComment(txt);
                  setModalMessage("");
                }}
                multiline
                numberOfLines={4}
                style={styles.feedbackInput}
              />

              {/* Modal Feedback Message Banner */}
              {modalMessage ? (
                <View
                  style={[
                    styles.messageBanner,
                    modalMessageType === "success"
                      ? styles.messageBannerSuccess
                      : styles.messageBannerError,
                  ]}
                >
                  <Ionicons
                    name={
                      modalMessageType === "success"
                        ? "checkmark-circle"
                        : "alert-circle"
                    }
                    size={18}
                    color={modalMessageType === "success" ? "#10B981" : "#EF4444"}
                    style={{ marginRight: 6 }}
                  />
                  <Text
                    style={[
                      styles.messageBannerText,
                      {
                        color:
                          modalMessageType === "success" ? "#065F46" : "#991B1B",
                      },
                    ]}
                  >
                    {modalMessage}
                  </Text>
                </View>
              ) : null}

              {/* Submit Button */}
              <TouchableOpacity
                style={[
                  styles.submitReviewBtn,
                  submittingReview && { opacity: 0.7 },
                ]}
                onPress={handleSubmitReview}
                disabled={submittingReview}
                activeOpacity={0.85}
              >
                {submittingReview ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.submitReviewBtnText}>Submit Review</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </View>
    </SafeAreaView>
  );
};

export default OrderDetails;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F8FAFC",
    paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0,
  },
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#0F172A",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  backBtnPill: {
    marginTop: 15,
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: "#0F172A",
    borderRadius: 20,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#F1F5F9",
  },
  rowBetween: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  orderIdText: {
    fontSize: 16,
    fontWeight: "800",
    color: "#0F172A",
  },
  statusBadge: {
    backgroundColor: "#E0E7FF",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 16,
  },
  statusText: {
    color: "#4338CA",
    fontWeight: "700",
    fontSize: 12,
  },
  dateText: {
    fontSize: 13,
    color: "#64748B",
    marginTop: 4,
  },
  divider: {
    height: 1,
    backgroundColor: "#F1F5F9",
    marginVertical: 12,
  },
  sectionHeader: {
    fontSize: 14,
    fontWeight: "700",
    color: "#0F172A",
    marginBottom: 6,
  },
  addressBox: {
    marginTop: 2,
  },
  addressName: {
    fontSize: 14,
    fontWeight: "700",
    color: "#0F172A",
  },
  addressText: {
    fontSize: 13,
    color: "#64748B",
    marginTop: 2,
    lineHeight: 18,
  },
  addressPhone: {
    fontSize: 13,
    color: "#64748B",
    marginTop: 2,
  },
  sectionMargin: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#0F172A",
    marginBottom: 10,
  },
  productCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 12,
    marginBottom: 10,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#F1F5F9",
  },
  productThumb: {
    width: 60,
    height: 60,
    borderRadius: 10,
  },
  productDetails: {
    flex: 1,
    marginLeft: 12,
  },
  productName: {
    fontSize: 15,
    fontWeight: "700",
    color: "#0F172A",
  },
  qtyPriceText: {
    fontSize: 13,
    color: "#64748B",
    marginTop: 2,
  },
  itemTotal: {
    fontSize: 13,
    fontWeight: "700",
    color: "#0F172A",
    marginTop: 2,
  },
  rateBtn: {
    backgroundColor: "#FF6B35",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    flexDirection: "row",
    alignItems: "center",
  },
  rateBtnText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 13,
  },
  totalLabel: {
    fontSize: 14,
    color: "#64748B",
  },
  totalVal: {
    fontSize: 14,
    fontWeight: "600",
    color: "#0F172A",
  },
  grandTotalLabel: {
    fontSize: 16,
    fontWeight: "800",
    color: "#0F172A",
  },
  grandTotalVal: {
    fontSize: 18,
    fontWeight: "800",
    color: "#FF6B35",
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 24,
    paddingBottom: 36,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: "#0F172A",
  },
  closeBtnCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
  },
  modalSubtitle: {
    fontSize: 14,
    color: "#64748B",
    textAlign: "center",
    marginVertical: 14,
    lineHeight: 20,
    paddingHorizontal: 20,
  },
  starsRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 15,
    fontWeight: "700",
    color: "#0F172A",
    marginBottom: 8,
  },
  modalProductPreview: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    padding: 10,
    borderRadius: 14,
    marginBottom: 16,
  },
  modalProdImage: {
    width: 48,
    height: 48,
    borderRadius: 8,
  },
  modalProdTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#0F172A",
    marginLeft: 12,
    flex: 1,
  },
  feedbackInput: {
    backgroundColor: "#F8FAFC",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    padding: 14,
    fontSize: 14,
    color: "#0F172A",
    minHeight: 100,
    textAlignVertical: "top",
    marginBottom: 16,
  },
  messageBanner: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
  },
  messageBannerError: {
    backgroundColor: "#FEE2E2",
  },
  messageBannerSuccess: {
    backgroundColor: "#D1FAE5",
  },
  messageBannerText: {
    fontSize: 13,
    fontWeight: "600",
    flex: 1,
  },
  submitReviewBtn: {
    backgroundColor: "#0F172A",
    borderRadius: 30,
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  submitReviewBtnText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
});
