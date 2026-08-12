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
  Linking,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import API_CONFIG from "../../config/apiConfig";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import orderService from "../../services/orderService";
import reviewService from "../../services/reviewService";
import authService from "../../services/authService";

const ORDER_STAGES = [
  {
    key: "Placed",
    title: "Order Placed",
    time: "9:30 AM",
    getSubtitle: (id) => `Your order #${id ? id.slice(-6).toUpperCase() : "212423"} was placed for delivery.`,
  },
  {
    key: "Pending",
    title: "Pending",
    time: "9:35 AM",
    subtitle: "Your order is pending for confirmation. Will confirmed within 5 minutes.",
  },
  {
    key: "Confirmed",
    title: "Confirmed",
    time: "9:55 AM",
    subtitle: "Your order is confirmed. Will deliver soon within 20 minutes.",
  },
  {
    key: "Processing",
    title: "Processing",
    time: "10:30 AM",
    subtitle: "Your product is processing to deliver you on time.",
  },
  {
    key: "Delivered",
    title: "Delivered",
    time: "10:45 AM",
    subtitle: "Product deliver to you and marked as deliverd by customer.",
  },
];

// Helper to determine stage completion index
const getStageIndex = (status) => {
  switch (status) {
    case "Pending":
      return 1;
    case "Confirmed":
      return 2;
    case "Packed":
    case "Processing":
      return 3;
    case "Shipped":
      return 3;
    case "Delivered":
      return 4;
    default:
      return 0; // Order Placed
  }
};

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
  const [modalMessageType, setModalMessageType] = useState("error");
  const [currentUser, setCurrentUser] = useState(null);
  const [existingReviewId, setExistingReviewId] = useState(null);

  // Return & Refund State
  const [returnRequestState, setReturnRequestState] = useState(null);
  const [returnModalVisible, setReturnModalVisible] = useState(false);
  const [returnType, setReturnType] = useState("Refund"); // "Refund" or "Replace"
  const [returnReason, setReturnReason] = useState("");
  const [submittingReturn, setSubmittingReturn] = useState(false);

  useEffect(() => {
    if (orderId) {
      fetchOrderDetails();
    }
  }, [orderId]);

  const fetchOrderDetails = async () => {
    try {
      setLoading(true);
      const [res, returnRes, profileRes] = await Promise.all([
        orderService.getOrderById(orderId),
        orderService.getReturnRequests().catch(() => ({ success: false, data: [] })),
        authService.getProfile().catch(() => null),
      ]);

      if (res && res.success && res.data) {
        setOrder(res.data);
      }
      
      if (returnRes && returnRes.success && Array.isArray(returnRes.data)) {
        const orderRequest = returnRes.data.find(
          (r) => r.order?._id === orderId || r.order === orderId
        );
        setReturnRequestState(orderRequest || null);
      }

      if (profileRes && profileRes.success && profileRes.user) {
        setCurrentUser(profileRes.user);
      }
    } catch (error) {
      console.log("Error loading order details:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const checkExistingReview = async () => {
      if (!selectedProduct || !currentUser) return;
      const prodId = typeof selectedProduct === "object" ? selectedProduct._id : selectedProduct;
      if (!prodId) return;

      try {
        const revRes = await reviewService.getReviewsByProduct(prodId);
        if (revRes && revRes.success && Array.isArray(revRes.data)) {
          const userRev = revRes.data.find((r) => r.userId === currentUser._id);
          if (userRev) {
            setExistingReviewId(userRev._id);
            setRating(userRev.rating);
            setComment(userRev.comment || "");
            return;
          }
        }
      } catch (err) {
        console.log("Error checking existing review:", err);
      }
      setExistingReviewId(null);
      setRating(5);
      setComment("");
    };
    checkExistingReview();
  }, [selectedProduct, currentUser]);

  const openReviewModal = (product = null) => {
    if (product) {
      setSelectedProduct(product);
    } else if (order?.items && order.items.length > 0) {
      setSelectedProduct(order.items[0].product);
    }
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

      let res;
      if (existingReviewId) {
        res = await reviewService.updateReview(existingReviewId, {
          rating: Number(rating),
          comment: comment ? comment.trim() : "",
        });
      } else {
        res = await reviewService.addReview({
          product: prodId,
          rating: Number(rating),
          comment: comment ? comment.trim() : "",
        });
      }

      if (res && res.success) {
        setModalMessage(existingReviewId ? "Review updated successfully!" : "Review submitted successfully!");
        setModalMessageType("success");
        setTimeout(() => {
          setReviewModalVisible(false);
          setModalMessage("");
        }, 1500);
      } else {
        setModalMessage(res?.message || (existingReviewId ? "Could not update review." : "Could not submit review."));
        setModalMessageType("error");
      }
    } catch (err) {
      console.log("Submit review error:", err);
      const errMsg =
        err?.response?.data?.message || err.message || (existingReviewId ? "Failed to update review." : "Failed to submit review.");
      setModalMessage(errMsg);
      setModalMessageType("error");
    } finally {
      setSubmittingReview(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingArea}>
        <ActivityIndicator size="large" color="#0D172A" />
        <Text style={{ marginTop: 10, color: "#64748B" }}>Loading order details...</Text>
      </SafeAreaView>
    );
  }

  if (!order) {
    return (
      <SafeAreaView style={styles.loadingArea}>
        <Ionicons name="alert-circle-outline" size={54} color="#CBD5E1" />
        <Text style={{ fontSize: 18, color: "#0F172A", marginTop: 10 }}>
          Order Not Found
        </Text>
        <TouchableOpacity style={styles.backPill} onPress={() => router.back()}>
          <Text style={{ color: "#FFFFFF", fontWeight: "700" }}>Go Back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const handleCancelOrder = () => {
    Alert.alert(
      "Cancel Order",
      "Are you sure you want to cancel this order?",
      [
        { text: "No", style: "cancel" },
        {
          text: "Yes, Cancel Order",
          style: "destructive",
          onPress: async () => {
            try {
              setLoading(true);
              let res;
              if (order.paymentMethod === "Razorpay") {
                res = await orderService.submitReturnRequest({
                  orderId: order._id,
                  requestType: "Refund",
                  reason: "User cancelled pre-paid order",
                });
              } else {
                res = await orderService.cancelOrder(order._id);
              }

              if (res && res.success) {
                const title = order.paymentMethod === "Razorpay" ? "Refund Applied" : "Order Cancelled";
                const msg = order.paymentMethod === "Razorpay"
                  ? "Your cancellation refund request has been submitted successfully."
                  : "Your order has been cancelled successfully.";
                Alert.alert(title, msg);
                router.replace("/(root)/(tabs)/order");
              } else {
                Alert.alert("Cancel Error", res?.message || "Could not cancel order.");
              }
            } catch (err) {
              console.log("Cancel order error:", err);
              const errMsg = err?.response?.data?.message || err.message || "Failed to cancel order.";
              Alert.alert("Cancel Error", errMsg);
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const handleSubmitReturn = async () => {
    if (!returnReason || !returnReason.trim()) {
      Alert.alert("Input Error", "Please provide a reason for your return request.");
      return;
    }

    try {
      setSubmittingReturn(true);
      const res = await orderService.submitReturnRequest({
        orderId: order._id,
        requestType: returnType,
        reason: returnReason.trim(),
      });

      if (res && res.success) {
        Alert.alert("Request Submitted", "Your return request has been submitted successfully.");
        setReturnModalVisible(false);
        setReturnReason("");
        fetchOrderDetails();
      } else {
        Alert.alert("Submission Error", res?.message || "Could not submit return request.");
      }
    } catch (err) {
      console.log("Submit return request error:", err);
      const errMsg = err?.response?.data?.message || err.message || "Failed to submit return request.";
      Alert.alert("Submission Error", errMsg);
    } finally {
      setSubmittingReturn(false);
    }
  };

  const getReturnStatusBadgeStyle = (status) => {
    switch (status) {
      case "Pending":
        return { backgroundColor: "#FEF3C7", borderColor: "#F59E0B" }; // Amber
      case "Processing":
        return { backgroundColor: "#DBEAFE", borderColor: "#3B82F6" }; // Blue
      case "Approved":
      case "Completed":
        return { backgroundColor: "#D1FAE5", borderColor: "#10B981" }; // Green
      case "Rejected":
        return { backgroundColor: "#FEE2E2", borderColor: "#EF4444" }; // Red
      default:
        return { backgroundColor: "#F1F5F9", borderColor: "#94A3B8" };
    }
  };

  const handleGoBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace("/(root)/(tabs)/order");
    }
  };

  const handleDownloadInvoice = async () => {
    try {
      const token = await AsyncStorage.getItem("token");
      if (!token) {
        Alert.alert("Authentication Required", "Please log in to download the invoice.");
        return;
      }
      const url = `${API_CONFIG.ECOMMERCE_BASE_URL}/order/invoice/${order._id}?token=${token}`;
      await Linking.openURL(url);
    } catch (err) {
      console.log("Invoice download error:", err);
      Alert.alert("Error", "Failed to initiate invoice download.");
    }
  };

  const currentStageIdx = getStageIndex(order?.orderStatus);
  const isDelivered = order?.orderStatus === "Delivered";
  const isCancelled = order?.orderStatus === "Cancelled";
  const canCancel = !["Delivered", "Cancelled"].includes(order?.orderStatus || "");
  const canDownloadInvoice = ["Confirmed", "Packed", "Shipped", "Delivered"].includes(order?.orderStatus || "");

  return (
    <View style={styles.darkNavyContainer}>
      <StatusBar barStyle="light-content" backgroundColor="#0D172A" />
      <SafeAreaView style={styles.safeHeaderArea}>
        {/* Top Header matching Image 1, 2, 3 */}
        <View style={styles.headerRow}>
          <TouchableOpacity
            style={styles.backCircleBtn}
            onPress={handleGoBack}
            activeOpacity={0.8}
          >
            <Ionicons name="arrow-back" size={20} color="#FFFFFF" />
          </TouchableOpacity>

          <Text style={styles.headerTitle}>Order details</Text>

          <View style={{ width: 42 }} />
        </View>
      </SafeAreaView>

      {/* Main Curved White Content Container */}
      <View style={styles.whiteCurveCard}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Return Status Tracker Card */}
          {returnRequestState && (
            <View style={styles.returnTrackerCard}>
              <View style={styles.flexRowBetween}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                  <Ionicons name="swap-horizontal" size={18} color="#4F46E5" />
                  <Text style={styles.returnTrackerTitle}>
                    {returnRequestState.requestType} Request
                  </Text>
                </View>
                <View style={[styles.returnBadge, getReturnStatusBadgeStyle(returnRequestState.status)]}>
                  <Text style={styles.returnBadgeText}>{returnRequestState.status}</Text>
                </View>
              </View>
              <Text style={styles.returnTrackerReason}>
                <Text style={{ fontWeight: "700", color: "#475569" }}>Reason: </Text>
                {returnRequestState.reason}
              </Text>
              {returnRequestState.adminNotes ? (
                <Text style={styles.returnTrackerNotes}>
                  <Text style={{ fontWeight: "700", color: "#475569" }}>Response: </Text>
                  {returnRequestState.adminNotes}
                </Text>
              ) : null}
            </View>
          )}

          {/* Timeline Card Container */}
          <View style={styles.timelineCard}>
            {ORDER_STAGES.map((stage, idx) => {
              const isCompleted = !isCancelled && idx <= currentStageIdx;
              const isLast = idx === ORDER_STAGES.length - 1;

              return (
                <View key={stage.key} style={styles.timelineItemRow}>
                  {/* Left Time Column */}
                  <View style={styles.timeCol}>
                    <Text style={[styles.timeText, !isCompleted && styles.timeTextDim]}>
                      {isCompleted ? stage.time : ""}
                    </Text>
                  </View>

                  {/* Vertical Line & Checkmark Circle Icon */}
                  <View style={styles.iconCol}>
                    <View
                      style={[
                        styles.circleBadge,
                        isCompleted ? styles.circleBadgeDone : styles.circleBadgePending,
                        isCancelled && { backgroundColor: "#EF4444", borderColor: "#EF4444" },
                      ]}
                    >
                      {isCancelled ? (
                        <Ionicons name="close" size={14} color="#FFFFFF" />
                      ) : isCompleted ? (
                        <Ionicons name="checkmark" size={14} color="#FFFFFF" />
                      ) : null}
                    </View>

                    {!isLast && (
                      <View
                        style={[
                          styles.verticalLine,
                          idx < currentStageIdx && !isCancelled && styles.verticalLineDone,
                        ]}
                      />
                    )}
                  </View>

                  {/* Right Description Column */}
                  <View style={styles.textCol}>
                    <Text style={[styles.stageTitle, isCancelled && idx === currentStageIdx && { color: "#EF4444" }]}>
                      {isCancelled && idx === currentStageIdx ? "Order Cancelled" : stage.title}
                    </Text>
                    <Text style={styles.stageSubtitle}>
                      {isCancelled && idx === currentStageIdx
                        ? "This order was cancelled by customer."
                        : stage.getSubtitle
                        ? stage.getSubtitle(order._id)
                        : stage.subtitle}
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>

          {/* Products Section Card */}
          <View style={styles.productsCardContainer}>
            <Text style={styles.productsSectionTitle}>Products</Text>

            {order.items?.map((item, idx) => {
              const prod = item.product || {};
              const prodImage =
                prod.images && prod.images.length > 0
                  ? prod.images[0]
                  : "https://via.placeholder.com/100";

              return (
                <View key={item._id || idx} style={styles.productRowCard}>
                  <Image
                    source={{ uri: prodImage }}
                    style={styles.prodThumbImg}
                    resizeMode="contain"
                  />

                  <View style={styles.prodMetaCol}>
                    <Text numberOfLines={1} style={styles.prodTitleText}>
                      {prod.name || "Product"}
                    </Text>
                    <Text style={styles.prodPriceQty}>
                      Qty: {item.quantity}  •  ₹{item.price}
                    </Text>
                    <Text style={styles.prodTotalText}>
                      Total: ₹{(item.quantity * item.price).toFixed(2)}
                    </Text>
                  </View>

                  {isDelivered && (
                    <TouchableOpacity
                      style={styles.smallRateBtn}
                      onPress={() => openReviewModal(prod)}
                      activeOpacity={0.8}
                    >
                      <Ionicons name="star" size={12} color="#FFFFFF" style={{ marginRight: 3 }} />
                      <Text style={styles.smallRateBtnText}>Rate</Text>
                    </TouchableOpacity>
                  )}
                </View>
              );
            })}
          </View>

          {/* Payment & Total Card */}
          <View style={styles.paymentSummaryCard}>
            <View style={styles.flexRowBetween}>
              <Text style={styles.summaryLabel}>Payment Method</Text>
              <Text style={styles.summaryValue}>{order.paymentMethod || "COD"}</Text>
            </View>

            <View style={[styles.flexRowBetween, { marginTop: 10 }]}>
              <Text style={styles.summaryLabel}>Payment Status</Text>
              <Text
                style={[
                  styles.summaryValue,
                  { color: order.paymentStatus === "Paid" ? "#10B981" : "#F59E0B" },
                ]}
              >
                {order.paymentStatus || "Pending"}
              </Text>
            </View>

            <View style={styles.cardDividerLine} />

            <View style={styles.flexRowBetween}>
              <Text style={styles.totalHeaderLabel}>Grand Total</Text>
              <Text style={styles.totalHeaderVal}>₹{order.totalAmount?.toFixed(2)}</Text>
            </View>

            {canDownloadInvoice && (
              <TouchableOpacity
                style={styles.invoiceBtn}
                onPress={handleDownloadInvoice}
                activeOpacity={0.8}
              >
                <Ionicons name="document-text-outline" size={16} color="#4F46E5" style={{ marginRight: 6 }} />
                <Text style={styles.invoiceBtnText}>Download Invoice</Text>
              </TouchableOpacity>
            )}
          </View>
        </ScrollView>

        {/* Bottom Pill Action Button */}
        <View style={styles.bottomBarContainer}>
          {isDelivered ? (
            <View style={{ flexDirection: "row", gap: 10, width: "100%" }}>
              <TouchableOpacity
                style={[styles.darkNavyActionBtn, { flex: 1 }]}
                onPress={() => openReviewModal()}
                activeOpacity={0.85}
              >
                <Text style={styles.darkNavyActionBtnText}>Leave Feedback</Text>
              </TouchableOpacity>
              
              {!returnRequestState ? (
                <TouchableOpacity
                  style={[styles.darkNavyActionBtn, { flex: 1, backgroundColor: "#4F46E5" }]}
                  onPress={() => setReturnModalVisible(true)}
                  activeOpacity={0.85}
                >
                  <Text style={styles.darkNavyActionBtnText}>Return / Replace</Text>
                </TouchableOpacity>
              ) : (
                <View style={[styles.darkNavyActionBtn, { flex: 1, backgroundColor: "#E2E8F0", borderWidth: 1, borderColor: "#CBD5E1" }]}>
                  <Text style={[styles.darkNavyActionBtnText, { color: "#64748B" }]}>Return Requested</Text>
                </View>
              )}
            </View>
          ) : canCancel ? (
            <TouchableOpacity
              style={[styles.darkNavyActionBtn, { backgroundColor: "#EF4444" }]}
              onPress={handleCancelOrder}
              activeOpacity={0.85}
            >
              <Text style={styles.darkNavyActionBtnText}>
                {order.paymentMethod === "Razorpay" ? "Apply Refund / Cancel" : "Cancel Order"}
              </Text>
            </TouchableOpacity>
          ) : isCancelled ? (
            <TouchableOpacity
              style={styles.darkNavyActionBtn}
              onPress={handleGoBack}
              activeOpacity={0.85}
            >
              <Text style={styles.darkNavyActionBtnText}>Back to My Orders</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      {/* Rate and Review Modal matching Image 3 */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={reviewModalVisible}
        onRequestClose={() => setReviewModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheetContent}>
            {/* Modal Header */}
            <View style={styles.modalHeaderRow}>
              <Text style={styles.modalTitleText}>Rate and Review</Text>
              <TouchableOpacity
                style={styles.modalCloseCircle}
                onPress={() => setReviewModalVisible(false)}
                activeOpacity={0.8}
              >
                <Ionicons name="close" size={20} color="#0D172A" />
              </TouchableOpacity>
            </View>

            {/* Subtitle */}
            <Text style={styles.modalSubtitleText}>
              Please rate this service using stars to indicate your level of satisfaction.
            </Text>

            {/* 5 Star Rating Row matching Image 3 (Orange Stars) */}
            <View style={styles.starRatingRow}>
              {[1, 2, 3, 4, 5].map((starIdx) => (
                <TouchableOpacity
                  key={starIdx}
                  onPress={() => handleRatingSelect(starIdx)}
                  activeOpacity={0.7}
                  style={{ paddingHorizontal: 6 }}
                >
                  <Ionicons
                    name="star"
                    size={38}
                    color={starIdx <= rating ? "#FF5500" : "#E2E8F0"}
                  />
                </TouchableOpacity>
              ))}
            </View>

            {/* Product Gallery Section */}
            <Text style={styles.inputFieldLabel}>Product</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.prodGalleryRow}
            >
              {order.items?.map((item, index) => {
                const p = item.product || {};
                const pImg = p.images?.[0];
                const isSelected = selectedProduct?._id === p._id || (!selectedProduct && index === 0);

                return (
                  <TouchableOpacity
                    key={p._id || index}
                    style={[
                      styles.galleryThumbCard,
                      isSelected && styles.galleryThumbSelected,
                    ]}
                    onPress={() => setSelectedProduct(p)}
                    activeOpacity={0.8}
                  >
                    {pImg ? (
                      <Image source={{ uri: pImg }} style={styles.galleryImg} resizeMode="cover" />
                    ) : (
                      <View style={styles.galleryPlaceholder}>
                        <Ionicons name="image-outline" size={20} color="#94A3B8" />
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* Feedback Section */}
            <Text style={styles.inputFieldLabel}>Feedback</Text>
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
              style={styles.modalFeedbackInput}
            />

            {/* Banner Message */}
            {modalMessage ? (
              <View
                style={[
                  styles.msgBanner,
                  modalMessageType === "success"
                    ? styles.msgBannerSuccess
                    : styles.msgBannerError,
                ]}
              >
                <Ionicons
                  name={modalMessageType === "success" ? "checkmark-circle" : "alert-circle"}
                  size={18}
                  color={modalMessageType === "success" ? "#10B981" : "#EF4444"}
                  style={{ marginRight: 6 }}
                />
                <Text
                  style={[
                    styles.msgBannerText,
                    { color: modalMessageType === "success" ? "#065F46" : "#991B1B" },
                  ]}
                >
                  {modalMessage}
                </Text>
              </View>
            ) : null}

            {/* Bottom Submit Action Button matching Image 3 */}
            <TouchableOpacity
              style={[
                styles.modalSubmitNavyBtn,
                submittingReview && { opacity: 0.7 },
              ]}
              onPress={handleSubmitReview}
              disabled={submittingReview}
              activeOpacity={0.85}
            >
              {submittingReview ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.modalSubmitNavyBtnText}>{existingReviewId ? "Update Review" : "Submit Review"}</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Return Request Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={returnModalVisible}
        onRequestClose={() => setReturnModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheetContent}>
            {/* Modal Header */}
            <View style={styles.modalHeaderRow}>
              <Text style={styles.modalTitleText}>Return / Replace</Text>
              <TouchableOpacity
                style={styles.modalCloseCircle}
                onPress={() => setReturnModalVisible(false)}
                activeOpacity={0.8}
              >
                <Ionicons name="close" size={20} color="#0D172A" />
              </TouchableOpacity>
            </View>

            {/* Subtitle */}
            <Text style={styles.modalSubtitleText}>
              Select the option for your return request and specify the reason.
            </Text>

            {/* Request Type Options */}
            <Text style={styles.inputFieldLabel}>Request Type</Text>
            <View style={{ flexDirection: "row", gap: 12, marginBottom: 20 }}>
              <TouchableOpacity
                style={[
                  styles.optionSelectCard,
                  returnType === "Refund" && styles.optionSelectCardSelected,
                ]}
                onPress={() => setReturnType("Refund")}
                activeOpacity={0.85}
              >
                <Ionicons
                  name="cash-outline"
                  size={24}
                  color={returnType === "Refund" ? "#FF5500" : "#64748B"}
                />
                <Text
                  style={[
                    styles.optionSelectCardText,
                    returnType === "Refund" && styles.optionSelectCardTextSelected,
                  ]}
                >
                  Refund
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.optionSelectCard,
                  returnType === "Replace" && styles.optionSelectCardSelected,
                ]}
                onPress={() => setReturnType("Replace")}
                activeOpacity={0.85}
              >
                <Ionicons
                  name="sync-outline"
                  size={24}
                  color={returnType === "Replace" ? "#FF5500" : "#64748B"}
                />
                <Text
                  style={[
                    styles.optionSelectCardText,
                    returnType === "Replace" && styles.optionSelectCardTextSelected,
                  ]}
                >
                  Replace
                </Text>
              </TouchableOpacity>
            </View>

            {/* Reason Section */}
            <Text style={styles.inputFieldLabel}>Reason for Return</Text>
            <TextInput
              placeholder="Please explain why you want to return or replace these items..."
              placeholderTextColor="#94A3B8"
              value={returnReason}
              onChangeText={(txt) => setReturnReason(txt)}
              multiline
              numberOfLines={4}
              style={styles.modalFeedbackInput}
            />

            {/* Bottom Submit Action Button */}
            <TouchableOpacity
              style={[
                styles.modalSubmitNavyBtn,
                submittingReturn && { opacity: 0.7 },
              ]}
              onPress={handleSubmitReturn}
              disabled={submittingReturn}
              activeOpacity={0.85}
            >
              {submittingReturn ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.modalSubmitNavyBtnText}>Submit Request</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default OrderDetails;

const styles = StyleSheet.create({
  loadingArea: {
    flex: 1,
    backgroundColor: "#F8FAFC",
    justifyContent: "center",
    alignItems: "center",
  },
  backPill: {
    marginTop: 16,
    backgroundColor: "#0D172A",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
  },
  darkNavyContainer: {
    flex: 1,
    backgroundColor: "#0D172A",
  },
  safeHeaderArea: {
    paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  backCircleBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "rgba(255, 255, 255, 0.12)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  whiteCurveCard: {
    flex: 1,
    backgroundColor: "#F4F6F9",
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    overflow: "hidden",
    paddingTop: 16,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 110,
  },

  /* Timeline Card Styles matching Image 1 & 2 */
  timelineCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    paddingVertical: 22,
    paddingHorizontal: 18,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  timelineItemRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 4,
  },
  timeCol: {
    width: 68,
    paddingTop: 2,
  },
  timeText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#0D172A",
  },
  timeTextDim: {
    color: "transparent",
  },
  iconCol: {
    alignItems: "center",
    marginRight: 14,
  },
  circleBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  circleBadgeDone: {
    backgroundColor: "#0D172A",
  },
  circleBadgePending: {
    backgroundColor: "#FFFFFF",
    borderWidth: 2,
    borderColor: "#CBD5E1",
  },
  verticalLine: {
    width: 2,
    height: 48,
    backgroundColor: "#E2E8F0",
    marginVertical: 4,
  },
  verticalLineDone: {
    backgroundColor: "#0D172A",
  },
  textCol: {
    flex: 1,
    paddingBottom: 16,
  },
  stageTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#0D172A",
    marginBottom: 4,
  },
  stageSubtitle: {
    fontSize: 12,
    color: "#94A3B8",
    lineHeight: 17,
  },

  /* Products Card Styles */
  productsCardContainer: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 18,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  productsSectionTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#0D172A",
    marginBottom: 14,
  },
  productRowCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    borderRadius: 18,
    padding: 12,
    marginBottom: 10,
  },
  prodThumbImg: {
    width: 56,
    height: 56,
    borderRadius: 12,
  },
  prodMetaCol: {
    flex: 1,
    marginLeft: 12,
  },
  prodTitleText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#0D172A",
  },
  prodPriceQty: {
    fontSize: 12,
    color: "#64748B",
    marginTop: 2,
  },
  prodTotalText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#0D172A",
    marginTop: 2,
  },
  smallRateBtn: {
    backgroundColor: "#FF5500",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    flexDirection: "row",
    alignItems: "center",
  },
  smallRateBtnText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "700",
  },
  rateStarMargin: {
    marginRight: 4,
  },
  summaryCardContainer: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 18,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  flexRowBetween: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  summaryLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#64748B",
  },
  summaryValue: {
    fontSize: 13,
    fontWeight: "700",
    color: "#0D172A",
  },
  cardDividerLine: {
    height: 1,
    backgroundColor: "#F1F5F9",
    marginVertical: 14,
  },
  totalHeaderLabel: {
    fontSize: 16,
    fontWeight: "800",
    color: "#0D172A",
  },
  totalHeaderVal: {
    fontSize: 20,
    fontWeight: "900",
    color: "#0D172A",
  },
  invoiceBtn: {
    marginTop: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderRadius: 20,
    backgroundColor: "#EEF2FF",
    borderWidth: 1.5,
    borderColor: "#E0E7FF",
  },
  invoiceBtnText: {
    fontSize: 14,
    fontWeight: "800",
    color: "#4F46E5",
  },
  bottomBarContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: Platform.OS === "ios" ? 28 : 16,
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
    flexDirection: "row",
    alignItems: "center",
  },
  darkNavyActionBtn: {
    width: "100%",
    backgroundColor: "#0D172A",
    borderRadius: 30,
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  darkNavyActionBtnText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "800",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.6)",
    justifyContent: "flex-end",
  },
  modalSheetContent: {
    backgroundColor: "#F8FAFC",
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingHorizontal: 20,
    paddingTop: 22,
    paddingBottom: Platform.OS === "ios" ? 38 : 24,
  },
  modalHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  modalTitleText: {
    fontSize: 22,
    fontWeight: "800",
    color: "#0D172A",
  },
  modalCloseCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
  },
  modalSubtitleText: {
    fontSize: 14,
    color: "#64748B",
    textAlign: "center",
    marginVertical: 16,
    lineHeight: 20,
    paddingHorizontal: 16,
  },
  starRatingRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
  },
  inputFieldLabel: {
    fontSize: 15,
    fontWeight: "800",
    color: "#0D172A",
    marginBottom: 10,
  },
  prodGalleryRow: {
    flexDirection: "row",
    marginBottom: 20,
  },
  galleryThumbCard: {
    width: 64,
    height: 64,
    borderRadius: 16,
    backgroundColor: "#F8FAFC",
    marginRight: 12,
    overflow: "hidden",
    borderWidth: 2,
    borderColor: "transparent",
  },
  galleryThumbSelected: {
    borderColor: "#FF5500",
  },
  galleryImg: {
    width: "100%",
    height: "100%",
  },
  galleryPlaceholder: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  modalFeedbackInput: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    padding: 16,
    fontSize: 14,
    color: "#0D172A",
    minHeight: 110,
    textAlignVertical: "top",
    marginBottom: 20,
  },
  msgBanner: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 14,
    marginBottom: 16,
  },
  msgBannerError: {
    backgroundColor: "#FEE2E2",
  },
  msgBannerSuccess: {
    backgroundColor: "#D1FAE5",
  },
  msgBannerText: {
    fontSize: 13,
    fontWeight: "600",
    flex: 1,
  },
  modalSubmitNavyBtn: {
    backgroundColor: "#0D172A",
    borderRadius: 30,
    paddingVertical: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  modalSubmitNavyBtnText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "800",
  },
  returnTrackerCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  returnTrackerTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#0F172A",
  },
  returnBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
  },
  returnBadgeText: {
    fontSize: 11,
    fontWeight: "800",
    textTransform: "uppercase",
  },
  returnTrackerReason: {
    fontSize: 13,
    color: "#64748B",
    marginTop: 10,
    lineHeight: 18,
  },
  returnTrackerNotes: {
    fontSize: 13,
    color: "#0F172A",
    marginTop: 8,
    backgroundColor: "#F8FAFC",
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    lineHeight: 18,
  },
  optionSelectCard: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F8FAFC",
    borderWidth: 2,
    borderColor: "#E2E8F0",
    borderRadius: 16,
    paddingVertical: 14,
    gap: 8,
  },
  optionSelectCardSelected: {
    borderColor: "#FF5500",
    backgroundColor: "#FFF7ED",
  },
  optionSelectCardText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#64748B",
  },
  optionSelectCardTextSelected: {
    color: "#FF5500",
  },
});
