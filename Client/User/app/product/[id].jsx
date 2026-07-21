import React, { useEffect, useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  Image,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  FlatList,
  Alert,
  SafeAreaView,
  Platform,
  StatusBar,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import productService from "../../services/productService";
import reviewService from "../../services/reviewService";
import cartService from "../../services/cartService";

const ProductDetails = () => {
  const { id } = useLocalSearchParams();
  const router = useRouter();

  const [product, setProduct] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [similarProducts, setSimilarProducts] = useState([]);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [addingToCart, setAddingToCart] = useState(false);

  useEffect(() => {
    if (id) {
      fetchProductDetails();
    }
  }, [id]);

  const fetchProductDetails = async () => {
    try {
      setLoading(true);
      const [prodRes, revRes, allProdsRes] = await Promise.all([
        productService.getProductById(id),
        reviewService.getReviewsByProduct(id).catch(() => ({ success: false, data: [] })),
        productService.getProducts().catch(() => ({ success: false, data: [] })),
      ]);

      if (prodRes && prodRes.success && prodRes.data) {
        setProduct(prodRes.data);

        // Fetch similar products in the same category
        if (allProdsRes && allProdsRes.success && Array.isArray(allProdsRes.data)) {
          const currentCatId = prodRes.data.category?._id || prodRes.data.category;
          const currentCatName = prodRes.data.category?.name;

          const filtered = allProdsRes.data.filter(
            (p) =>
              p._id !== prodRes.data._id &&
              ((p.category?._id && p.category?._id === currentCatId) ||
                (p.category?.name && p.category?.name === currentCatName) ||
                p.category === currentCatId)
          );
          setSimilarProducts(filtered);
        }
      }

      if (revRes && revRes.success && Array.isArray(revRes.data)) {
        setReviews(revRes.data);
      }
    } catch (error) {
      console.log("Error loading product details:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleIncrement = () => {
    if (product && quantity < product.stock) {
      setQuantity((prev) => prev + 1);
    } else {
      Alert.alert("Stock Limit", `Only ${product?.stock} items available.`);
    }
  };

  const handleDecrement = () => {
    if (quantity > 1) {
      setQuantity((prev) => prev - 1);
    }
  };

  const handleAddToCart = async () => {
    if (!product) return;
    try {
      setAddingToCart(true);
      const res = await cartService.addToCart(product._id, quantity);
      if (res && res.success) {
        Alert.alert("Success", `${quantity} ${product.unit || 'unit(s)'} of ${product.name} added to cart!`);
      } else {
        Alert.alert("Notice", res?.message || "Failed to add product to cart.");
      }
    } catch (err) {
      console.log("Add to cart error:", err);
      Alert.alert("Error", err?.response?.data?.message || "Could not add product to cart.");
    } finally {
      setAddingToCart(false);
    }
  };

  const renderStars = (rating) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <Ionicons
          key={i}
          name={i <= rating ? "star" : "star-outline"}
          size={16}
          color="#FF6B35"
          style={{ marginRight: 2 }}
        />
      );
    }
    return <View style={{ flexDirection: "row" }}>{stars}</View>;
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF6B35" />
        <Text style={{ marginTop: 10, color: "#64748B" }}>Loading details...</Text>
      </SafeAreaView>
    );
  }

  if (!product) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <Ionicons name="alert-circle-outline" size={54} color="#CBD5E1" />
        <Text style={{ fontSize: 18, color: "#0F172A", marginTop: 10 }}>
          Product Not Found
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
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Top Banner with Product Image and Back Button */}
          <View style={styles.imageHeaderCard}>
            <TouchableOpacity
              style={styles.backButtonCircle}
              onPress={() => router.back()}
              activeOpacity={0.8}
            >
              <Ionicons name="arrow-back" size={22} color="#0F172A" />
            </TouchableOpacity>

            <Image
              source={{
                uri:
                  product.images && product.images.length > 0
                    ? product.images[0]
                    : "https://via.placeholder.com/300",
              }}
              style={styles.productMainImage}
              resizeMode="contain"
            />
          </View>

          {/* Details Body */}
          <View style={styles.bodySection}>
            {/* Title & Quantity Row */}
            <View style={styles.titleRow}>
              <View style={{ flex: 1, paddingRight: 10 }}>
                <Text style={styles.productTitle}>{product.name}</Text>
                <Text style={styles.stockText}>
                  {product.stock > 0
                    ? `Available in stock (${product.stock} ${product.unit || ''})`
                    : "Out of stock"}
                </Text>
              </View>

              {/* Quantity Counter */}
              <View style={styles.quantityContainer}>
                <TouchableOpacity
                  style={styles.qtyBtn}
                  onPress={handleDecrement}
                  activeOpacity={0.8}
                >
                  <Ionicons name="remove" size={18} color="#FFFFFF" />
                </TouchableOpacity>

                <Text style={styles.qtyText}>
                  {quantity} {product.unit || ''}
                </Text>

                <TouchableOpacity
                  style={styles.qtyBtn}
                  onPress={handleIncrement}
                  activeOpacity={0.8}
                >
                  <Ionicons name="add" size={18} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
            </View>

            {/* Product Description */}
            <View style={styles.sectionMargin}>
              <Text style={styles.sectionTitle}>Product Description</Text>
              <Text style={styles.descriptionText}>
                {product.description ||
                  "There are many variations of passages of Lorem Ipsum available, but the majority have suffered alteration in some form, by injected humour."}
              </Text>
            </View>

            {/* Product Reviews */}
            <View style={styles.sectionMargin}>
              <Text style={styles.sectionTitle}>Product Reviews</Text>

              {reviews.length === 0 ? (
                <Text style={styles.noReviewsText}>
                  No reviews for this product yet.
                </Text>
              ) : (
                reviews.map((rev) => (
                  <View key={rev._id} style={styles.reviewCard}>
                    <View style={styles.reviewerHeader}>
                      <View style={styles.avatarCircle}>
                        {rev.user?.avatar ? (
                          <Image
                            source={{ uri: rev.user.avatar }}
                            style={styles.avatarImage}
                          />
                        ) : (
                          <Ionicons name="person" size={20} color="#64748B" />
                        )}
                      </View>

                      <View style={{ flex: 1, marginLeft: 10 }}>
                        <Text style={styles.reviewerName}>
                          {rev.user?.username || rev.user?.name || "Verified Customer"}
                        </Text>
                        {renderStars(rev.rating)}
                      </View>

                      <Text style={styles.reviewDate}>
                        {rev.createdAt
                          ? new Date(rev.createdAt).toLocaleDateString("en-US", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })
                          : "Recent"}
                      </Text>
                    </View>

                    {rev.comment ? (
                      <Text style={styles.reviewComment}>{rev.comment}</Text>
                    ) : null}
                  </View>
                ))
              )}
            </View>

            {/* Similar Products */}
            {similarProducts.length > 0 && (
              <View style={styles.sectionMargin}>
                <Text style={styles.sectionTitle}>Similar Products</Text>
                <FlatList
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  data={similarProducts}
                  keyExtractor={(item) => item._id}
                  contentContainerStyle={styles.similarList}
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      style={styles.similarCard}
                      onPress={() => router.push(`/product/${item._id}`)}
                      activeOpacity={0.8}
                    >
                      <Image
                        source={{
                          uri:
                            item.images && item.images.length > 0
                              ? item.images[0]
                              : "https://via.placeholder.com/150",
                        }}
                        style={styles.similarImage}
                        resizeMode="contain"
                      />
                      <Text numberOfLines={1} style={styles.similarName}>
                        {item.name}
                      </Text>
                      <Text style={styles.similarPrice}>
                        ₹{item.price}
                        {item.unit ? `/${item.unit}` : ''}
                      </Text>
                    </TouchableOpacity>
                  )}
                />
              </View>
            )}
          </View>
        </ScrollView>

        {/* Bottom Floating Bar */}
        <View style={styles.bottomBar}>
          <View style={styles.bottomPriceContainer}>
            <Text style={styles.bottomPriceText}>
              ₹{(product.price * quantity).toFixed(2)}
              {product.unit ? (
                <Text style={styles.bottomUnitText}>/{product.unit}</Text>
              ) : null}
            </Text>
          </View>

          <TouchableOpacity
            style={[
              styles.addToCartPillBtn,
              (addingToCart || product.stock <= 0) && { opacity: 0.7 },
            ]}
            onPress={handleAddToCart}
            disabled={addingToCart || product.stock <= 0}
            activeOpacity={0.85}
          >
            {addingToCart ? (
              <ActivityIndicator size="small" color="#0F172A" />
            ) : (
              <Text style={styles.addToCartPillText}>
                {product.stock > 0 ? "Add to cart" : "Out of Stock"}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

export default ProductDetails;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F8FAFC",
    paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0,
  },
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
  },
  backBtnPill: {
    marginTop: 15,
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: "#0F172A",
    borderRadius: 20,
  },
  scrollContent: {
    paddingBottom: 110,
  },
  imageHeaderCard: {
    backgroundColor: "#FFFFFF",
    borderBottomLeftRadius: 36,
    borderBottomRightRadius: 36,
    paddingTop: 16,
    paddingBottom: 30,
    paddingHorizontal: 20,
    alignItems: "center",
    position: "relative",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  backButtonCircle: {
    position: "absolute",
    top: 16,
    left: 20,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#F1F5F9",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10,
  },
  productMainImage: {
    width: "100%",
    height: 230,
    marginTop: 20,
  },
  bodySection: {
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  titleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  productTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: "#0F172A",
    marginBottom: 4,
  },
  stockText: {
    fontSize: 13,
    color: "#10B981",
    fontWeight: "600",
  },
  quantityContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F1F5F9",
    borderRadius: 25,
    paddingHorizontal: 6,
    paddingVertical: 4,
  },
  qtyBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#0F172A",
    justifyContent: "center",
    alignItems: "center",
  },
  qtyText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#0F172A",
    marginHorizontal: 10,
  },
  sectionMargin: {
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#0F172A",
    marginBottom: 10,
  },
  descriptionText: {
    fontSize: 14,
    color: "#64748B",
    lineHeight: 22,
  },
  noReviewsText: {
    fontSize: 14,
    color: "#94A3B8",
    fontStyle: "italic",
  },
  reviewCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#F1F5F9",
  },
  reviewerHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatarCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#E2E8F0",
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
  avatarImage: {
    width: "100%",
    height: "100%",
  },
  reviewerName: {
    fontSize: 14,
    fontWeight: "700",
    color: "#0F172A",
    marginBottom: 2,
  },
  reviewDate: {
    fontSize: 12,
    color: "#94A3B8",
  },
  reviewComment: {
    marginTop: 8,
    fontSize: 13,
    color: "#475569",
    lineHeight: 18,
  },
  similarList: {
    paddingRight: 10,
  },
  similarCard: {
    width: 130,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 10,
    marginRight: 12,
    borderWidth: 1,
    borderColor: "#F1F5F9",
  },
  similarImage: {
    width: "100%",
    height: 80,
    marginBottom: 6,
  },
  similarName: {
    fontSize: 13,
    fontWeight: "600",
    color: "#0F172A",
  },
  similarPrice: {
    fontSize: 13,
    fontWeight: "700",
    color: "#FF6B35",
    marginTop: 2,
  },
  bottomBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#0F172A",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingVertical: 18,
  },
  bottomPriceContainer: {
    justifyContent: "center",
  },
  bottomPriceText: {
    fontSize: 22,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  bottomUnitText: {
    fontSize: 13,
    color: "#94A3B8",
    fontWeight: "400",
  },
  addToCartPillBtn: {
    backgroundColor: "#FFFFFF",
    borderRadius: 30,
    paddingHorizontal: 28,
    paddingVertical: 14,
    justifyContent: "center",
    alignItems: "center",
  },
  addToCartPillText: {
    color: "#0F172A",
    fontSize: 15,
    fontWeight: "800",
  },
});