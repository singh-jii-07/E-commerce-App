import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Image,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import productService from "../../services/productService";

const categories = [
  "All",
  "Fruits",
  "Vegetables",
  "Fast-food",
  "Drinks",
];

const Product = () => {
  const router = useRouter();
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProducts();
  }, []);

  useEffect(() => {
    filterProducts();
  }, [search, selectedCategory, products]);

  const loadProducts = async () => {
    try {
      const response = await productService.getProducts();

      if (response.success) {
        setProducts(response.data);
        setFilteredProducts(response.data);
      }
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  };

  const filterProducts = () => {
    let data = [...products];

    if (selectedCategory !== "All") {
      data = data.filter(
        (item) =>
          item.category?.name?.toLowerCase() ===
          selectedCategory.toLowerCase()
      );
    }

    if (search.trim()) {
      data = data.filter((item) =>
        item.name.toLowerCase().includes(search.toLowerCase())
      );
    }

    setFilteredProducts(data);
  };

  const renderProduct = ({ item }) => (
    <TouchableOpacity
  style={styles.card}
  activeOpacity={0.8}
  onPress={() => router.push(`/product/${item._id}`)}
>
      <Image
        source={{
          uri: item.images?.[0],
        }}
        style={styles.image}
        resizeMode="contain"
      />

      <Text numberOfLines={1} style={styles.name}>
        {item.name}
      </Text>

      <Text style={styles.stock}>
        Stock : {item.stock}
      </Text>

      <View style={styles.bottomRow}>
        <View>
          <Text style={styles.price}>
            ₹{item.price}
            <Text style={styles.unit}>/{item.unit}</Text>
          </Text>
        </View>

        <TouchableOpacity style={styles.addBtn}>
          <Ionicons name="add" size={20} color="#fff" />
        </TouchableOpacity>
      </View>
      </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>

      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Daily</Text>
          <Text style={styles.title}>Grocery Food</Text>
        </View>

        <TouchableOpacity style={styles.searchIcon}>
          <Ionicons name="search" size={24} color="#222" />
        </TouchableOpacity>
      </View>

      <View style={styles.searchContainer}>
        <Ionicons name="search" size={18} color="#999" />

        <TextInput
          placeholder="Search products..."
          value={search}
          onChangeText={setSearch}
          style={styles.searchInput}
        />
      </View>

      <FlatList
        horizontal
        showsHorizontalScrollIndicator={false}
        data={categories}
        keyExtractor={(item) => item}
        contentContainerStyle={styles.categoryContainer}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[
              styles.categoryBtn,
              selectedCategory === item && styles.activeCategory,
            ]}
            onPress={() => setSelectedCategory(item)}
          >
            <Text
              style={[
                styles.categoryText,
                selectedCategory === item && styles.activeText,
              ]}
            >
              {item}
            </Text>
          </TouchableOpacity>
        )}
      />

      <View style={styles.row}>
        <Text style={styles.heading}>Popular Products</Text>

        <TouchableOpacity>
          <Text style={styles.seeAll}>See all</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator
          size="large"
          color="#ff6b35"
          style={{ marginTop: 30 }}
        />
      ) : (
        <FlatList
          data={filteredProducts}
          keyExtractor={(item) => item._id}
          numColumns={2}
          showsVerticalScrollIndicator={false}
          columnWrapperStyle={{
            justifyContent: "space-between",
          }}
          renderItem={renderProduct}
          contentContainerStyle={{
            paddingBottom: 120,
          }}
        />
      )}
    </SafeAreaView>
  );
};

export default Product;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    paddingHorizontal: 18,
    paddingTop: 10,
  },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  title: {
    fontSize: 34,
    fontWeight: "700",
    color: "#1F2A44",
  },

  searchIcon: {
    width: 58,
    height: 58,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
    elevation: 5,
  },

  searchContainer: {
    marginTop: 18,
    backgroundColor: "#F5F5F5",
    borderRadius: 14,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 15,
    marginBottom: 18,
  },

  searchInput: {
    flex: 1,
    height: 50,
    marginLeft: 10,
  },

  categoryContainer: {
    paddingBottom: 20,
  },

  categoryBtn: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    backgroundColor: "#F4F4F4",
    borderRadius: 20,
    marginRight: 10,
  },

  activeCategory: {
    backgroundColor: "#1F2A44",
  },

  categoryText: {
    color: "#222",
    fontWeight: "500",
  },

  activeText: {
    color: "#fff",
  },

  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 18,
  },

  heading: {
    fontSize: 22,
    fontWeight: "700",
    color: "#1F2A44",
  },

  seeAll: {
    color: "#999",
  },

  card: {
    width: "48%",
    backgroundColor: "#FAFAFA",
    borderRadius: 20,
    padding: 15,
    marginBottom: 18,
  },

  image: {
    width: "100%",
    height: 120,
  },

  name: {
    fontWeight: "700",
    fontSize: 18,
    marginTop: 10,
  },

  stock: {
    color: "#888",
    marginVertical: 5,
  },

  bottomRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  price: {
    color: "#ff6b35",
    fontWeight: "700",
    fontSize: 18,
  },

  unit: {
    color: "#888",
    fontSize: 13,
  },

  addBtn: {
    width: 34,
    height: 34,
    borderRadius: 8,
    backgroundColor: "#ff6b35",
    justifyContent: "center",
    alignItems: "center",
  },
});