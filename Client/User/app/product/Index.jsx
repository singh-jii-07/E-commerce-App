import React, { useEffect, useState, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Image,
  ActivityIndicator,
  Alert,
  SafeAreaView,
  Platform,
  StatusBar,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import productService from "../../services/productService";
import categoryService from "../../services/categoryService";
import cartService from "../../services/cartService";

const ProductListing = () => {
  const router = useRouter();

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState(["All"]);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [addingId, setAddingId] = useState(null);
  const [showSearch, setShowSearch] = useState(false);

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      const [prodRes, catRes] = await Promise.all([
        productService.getProducts(),
        categoryService.getCategories(),
      ]);

      let loadedProducts = [];
      if (prodRes && prodRes.success && Array.isArray(prodRes.data)) {
        loadedProducts = prodRes.data;
        setProducts(loadedProducts);
      }

      // Collect categories dynamically from Category API + Products
      const catList = ["All"];
      if (catRes && catRes.success && Array.isArray(catRes.data)) {
        catRes.data.forEach((c) => {
          const cName = typeof c === "string" ? c : c.name;
          if (cName && !catList.includes(cName)) {
            catList.push(cName);
          }
        });
      }

      // Fallback/Supplement: extract category names directly from products if missing
      loadedProducts.forEach((p) => {
        const catName = p.category?.name;
        if (catName && !catList.includes(catName)) {
          catList.push(catName);
        }
      });

      setCategories(catList);
    } catch (error) {
      console.log("Error loading product listing data:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = useMemo(() => {
    let data = [...products];

    if (selectedCategory !== "All") {
      data = data.filter(
        (item) =>
          item.category?.name?.toLowerCase() === selectedCategory.toLowerCase()
      );
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      data = data.filter((item) => item.name?.toLowerCase().includes(q));
    }

    return data;
  }, [products, selectedCategory, search]);

  const handleAddToCart = async (product, e) => {
    if (e && e.stopPropagation) {
      e.stopPropagation();
    }
    try {
      setAddingId(product._id);
      const res = await cartService.addToCart(product._id, 1);
      if (res && res.success) {
        Alert.alert("Success", `${product.name} added to cart!`);
      } else {
        Alert.alert("Notice", res?.message || "Failed to add product to cart.");
      }
    } catch (err) {
      console.log("Add to cart error:", err);
      Alert.alert("Error", err?.response?.data?.message || "Could not add item to cart.");
    } finally {
      setAddingId(null);
    }
  };

  const renderProductItem = ({ item }) => {
    const isAdding = addingId === item._id;

    return (
      <TouchableOpacity
        style={styles.card}
        activeOpacity={0.85}
        onPress={() => router.push(`/product/${item._id}`)}
      >
        <Image
          source={{
            uri:
              item.images && item.images.length > 0
                ? item.images[0]
                : "https://via.placeholder.com/150",
          }}
          style={styles.cardImage}
          resizeMode="contain"
        />

        <Text numberOfLines={1} style={styles.cardTitle}>
          {item.name}
        </Text>

        <Text style={styles.cardStock}>
          {item.stock > 0 ? `Stock: ${item.stock} ${item.unit || ''}` : "Out of stock"}
        </Text>

        <View style={styles.cardBottomRow}>
          <Text style={styles.cardPrice}>
            ₹{item.price}
            {item.unit ? <Text style={styles.cardUnit}>/{item.unit}</Text> : null}
          </Text>

          <TouchableOpacity
            style={[styles.addBtn, isAdding && { opacity: 0.7 }]}
            onPress={(e) => handleAddToCart(item, e)}
            disabled={isAdding || item.stock <= 0}
          >
            {isAdding ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Ionicons name="add" size={20} color="#fff" />
            )}
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Top Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>Daily</Text>
            <Text style={styles.headerTitleBold}>Grocery Food</Text>
          </View>

          <TouchableOpacity
            style={styles.searchIconBtn}
            onPress={() => setShowSearch((prev) => !prev)}
            activeOpacity={0.8}
          >
            <Ionicons name="search-outline" size={22} color="#0F172A" />
          </TouchableOpacity>
        </View>

        {/* Search Bar Input (Visible or Toggled) */}
        {(showSearch || search.length > 0) && (
          <View style={styles.searchContainer}>
            <Ionicons name="search" size={18} color="#94A3B8" />
            <TextInput
              placeholder="Search products..."
              placeholderTextColor="#94A3B8"
              value={search}
              onChangeText={setSearch}
              style={styles.searchInput}
              autoFocus={showSearch}
            />
            {search.length > 0 && (
              <TouchableOpacity onPress={() => setSearch("")}>
                <Ionicons name="close-circle" size={18} color="#94A3B8" />
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Horizontal Dynamic Categories */}
        <View style={{ height: 50, marginVertical: 10 }}>
          <FlatList
            horizontal
            showsHorizontalScrollIndicator={false}
            data={categories}
            keyExtractor={(item, index) => `${item}-${index}`}
            contentContainerStyle={styles.categoryListContainer}
            renderItem={({ item }) => {
              const isSelected = selectedCategory === item;
              return (
                <TouchableOpacity
                  style={[
                    styles.categoryBtn,
                    isSelected && styles.categoryBtnActive,
                  ]}
                  onPress={() => setSelectedCategory(item)}
                  activeOpacity={0.8}
                >
                  <Text
                    style={[
                      styles.categoryText,
                      isSelected && styles.categoryTextActive,
                    ]}
                  >
                    {item}
                  </Text>
                </TouchableOpacity>
              );
            }}
          />
        </View>

        {/* Section Title */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Popular Products</Text>
          <TouchableOpacity onPress={() => setSelectedCategory("All")}>
            <Text style={styles.seeAllText}>See all</Text>
          </TouchableOpacity>
        </View>

        {/* Products Grid */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#FF6B35" />
            <Text style={styles.loadingText}>Loading products...</Text>
          </View>
        ) : filteredProducts.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="basket-outline" size={54} color="#CBD5E1" />
            <Text style={styles.emptyTitle}>No Products Found</Text>
            <Text style={styles.emptySubtitle}>
              Try selecting a different category or search term.
            </Text>
          </View>
        ) : (
          <FlatList
            data={filteredProducts}
            keyExtractor={(item) => item._id}
            numColumns={2}
            showsVerticalScrollIndicator={false}
            columnWrapperStyle={styles.columnWrapper}
            renderItem={renderProductItem}
            contentContainerStyle={styles.productListContent}
          />
        )}
      </View>
    </SafeAreaView>
  );
};

export default ProductListing;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0,
  },
  container: {
    flex: 1,
    paddingHorizontal: 18,
    paddingTop: 10,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "400",
    color: "#0F172A",
    lineHeight: 32,
  },
  headerTitleBold: {
    fontSize: 28,
    fontWeight: "800",
    color: "#0F172A",
    lineHeight: 32,
  },
  searchIconBtn: {
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#F1F5F9",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  searchContainer: {
    marginVertical: 10,
    backgroundColor: "#F1F5F9",
    borderRadius: 16,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    height: 48,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: "#0F172A",
    marginLeft: 8,
  },
  categoryListContainer: {
    paddingRight: 10,
    alignItems: "center",
  },
  categoryBtn: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: "#F1F5F9",
    borderRadius: 25,
    marginRight: 10,
  },
  categoryBtnActive: {
    backgroundColor: "#0F172A",
  },
  categoryText: {
    color: "#475569",
    fontWeight: "600",
    fontSize: 14,
  },
  categoryTextActive: {
    color: "#FFFFFF",
  },
  sectionHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 10,
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#0F172A",
  },
  seeAllText: {
    color: "#94A3B8",
    fontSize: 14,
    fontWeight: "500",
  },
  columnWrapper: {
    justifyContent: "space-between",
    marginBottom: 16,
  },
  productListContent: {
    paddingBottom: 100,
  },
  card: {
    width: "48%",
    backgroundColor: "#FAFAFA",
    borderRadius: 20,
    padding: 14,
    borderWidth: 1,
    borderColor: "#F1F5F9",
  },
  cardImage: {
    width: "100%",
    height: 110,
    marginBottom: 10,
  },
  cardTitle: {
    fontWeight: "700",
    fontSize: 16,
    color: "#0F172A",
  },
  cardStock: {
    fontSize: 12,
    color: "#94A3B8",
    marginTop: 2,
    marginBottom: 8,
  },
  cardBottomRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 4,
  },
  cardPrice: {
    color: "#FF6B35",
    fontWeight: "800",
    fontSize: 16,
  },
  cardUnit: {
    color: "#94A3B8",
    fontSize: 12,
    fontWeight: "400",
  },
  addBtn: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: "#FF6B35",
    justifyContent: "center",
    alignItems: "center",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 50,
  },
  loadingText: {
    marginTop: 10,
    color: "#64748B",
    fontSize: 14,
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#0F172A",
    marginTop: 12,
  },
  emptySubtitle: {
    fontSize: 14,
    color: "#64748B",
    marginTop: 4,
    textAlign: "center",
  },
});