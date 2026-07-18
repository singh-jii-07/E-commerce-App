import Cart from "../models/Cart.js";
import Product from "../models/Product.js";
import mongoose from "mongoose";

 const addToCart = async (req, res) => {
  try {
    const userId = req.userId;
    const { product, quantity } = req.body;

    if (!product) {
      return res.status(400).json({
        success: false,
        message: "Product is required",
      });
    }

  
    if (!mongoose.Types.ObjectId.isValid(product)) {
      return res.status(400).json({
        success: false,
        message: "Invalid Product ID",
      });
    }

    const existingProduct = await Product.findById(product);

    if (!existingProduct) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

  
    const existingCart = await Cart.findOne({
      user: userId,
      product,
    });

    if (existingCart) {
      existingCart.quantity += quantity || 1;

      await existingCart.save();

      return res.status(200).json({
        success: true,
        message: "Cart updated successfully",
        data: existingCart,
      });
    }

   
    const cart = await Cart.create({
      user: userId,
      product,
      quantity: quantity || 1,
    });

    return res.status(201).json({
      success: true,
      message: "Product added to cart",
      data: cart,
    });
  } catch (error) {
    console.error("ADD CART ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

 const getMyCart = async (req, res) => {
  try {
    const userId = req.userId;

    const cart = await Cart.find({ user: userId }).populate(
      "product",
      "name price images stock"
    );

    return res.status(200).json({
      success: true,
      message: "Cart fetched successfully",
      count: cart.length,
      data: cart,
    });
  } catch (error) {
    console.error("GET CART ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

 const deleteCartItem = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId;

   
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid Cart ID",
      });
    }

   
    const cartItem = await Cart.findOne({
      _id: id,
      user: userId,
    });

    if (!cartItem) {
      return res.status(404).json({
        success: false,
        message: "Cart item not found",
      });
    }

    await Cart.findByIdAndDelete(id);

    return res.status(200).json({
      success: true,
      message: "Cart item removed successfully",
    });
  } catch (error) {
    console.error("DELETE CART ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

export{addToCart,getMyCart,deleteCartItem}