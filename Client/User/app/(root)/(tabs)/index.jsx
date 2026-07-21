import { StyleSheet, Text } from "react-native";
import React from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import Product from "../../product/Index"

const Home = () => {
  return (
    <SafeAreaView style={styles.container}>
    <Product/>

    </SafeAreaView>
  );
};

export default Home;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },

  text: {
    color: "red",
    fontSize: 24,
    fontWeight: "bold",
  },
});